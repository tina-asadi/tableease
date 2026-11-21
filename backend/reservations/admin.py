from django.contrib import admin

from .models import BlockedTable, DiningTable, Reservation, WaitlistEntry

admin.site.register(DiningTable)
admin.site.register(BlockedTable)
admin.site.register(WaitlistEntry)


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ("reference", "customer_name", "date", "start_time", "table", "party_size", "status")
    list_filter = ("status", "date")
    search_fields = ("reference", "customer_name", "email")
