import uuid

import pytest
import requests

from orders.cart_gateway import CartUnavailableError
from orders.cart_http import HttpCartGateway
from orders.tests.fakes import FakeSession, fake_response


@pytest.mark.parametrize(
    "outcome",
    [requests.ConnectionError("connection refused"), fake_response(503)],
    ids=["network-error", "server-error"],
)
def test_network_errors_and_server_errors_raise_cart_unavailable(outcome):
    gateway = HttpCartGateway(session=FakeSession(outcome), base_url="http://cart:8000")

    with pytest.raises(CartUnavailableError):
        gateway.get_cart(uuid.uuid4())
