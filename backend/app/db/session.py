from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def _normalize_database_url(database_url: str) -> str:
    # Use pure-Python pg8000 driver for PostgreSQL URLs to avoid Windows DLL issues.
    if database_url.startswith("postgresql+psycopg2://"):
        return database_url.replace("postgresql+psycopg2://", "postgresql+pg8000://", 1)
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+pg8000://", 1)
    return database_url


_engine: Engine | None = None
SessionLocal = sessionmaker(autoflush=False, autocommit=False)


def get_engine() -> Engine:
    global _engine

    if _engine is None:
        database_url = _normalize_database_url(settings.database_url)
        if database_url.startswith("sqlite"):
            _engine = create_engine(database_url, connect_args={"check_same_thread": False}, pool_pre_ping=True)
        else:
            _engine = create_engine(database_url, pool_pre_ping=True)
        SessionLocal.configure(bind=_engine)

    return _engine


def get_session() -> Session:
    get_engine()
    return SessionLocal()


def get_db() -> Generator[Session, None, None]:
    db = get_session()
    try:
        yield db
    finally:
        db.close()
