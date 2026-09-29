from django.db import connection
from django.db.models import Count, ProtectedError
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from marketplace_common.errors import DomainError
from marketplace_common.permissions import IsAdminOrReadOnly
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .catalog_cache import CatalogCacheMixin
from .filters import ProductFilter, ProductOrderingFilter, ProductSearchFilter
from .models import Category, Product
from .serializers import (
    CategorySerializer,
    ProductImageSerializer,
    ProductSerializer,
    StockDeductionRequestSerializer,
    StockDeductionSerializer,
)

UUID_REGEX = r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"


class ProductViewSet(CatalogCacheMixin, viewsets.ModelViewSet):
    # `?ids=` is how cart and orders price items: always read the database.
    cache_bypass_params = ("ids",)
    queryset = Product.objects.select_related("category").prefetch_related("images")
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    # The global defaults, with search that forgives typos and orders by best match (see filters.py).
    filter_backends = [DjangoFilterBackend, ProductSearchFilter, ProductOrderingFilter]
    filterset_class = ProductFilter
    # `__unaccent` makes the match accent-insensitive on both sides ("cafe" finds "Café", and vice versa).
    search_fields = ["name__unaccent", "sku"]
    ordering_fields = ["price", "name", "created_at", "stock"]
    ordering = ["-created_at"]
    lookup_field = "id"
    lookup_value_regex = UUID_REGEX

    @extend_schema(responses={200: None})
    def destroy(self, request, *args, **kwargs):
        # 200 with the envelope (data: null) instead of an empty 204, so every
        # response has the same shape for clients.
        self.get_object().delete()
        return Response(None, status=status.HTTP_200_OK)

    @extend_schema(
        request={"multipart/form-data": ProductImageSerializer},
        responses={201: ProductImageSerializer},
    )
    @action(detail=True, methods=["post"], url_path="images", parser_classes=[MultiPartParser])
    def upload_image(self, request, *args, **kwargs):
        product = self.get_object()
        serializer = ProductImageSerializer(
            data=request.data, context={**self.get_serializer_context(), "product": product}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(request=None, responses={200: None})
    @action(detail=True, methods=["delete"], url_path=rf"images/(?P<image_id>{UUID_REGEX})")
    def delete_image(self, request, image_id, *args, **kwargs):
        product = self.get_object()
        get_object_or_404(product.images, pk=image_id).delete()
        return Response(None, status=status.HTTP_200_OK)


class CategoryInUseError(DomainError):
    status_code = status.HTTP_409_CONFLICT
    code = "category_in_use"
    default_message = "This category still has products. Move or delete them first."


class CategoryViewSet(CatalogCacheMixin, viewsets.ModelViewSet):

    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["is_active"]
    search_fields = ["name__unaccent"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]
    lookup_field = "id"
    lookup_value_regex = UUID_REGEX

    def get_queryset(self):
        return Category.objects.annotate(product_count=Count("products"))

    @extend_schema(responses={200: None})
    def destroy(self, request, *args, **kwargs):
        try:
            self.get_object().delete()
        except ProtectedError as exc:
            # on_delete=PROTECT: refusing is safer than orphaning or deleting products.
            raise CategoryInUseError() from exc
        return Response(None, status=status.HTTP_200_OK)


@extend_schema(exclude=True)  # internal endpoint, not part of the public API
class InternalStockDeductionsView(APIView):
    # Called by orders, no token: nginx never routes /internal/, so trust is network isolation
    # (production would add mTLS or per-service credentials).

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        payload = StockDeductionRequestSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        result = services.deduct_stock(**payload.validated_data)
        # 200 for a replay of an earlier call: the caller can tell nothing new happened.
        return Response(
            StockDeductionSerializer(result.deduction).data,
            status=status.HTTP_201_CREATED if result.applied else status.HTTP_200_OK,
        )


@extend_schema(exclude=True)  # internal endpoint, not part of the public API
class InternalStockDeductionView(APIView):

    authentication_classes = []
    permission_classes = [AllowAny]

    def delete(self, request, reference):
        services.release_stock(reference)  # idempotent: unknown or released references are fine
        return Response(None, status=status.HTTP_200_OK)


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
