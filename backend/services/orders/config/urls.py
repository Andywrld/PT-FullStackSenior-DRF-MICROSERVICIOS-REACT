from django.urls import include, path, re_path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from orders.views import HealthView

API_VERSION = r"(?P<version>v1)"

handler404 = "marketplace_common.views.not_found"
handler500 = "marketplace_common.views.server_error"

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    re_path(rf"^api/{API_VERSION}/", include("orders.urls")),
    re_path(
        rf"^api/{API_VERSION}/schema/orders/$",
        SpectacularAPIView.as_view(),
        name="schema-orders",
    ),
    re_path(
        rf"^api/{API_VERSION}/docs/orders/$",
        SpectacularSwaggerView.as_view(url_name="schema-orders"),
        name="docs-orders",
    ),
]
