from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from reservations.models import DiningTable

TABLES = [  # same 12 tables as the front-end prototype
    ("W1", 2, "Window", ["window", "quiet"], 62, 78), ("W2", 2, "Window", ["window"], 62, 150),
    ("W3", 4, "Window", ["window", "accessible"], 150, 72), ("W4", 4, "Window", ["window", "booth"], 215, 150),
    ("M1", 4, "Main hall", ["booth"], 346, 78), ("M2", 4, "Main hall", ["accessible"], 436, 78),
    ("M3", 6, "Main hall", ["booth", "accessible"], 548, 92), ("M4", 2, "Main hall", ["quiet", "accessible"], 390, 156),
    ("P1", 2, "Patio", ["patio", "quiet"], 80, 322), ("P2", 4, "Patio", ["patio", "accessible"], 200, 300),
    ("P3", 4, "Patio", ["patio"], 320, 322), ("P4", 6, "Patio", ["patio", "booth"], 470, 305),
]


class Command(BaseCommand):
    help = "Create the 12 tables and two demo accounts (staff and customer)."

    def handle(self, *args, **opts):
        for code, cap, zone, tags, x, y in TABLES:
            DiningTable.objects.update_or_create(code=code, defaults=dict(capacity=cap, zone=zone, tags=tags, x=x, y=y))
        U = get_user_model()
        if not U.objects.filter(username="staff").exists():
            U.objects.create_user("staff", "staff@tableease.test", "staffpass123", is_staff=True)
        if not U.objects.filter(username="guest").exists():
            U.objects.create_user("guest", "guest@tableease.test", "guestpass123", first_name="Alex", last_name="Morgan")
        self.stdout.write(self.style.SUCCESS("Seeded 12 tables. Accounts: staff / staffpass123, guest / guestpass123"))
