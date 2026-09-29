import uuid

from django_filters import rest_framework as filters
from rest_framework.exceptions import ValidationError

from .models import Product

MAX_IDS = 100


class ProductFilter(filters.FilterSet):
    is_active = filters.BooleanFilter(field_name="is_active")
    min_price = filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = filters.NumberFilter(field_name="price", lookup_expr="lte")
    category = filters.UUIDFilter(field_name="category_id")
    ids = filters.CharFilter(method="filter_ids")

    class Meta:
        model = Product
        fields = ["is_active", "min_price", "max_price", "category", "ids"]

    def filter_ids(self, queryset, name, value):
        raw_ids = [item.strip() for item in value.split(",") if item.strip()]
        if len(raw_ids) > MAX_IDS:
            raise ValidationError({"ids": f"Accepts at most {MAX_IDS} values."})
        parsed_ids = []
        for raw_id in raw_ids:
            try:
                parsed_ids.append(uuid.UUID(raw_id))
            except ValueError:
                raise ValidationError({"ids": f"'{raw_id}' is not a valid UUID."})
        return queryset.filter(id__in=parsed_ids)
