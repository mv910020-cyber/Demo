from abc import ABC, abstractmethod
from datetime import datetime


class MeetingAdapter(ABC):
    @abstractmethod
    def create_meeting(self, title: str, start_time: datetime, duration_minutes: int, attendees: list[str]) -> str:
        raise NotImplementedError
