import uuid

import pytest
from rest_framework.test import APIClient

from carts.models import Cart, CartItem

pytestmark = pytest.mark.django_db


def test_internal_endpoints_read_and_clear_a_users_cart_without_a_token(catalog):
    user_id = uuid.uuid4()
    product = catalog.add(name="Mouse", price="19.99")
    cart = Cart.objects.create(user_id=user_id)
    CartItem.objects.create(cart=cart, product_id=product.id, quantity=2)

    client = APIClient()  # no credentials: internal endpoints require no token

    read = client.get(f"/internal/v1/carts/{user_id}/")
    assert read.json()["data"]["items"][0]["name"] == "Mouse"

    cleared = client.delete(f"/internal/v1/carts/{user_id}/items/")
    assert cleared.json()["data"]["items"] == []
    assert not CartItem.objects.filter(cart=cart).exists()
