from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["product_id", "product_name", "image_url", "unit_price", "quantity", "line_total"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "user_id",
            "customer_email",
            "status",
            "subtotal",
            "total_quantity",
            "items",
            "created_at",
        ]
        read_only_fields = fields
