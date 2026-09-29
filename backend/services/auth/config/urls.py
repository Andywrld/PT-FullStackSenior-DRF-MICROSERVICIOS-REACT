from django.urls import include, path, re_path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from accounts.views import HealthView, JWKSView

API_VERSION = r"(?P<version>v1)"

handler404 = "marketplace_common.views.not_found"
handler500 = "marketplace_common.views.server_error"

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path(".well-known/jwks.json", JWKSView.as_view(), name="jwks"),
    re_path(rf"^api/{API_VERSION}/auth/", include("accounts.urls")),
    re_path(
        rf"^api/{API_VERSION}/schema/auth/$",
        SpectacularAPIView.as_view(),
        name="schema-auth",
    ),
    re_path(
        rf"^api/{API_VERSION}/docs/auth/$",
        SpectacularSwaggerView.as_view(url_name="schema-auth"),
        name="docs-auth",
    ),
]
