from uuid import UUID

from django.db import connection
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .catalog import get_product_catalog
from .models import Cart
from .serializers import AddItemSerializer, CartSerializer, UpdateItemSerializer

UUID_REGEX = r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"


class CartViewSet(viewsets.GenericViewSet):
    """The authenticated user's cart. Every endpoint answers with the full,
    recalculated cart, so the client re-renders from a single response."""

    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_cart(self):
        # Created lazily on first use; get_or_create handles the race of two
        # concurrent first requests thanks to the unique user_id.
        cart, _ = Cart.objects.get_or_create(user_id=self.request.user.id)
        return cart

    def _cart_response(self, cart):
        view = services.build_cart_view(cart, get_product_catalog())
        return Response(CartSerializer(view).data)

    @extend_schema(responses=CartSerializer)
    def retrieve(self, request, *args, **kwargs):
        return self._cart_response(self.get_cart())

    @extend_schema(request=AddItemSerializer, responses=CartSerializer)
    def add_item(self, request, *args, **kwargs):
        cart = self.get_cart()
        payload = AddItemSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        services.add_item(cart, catalog=get_product_catalog(), **payload.validated_data)
        return self._cart_response(cart)

    @extend_schema(request=None, responses=CartSerializer)
    def clear_items(self, request, *args, **kwargs):
        cart = self.get_cart()
        services.clear(cart)
        return self._cart_response(cart)

    @extend_schema(request=UpdateItemSerializer, responses=CartSerializer)
    def update_item(self, request, product_id, *args, **kwargs):
        cart = self.get_cart()
        payload = UpdateItemSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        services.set_item_quantity(
            cart, UUID(product_id), payload.validated_data["quantity"], get_product_catalog()
        )
        return self._cart_response(cart)

    @extend_schema(request=None, responses=CartSerializer)
    def remove_item(self, request, product_id, *args, **kwargs):
        cart = self.get_cart()
        services.remove_item(cart, UUID(product_id))
        return self._cart_response(cart)


@extend_schema(exclude=True)  # internal endpoint, not part of the public API
class InternalCartView(APIView):
    # Keyed by user_id, no token: nginx never routes /internal/, so trust is network isolation
    # (production would add mTLS or per-service credentials).

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        cart, _ = Cart.objects.get_or_create(user_id=user_id)
        view = services.build_cart_view(cart, get_product_catalog())
        return Response(CartSerializer(view).data)


@extend_schema(exclude=True)  # internal endpoint, not part of the public API
class InternalCartItemsView(APIView):

    authentication_classes = []
    permission_classes = [AllowAny]

    def delete(self, request, user_id):
        cart, _ = Cart.objects.get_or_create(user_id=user_id)
        services.clear(cart)
        view = services.build_cart_view(cart, get_product_catalog())
        return Response(CartSerializer(view).data)


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
