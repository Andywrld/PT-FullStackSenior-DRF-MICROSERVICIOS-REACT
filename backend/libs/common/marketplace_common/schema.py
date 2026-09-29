from drf_spectacular.extensions import OpenApiAuthenticationExtension

REF = "#/components/schemas/"


class JWTAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = "marketplace_common.auth.JWTAuthentication"
    match_subclasses = True
    name = "BearerAuth"

    def get_security_definition(self, auto_schema):
        return {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}

COMPONENTS = {
    "Pagination": {
        "type": "object",
        "properties": {
            "page": {"type": "integer"},
            "page_size": {"type": "integer"},
            "total_items": {"type": "integer"},
            "total_pages": {"type": "integer"},
            "has_next": {"type": "boolean"},
            "has_previous": {"type": "boolean"},
        },
    },
    "Meta": {
        "type": "object",
        "required": ["request_id"],
        "properties": {
            "request_id": {"type": "string"},
            "pagination": {"$ref": f"{REF}Pagination"},
        },
    },
    "Error": {
        "type": "object",
        "required": ["code", "message"],
        "properties": {
            "code": {"type": "string", "example": "validation_error"},
            "message": {"type": "string"},
            "details": {"type": "object", "nullable": True},
        },
    },
    "ErrorEnvelope": {
        "type": "object",
        "required": ["success", "data", "error", "meta"],
        "properties": {
            "success": {"type": "boolean", "enum": [False]},
            "data": {"nullable": True, "enum": [None]},
            "error": {"$ref": f"{REF}Error"},
            "meta": {"$ref": f"{REF}Meta"},
        },
    },
}


def _success(data_schema):
    return {
        "type": "object",
        "required": ["success", "data", "error", "meta"],
        "properties": {
            "success": {"type": "boolean", "enum": [True]},
            "data": data_schema,
            "error": {"nullable": True, "enum": [None]},
            "meta": {"$ref": f"{REF}Meta"},
        },
    }


def envelope_hook(result, generator, request, public):
    result.setdefault("components", {}).setdefault("schemas", {}).update(COMPONENTS)
    for path_item in result.get("paths", {}).values():
        for operation in path_item.values():
            if not isinstance(operation, dict) or "responses" not in operation:
                continue
            for status_code, response in operation["responses"].items():
                content = response.get("content", {}).get("application/json")
                if content is not None and status_code.startswith("2"):
                    content["schema"] = _success(content.get("schema", {"nullable": True}))
            error = {"$ref": f"{REF}ErrorEnvelope"}
            for range_code in ("4XX", "5XX"):
                operation["responses"].setdefault(
                    range_code,
                    {"description": "Error", "content": {"application/json": {"schema": error}}},
                )
    return result
