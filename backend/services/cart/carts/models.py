import uuid

from django.db import models
from django.db.models import Q


class Cart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # unique: one cart per user, enforced by the DB even under concurrent first requests.
    user_id = models.UUIDField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"cart of {self.user_id}"


class CartItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    # No price stored: carts always show the current catalog price.
    product_id = models.UUIDField()
    quantity = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        constraints = [
            models.UniqueConstraint(fields=["cart", "product_id"], name="cart_item_unique_product"),
            models.CheckConstraint(condition=Q(quantity__gte=1), name="cart_item_quantity_gte_1"),
        ]

    def __str__(self):
        return f"{self.cart_id}: {self.product_id} x{self.quantity}"
