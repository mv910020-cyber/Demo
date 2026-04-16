from datetime import datetime, timezone
from base64 import b64encode
import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.core.config import settings
from app.services.meetings.base import MeetingAdapter


class ZoomAdapter(MeetingAdapter):
    def create_meeting(self, title: str, start_time: datetime, duration_minutes: int, attendees: list[str]) -> str:
        if not settings.zoom_account_id or not settings.zoom_client_id or not settings.zoom_client_secret:
            raise ValueError("Zoom credentials are required")

        start_time_utc = (
            start_time.astimezone(timezone.utc) if start_time.tzinfo is not None else start_time.replace(tzinfo=timezone.utc)
        )
        token = b64encode(f"{settings.zoom_client_id}:{settings.zoom_client_secret}".encode()).decode()
        auth_request = Request(
            f"https://zoom.us/oauth/token?{urlencode({'grant_type': 'account_credentials', 'account_id': settings.zoom_account_id})}",
            headers={"Authorization": f"Basic {token}"},
            method="POST",
        )
        try:
            with urlopen(auth_request, timeout=30) as auth_response:
                access_token = json.loads(auth_response.read().decode("utf-8"))["access_token"]

            payload = {
                "topic": title,
                "type": 2,
                "start_time": start_time_utc.isoformat(timespec="seconds").replace("+00:00", "Z"),
                "timezone": "UTC",
                "duration": duration_minutes,
                "settings": {"join_before_host": False, "waiting_room": True},
            }
            request = Request(
                "https://api.zoom.us/v2/users/me/meetings",
                data=json.dumps(payload).encode("utf-8"),
                headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
                method="POST",
            )
            with urlopen(request, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))["join_url"]
        except HTTPError as exc:
            details = ""
            if exc.fp:
                try:
                    details = exc.fp.read().decode("utf-8").strip()
                except Exception:
                    details = ""
            raise ValueError(f"Zoom meeting creation failed ({exc.code} {exc.reason}){': ' + details if details else ''}") from exc
        except (URLError, TimeoutError) as exc:
            raise ValueError(f"Zoom meeting creation failed: {exc}") from exc
