"""
Central Celery configuration used by both backend and worker.
This file does not create Celery app, only configuration.
"""
from pydantic_settings import BaseSettings

class CelerySettings(BaseSettings):
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/1"

    class Config:
        env_file = ".env"

celery_settings = CelerySettings()