from rest_framework.permissions import SAFE_METHODS, BasePermission


def _is_authenticated(request):
    return bool(request.user and request.user.is_authenticated)


class IsAdmin(BasePermission):

    def has_permission(self, request, view):
        return _is_authenticated(request) and request.user.is_admin


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return _is_authenticated(request) and request.user.is_super_admin


class IsAdminOrReadOnly(BasePermission):

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return _is_authenticated(request) and request.user.is_admin
