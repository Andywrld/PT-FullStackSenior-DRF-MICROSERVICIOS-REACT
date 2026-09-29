def rest_framework_settings(debug):
    renderers = ["marketplace_common.renderers.EnvelopeJSONRenderer"]
    if debug:
        renderers.append("rest_framework.renderers.BrowsableAPIRenderer")
    return {
        "DEFAULT_AUTHENTICATION_CLASSES": ["marketplace_common.auth.JWTAuthentication"],
        "UNAUTHENTICATED_USER": None,
        # Deny by default: public endpoints must opt out explicitly.
        "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
        "DEFAULT_PAGINATION_CLASS": "marketplace_common.pagination.EnvelopePagination",
        "PAGE_SIZE": 20,
        "EXCEPTION_HANDLER": "marketplace_common.exceptions.exception_handler",
        "DEFAULT_RENDERER_CLASSES": renderers,
        "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
        "DEFAULT_VERSIONING_CLASS": "rest_framework.versioning.URLPathVersioning",
        "DEFAULT_VERSION": "v1",
        "ALLOWED_VERSIONS": ("v1",),
    }


def spectacular_settings(title, description):
    return {
        "TITLE": title,
        "DESCRIPTION": description,
        "VERSION": "1.0.0",
        "SERVE_INCLUDE_SCHEMA": False,
        "POSTPROCESSING_HOOKS": [
            "drf_spectacular.hooks.postprocess_schema_enums",
            "marketplace_common.schema.envelope_hook",
        ],
    }


def logging_settings():
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "filters": {"request_id": {"()": "marketplace_common.middleware.RequestIDLogFilter"}},
        "formatters": {
            "default": {"format": "%(asctime)s %(levelname)s [%(request_id)s] %(name)s: %(message)s"},
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "filters": ["request_id"],
            },
        },
        "root": {"handlers": ["console"], "level": "INFO"},
    }
