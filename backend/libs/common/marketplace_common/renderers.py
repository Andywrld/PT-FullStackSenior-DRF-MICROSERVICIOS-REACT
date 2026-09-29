from rest_framework.renderers import JSONRenderer

from .envelope import error_envelope, success_envelope


class EnvelopeJSONRenderer(JSONRenderer):

    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = (renderer_context or {}).get("response")
        if response is None:
            return super().render(data, accepted_media_type, renderer_context)

        if response.status_code >= 400:
            if isinstance(data, dict) and "error" in data:
                body = error_envelope(**data["error"])
            else:
                body = error_envelope("error", "The request failed.", data)
        else:
            body = success_envelope(data, getattr(response, "envelope_meta", None))
        return super().render(body, accepted_media_type, renderer_context)
