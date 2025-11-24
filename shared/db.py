
"""
Database utilities (async SQLAlchemy engine + session helper).
Import with: from shared.db import engine, AsyncSessionLocal, Base, get_db
"""
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from pydantic_settings import BaseSettings

logger = logging.getLogger("shared.db")

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://app:secret@postgres:5432/logs"

    class Config:
        env_file = ".env"

settings = Settings()

# Async engine & session factory
engine = create_async_engine(settings.DATABASE_URL, future=True, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def init_db():
    """Create tables (DEV only - use Alembic for migrations in prod)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("shared.db: initialized DB (created tables)")

# Dependency for FastAPI
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


