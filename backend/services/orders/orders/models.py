import uuid

from django.db import models
from django.db.models import Q


class Order(models.Model):
    class Status(models.TextChoices):
        PLACED = "placed", "Placed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    # Snapshot of the JWT `email` claim, so the admin dashboard can show the
    # buyer without calling the auth service.
    customer_email = models.EmailField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLACED)
    # Snapshotted at checkout from the cart's live prices; never recomputed.
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    total_quantity = models.PositiveIntegerField()
    # Set from the `Idempotency-Key` header: lets a retried checkout (double
    # click, network retry) return the same order instead of a duplicate.
    idempotency_key = models.CharField(max_length=64, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user_id", "-created_at"], name="order_user_created_idx"),
            models.Index(fields=["status", "-created_at"], name="order_status_created_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(subtotal__gte=0), name="order_subtotal_gte_0"),
            models.UniqueConstraint(
                fields=["user_id", "idempotency_key"],
                condition=Q(idempotency_key__isnull=False),
                name="order_user_idempotency_key_unique",
            ),
        ]

    def __str__(self):
        return f"order {self.id} of {self.user_id}"


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product_id = models.UUIDField()
    # Snapshots at checkout time: an order must keep showing what was actually
    # bought even after the product is later renamed, repriced or deleted.
    product_name = models.CharField(max_length=200)
    image_url = models.URLField(max_length=500, null=True, blank=True)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField()
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["order", "product_id"], name="order_item_unique_product"),
            models.CheckConstraint(condition=Q(quantity__gte=1), name="order_item_quantity_gte_1"),
            models.CheckConstraint(condition=Q(unit_price__gte=0), name="order_item_unit_price_gte_0"),
        ]

    def __str__(self):
        return f"{self.order_id}: {self.product_id} x{self.quantity}"
