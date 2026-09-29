from django.http import JsonResponse

from .envelope import error_envelope


def not_found(request, exception=None):
    return JsonResponse(error_envelope("not_found", "Resource not found."), status=404)


def server_error(request):
    return JsonResponse(error_envelope("internal_error", "An unexpected error occurred."), status=500)
