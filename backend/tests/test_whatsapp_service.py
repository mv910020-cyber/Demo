import json

from app.core import config
from app.services.whatsapp_service import WhatsAppService


class DummyResponse:
    def read(self):
        return b"{}"

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


def test_whatsapp_service_builds_graph_payload(monkeypatch):
    monkeypatch.setattr(config.settings, "whatsapp_api_url", "https://graph.facebook.com/v25.0/123/messages")
    monkeypatch.setattr(config.settings, "whatsapp_api_token", "token")
    monkeypatch.setattr(config.settings, "whatsapp_timeout", 5)

    captured = {}

    def fake_urlopen(request, timeout=0):
        captured["url"] = request.full_url
        captured["headers"] = dict(request.headers)
        captured["payload"] = json.loads(request.data.decode("utf-8"))
        captured["timeout"] = timeout
        return DummyResponse()

    monkeypatch.setattr("app.services.whatsapp_service.urlopen", fake_urlopen)

    assert WhatsAppService.send_message("+91 83282 96608", "Hello") is True
    assert captured["url"] == "https://graph.facebook.com/v25.0/123/messages"
    assert captured["payload"]["messaging_product"] == "whatsapp"
    assert captured["payload"]["to"] == "918328296608"
    assert captured["timeout"] == 5