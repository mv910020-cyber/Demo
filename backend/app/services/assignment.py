from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.datetime_utils import ensure_naive_utc
from app.models.availability import UserAvailability
from app.models.enums import DemoStatus, Role
from app.models.user import User
from app.models.demo import Demo

ACTIVE_STATUSES = {DemoStatus.NEW, DemoStatus.SCHEDULED, DemoStatus.CONFIRMED, DemoStatus.FOLLOW_UP}


class AssignmentService:
    @staticmethod
    def assign_least_loaded_rep(db: Session) -> User:
        return AssignmentService._assign_least_loaded_user(db, Role.SALES)

    @staticmethod
    def assign_least_loaded_presenter(db: Session) -> User:
        return AssignmentService._assign_least_loaded_user(db, Role.TECHNICAL)

    @staticmethod
    def assign_available_rep(db: Session, target_datetime: datetime) -> User:
        return AssignmentService._assign_available_user(db, Role.SALES, target_datetime)

    @staticmethod
    def assign_available_presenter(db: Session, target_datetime: datetime) -> User:
        return AssignmentService._assign_available_user(db, Role.TECHNICAL, target_datetime)

    @staticmethod
    def user_has_conflict(db: Session, user: User, target_datetime: datetime, duration_minutes: int = 60) -> bool:
        normalized_start = ensure_naive_utc(target_datetime)
        slot_end = normalized_start + timedelta(minutes=duration_minutes)
        return AssignmentService._has_conflicting_demo(db, user, normalized_start, slot_end)

    @staticmethod
    def _assign_least_loaded_user(db: Session, role: Role) -> User:
        users = db.query(User).filter(User.role == role).order_by(User.created_at.asc()).all()
        if not users:
            raise ValueError(f"No users available for role {role.value}")

        def active_count_for_user(user: User) -> int:
            if role == Role.SALES:
                return (
                    db.query(Demo)
                    .filter(Demo.sales_rep_id == user.id, Demo.status.in_(ACTIVE_STATUSES))
                    .count()
                )
            return (
                db.query(Demo)
                .filter(Demo.technical_presenter_id == user.id, Demo.status.in_(ACTIVE_STATUSES))
                .count()
            )

        return min(users, key=lambda user: (active_count_for_user(user), user.created_at, user.id))

    @staticmethod
    def _assign_available_user(db: Session, role: Role, target_datetime: datetime) -> User:
        target_datetime = ensure_naive_utc(target_datetime)
        users = db.query(User).filter(User.role == role).order_by(User.created_at.asc()).all()
        if not users:
            raise ValueError(f"No users available for role {role.value}")

        matching_users = [
            user
            for user in users
            if AssignmentService._has_availability(user, db, target_datetime)
            and not AssignmentService._has_conflicting_demo(db, user, target_datetime, target_datetime + timedelta(minutes=60))
        ]
        if matching_users:
            return min(matching_users, key=lambda user: (AssignmentService._active_count(db, user, role), user.created_at, user.id))

        conflict_free_users = [
            user
            for user in users
            if not AssignmentService._has_conflicting_demo(db, user, target_datetime, target_datetime + timedelta(minutes=60))
        ]
        if conflict_free_users:
            return min(conflict_free_users, key=lambda user: (AssignmentService._active_count(db, user, role), user.created_at, user.id))

        raise ValueError(f"No conflict-free users available for role {role.value} at the requested time")

    @staticmethod
    def _has_availability(user: User, db: Session, target_datetime: datetime) -> bool:
        slot_day = target_datetime.weekday()
        slot_time = target_datetime.time()
        availabilities = (
            db.query(UserAvailability)
            .filter(UserAvailability.user_id == user.id, UserAvailability.is_available.is_(True), UserAvailability.day_of_week == slot_day)
            .all()
        )
        return any(slot.start_time <= slot_time <= slot.end_time for slot in availabilities)

    @staticmethod
    def _active_count(db: Session, user: User, role: Role) -> int:
        if role == Role.SALES:
            return db.query(Demo).filter(Demo.sales_rep_id == user.id, Demo.status.in_(ACTIVE_STATUSES)).count()
        return db.query(Demo).filter(Demo.technical_presenter_id == user.id, Demo.status.in_(ACTIVE_STATUSES)).count()

    @staticmethod
    def _has_conflicting_demo(db: Session, user: User, start_time: datetime, end_time: datetime) -> bool:
        start_time = ensure_naive_utc(start_time)
        end_time = ensure_naive_utc(end_time)
        overlapping_sales = (
            db.query(Demo)
            .filter(
                Demo.sales_rep_id == user.id,
                Demo.status.in_(ACTIVE_STATUSES),
                Demo.final_datetime.isnot(None),
            )
            .all()
        )
        overlapping_tech = (
            db.query(Demo)
            .filter(
                Demo.technical_presenter_id == user.id,
                Demo.status.in_(ACTIVE_STATUSES),
                Demo.final_datetime.isnot(None),
            )
            .all()
        )

        for demo in overlapping_sales + overlapping_tech:
            if not demo.final_datetime:
                continue
            demo_start = ensure_naive_utc(demo.final_datetime)
            demo_end = demo_start + timedelta(minutes=60)
            if demo_start < end_time and start_time < demo_end:
                return True
        return False
