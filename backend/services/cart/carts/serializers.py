from rest_framework import serializers

MAX_LINE_QUANTITY = 999


class AddItemSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, max_value=MAX_LINE_QUANTITY, default=1)


class UpdateItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, max_value=MAX_LINE_QUANTITY)


class CartLineSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    name = serializers.CharField(allow_null=True)
    image_url = serializers.CharField(allow_null=True)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True)
    quantity = serializers.IntegerField()
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    stock = serializers.IntegerField(allow_null=True)
    available = serializers.BooleanField()


class CartSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    user_id = serializers.UUIDField()
    items = CartLineSerializer(many=True, source="lines")
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_quantity = serializers.IntegerField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
