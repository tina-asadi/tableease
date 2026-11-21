from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Reservation, WaitlistEntry

U = get_user_model()


def next_open_day(weekday=4):  # default: next Friday
    d = timezone.localdate() + timedelta(days=1)
    while d.weekday() != weekday:
        d += timedelta(days=1)
    return d


class Base(TestCase):
    def setUp(self):
        call_command("seed", verbosity=0)
        self.api = APIClient()
        self.day = str(next_open_day())

    def login(self, username, password):
        r = self.api.post("/api/auth/login/", {"username": username, "password": password}, format="json")
        self.assertEqual(r.status_code, 200)
        self.api.credentials(HTTP_AUTHORIZATION="Token " + r.data["token"])
        return r.data

    def book(self, table="M1", time="19:00", party=4, email="a@b.com", **extra):
        body = dict(date=self.day, time=time, party_size=party, table=table, customer_name="Alex Morgan",
                    email=email, phone="613-555-0100")
        body.update(extra)
        return self.api.post("/api/reservations/", body, format="json")


class AuthTests(Base):
    def test_register_creates_customer_never_staff(self):
        r = self.api.post("/api/auth/register/", {"username": "tina", "email": "t@x.com", "password": "Str0ngPass!9",
                                                  "is_staff": True}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["user"]["role"], "customer")

    def test_login_and_me(self):
        data = self.login("staff", "staffpass123")
        self.assertEqual(data["user"]["role"], "staff")
        self.assertEqual(self.api.get("/api/auth/me/").data["username"], "staff")

    def test_bad_login(self):
        r = self.api.post("/api/auth/login/", {"username": "staff", "password": "nope"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_staff_endpoints_forbidden_for_customers_and_anonymous(self):
        self.assertEqual(self.api.get("/api/reservations/all/").status_code, 401)
        self.assertEqual(self.api.get("/api/customers/").status_code, 401)
        self.login("guest", "guestpass123")
        self.assertEqual(self.api.get("/api/reservations/all/").status_code, 403)
        self.assertEqual(self.api.get("/api/customers/").status_code, 403)
        self.assertEqual(self.api.get("/api/staff/insights/").status_code, 403)


class AvailabilityTests(Base):
    def test_only_tables_that_fit_the_party(self):
        r = self.api.get("/api/availability/", {"date": self.day, "time": "19:00", "party": 5})
        self.assertEqual(r.status_code, 200)
        self.assertEqual({t["code"] for t in r.data["tables"]}, {"M3", "P4"})

    def test_day_levels_cover_every_slot(self):
        r = self.api.get("/api/availability/", {"date": self.day, "party": 2})
        self.assertEqual(len(r.data["slots"]), 8)  # 5:00 to 8:30 in 30 minute steps

    def test_closed_on_monday(self):
        r = self.api.get("/api/availability/", {"date": str(next_open_day(0)), "party": 2})
        self.assertFalse(r.data["open"])

    def test_booked_table_disappears(self):
        self.book("M1", "19:00", 4)
        r = self.api.get("/api/availability/", {"date": self.day, "time": "19:30", "party": 4})
        self.assertNotIn("M1", {t["code"] for t in r.data["tables"]})  # 90 minute stay overlaps 19:30


class ReservationTests(Base):
    def test_create_and_reference(self):
        r = self.book()
        self.assertEqual(r.status_code, 201)
        self.assertTrue(r.data["reference"].startswith("TE-"))
        self.assertEqual(r.data["status"], "CONFIRMED")
        self.assertEqual(r.data["end_time"], "20:30:00")

    def test_double_booking_is_rejected(self):
        self.assertEqual(self.book("M1", "19:00").status_code, 201)
        r = self.book("M1", "19:30", email="c@d.com")
        self.assertEqual(r.status_code, 409)
        self.assertEqual(r.data["code"], "conflict")

    def test_back_to_back_is_allowed(self):
        self.assertEqual(self.book("M1", "17:00").status_code, 201)
        self.assertEqual(self.book("M1", "18:30", email="c@d.com").status_code, 201)  # starts when the first ends

    def test_table_too_small(self):
        r = self.book("W1", "19:00", party=4)
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.data["code"], "too_small")

    def test_validation_errors(self):
        self.assertEqual(self.book(email="bad").status_code, 400)
        self.assertEqual(self.book(party_size=9).status_code, 400)
        self.assertEqual(self.book(time="23:00").data["code"], "bad_time")
        self.assertEqual(self.book(date=str(next_open_day(0))).data["code"], "closed")
        self.assertEqual(self.book(date=str(timezone.localdate() - timedelta(days=2))).data["code"], "past_date")

    def test_customer_sees_only_own_and_can_cancel_own(self):
        self.login("guest", "guestpass123")
        mine = self.book("M1", email="guest@tableease.test").data
        self.api.credentials()
        self.book("M2", "19:00", email="other@x.com")
        self.login("guest", "guestpass123")
        listing = self.api.get("/api/reservations/").data
        self.assertEqual([r["reference"] for r in listing], [mine["reference"]])
        self.assertEqual(self.api.post(f"/api/reservations/{mine['id']}/cancel/").data["status"], "CANCELLED")

    def test_customer_cannot_cancel_someone_elses(self):
        other = self.book("M2", email="other@x.com").data
        self.login("guest", "guestpass123")
        self.assertEqual(self.api.post(f"/api/reservations/{other['id']}/cancel/").status_code, 404)

    def test_guest_lookup_and_cancel_need_matching_email(self):
        res = self.book(email="me@x.com").data
        bad = self.api.get("/api/reservations/lookup/", {"reference": res["reference"], "email": "x@y.com"})
        self.assertEqual(bad.status_code, 404)
        ok = self.api.post("/api/reservations/cancel-guest/", {"reference": res["reference"], "email": "me@x.com"},
                           format="json")
        self.assertEqual(ok.data["status"], "CANCELLED")

    def test_cancelled_table_is_free_again(self):
        res = self.book("M1", "19:00").data
        self.api.post("/api/reservations/cancel-guest/", {"reference": res["reference"], "email": "a@b.com"},
                      format="json")
        self.assertEqual(self.book("M1", "19:00", email="n@x.com").status_code, 201)


class StaffTests(Base):
    def setUp(self):
        super().setUp()
        self.login("staff", "staffpass123")

    def test_status_workflow(self):
        res = self.book().data
        sid = res["id"]
        for new in ("SEATED", "COMPLETED"):
            self.assertEqual(self.api.post(f"/api/reservations/{sid}/status/", {"status": new}, format="json").data["status"], new)
        self.assertEqual(self.api.post(f"/api/reservations/{sid}/status/", {"status": "SEATED"}, format="json").status_code, 400)

    def test_walk_in_without_email(self):
        r = self.api.post("/api/reservations/staff/", dict(date=self.day, time="18:00", party_size=2, table="W1",
                          customer_name="Walk-in"), format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["source"], "staff")

    def test_block_table_removes_it_from_availability(self):
        t = next(t for t in self.api.get("/api/tables/").data if t["code"] == "M1")
        self.assertEqual(self.api.post("/api/blocked-tables/", {"table": t["id"], "date": self.day, "reason": "Private event"},
                                       format="json").status_code, 201)
        self.api.credentials()
        r = self.api.get("/api/availability/", {"date": self.day, "time": "19:00", "party": 4})
        self.assertNotIn("M1", {x["code"] for x in r.data["tables"]})

    def test_search_filter_and_customers(self):
        self.book(email="priya@x.com", customer_name="Priya Shah")
        self.assertEqual(len(self.api.get("/api/reservations/all/", {"q": "priya"}).data), 1)
        self.assertEqual(len(self.api.get("/api/reservations/all/", {"status": "CANCELLED"}).data), 0)
        c = self.api.get("/api/customers/", {"q": "priya"}).data
        self.assertEqual(c[0]["bookings"], 1)

    def test_insights(self):
        self.book()
        r = self.api.get("/api/staff/insights/", {"date": self.day}).data
        self.assertEqual((r["reservations"], r["covers"]), (1, 4))


class WaitlistTests(Base):
    def fill_time(self):
        """Book every table that fits 2 guests at 19:00, so that slot is full."""
        for t in ("W1", "W2", "W3", "W4", "M1", "M2", "M3", "M4", "P1", "P2", "P3", "P4"):
            self.assertEqual(self.book(t, "19:00", party=2, email=f"{t}@x.com").status_code, 201)

    def test_cannot_join_waitlist_when_tables_are_free(self):
        r = self.api.post("/api/waitlist/", dict(date=self.day, time="19:00", party_size=2, name="Sam",
                                                 email="s@x.com"), format="json")
        self.assertEqual(r.status_code, 400)

    def test_cancellation_offers_a_15_minute_hold_to_first_in_line(self):
        self.fill_time()
        for n, em in enumerate(("first@x.com", "second@x.com")):
            r = self.api.post("/api/waitlist/", dict(date=self.day, time="19:00", party_size=2, name=f"W{n}", email=em),
                              format="json")
            self.assertEqual(r.status_code, 201)
        victim = Reservation.objects.get(table__code="M1")
        self.api.post("/api/reservations/cancel-guest/", {"reference": victim.reference, "email": "M1@x.com"}, format="json")
        first = WaitlistEntry.objects.get(email="first@x.com")
        self.assertEqual(first.status, "OFFERED")
        self.assertEqual(first.hold.status, "HOLD")
        self.assertEqual(WaitlistEntry.objects.get(email="second@x.com").status, "WAITING")
        # a stranger cannot take the held table
        self.assertEqual(self.book("M1", "19:00", party=2, email="late@x.com").status_code, 409)
        # first in line accepts
        r = self.api.post("/api/reservations/respond-offer/", {"reference": first.hold.reference, "email": "first@x.com",
                                                               "accept": True}, format="json")
        self.assertEqual(r.data["status"], "CONFIRMED")

    def test_expired_hold_passes_to_next_in_line(self):
        from . import services
        self.fill_time()
        for em in ("first@x.com", "second@x.com"):
            self.api.post("/api/waitlist/", dict(date=self.day, time="19:00", party_size=2, name=em, email=em), format="json")
        victim = Reservation.objects.get(table__code="M1")
        self.api.post("/api/reservations/cancel-guest/", {"reference": victim.reference, "email": "M1@x.com"}, format="json")
        Reservation.objects.filter(status="HOLD").update(hold_until=timezone.now() - timedelta(minutes=1))
        services.expire_holds()
        self.assertEqual(WaitlistEntry.objects.get(email="first@x.com").status, "EXPIRED")
        self.assertEqual(WaitlistEntry.objects.get(email="second@x.com").status, "OFFERED")
