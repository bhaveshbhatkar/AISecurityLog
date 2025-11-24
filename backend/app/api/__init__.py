from fastapi import APIRouter
from .routes_auth import router as auth_router
from .routes_uploads import router as uploads_router
from .routes_events import router as events_router
from .routes_anomalies import router as anomalies_router
from .routes_query import router as query_router


router = APIRouter()
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(uploads_router, prefix="/uploads", tags=["uploads"])
router.include_router(events_router, prefix="/events", tags=["events"])
router.include_router(anomalies_router, prefix="/anomalies", tags=["anomalies"])
router.include_router(query_router, prefix="/query", tags=["query"])