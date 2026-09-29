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


def env_list(name, default=None):
    value = os.environ.get(name)
    if not value:
        return list(default or [])
    return [item.strip() for item in value.split(",") if item.strip()]


SECRET_KEY = env_str("DJANGO_SECRET_KEY", "insecure-dev-secret-key-change-me")
DEBUG = env_bool("DJANGO_DEBUG", False)
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", ["localhost", "127.0.0.1", "products"])

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.staticfiles",
    "rest_framework",
    "django_filters",
    "drf_spectacular",
    "marketplace_common",
    "products",
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
        "NAME": env_str("POSTGRES_DB", "products"),
        "USER": env_str("POSTGRES_USER", "products"),
        "PASSWORD": env_str("POSTGRES_PASSWORD", "products"),
        "HOST": env_str("POSTGRES_HOST", "products-db"),
        "PORT": env_str("POSTGRES_PORT", "5432"),
        "CONN_MAX_AGE": env_int("DJANGO_CONN_MAX_AGE", 60),
        "CONN_HEALTH_CHECKS": True,
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
# S3 API only (MinIO locally, any S3 elsewhere). Public-read via the gateway's /media/: unsigned, cacheable URLs.

STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "bucket_name": env_str("S3_BUCKET", "product-images"),
            "endpoint_url": env_str("S3_ENDPOINT_URL", "http://minio:9000"),
            "access_key": env_str("PRODUCTS_S3_ACCESS_KEY"),
            "secret_key": env_str("PRODUCTS_S3_SECRET_KEY"),
            "region_name": env_str("S3_REGION", "us-east-1"),
            "addressing_style": "path",
            "signature_version": "s3v4",
            "querystring_auth": False,
            "file_overwrite": False,
            "default_acl": None,
            "custom_domain": env_str("MEDIA_PUBLIC_DOMAIN", "localhost:8080/media/product-images"),
            "url_protocol": env_str("MEDIA_URL_PROTOCOL", "http:"),
        },
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}


CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": env_str("REDIS_URL", "redis://redis:6379/0"),
        "KEY_PREFIX": "products",
        "TIMEOUT": env_int("CATALOG_CACHE_TTL_SECONDS", 300),
        # Short timeouts: a sick Redis must not slow the catalog down much (fail-open).
        "OPTIONS": {"socket_connect_timeout": 0.2, "socket_timeout": 0.2},
    }
}

MAX_IMAGE_UPLOAD_BYTES = env_int("MAX_IMAGE_UPLOAD_MB", 5) * 1024 * 1024
MAX_IMAGES_PER_PRODUCT = env_int("MAX_IMAGES_PER_PRODUCT", 8)


USE_TZ = True
TIME_ZONE = "UTC"
LANGUAGE_CODE = env_str("DJANGO_LANGUAGE_CODE", "es")


REST_FRAMEWORK = {
    **rest_framework_settings(DEBUG),
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
}

SPECTACULAR_SETTINGS = spectacular_settings(
    "Products Service API",
    "Marketplace product catalog. Anyone can read; only admins can write.",
)

LOGGING = logging_settings()


JWT_JWKS_URL = env_str("JWT_JWKS_URL", "http://auth:8000/.well-known/jwks.json")
JWT_ISSUER = env_str("JWT_ISSUER", "marketplace-auth")
JWT_AUDIENCE = env_str("JWT_AUDIENCE", "marketplace")
JWT_PUBLIC_KEY = env_str("JWT_PUBLIC_KEY", "")
