from fastapi import APIRouter

from app.api import action_items, auth, availability, dashboard, demos, reminders, requirements, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(availability.router)
api_router.include_router(demos.router)
api_router.include_router(reminders.router)
api_router.include_router(action_items.router)
api_router.include_router(requirements.router)
api_router.include_router(dashboard.router)
