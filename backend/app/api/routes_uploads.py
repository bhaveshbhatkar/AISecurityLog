from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from shared.db import get_db
from ..crud import create_upload, get_upload_status
from ..auth import get_current_user
import logging
import os
from shared.celery_app import celery_app


router = APIRouter()
logger = logging.getLogger("backend.uploads")


UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/data/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/")
async def upload_file(file: UploadFile = File(...), user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    contents = await file.read()
    upload = await create_upload(db, user.id, file.filename, len(contents))


    # Save file to disk
    filename_on_disk = f"{upload.id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename_on_disk)
    with open(file_path, "wb") as f:
        f.write(contents)


    logger.info(f"Saved upload {upload.id} to {file_path}")


    # Enqueue Celery task (synchronous broker call)
    try:
        celery_app.send_task("tasks.parse_file", args=[str(upload.id), file_path], queue="parser")
        logger.info(f"Enqueued parse task for upload {upload.id}")
    except Exception as e:
        logger.exception("Failed to enqueue parse task")
        raise HTTPException(status_code=500, detail="Failed to enqueue parse task")


    return {"uploadId": str(upload.id)}

@router.get("/{upload_id}/status")
async def upload_status(upload_id: str, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    status = await get_upload_status(db, upload_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Upload not found")
    return {"uploadId": upload_id, "status": status}