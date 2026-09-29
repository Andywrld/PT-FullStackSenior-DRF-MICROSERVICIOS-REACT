from decimal import Decimal
from uuid import UUID

import requests
from django.conf import settings
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from marketplace_common.middleware import get_request_id

from .cart_gateway import CartLine, CartSnapshot, CartUnavailableError

_session = None


def _default_session():
    global _session
    if _session is None:
        retry = Retry(
            total=settings.CART_SERVICE_RETRIES,
            backoff_factor=0.1,
            status_forcelist=(502, 503, 504),
            allowed_methods=frozenset({"GET", "DELETE"}),
            raise_on_status=False,
        )
        _session = requests.Session()
        _session.mount("http://", HTTPAdapter(max_retries=retry))
        _session.mount("https://", HTTPAdapter(max_retries=retry))
    return _session


class HttpCartGateway:
    def __init__(self, session=None, base_url=None, timeout=None):
        self._session = session or _default_session()
        self._base_url = (base_url or settings.CART_SERVICE_URL).rstrip("/")
        self._timeout = timeout or settings.CART_SERVICE_TIMEOUT

    def get_cart(self, user_id: UUID) -> CartSnapshot:
        data = self._request("get", f"{self._base_url}/internal/v1/carts/{user_id}/")
        return CartSnapshot(lines=[_to_line(item) for item in data["items"]])

    def clear_cart(self, user_id: UUID) -> None:
        self._request("delete", f"{self._base_url}/internal/v1/carts/{user_id}/items/")

    def _request(self, method, url):
        try:
            response = self._session.request(
                method,
                url,
                headers={"Accept": "application/json", "X-Request-ID": get_request_id()},
                timeout=self._timeout,
            )
        except requests.RequestException as exc:
            raise CartUnavailableError(f"cart service unreachable: {exc}") from exc
        if response.status_code != 200:
            raise CartUnavailableError(f"cart service answered HTTP {response.status_code}")
        return response.json()["data"]


def _to_line(item) -> CartLine:
    return CartLine(
        product_id=UUID(item["product_id"]),
        name=item["name"],
        unit_price=Decimal(item["unit_price"]) if item["unit_price"] is not None else None,
        quantity=item["quantity"],
        stock=item["stock"],
        available=item["available"],
        image_url=item.get("image_url"),
    )
