from django.urls import path, re_path

from .views import UUID_REGEX, CartViewSet

# No cart id in the URL: the owner comes from the JWT, so no one can guess another user's cart.
cart = CartViewSet.as_view({"get": "retrieve"})
items = CartViewSet.as_view({"post": "add_item", "delete": "clear_items"})
item = CartViewSet.as_view({"patch": "update_item", "delete": "remove_item"})

urlpatterns = [
    path("cart/", cart, name="cart"),
    path("cart/items/", items, name="cart-items"),
    re_path(rf"^cart/items/(?P<product_id>{UUID_REGEX})/$", item, name="cart-item"),
]
