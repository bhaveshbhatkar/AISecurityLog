from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from shared.db import get_db
from ..crud import query_anomalies
from ..auth import get_current_user
from typing import Optional
from sqlalchemy import select
from shared import models


router = APIRouter()


@router.get("")
async def list_anomalies(page: int = Query(1), perPage: int = Query(50), db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    offset = (page - 1) * perPage
    stmt = select(models.Anomaly).order_by(models.Anomaly.created_at.desc()).offset(offset).limit(perPage)
    res = await db.execute(stmt)
    anomalies = res.scalars().all()


    out = []
    for a in anomalies:
        out.append({
            "id": a.id,
            "event_id": a.event_id,
            "detector": a.detector,
            "score": float(a.score) if a.score else None,
            "reason": a.reason,
            "created_at": a.created_at.isoformat() if a.created_at else None
        })
    return {"anomalies": out, "page": page}