from app.models.enums import MeetingProvider
from app.services.meetings.base import MeetingAdapter
from app.services.meetings.google import GoogleMeetAdapter
from app.services.meetings.teams import TeamsAdapter
from app.services.meetings.zoom import ZoomAdapter


class MeetingFactory:
    @staticmethod
    def get_adapter(provider: MeetingProvider) -> MeetingAdapter:
        if provider == MeetingProvider.GOOGLE_MEET:
            return GoogleMeetAdapter()
        if provider == MeetingProvider.ZOOM:
            return ZoomAdapter()
        if provider == MeetingProvider.TEAMS:
            return TeamsAdapter()
        raise ValueError(f"Unsupported meeting provider: {provider}")
