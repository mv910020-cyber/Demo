import io
from datetime import datetime
from urllib.error import HTTPError

import pytest

from app.core.config import settings
from app.services.meetings.google import GoogleMeetAdapter
from app.services.meetings.teams import TeamsAdapter


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


def test_google_meet_adapter_wraps_http_error_as_value_error(monkeypatch):
    monkeypatch.setattr(settings, "google_calendar_access_token", "token")
    monkeypatch.setattr(settings, "google_calendar_timezone", "UTC")

    def fake_urlopen(request, timeout=30):
        if "conferenceDataVersion=1" in request.full_url:
            raise HTTPError(
                request.full_url,
                401,
                "Unauthorized",
                hdrs=None,
                fp=io.BytesIO(b'{"error":{"message":"Invalid Credentials"}}'),
            )
        return _FakeResponse({"access_token": "unused"})

    monkeypatch.setattr("app.services.meetings.google.urlopen", fake_urlopen)

    adapter = GoogleMeetAdapter()
    with pytest.raises(ValueError, match="Google Meet creation failed") as exc:
        adapter.create_meeting("Title", datetime(2026, 4, 20, 10, 30), 60, ["a@example.com"])

    assert "401" in str(exc.value)
    assert "Invalid Credentials" in str(exc.value)


def test_teams_adapter_wraps_http_error_as_value_error(monkeypatch):
    monkeypatch.setattr(settings, "microsoft_graph_access_token", "token")

    def fake_urlopen(request, timeout=30):
        raise HTTPError(
            request.full_url,
            401,
            "Unauthorized",
            hdrs=None,
            fp=io.BytesIO(b'{"error":{"message":"Unauthorized"}}'),
        )

    monkeypatch.setattr("app.services.meetings.teams.urlopen", fake_urlopen)

    adapter = TeamsAdapter()
    with pytest.raises(ValueError, match="Teams meeting creation failed") as exc:
        adapter.create_meeting("Title", datetime(2026, 4, 20, 10, 30), 60, ["a@example.com"])

    assert "401" in str(exc.value)
    assert "Unauthorized" in str(exc.value)
