"""Reservation rules. All validation happens here, on the server, never only in the browser."""
from datetime import time, timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import BlockedTable, DiningTable, Reservation, WaitlistEntry

R = settings.RESTAURANT


class ReservationError(Exception):
    """Raised for any rule violation; `code` is stable for the front-end."""
    def __init__(self, code, message):
        super().__init__(message)
        self.code, self.message = code, message


def mins(t):
    return t.hour * 60 + t.minute


def to_time(m):
    return time(m // 60, m % 60)


def slot_minutes():
    return list(range(R["OPEN_HOUR"] * 60, R["LAST_SEATING_MINUTES"] + 1, R["SLOT_STEP"]))


def is_open(day):
    return day.weekday() not in R["CLOSED_WEEKDAYS"]


def expire_holds(now=None):
    """Release lapsed 15 minute holds and offer the table to the next person waiting."""
    now = now or timezone.now()
    lapsed = Reservation.objects.filter(status=Reservation.Status.HOLD, hold_until__lt=now)
    for hold in lapsed:
        hold.status = Reservation.Status.CANCELLED
        hold.save(update_fields=["status", "updated_at"])
        WaitlistEntry.objects.filter(hold=hold, status=WaitlistEntry.Status.OFFERED).update(
            status=WaitlistEntry.Status.EXPIRED)
        offer_next(hold.date, hold.start_time)


def table_is_free(table, day, start_m, end_m, exclude_id=None):
    if not table.is_active or BlockedTable.objects.filter(table=table, date=day).exists():
        return False
    qs = Reservation.objects.filter(table=table, date=day, status__in=Reservation.BLOCKING)
    if exclude_id:
        qs = qs.exclude(pk=exclude_id)
    for r in qs:  # overlap: existing.start < new_end and existing.end > new_start
        if mins(r.start_time) < end_m and mins(r.end_time) > start_m:
            return False
    return True


def available_tables(day, start_m, party):
    end_m = start_m + R["DURATION_MIN"]
    tables = DiningTable.objects.filter(is_active=True, capacity__gte=party).order_by("capacity", "code")
    return [t for t in tables if table_is_free(t, day, start_m, end_m)]


def level(day, start_m, party):
    """quiet / moderate / busy / full: how crowded a time is for this party size."""
    suited = DiningTable.objects.filter(is_active=True, capacity__gte=party).count()
    if not suited:
        return "full"
    free_n = len(available_tables(day, start_m, party))
    if free_n == 0:
        return "full"
    ratio = free_n / suited
    return "quiet" if ratio > .66 else "moderate" if ratio > .33 else "busy"


def validate_request(day, start_m, party):
    today = timezone.localdate()
    if party < 1 or party > R["MAX_PARTY"]:
        raise ReservationError("bad_party", f"Party size must be between 1 and {R['MAX_PARTY']}.")
    if day < today:
        raise ReservationError("past_date", "That date has passed.")
    if day > today + timedelta(days=R["MAX_DAYS_AHEAD"]):
        raise ReservationError("too_far", f"We take bookings up to {R['MAX_DAYS_AHEAD']} days ahead.")
    if not is_open(day):
        raise ReservationError("closed", "The restaurant is closed on Mondays.")
    if start_m not in slot_minutes():
        raise ReservationError("bad_time", "Choose a time between 5:00 PM and 8:30 PM.")
    if day == today and start_m <= timezone.localtime().hour * 60 + timezone.localtime().minute:
        raise ReservationError("past_time", "That time has already passed today.")


@transaction.atomic
def create_reservation(*, day, start_m, party, table_code, name, email="", phone="", occasion="Just dining",
                       notes="", user=None, source="online", status=Reservation.Status.CONFIRMED,
                       hold_until=None, skip_time_rules=False):
    """Create a booking or raise ReservationError. The row lock on the table makes two
    simultaneous requests for the same table queue up, so the second one sees the first."""
    if not skip_time_rules:
        validate_request(day, start_m, party)
    try:
        table = DiningTable.objects.select_for_update().get(code=table_code)
    except DiningTable.DoesNotExist:
        raise ReservationError("no_table", "That table does not exist.")
    if table.capacity < party:
        raise ReservationError("too_small", f"Table {table.code} seats {table.capacity}.")
    if not table_is_free(table, day, start_m, start_m + R["DURATION_MIN"]):
        raise ReservationError("conflict", f"Table {table.code} is no longer available at that time.")
    return Reservation.objects.create(
        user=user, table=table, date=day, start_time=to_time(start_m),
        end_time=to_time(start_m + R["DURATION_MIN"]), party_size=party, customer_name=name,
        email=email, phone=phone, occasion=occasion, notes=notes, source=source,
        status=status, hold_until=hold_until)


def offer_next(day, start_time):
    """After a cancellation: give the first waiting party that fits a 15 minute hold."""
    start_m = mins(start_time)
    for entry in WaitlistEntry.objects.filter(date=day, time=start_time, status=WaitlistEntry.Status.WAITING):
        tables = available_tables(day, start_m, entry.party_size)
        if not tables:
            continue
        hold = create_reservation(
            day=day, start_m=start_m, party=entry.party_size, table_code=tables[0].code,
            name=entry.name, email=entry.email, phone=entry.phone, source="waitlist",
            status=Reservation.Status.HOLD, skip_time_rules=True,
            hold_until=timezone.now() + timedelta(minutes=R["HOLD_MINUTES"]))
        entry.status, entry.hold = WaitlistEntry.Status.OFFERED, hold
        entry.save(update_fields=["status", "hold"])
        return entry
    return None


@transaction.atomic
def cancel_reservation(res):
    if res.status in (Reservation.Status.CANCELLED, Reservation.Status.COMPLETED, Reservation.Status.NO_SHOW):
        raise ReservationError("not_cancellable", "This reservation can no longer be cancelled.")
    res.status = Reservation.Status.CANCELLED
    res.save(update_fields=["status", "updated_at"])
    offer_next(res.date, res.start_time)  # waitlist offer logic
    return res


TRANSITIONS = {  # staff workflow
    "PENDING": {"CONFIRMED", "CANCELLED"},
    "CONFIRMED": {"SEATED", "NO_SHOW", "CANCELLED"},
    "SEATED": {"COMPLETED"},
    "HOLD": {"CONFIRMED", "CANCELLED"},
}


def change_status(res, new):
    if new == "CANCELLED":
        return cancel_reservation(res)
    if new not in TRANSITIONS.get(res.status, set()):
        raise ReservationError("bad_transition", f"Cannot move from {res.status} to {new}.")
    res.status = new
    res.save(update_fields=["status", "updated_at"])
    if new == "NO_SHOW":
        offer_next(res.date, res.start_time)
    return res
