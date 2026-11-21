from rest_framework.permissions import BasePermission


class IsStaff(BasePermission):
    """Authorization: only restaurant staff (is_staff) may use management endpoints."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
