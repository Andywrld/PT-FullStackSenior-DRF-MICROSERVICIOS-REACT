from django.db import connection
from django.utils.dateparse import parse_datetime
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .cart_gateway import get_cart_gateway
from .models import Order
from .serializers import OrderSerializer
from .stock_gateway import get_stock_gateway

MAX_IDEMPOTENCY_KEY_LENGTH = 64


def _parse_datetime_param(name, params):
    try:
        value = parse_datetime(params[name])
    except ValueError:
        value = None
    if value is None:
        raise ValidationError({name: ["Enter a valid ISO 8601 date/time."]})
    return value


class OrderViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    """Orders placed from the authenticated user's cart.

    Regular users only ever see their own orders; admins see every order and
    may narrow the list with `?user_id=`, `?status=` and `?created_after=`.
    """

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    # `^id` matches the short order number shown in the UI (the id's first characters).
    search_fields = ["customer_email", "^id"]
    ordering_fields = ["created_at", "subtotal", "total_quantity"]
    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = Order.objects.prefetch_related("items")
        user = self.request.user
        if not user.is_admin:
            # Scoping the queryset (not a permission check) is what makes
            # another user's order answer 404 instead of 403 on retrieve.
            return queryset.filter(user_id=user.id)
        params = self.request.query_params
        if params.get("user_id"):
            queryset = queryset.filter(user_id=params["user_id"])
        if params.get("status"):
            queryset = queryset.filter(status=params["status"])
        if params.get("created_after"):
            queryset = queryset.filter(created_at__gte=_parse_datetime_param("created_after", params))
        return queryset

    @extend_schema(
        request=None,
        responses=OrderSerializer,
        parameters=[
            OpenApiParameter(
                "Idempotency-Key",
                str,
                OpenApiParameter.HEADER,
                description="Optional (max 64 chars). Repeating a key returns the same order (200).",
            )
        ],
    )
    def create(self, request, *args, **kwargs):
        idempotency_key = request.headers.get("Idempotency-Key") or None
        if idempotency_key and len(idempotency_key) > MAX_IDEMPOTENCY_KEY_LENGTH:
            raise ValidationError(
                {"idempotency_key": [f"Must be at most {MAX_IDEMPOTENCY_KEY_LENGTH} characters."]}
            )
        result = services.place_order(
            request.user, get_cart_gateway(), get_stock_gateway(), idempotency_key=idempotency_key
        )
        serializer = self.get_serializer(result.order)
        response = Response(
            serializer.data, status=status.HTTP_201_CREATED if result.created else status.HTTP_200_OK
        )
        if result.created:
            response.envelope_meta = {"cart_cleared": result.cart_cleared}
        return response


@extend_schema(exclude=True)  # internal endpoint, not part of the public API
class HealthView(APIView):

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except Exception:
            return Response({"status": "error"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"status": "ok"})
