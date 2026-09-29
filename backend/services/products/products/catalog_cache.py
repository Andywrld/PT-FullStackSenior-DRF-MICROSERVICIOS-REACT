# Versioned keys: any committed change bumps `catalog:version`, so every cached combination becomes
# unreachable at once, and a slow reader's stale write lands under a version nobody reads.
# Fail-open: if Redis is down, reads go to the database.
import hashlib
import json
import logging
from urllib.parse import urlencode

from django.core.cache import cache
from rest_framework.response import Response
from rest_framework.utils.encoders import JSONEncoder

logger = logging.getLogger(__name__)

VERSION_KEY = "catalog:version"


def _safe(operation, default=None):
    try:
        return operation()
    except Exception:  # redis.ConnectionError, TimeoutError, ...
        logger.warning("Catalog cache unavailable; falling back to the database", exc_info=True)
        return default


def _current_version():
    # add() is a no-op if the key exists; the version never expires.
    _safe(lambda: cache.add(VERSION_KEY, 1, timeout=None))
    return _safe(lambda: cache.get(VERSION_KEY))


def bump_version():
    """Invalidate the whole catalog cache. Call only after the change is committed."""
    _safe(lambda: cache.add(VERSION_KEY, 1, timeout=None))
    _safe(lambda: cache.incr(VERSION_KEY))


def _key(request, version):
    query = urlencode(sorted(request.query_params.lists()), doseq=True)
    digest = hashlib.sha256(f"{request.path}?{query}".encode()).hexdigest()[:32]
    return f"catalog:v{version}:{digest}"


class CatalogCacheMixin:

    # Query params that must always read fresh data (e.g. pricing at checkout).
    cache_bypass_params = ()

    def list(self, request, *args, **kwargs):
        return self._cached(request, lambda: super(CatalogCacheMixin, self).list(request, *args, **kwargs))

    def retrieve(self, request, *args, **kwargs):
        return self._cached(request, lambda: super(CatalogCacheMixin, self).retrieve(request, *args, **kwargs))

    def _cached(self, request, compute):
        if any(param in request.query_params for param in self.cache_bypass_params):
            return _tag(compute(), "BYPASS")

        version = _current_version()
        if version is None:  # Redis down: straight to the database
            return _tag(compute(), "MISS")

        key = _key(request, version)
        hit = _safe(lambda: cache.get(key))
        if hit is not None:
            entry = json.loads(hit)
            response = Response(entry["data"])
            response.envelope_meta = entry["meta"]
            return _tag(response, "HIT")

        response = compute()
        if response.status_code == 200:
            entry = json.dumps(
                {"data": response.data, "meta": getattr(response, "envelope_meta", None)}, cls=JSONEncoder
            )
            _safe(lambda: cache.set(key, entry))
        return _tag(response, "MISS")


def _tag(response, status):
    response["X-Cache"] = status
    return response
