from .middleware import get_request_id


def success_envelope(data, meta=None):
    return {
        "success": True,
        "data": data,
        "error": None,
        "meta": {**(meta or {}), "request_id": get_request_id()},
    }


def error_envelope(code, message, details=None):
    return {
        "success": False,
        "data": None,
        "error": {"code": code, "message": message, "details": details},
        "meta": {"request_id": get_request_id()},
    }
