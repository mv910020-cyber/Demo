from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.datetime_utils import utcnow_naive
from app.db.session import get_db
from app.models.demo import Demo
from app.models.enums import DemoStatus, Role
from app.models.enums import ReminderStatus
from app.models.reminder import DemoReminder
from app.models.requirement import Requirement
from app.models.user import User
from app.schemas.dashboard import DashboardOpsSummary, DashboardOverview, DeadLetterReminderItem, DeadLetterReminderReport

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=DashboardOverview)
def get_overview(
    _: User = Depends(require_roles({Role.ADMIN, Role.MANAGEMENT, Role.SALES, Role.TECHNICAL})),
    db: Session = Depends(get_db),
) -> DashboardOverview:
    total = db.query(func.count(Demo.id)).scalar() or 0
    converted = db.query(func.count(Demo.id)).filter(Demo.status == DemoStatus.CONVERTED).scalar() or 0
    lost = db.query(func.count(Demo.id)).filter(Demo.status == DemoStatus.LOST).scalar() or 0

    no_show = (
        db.query(func.count(Demo.id))
        .filter(Demo.status == DemoStatus.LOST, Demo.lost_reason.ilike("%no show%"))
        .scalar()
        or 0
    )

    status_rows = db.query(Demo.status, func.count(Demo.id)).group_by(Demo.status).all()
    product_rows = db.query(Demo.product_interest, func.count(Demo.id)).group_by(Demo.product_interest).all()
    loss_rows = (
        db.query(Demo.lost_reason, func.count(Demo.id))
        .filter(Demo.status == DemoStatus.LOST, Demo.lost_reason.isnot(None))
        .group_by(Demo.lost_reason)
        .all()
    )
    feature_rows = (
        db.query(Requirement.title, func.count(Requirement.id))
        .group_by(Requirement.title)
        .order_by(func.count(Requirement.id).desc())
        .limit(10)
        .all()
    )

    conversion_rate = (converted / total * 100) if total else 0.0
    no_show_rate = (no_show / total * 100) if total else 0.0

    return DashboardOverview(
        total_demos=total,
        conversion_rate=round(conversion_rate, 2),
        no_show_rate=round(no_show_rate, 2),
        demos_by_status={str(k.value): v for k, v in status_rows},
        demos_by_product={k: v for k, v in product_rows},
        loss_reasons={k: v for k, v in loss_rows if k},
        common_feature_requests=[{"title": k, "count": v} for k, v in feature_rows],
    )


@router.get("/ops-summary", response_model=DashboardOpsSummary)
def get_ops_summary(
    _: User = Depends(require_roles({Role.ADMIN, Role.MANAGEMENT, Role.SALES, Role.TECHNICAL})),
    db: Session = Depends(get_db),
) -> DashboardOpsSummary:
    now = utcnow_naive()
    next_24h = now + timedelta(hours=24)

    unassigned_new_requests = (
        db.query(func.count(Demo.id))
        .filter(Demo.status == DemoStatus.NEW, Demo.sales_rep_id.is_(None), Demo.technical_presenter_id.is_(None))
        .scalar()
        or 0
    )
    upcoming_24h_demos = (
        db.query(func.count(Demo.id))
        .filter(Demo.final_datetime.isnot(None), Demo.final_datetime >= now, Demo.final_datetime <= next_24h)
        .scalar()
        or 0
    )

    window_demos = (
        db.query(Demo)
        .filter(Demo.final_datetime.isnot(None), Demo.final_datetime >= now, Demo.final_datetime <= next_24h)
        .all()
    )
    seen_pairs: set[tuple[int, int]] = set()
    conflict_count = 0
    for idx, first_demo in enumerate(window_demos):
        first_start = first_demo.final_datetime
        first_end = first_start + timedelta(minutes=60)
        for second_demo in window_demos[idx + 1 :]:
            second_start = second_demo.final_datetime
            second_end = second_start + timedelta(minutes=60)
            overlaps = first_start < second_end and second_start < first_end
            if not overlaps:
                continue

            same_sales = first_demo.sales_rep_id and first_demo.sales_rep_id == second_demo.sales_rep_id
            same_tech = first_demo.technical_presenter_id and first_demo.technical_presenter_id == second_demo.technical_presenter_id
            if same_sales or same_tech:
                pair = tuple(sorted((first_demo.id, second_demo.id)))
                if pair not in seen_pairs:
                    seen_pairs.add(pair)
                    conflict_count += 1

    return DashboardOpsSummary(
        unassigned_new_requests=unassigned_new_requests,
        upcoming_24h_demos=upcoming_24h_demos,
        upcoming_conflict_count=conflict_count,
    )


@router.get("/dead-letter-reminders", response_model=DeadLetterReminderReport)
def get_dead_letter_reminders(
    limit: int = 50,
    _: User = Depends(require_roles({Role.ADMIN, Role.MANAGEMENT})),
    db: Session = Depends(get_db),
) -> DeadLetterReminderReport:
    from sqlalchemy.orm import selectinload
    
    safe_limit = max(1, min(limit, 200))
    total_failed = db.query(func.count(DemoReminder.id)).filter(DemoReminder.status == ReminderStatus.FAILED).scalar() or 0
    failed_rows = (
        db.query(DemoReminder)
        .options(selectinload(DemoReminder.demo))
        .filter(DemoReminder.status == ReminderStatus.FAILED)
        .order_by(DemoReminder.created_at.desc())
        .limit(safe_limit)
        .all()
    )

    items = [
        DeadLetterReminderItem(
            reminder_id=row.id,
            demo_id=row.demo_id,
            company_name=row.demo.company_name if row.demo else "unknown",
            channel=row.channel.value,
            attempt_count=row.attempt_count,
            max_attempts=row.max_attempts,
            failure_reason=row.failure_reason,
            remind_at=row.remind_at.isoformat(),
        )
        for row in failed_rows
    ]

    return DeadLetterReminderReport(total_failed_reminders=total_failed, items=items)
