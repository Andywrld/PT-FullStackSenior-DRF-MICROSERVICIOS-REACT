from django.apps import AppConfig


class MarketplaceCommonConfig(AppConfig):
    name = "marketplace_common"

    def ready(self):
        # Registers the OpenAPI extension for JWTAuthentication ("Authorize" button).
        from . import schema  # noqa: F401
