from uuid import UUID

import requests
from django.conf import settings
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from marketplace_common.middleware import get_request_id

from .services import InsufficientStockError, UnavailableItemsError
from .stock_gateway import StockLine, StockUnavailableError

_session = None

# Ok whether the reference existed or not: releasing is idempotent.
_RELEASE_OK = (200, 204, 404)


def _default_session():
    global _session
    if _session is None:
        retry = Retry(
            total=settings.PRODUCTS_SERVICE_RETRIES,
            backoff_factor=0.1,
            status_forcelist=(502, 503, 504),
            # POST is retried too, which is safe only because deductions are idempotent by
            # reference: a repeat of a call that did get through answers with the original.
            allowed_methods=frozenset({"POST", "DELETE"}),
            raise_on_status=False,
        )
        _session = requests.Session()
        _session.mount("http://", HTTPAdapter(max_retries=retry))
        _session.mount("https://", HTTPAdapter(max_retries=retry))
    return _session


class HttpStockGateway:
    def __init__(self, session=None, base_url=None, timeout=None):
        self._session = session or _default_session()
        self._base_url = (base_url or settings.PRODUCTS_SERVICE_URL).rstrip("/")
        self._timeout = timeout or settings.PRODUCTS_SERVICE_TIMEOUT

    def deduct(self, reference: UUID, lines: list[StockLine]) -> None:
        response = self._request(
            "post",
            f"{self._base_url}/internal/v1/stock/deductions/",
            json={
                "reference": str(reference),
                "items": [{"product_id": str(line.product_id), "quantity": line.quantity} for line in lines],
            },
        )
        if response.status_code in (200, 201):  # 200: an earlier attempt of this same call already got through
            return
        if response.status_code == 409:
            _raise_rejection(response)
        raise StockUnavailableError(f"products service answered HTTP {response.status_code}")

    def release(self, reference: UUID) -> None:
        response = self._request("delete", f"{self._base_url}/internal/v1/stock/deductions/{reference}/")
        if response.status_code not in _RELEASE_OK:
            raise StockUnavailableError(f"products service answered HTTP {response.status_code}")

    def _request(self, method, url, json=None):
        try:
            return self._session.request(
                method,
                url,
                json=json,
                headers={"Accept": "application/json", "X-Request-ID": get_request_id()},
                timeout=self._timeout,
            )
        except requests.RequestException as exc:
            raise StockUnavailableError(f"products service unreachable: {exc}") from exc


def _raise_rejection(response) -> None:
    """The catalog refused the deduction: surface its verdict as the order's own error."""
    try:
        error = response.json()["error"]
        code, message, details = error["code"], error["message"], error.get("details")
    except (ValueError, KeyError, TypeError):
        raise StockUnavailableError("products service answered an unreadable HTTP 409") from None
    if code == "insufficient_stock":
        raise InsufficientStockError(message, details=details)
    if code == "unavailable_items":
        raise UnavailableItemsError(message, details=details)
    raise StockUnavailableError(f"products service refused the deduction: {code}")
