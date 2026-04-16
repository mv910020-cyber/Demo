from app.models.enums import DemoStatus


ALLOWED_DEMO_TRANSITIONS: dict[DemoStatus, set[DemoStatus]] = {
    DemoStatus.NEW: {DemoStatus.SCHEDULED},
    DemoStatus.SCHEDULED: {DemoStatus.CONFIRMED, DemoStatus.COMPLETED, DemoStatus.LOST},
    DemoStatus.CONFIRMED: {DemoStatus.COMPLETED, DemoStatus.LOST},
    DemoStatus.COMPLETED: {DemoStatus.FOLLOW_UP, DemoStatus.CONVERTED, DemoStatus.LOST},
    DemoStatus.FOLLOW_UP: {DemoStatus.CONVERTED, DemoStatus.LOST},
    DemoStatus.CONVERTED: set(),
    DemoStatus.LOST: set(),
}


def can_transition(current: DemoStatus, target: DemoStatus) -> bool:
    return target in ALLOWED_DEMO_TRANSITIONS.get(current, set())
