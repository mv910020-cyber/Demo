from datetime import time

from pydantic import BaseModel, ConfigDict


class AvailabilityCreate(BaseModel):
    day_of_week: int
    start_time: time
    end_time: time
    is_available: bool = True


class AvailabilityRead(BaseModel):
    id: int
    user_id: int
    day_of_week: int
    start_time: time
    end_time: time
    is_available: bool

    model_config = ConfigDict(from_attributes=True)
