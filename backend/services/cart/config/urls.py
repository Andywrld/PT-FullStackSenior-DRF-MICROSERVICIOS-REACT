from django.urls import include, path, re_path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from carts.views import HealthView, InternalCartItemsView, InternalCartView

API_VERSION = r"(?P<version>v1)"

handler404 = "marketplace_common.views.not_found"
handler500 = "marketplace_common.views.server_error"

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    # Internal only (never routed by the gateway): used by the orders service.
    path("internal/v1/carts/<uuid:user_id>/", InternalCartView.as_view(), name="internal-cart"),
    path(
        "internal/v1/carts/<uuid:user_id>/items/",
        InternalCartItemsView.as_view(),
        name="internal-cart-items",
    ),
    re_path(rf"^api/{API_VERSION}/", include("carts.urls")),
    re_path(
        rf"^api/{API_VERSION}/schema/cart/$",
        SpectacularAPIView.as_view(),
        name="schema-cart",
    ),
    re_path(
        rf"^api/{API_VERSION}/docs/cart/$",
        SpectacularSwaggerView.as_view(url_name="schema-cart"),
        name="docs-cart",
    ),
]
