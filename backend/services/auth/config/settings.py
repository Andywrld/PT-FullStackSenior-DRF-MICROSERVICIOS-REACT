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
# "auth" lets the other services fetch the JWKS by compose hostname.
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", ["localhost", "127.0.0.1", "auth"])

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.staticfiles",
    "django.contrib.postgres",  # the unaccent lookup behind accent-insensitive search
    "rest_framework",
    "drf_spectacular",
    "marketplace_common",
    "accounts",
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
        "NAME": env_str("POSTGRES_DB", "auth"),
        "USER": env_str("POSTGRES_USER", "auth"),
        "PASSWORD": env_str("POSTGRES_PASSWORD", "auth"),
        "HOST": env_str("POSTGRES_HOST", "auth-db"),
        "PORT": env_str("POSTGRES_PORT", "5432"),
        "CONN_MAX_AGE": env_int("DJANGO_CONN_MAX_AGE", 60),
        "CONN_HEALTH_CHECKS": True,
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

SUPERADMIN_EMAIL = env_str("SUPERADMIN_EMAIL", "")
SUPERADMIN_PASSWORD = env_str("SUPERADMIN_PASSWORD", "")


STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}


JWT_PRIVATE_KEY_PATH = env_str("JWT_PRIVATE_KEY_PATH", "/keys/jwt_private.pem")
JWT_ISSUER = env_str("JWT_ISSUER", "marketplace-auth")
JWT_AUDIENCE = env_str("JWT_AUDIENCE", "marketplace")
JWT_ACCESS_TTL_MINUTES = env_int("JWT_ACCESS_TTL_MINUTES", 15)
JWT_REFRESH_TTL_DAYS = env_int("JWT_REFRESH_TTL_DAYS", 7)


USE_TZ = True
TIME_ZONE = "UTC"
LANGUAGE_CODE = env_str("DJANGO_LANGUAGE_CODE", "es")


REST_FRAMEWORK = {
    **rest_framework_settings(DEBUG),
    "DEFAULT_AUTHENTICATION_CLASSES": ["accounts.authentication.LocalJWTAuthentication"],
}

SPECTACULAR_SETTINGS = spectacular_settings(
    "Auth Service API",
    "Registration, login and JWT issuing (RS256). Roles: user, admin, super_admin.",
)

LOGGING = logging_settings()
