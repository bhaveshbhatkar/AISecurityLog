
from fastapi import FastAPI
import logging

logging.basicConfig(level=logging.INFO)
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from shared.db import init_db, engine
from .api import router as api_router


logger = logging.getLogger("backend")


app = FastAPI(title=settings.PROJECT_NAME)
app.include_router(api_router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://localhost:5000", "https://localhost:3000", "https://localhost:5000"],  # frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    logger.info("Starting up application")
    # Initialize DB (create missing tables in dev) - optional
    await init_db()


@app.on_event("shutdown")
async def on_shutdown():
    logger.info("Shutting down application")


# Health check
@app.get("/health")
async def health():
    return {"status": "ok"}