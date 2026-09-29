import logging

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.views import set_rollback

from .errors import DomainError, ServiceUnavailableError  # noqa: F401  (re-exported)

logger = logging.getLogger(__name__)


def _error(code, message, details=None):
    return {"error": {"code": code, "message": message, "details": details}}


def exception_handler(exc, context):
    if isinstance(exc, DomainError):
        set_rollback()
        message = str(exc)
        details = {exc.field: [message]} if exc.field else None
        if exc.details:
            details = {**(details or {}), **exc.details}
        return Response(_error(exc.code, message, details), status=exc.status_code, headers=exc.headers)

    if isinstance(exc, Http404):
        exc = exceptions.NotFound()
    elif isinstance(exc, DjangoPermissionDenied):
        exc = exceptions.PermissionDenied()
    elif isinstance(exc, DjangoValidationError):
        # Bad input reaching the ORM (e.g. `?user_id=abc` on a UUID field) is the
        # client's fault: 400, never a 500.
        exc = exceptions.ValidationError(exc.messages)

    response = drf_exception_handler(exc, context)
    if response is None:
        set_rollback()
        logger.exception("Unhandled error", exc_info=exc)
        return Response(
            _error("internal_error", "An unexpected error occurred."),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if isinstance(exc, exceptions.ValidationError):
        response.data = _error("validation_error", "Invalid input.", response.data)
    else:
        detail = exc.detail
        code = getattr(detail, "code", None) or exc.default_code
        response.data = _error(code, str(detail))
    return response
