import uuid
from pathlib import Path

from django.db import models
from django.db.models import Q
from django.db.models.functions import Lower


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True, default="")
    # Inactive categories stay attached to their products but can't be assigned.
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(Lower("name"), name="category_name_ci_unique"),
        ]

    def __str__(self):
        return self.name


class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sku = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    price = models.DecimalField(max_digits=12, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    # Optional so existing products stay valid. PROTECT: a category that still
    # has products can't be deleted (the API answers 409 instead).
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, null=True, blank=True, related_name="products"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=Q(price__gte=0),
                name="product_price_gte_0",
            ),
        ]
        indexes = [
            models.Index(fields=["is_active", "-created_at"], name="product_active_created_idx"),
        ]

    def __str__(self):
        return f"{self.sku} - {self.name}"


def product_image_upload_to(instance, filename):
    # Random key, never the client's filename (avoids collisions and path tricks).
    return f"products/{instance.product_id}/{uuid.uuid4().hex}{Path(filename).suffix.lower()}"


class ProductImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(
        upload_to=product_image_upload_to,
        width_field="width",
        height_field="height",
        max_length=255,
    )
    width = models.PositiveIntegerField(editable=False)
    height = models.PositiveIntegerField(editable=False)
    position = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position", "created_at"]
        indexes = [
            models.Index(fields=["product", "position"], name="product_image_position_idx"),
        ]

    def __str__(self):
        return f"{self.product_id} #{self.position}"
