import re
from decimal import Decimal

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import Max
from django.utils.text import slugify
from rest_framework import serializers

from .models import Category, Product, ProductImage, StockDeduction

# Extension comes from the Pillow-detected format: the client's filename and content-type are never trusted.
ALLOWED_IMAGE_FORMATS = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}


class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image", "url", "width", "height", "position", "created_at"]
        read_only_fields = ["id", "url", "width", "height", "created_at"]
        extra_kwargs = {
            "image": {"write_only": True},
            "position": {"required": False},
        }

    def get_url(self, obj) -> str:
        return obj.image.url

    def validate_image(self, value):
        max_bytes = settings.MAX_IMAGE_UPLOAD_BYTES
        if value.size > max_bytes:
            raise serializers.ValidationError(
                f"La imagen es demasiado grande. El máximo es {max_bytes // (1024 * 1024) or 1} MB."
            )
        image_format = getattr(getattr(value, "image", None), "format", None)
        if image_format not in ALLOWED_IMAGE_FORMATS:
            allowed = ", ".join(ALLOWED_IMAGE_FORMATS)
            raise serializers.ValidationError(f"Formato de imagen no admitido. Usa {allowed}.")
        value.name = f"upload{ALLOWED_IMAGE_FORMATS[image_format]}"
        return value

    def create(self, validated_data):
        product = self.context["product"]
        with transaction.atomic():
            # Row lock: concurrent uploads for the same product can't both pass
            # the limit check or pick the same next position.
            product = Product.objects.select_for_update().get(pk=product.pk)
            images = product.images.all()
            if images.count() >= settings.MAX_IMAGES_PER_PRODUCT:
                raise serializers.ValidationError(
                    {"image": [f"Un producto puede tener como máximo {settings.MAX_IMAGES_PER_PRODUCT} imágenes."]}
                )
            if validated_data.get("position") is None:
                last_position = images.aggregate(last=Max("position"))["last"]
                validated_data["position"] = 0 if last_position is None else last_position + 1
            return ProductImage.objects.create(product=product, **validated_data)


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "is_active", "product_count", "created_at", "updated_at"]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]

    def get_product_count(self, obj) -> int:
        count = getattr(obj, "product_count", None)
        return count if count is not None else obj.products.count()

    def validate_name(self, value):
        name = value.strip()
        slug = slugify(name)
        if not slug:
            raise serializers.ValidationError("El nombre debe contener letras o números.")
        others = Category.objects.all()
        if self.instance is not None:
            others = others.exclude(pk=self.instance.pk)
        if others.filter(name__iexact=name).exists() or others.filter(slug=slug).exists():
            raise serializers.ValidationError("Ya existe una categoría con este nombre.")
        return name

    def validate(self, attrs):
        if "name" in attrs:
            attrs["slug"] = slugify(attrs["name"])
        return attrs


class CategorySummarySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


SKU_GENERATION_ATTEMPTS = 5


def next_sku(category) -> str:
    """`<first 4 letters of the category>-<next number>`, e.g. ELEC-0008; PROD-0001 without category."""
    prefix = re.sub(r"[^a-z0-9]", "", category.slug)[:4].upper() if category else ""
    prefix = prefix or "PROD"
    last = (
        Product.objects.filter(sku__regex=rf"^{prefix}-\d+$")
        .order_by("-sku")
        .values_list("sku", flat=True)
        .first()
    )
    number = int(last.rsplit("-", 1)[1]) + 1 if last else 1
    return f"{prefix}-{number:04d}"


class ProductSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0"))
    sku = serializers.CharField(max_length=64, required=False, allow_blank=True)
    images = ProductImageSerializer(many=True, read_only=True)
    category = CategorySummarySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=Category.objects.filter(is_active=True),
        allow_null=True,
        required=False,
        write_only=True,
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "sku",
            "name",
            "description",
            "price",
            "stock",
            "is_active",
            "category",
            "category_id",
            "images",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_sku(self, value):
        normalized = value.strip().upper()
        if not normalized:
            return normalized
        existing = Product.objects.filter(sku__iexact=normalized)
        if self.instance is not None:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError("Ya existe un producto con este SKU.")
        return normalized

    def create(self, validated_data):
        if validated_data.get("sku"):
            return super().create(validated_data)
        # Two concurrent creates can compute the same next number: the unique
        # constraint rejects one, which then retries with the following number.
        for _ in range(SKU_GENERATION_ATTEMPTS):
            validated_data["sku"] = next_sku(validated_data.get("category"))
            try:
                with transaction.atomic():
                    return super().create(validated_data)
            except IntegrityError:
                continue
        raise serializers.ValidationError({"sku": ["No se pudo generar un SKU. Inténtalo de nuevo."]})

    def update(self, instance, validated_data):
        if not validated_data.get("sku"):
            validated_data.pop("sku", None)
        return super().update(instance, validated_data)


class StockLineSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)


class StockDeductionRequestSerializer(serializers.Serializer):
    reference = serializers.UUIDField()
    items = StockLineSerializer(many=True, allow_empty=False)


class StockDeductionSerializer(serializers.ModelSerializer):

    class Meta:
        model = StockDeduction
        fields = ["reference", "items", "created_at", "released_at"]
        read_only_fields = fields
