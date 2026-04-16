from enum import Enum


class Role(str, Enum):
    ADMIN = "admin"
    SALES = "sales"
    TECHNICAL = "technical"
    MANAGEMENT = "management"


class DemoType(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"


class MeetingProvider(str, Enum):
    GOOGLE_MEET = "google_meet"
    ZOOM = "zoom"
    TEAMS = "teams"


class DemoStatus(str, Enum):
    NEW = "new"
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    FOLLOW_UP = "follow_up"
    CONVERTED = "converted"
    LOST = "lost"


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class RequirementStatus(str, Enum):
    NEW = "new"
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    SHIPPED = "shipped"
    REJECTED = "rejected"


class ReminderChannel(str, Enum):
    EMAIL = "email"
    WHATSAPP = "whatsapp"


class ReminderStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
