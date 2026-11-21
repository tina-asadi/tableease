from django.contrib.auth import get_user_model, password_validation
from rest_framework import serializers

from . import services
from .models import BlockedTable, DiningTable, Reservation, WaitlistEntry

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["username", "email", "first_name", "last_name", "password"]
        extra_kwargs = {"email": {"required": True}}

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value

    def create(self, data):
        return User.objects.create_user(**data)  # always a customer, never staff


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role"]

    def get_role(self, u):
        return "staff" if u.is_staff else "customer"


class DiningTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiningTable
        fields = ["id", "code", "capacity", "zone", "tags", "is_active", "x", "y"]


class BlockedTableSerializer(serializers.ModelSerializer):
    table_code = serializers.CharField(source="table.code", read_only=True)

    class Meta:
        model = BlockedTable
        fields = ["id", "table", "table_code", "date", "reason"]


class ReservationSerializer(serializers.ModelSerializer):
    """Read shape. Staff and owners see contact details; the public never lists reservations."""
    table_code = serializers.CharField(source="table.code", read_only=True)

    class Meta:
        model = Reservation
        fields = ["id", "reference", "table", "table_code", "date", "start_time", "end_time", "party_size",
                  "customer_name", "email", "phone", "occasion", "notes", "source", "status", "hold_until",
                  "created_at"]
        read_only_fields = fields


class ReservationCreateSerializer(serializers.Serializer):
    date = serializers.DateField()
    time = serializers.TimeField(input_formats=["%H:%M", "%H:%M:%S"])
    party_size = serializers.IntegerField(min_value=1, max_value=8)
    table = serializers.CharField(max_length=8)
    customer_name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True, default="")
    occasion = serializers.CharField(max_length=30, required=False, default="Just dining")
    notes = serializers.CharField(max_length=300, required=False, allow_blank=True, default="")

    def validate_phone(self, v):
        digits = "".join(c for c in v if c.isdigit())
        if v and not 7 <= len(digits) <= 15:
            raise serializers.ValidationError("Enter a valid phone number.")
        return v


class StaffReservationSerializer(ReservationCreateSerializer):
    """Walk-ins and phone bookings entered by staff: email is optional."""
    email = serializers.EmailField(required=False, allow_blank=True, default="")


class WaitlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = WaitlistEntry
        fields = ["id", "date", "time", "party_size", "name", "email", "phone", "status", "created_at"]
        read_only_fields = ["id", "status", "created_at"]

    def validate(self, data):
        try:
            services.validate_request(data["date"], services.mins(data["time"]), data["party_size"])
        except services.ReservationError as e:
            raise serializers.ValidationError({e.code: e.message})
        if services.level(data["date"], services.mins(data["time"]), data["party_size"]) != "full":
            raise serializers.ValidationError("Tables are still free at that time, please book instead.")
        return data
