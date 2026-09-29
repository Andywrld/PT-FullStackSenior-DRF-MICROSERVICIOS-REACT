import os
from pathlib import Path

from marketplace_common.conf import logging_settings, rest_framework_settings, spectacular_settings

BASE_DIR = Path(__file__).resolve().parent.parent


def env_str(name, default=""):
    return os.environ.get(name, default)


def env_bool(name, default=False):
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_int(name, default=0):
    value = os.environ.get(name)
    if value is None or value == "":
        return default
    return int(value)


def env_float(name, default=0.0):
    value = os.environ.get(name)
    if value is None or value == "":
        return default
    return float(value)


def env_list(name, default=None):
    value = os.environ.get(name)
    if not value:
        return list(default or [])
    return [item.strip() for item in value.split(",") if item.strip()]


SECRET_KEY = env_str("DJANGO_SECRET_KEY", "insecure-dev-secret-key-change-me")
DEBUG = env_bool("DJANGO_DEBUG", False)
# "cart" is required so the orders service can reach this API by hostname.
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", ["localhost", "127.0.0.1", "cart"])

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.staticfiles",
    "rest_framework",
    "drf_spectacular",
    "marketplace_common",
    "carts",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.middleware.common.CommonMiddleware",
    "marketplace_common.middleware.RequestIDMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env_str("POSTGRES_DB", "cart"),
        "USER": env_str("POSTGRES_USER", "cart"),
        "PASSWORD": env_str("POSTGRES_PASSWORD", "cart"),
        "HOST": env_str("POSTGRES_HOST", "cart-db"),
        "PORT": env_str("POSTGRES_PORT", "5432"),
        "CONN_MAX_AGE": env_int("DJANGO_CONN_MAX_AGE", 60),
        "CONN_HEALTH_CHECKS": True,
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}


PRODUCTS_SERVICE_URL = env_str("PRODUCTS_SERVICE_URL", "http://products:8000")
PRODUCTS_SERVICE_TIMEOUT = (
    env_float("PRODUCTS_SERVICE_CONNECT_TIMEOUT", 1.0),
    env_float("PRODUCTS_SERVICE_READ_TIMEOUT", 3.0),
)
PRODUCTS_SERVICE_RETRIES = env_int("PRODUCTS_SERVICE_RETRIES", 2)
PRODUCT_CATALOG_CLASS = "carts.catalog_http.HttpProductCatalog"


USE_TZ = True
TIME_ZONE = "UTC"
LANGUAGE_CODE = env_str("DJANGO_LANGUAGE_CODE", "es")


REST_FRAMEWORK = rest_framework_settings(DEBUG)

SPECTACULAR_SETTINGS = spectacular_settings(
    "Cart Service API",
    "The authenticated user's cart. Prices are always read live from the products service.",
)

LOGGING = logging_settings()


JWT_JWKS_URL = env_str("JWT_JWKS_URL", "http://auth:8000/.well-known/jwks.json")
JWT_ISSUER = env_str("JWT_ISSUER", "marketplace-auth")
JWT_AUDIENCE = env_str("JWT_AUDIENCE", "marketplace")
JWT_PUBLIC_KEY = env_str("JWT_PUBLIC_KEY", "")
