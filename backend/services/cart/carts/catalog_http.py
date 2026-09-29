from decimal import Decimal
from uuid import UUID

import requests
from django.conf import settings
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from marketplace_common.middleware import get_request_id

from .catalog import CatalogUnavailableError, ProductSnapshot

# The products service caps the `ids` filter (and page size) at 100.
MAX_IDS_PER_REQUEST = 100

_session = None


def _default_session():
    global _session
    if _session is None:
        retry = Retry(
            total=settings.PRODUCTS_SERVICE_RETRIES,
            backoff_factor=0.1,
            status_forcelist=(502, 503, 504),
            allowed_methods=frozenset({"GET"}),
            raise_on_status=False,
        )
        _session = requests.Session()
        _session.mount("http://", HTTPAdapter(max_retries=retry))
        _session.mount("https://", HTTPAdapter(max_retries=retry))
    return _session


class HttpProductCatalog:
    def __init__(self, session=None, base_url=None, timeout=None):
        self._session = session or _default_session()
        base = (base_url or settings.PRODUCTS_SERVICE_URL).rstrip("/")
        self._url = f"{base}/api/v1/products/"
        self._timeout = timeout or settings.PRODUCTS_SERVICE_TIMEOUT

    def get_products(self, product_ids):
        ids = list(dict.fromkeys(product_ids))  # dedupe, keep order
        products = {}
        for start in range(0, len(ids), MAX_IDS_PER_REQUEST):
            for item in self._fetch(ids[start : start + MAX_IDS_PER_REQUEST]):
                snapshot = _to_snapshot(item)
                products[snapshot.id] = snapshot
        return products

    def _fetch(self, ids):
        try:
            response = self._session.get(
                self._url,
                params={"ids": ",".join(str(pid) for pid in ids), "page_size": len(ids)},
                headers={"Accept": "application/json", "X-Request-ID": get_request_id()},
                timeout=self._timeout,
            )
        except requests.RequestException as exc:
            raise CatalogUnavailableError(f"products service unreachable: {exc}") from exc
        if response.status_code != 200:
            raise CatalogUnavailableError(f"products service answered HTTP {response.status_code}")
        return response.json()["data"]


def _to_snapshot(item):
    images = item.get("images") or []
    return ProductSnapshot(
        id=UUID(item["id"]),
        name=item["name"],
        price=Decimal(item["price"]),
        stock=item["stock"],
        is_active=item["is_active"],
        image_url=images[0]["url"] if images else None,
    )
