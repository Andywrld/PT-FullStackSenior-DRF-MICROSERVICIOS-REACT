from django.urls import include, path, re_path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from products.views import HealthView, InternalStockDeductionView, InternalStockDeductionsView

API_VERSION = r"(?P<version>v1)"

handler404 = "marketplace_common.views.not_found"
handler500 = "marketplace_common.views.server_error"

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    # Internal only (never routed by the gateway): used by the orders service.
    path("internal/v1/stock/deductions/", InternalStockDeductionsView.as_view(), name="internal-stock-deductions"),
    path(
        "internal/v1/stock/deductions/<uuid:reference>/",
        InternalStockDeductionView.as_view(),
        name="internal-stock-deduction",
    ),
    re_path(rf"^api/{API_VERSION}/", include("products.urls")),
    re_path(
        rf"^api/{API_VERSION}/schema/products/$",
        SpectacularAPIView.as_view(),
        name="schema-products",
    ),
    re_path(
        rf"^api/{API_VERSION}/docs/products/$",
        SpectacularSwaggerView.as_view(url_name="schema-products"),
        name="docs-products",
    ),
]
