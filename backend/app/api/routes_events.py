from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from shared.db import get_db
from ..crud import query_events_with_features, get_event
from ..auth import get_current_user
from typing import Optional
from shared import models

router = APIRouter()


@router.get("")
async def list_events(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    ip: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    perPage: int = Query(50, ge=1, le=10000),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    offset = (page - 1) * perPage
    events = await query_events_with_features(db, start=start, end=end, ip=ip, offset=offset, limit=perPage)
    return {"events": events, "page": page}


@router.get("/{event_id}")
async def get_single_event(event_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    event = await get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Attempt to fetch anomalies for this event
    stmt = select(models.Anomaly).where(models.Anomaly.event_id == event.id)
    res = await db.execute(stmt)
    anomalies = res.scalars().all()

    event_out = {
        "id": event.id,
        "timestamp": event.timestamp.isoformat() if event.timestamp else None,
        "src_ip": str(event.src_ip) if event.src_ip else None,
        "url": event.url,
        "raw_line": event.raw_line,
        "anomalies": [
            {
                "id": a.id,
                "detector": a.detector,
                "score": a.score,
                "reason": a.reason
            }
            for a in anomalies
        ]
    }
    return event_out