import secrets
from django.conf import settings
from django.db import models


class DiningTable(models.Model):
    class Zone(models.TextChoices):
        WINDOW = "Window", "Window"
        MAIN = "Main hall", "Main hall"
        PATIO = "Patio", "Patio"

    code = models.CharField(max_length=8, unique=True)
    capacity = models.PositiveSmallIntegerField()
    zone = models.CharField(max_length=20, choices=Zone.choices)
    tags = models.JSONField(default=list, blank=True)  # window, quiet, patio, accessible, booth
    is_active = models.BooleanField(default=True)
    x = models.PositiveSmallIntegerField(default=0)  # floor-plan position for the React map
    y = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} ({self.capacity})"


class BlockedTable(models.Model):
    """A table taken out of service for a whole date (staff availability management)."""
    table = models.ForeignKey(DiningTable, on_delete=models.CASCADE, related_name="blocks")
    date = models.DateField()
    reason = models.CharField(max_length=120, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["table", "date"], name="uniq_block_per_day")]


def make_reference():
    return "TE-" + secrets.token_hex(3).upper()


class Reservation(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING"
        CONFIRMED = "CONFIRMED"
        SEATED = "SEATED"
        COMPLETED = "COMPLETED"
        CANCELLED = "CANCELLED"
        NO_SHOW = "NO_SHOW"
        HOLD = "HOLD"  # 15 minute offer from the waitlist

    BLOCKING = (Status.PENDING, Status.CONFIRMED, Status.SEATED, Status.HOLD)

    reference = models.CharField(max_length=12, unique=True, default=make_reference, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                             on_delete=models.SET_NULL, related_name="reservations")
    table = models.ForeignKey(DiningTable, on_delete=models.PROTECT, related_name="reservations")
    date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    party_size = models.PositiveSmallIntegerField()
    customer_name = models.CharField(max_length=120)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    occasion = models.CharField(max_length=30, blank=True, default="Just dining")
    notes = models.CharField(max_length=300, blank=True)
    source = models.CharField(max_length=10, default="online")  # online | staff | waitlist
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.CONFIRMED)
    hold_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["date", "start_time", "table__code"]
        indexes = [models.Index(fields=["table", "date", "start_time"])]

    def __str__(self):
        return f"{self.reference} {self.customer_name} {self.date} {self.start_time:%H:%M} {self.table.code}"


class WaitlistEntry(models.Model):
    class Status(models.TextChoices):
        WAITING = "WAITING"
        OFFERED = "OFFERED"
        CONFIRMED = "CONFIRMED"
        DECLINED = "DECLINED"
        EXPIRED = "EXPIRED"

    date = models.DateField(db_index=True)
    time = models.TimeField()
    party_size = models.PositiveSmallIntegerField()
    name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.WAITING)
    hold = models.ForeignKey(Reservation, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]  # first come, first served
