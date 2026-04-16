import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import get_session
from app.models.enums import Role
from app.models.user import User
from app.services.reminder_dispatcher import ReminderDispatcher


DEFAULT_TECHNICAL_PRESENTERS = [
    ("Akhil", "akhil.technical@example.com"),
    ("Vivek", "vivek.technical@example.com"),
    ("Tushar", "tushar.technical@example.com"),
    ("Uday", "uday.technical@example.com"),
    ("Srikanth", "srikanth.technical@example.com"),
]


def _seed_technical_presenters() -> None:
    db = get_session()
    try:
        technical_count = db.query(User).filter(User.role == Role.TECHNICAL).count()
        if technical_count:
            return

        for full_name, email in DEFAULT_TECHNICAL_PRESENTERS:
            db.add(
                User(
                    full_name=full_name,
                    email=email,
                    password_hash=get_password_hash("Tech1234!"),
                    role=Role.TECHNICAL,
                )
            )
        db.commit()
    finally:
        db.close()


async def _reminder_worker(stop_event: asyncio.Event) -> None:
    while not stop_event.is_set():
        db = get_session()
        try:
            ReminderDispatcher.process_due_reminders(db)
        finally:
            db.close()
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=60)
        except TimeoutError:
            continue


@asynccontextmanager
async def lifespan(_: FastAPI):
    _seed_technical_presenters()
    if not settings.enable_reminder_worker:
        yield
        return

    stop_event = asyncio.Event()
    task = asyncio.create_task(_reminder_worker(stop_event))
    try:
        yield
    finally:
        stop_event.set()
        await task

app = FastAPI(title=settings.app_name, lifespan=lifespan)

allowed_origins = [origin.strip() for origin in settings.cors_allow_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
