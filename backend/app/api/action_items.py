from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.action_item import ActionItem
from app.models.demo import Demo
from app.models.enums import Role
from app.models.user import User
from app.schemas.action_item import ActionItemCreate, ActionItemRead, ActionItemUpdate

router = APIRouter(prefix="/demos/{demo_id}/action-items", tags=["action-items"])


@router.post("/", response_model=ActionItemRead, status_code=status.HTTP_201_CREATED)
def create_action_item(
    demo_id: int,
    payload: ActionItemCreate,
    _: User = Depends(require_roles({Role.ADMIN, Role.SALES, Role.TECHNICAL})),
    db: Session = Depends(get_db),
) -> ActionItem:
    demo = db.query(Demo).filter(Demo.id == demo_id).first()
    if not demo:
        raise HTTPException(status_code=404, detail="Demo not found")

    action_item = ActionItem(demo_id=demo_id, **payload.model_dump())
    db.add(action_item)
    db.commit()
    db.refresh(action_item)
    return action_item


@router.get("/", response_model=list[ActionItemRead])
def list_action_items(
    demo_id: int,
    _: User = Depends(require_roles({Role.ADMIN, Role.SALES, Role.TECHNICAL, Role.MANAGEMENT})),
    db: Session = Depends(get_db),
) -> list[ActionItem]:
    return db.query(ActionItem).filter(ActionItem.demo_id == demo_id).all()


@router.patch("/{action_item_id}", response_model=ActionItemRead)
def update_action_item(
    demo_id: int,
    action_item_id: int,
    payload: ActionItemUpdate,
    _: User = Depends(require_roles({Role.ADMIN, Role.SALES, Role.TECHNICAL})),
    db: Session = Depends(get_db),
) -> ActionItem:
    action_item = (
        db.query(ActionItem)
        .filter(ActionItem.id == action_item_id, ActionItem.demo_id == demo_id)
        .first()
    )
    if not action_item:
        raise HTTPException(status_code=404, detail="Action item not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(action_item, field, value)

    db.add(action_item)
    db.commit()
    db.refresh(action_item)
    return action_item
