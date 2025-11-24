"""
Create the Celery app here using the shared configuration.
Backend will import this module and worker will also import the same app.
"""
import logging
from celery import Celery
from shared.celery_config import celery_settings

logger = logging.getLogger("backend.celery_app")

celery_app = Celery(
    "log_analysis",
    broker=celery_settings.CELERY_BROKER_URL,
    backend=celery_settings.CELERY_RESULT_BACKEND,
)

# Optional: set some defaults
celery_app.conf.update(
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

# Auto-discover tasks from worker.tasks and worker.tasks_advanced
celery_app.autodiscover_tasks(['worker'])

logger.info("Celery app initialized (shared) with broker=%s", celery_settings.CELERY_BROKER_URL)
