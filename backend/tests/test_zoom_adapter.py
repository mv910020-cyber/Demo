import io
from datetime import datetime
from urllib.error import HTTPError

import pytest

from app.core.config import settings
from app.services.meetings.zoom import ZoomAdapter


class _FakeResponse:
    def __init__(self, payload: dict):
        self._payload = payload

    def read(self) -> bytes:
        import json

        return json.dumps(self._payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


def test_zoom_adapter_wraps_http_error_as_value_error(monkeypatch):
    monkeypatch.setattr(settings, "zoom_account_id", "account-id")
    monkeypatch.setattr(settings, "zoom_client_id", "client-id")
    monkeypatch.setattr(settings, "zoom_client_secret", "client-secret")

    def fake_urlopen(request, timeout=30):
        if "oauth/token" in request.full_url:
            return _FakeResponse({"access_token": "token"})
        raise HTTPError(
            request.full_url,
            400,
            "Bad Request",
            hdrs=None,
            fp=io.BytesIO(b'{"message":"Invalid field"}'),
        )

    monkeypatch.setattr("app.services.meetings.zoom.urlopen", fake_urlopen)

    adapter = ZoomAdapter()
    with pytest.raises(ValueError, match="Zoom meeting creation failed") as exc:
        adapter.create_meeting("Title", datetime(2026, 4, 20, 10, 30), 60, ["a@example.com"])

    assert "400" in str(exc.value)
    assert "Invalid field" in str(exc.value)
