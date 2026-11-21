from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("reservations", views.ReservationViewSet, basename="reservation")
router.register("waitlist", views.WaitlistViewSet, basename="waitlist")
router.register("tables", views.DiningTableViewSet, basename="table")
router.register("blocked-tables", views.BlockedTableViewSet, basename="blocked")

urlpatterns = [
    path("auth/register/", views.RegisterView.as_view()),
    path("auth/login/", views.LoginView.as_view()),
    path("auth/logout/", views.logout),
    path("auth/me/", views.me),
    path("availability/", views.AvailabilityView.as_view()),
    path("customers/", views.CustomerListView.as_view()),
    path("staff/insights/", views.InsightsView.as_view()),
    path("", include(router.urls)),
]
