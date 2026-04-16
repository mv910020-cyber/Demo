import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Product Demo Platform API"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = os.getenv("SECRET_KEY", "change-me-in-production")
    access_token_expire_minutes: int = 60
    database_url: str = "postgresql+pg8000://postgres:postgres@localhost:5432/demo_platform"
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "Product Demo Platform"
    smtp_secure: str = "starttls"
    whatsapp_api_url: str = ""
    whatsapp_api_token: str = ""
    whatsapp_timeout: int = 20
    reminder_retry_delay_minutes: int = 5
    reminder_retry_max_delay_minutes: int = 60
    default_reminder_max_attempts: int = 3
    cors_allow_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    enable_reminder_worker: bool = True
    google_calendar_access_token: str = ""
    google_calendar_timezone: str = "UTC"
    zoom_account_id: str = ""
    zoom_client_id: str = ""
    zoom_client_secret: str = ""
    microsoft_graph_access_token: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
