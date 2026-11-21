from datetime import datetime

from django.contrib.auth import authenticate, get_user_model
from django.db.models import Count, Max, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import BlockedTable, DiningTable, Reservation, WaitlistEntry
from .permissions import IsStaff
from .serializers import (BlockedTableSerializer, DiningTableSerializer, RegisterSerializer,
                          ReservationCreateSerializer, ReservationSerializer, StaffReservationSerializer,
                          UserSerializer, WaitlistSerializer)

User = get_user_model()


def fail(err, http=status.HTTP_400_BAD_REQUEST):
    return Response({"code": err.code, "detail": err.message}, status=http)


# ---------- Authentication ----------
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = RegisterSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": UserSerializer(user).data}, status=201)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user = authenticate(username=request.data.get("username"), password=request.data.get("password"))
        if not user:
            return Response({"detail": "Incorrect username or password."}, status=400)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": UserSerializer(user).data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response(status=204)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


# ---------- Availability (public) ----------
def parse_query(request):
    try:
        day = datetime.strptime(request.query_params["date"], "%Y-%m-%d").date()
        party = int(request.query_params.get("party", 2))
    except (KeyError, ValueError):
        raise services.ReservationError("bad_query", "Provide date=YYYY-MM-DD and a numeric party.")
    return day, party


class AvailabilityView(APIView):
    """GET /api/availability/?date=2026-11-06&party=4&time=19:00
    Without `time`: the crowding level of every slot that day. With `time`: tables that fit."""
    permission_classes = [AllowAny]

    def get(self, request):
        services.expire_holds()
        try:
            day, party = parse_query(request)
            if "time" in request.query_params:
                h, m = request.query_params["time"].split(":")
                start_m = int(h) * 60 + int(m)
                services.validate_request(day, start_m, party)
                tables = services.available_tables(day, start_m, party)
                return Response({"date": day, "time": request.query_params["time"], "party": party,
                                 "level": services.level(day, start_m, party),
                                 "tables": DiningTableSerializer(tables, many=True).data})
            if not services.is_open(day):
                return Response({"date": day, "open": False, "slots": []})
            slots = [{"time": f"{s // 60:02d}:{s % 60:02d}", "level": services.level(day, s, party)}
                     for s in services.slot_minutes()]
            return Response({"date": day, "open": True, "party": party, "slots": slots})
        except services.ReservationError as e:
            return fail(e)
        except ValueError:
            return Response({"code": "bad_query", "detail": "Invalid time."}, status=400)


# ---------- Reservations ----------
class ReservationViewSet(viewsets.ViewSet):
    """Customers: create, list their own, cancel their own. Guests may create and look up by reference.
    Staff: everything, with filters, status changes and walk-ins."""

    def get_permissions(self):
        if self.action in ("create", "lookup", "cancel_guest", "respond_offer"):
            return [AllowAny()]
        if self.action in ("staff_create", "set_status", "all_reservations"):
            return [IsStaff()]
        return [IsAuthenticated()]

    def create(self, request):
        s = ReservationCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        try:
            res = services.create_reservation(
                day=d["date"], start_m=services.mins(d["time"]), party=d["party_size"], table_code=d["table"],
                name=d["customer_name"], email=d["email"], phone=d["phone"], occasion=d["occasion"],
                notes=d["notes"], user=request.user if request.user.is_authenticated else None)
        except services.ReservationError as e:
            return fail(e, status.HTTP_409_CONFLICT if e.code == "conflict" else 400)
        return Response(ReservationSerializer(res).data, status=201)

    def list(self, request):
        """The signed-in customer's own reservations."""
        qs = Reservation.objects.filter(user=request.user).select_related("table")
        return Response(ReservationSerializer(qs, many=True).data)

    @action(detail=False, methods=["get"], url_path="lookup")
    def lookup(self, request):
        res = Reservation.objects.filter(reference__iexact=request.query_params.get("reference", ""),
                                         email__iexact=request.query_params.get("email", "")).first()
        if not res:
            return Response({"detail": "No reservation matches that reference and email."}, status=404)
        return Response(ReservationSerializer(res).data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        res = Reservation.objects.filter(pk=pk).first()
        if not res or not (request.user.is_staff or res.user_id == request.user.id):
            return Response({"detail": "Not found."}, status=404)  # do not reveal other people's bookings
        try:
            return Response(ReservationSerializer(services.cancel_reservation(res)).data)
        except services.ReservationError as e:
            return fail(e)

    @action(detail=False, methods=["post"], url_path="cancel-guest")
    def cancel_guest(self, request):
        res = Reservation.objects.filter(reference__iexact=request.data.get("reference", ""),
                                         email__iexact=request.data.get("email", "")).first()
        if not res:
            return Response({"detail": "No reservation matches that reference and email."}, status=404)
        try:
            return Response(ReservationSerializer(services.cancel_reservation(res)).data)
        except services.ReservationError as e:
            return fail(e)

    @action(detail=False, methods=["post"], url_path="respond-offer")
    def respond_offer(self, request):
        """A waitlisted guest accepts or declines their 15 minute hold."""
        services.expire_holds()
        res = Reservation.objects.filter(reference__iexact=request.data.get("reference", ""),
                                         email__iexact=request.data.get("email", ""),
                                         status=Reservation.Status.HOLD).first()
        if not res:
            return Response({"detail": "This offer has expired or does not exist."}, status=404)
        entry = WaitlistEntry.objects.filter(hold=res).first()
        if request.data.get("accept"):
            res.status = Reservation.Status.CONFIRMED
            res.hold_until = None
            res.save(update_fields=["status", "hold_until", "updated_at"])
            if entry:
                entry.status = WaitlistEntry.Status.CONFIRMED
                entry.save(update_fields=["status"])
        else:
            if entry:
                entry.status = WaitlistEntry.Status.DECLINED
                entry.save(update_fields=["status"])
            services.cancel_reservation(res)
        res.refresh_from_db()
        return Response(ReservationSerializer(res).data)

    # ---- staff ----
    @action(detail=False, methods=["get"], url_path="all")
    def all_reservations(self, request):
        services.expire_holds()
        qs = Reservation.objects.select_related("table")
        p = request.query_params
        if p.get("date"):
            qs = qs.filter(date=p["date"])
        if p.get("status"):
            qs = qs.filter(status=p["status"])
        if p.get("q"):
            qs = qs.filter(Q(customer_name__icontains=p["q"]) | Q(reference__icontains=p["q"]) |
                           Q(email__icontains=p["q"]))
        return Response(ReservationSerializer(qs, many=True).data)

    @action(detail=False, methods=["post"], url_path="staff")
    def staff_create(self, request):
        s = StaffReservationSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        try:
            res = services.create_reservation(
                day=d["date"], start_m=services.mins(d["time"]), party=d["party_size"], table_code=d["table"],
                name=d["customer_name"], email=d["email"], phone=d["phone"], occasion=d["occasion"],
                notes=d["notes"], source="staff", skip_time_rules=False)
        except services.ReservationError as e:
            return fail(e, status.HTTP_409_CONFLICT if e.code == "conflict" else 400)
        return Response(ReservationSerializer(res).data, status=201)

    @action(detail=True, methods=["post"], url_path="status")
    def set_status(self, request, pk=None):
        res = Reservation.objects.filter(pk=pk).first()
        if not res:
            return Response({"detail": "Not found."}, status=404)
        try:
            services.change_status(res, request.data.get("status", ""))
        except services.ReservationError as e:
            return fail(e)
        res.refresh_from_db()
        return Response(ReservationSerializer(res).data)


# ---------- Waitlist ----------
class WaitlistViewSet(viewsets.ViewSet):
    def get_permissions(self):
        return [AllowAny()] if self.action == "create" else [IsStaff()]

    def create(self, request):
        s = WaitlistSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        return Response(WaitlistSerializer(s.save()).data, status=201)

    def list(self, request):
        qs = WaitlistEntry.objects.exclude(status__in=["EXPIRED", "DECLINED"])
        if request.query_params.get("date"):
            qs = qs.filter(date=request.query_params["date"])
        return Response(WaitlistSerializer(qs, many=True).data)


# ---------- Staff: tables, blocks, customers, insights ----------
class DiningTableViewSet(viewsets.ModelViewSet):
    queryset = DiningTable.objects.all()
    serializer_class = DiningTableSerializer

    def get_permissions(self):
        return [AllowAny()] if self.action in ("list", "retrieve") else [IsStaff()]


class BlockedTableViewSet(viewsets.ModelViewSet):
    queryset = BlockedTable.objects.select_related("table")
    serializer_class = BlockedTableSerializer
    permission_classes = [IsStaff]


class CustomerListView(APIView):
    """Customer management: one row per guest email with their visit history."""
    permission_classes = [IsStaff]

    def get(self, request):
        q = request.query_params.get("q", "")
        rows = (Reservation.objects.exclude(email="")
                .filter(Q(customer_name__icontains=q) | Q(email__icontains=q))
                .values("email").annotate(
                    name=Max("customer_name"), contact_phone=Max("phone"), bookings=Count("id"),
                    completed=Count("id", filter=Q(status="COMPLETED")),
                    cancelled=Count("id", filter=Q(status="CANCELLED")),
                    no_shows=Count("id", filter=Q(status="NO_SHOW")),
                    last_visit=Max("date")).order_by("-last_visit"))
        return Response(list(rows))


class InsightsView(APIView):
    permission_classes = [IsStaff]

    def get(self, request):
        day = request.query_params.get("date") or str(timezone.localdate())
        today = Reservation.objects.filter(date=day).exclude(status__in=["CANCELLED"])
        total_seats = sum(DiningTable.objects.filter(is_active=True).values_list("capacity", flat=True))
        booked_covers = sum(r.party_size for r in today.exclude(status="NO_SHOW"))
        done = Reservation.objects.filter(date__lte=day, status__in=["COMPLETED", "NO_SHOW"])
        return Response({
            "date": day, "reservations": today.count(), "covers": booked_covers,
            "seats": total_seats, "waiting": WaitlistEntry.objects.filter(date=day, status="WAITING").count(),
            "no_show_rate": round(done.filter(status="NO_SHOW").count() / done.count(), 3) if done.count() else 0,
        })
