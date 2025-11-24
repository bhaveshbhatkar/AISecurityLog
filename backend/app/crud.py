from sqlalchemy import select, insert, func
from shared import models
import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
import uuid


logger = logging.getLogger("backend.crud")


async def query_events_with_features(db: AsyncSession, start=None, end=None, ip=None, offset=0, limit=50):
    """Query events and join anomalies (if present) and include advanced feature metadata stored in anomalies.reason (if structured).
    Assumes anomalies.reason may contain LLM explanation or a JSON blob with metadata; adapt storage schema as needed.
    """
    # Simple approach: fetch events, then fetch anomalies for event ids
    stmt = select(models.Event).order_by(models.Event.timestamp.desc()).offset(offset).limit(limit)
    if start:
        stmt = stmt.where(models.Event.timestamp >= start)
    if end:
        stmt = stmt.where(models.Event.timestamp <= end)
    if ip:
        stmt = stmt.where(models.Event.src_ip == ip)
    res = await db.execute(stmt)
    events = res.scalars().all()


    event_ids = [e.id for e in events]
    anomalies = {}
    if event_ids:
        stmt2 = select(models.Anomaly).where(models.Anomaly.event_id.in_(event_ids))
        res2 = await db.execute(stmt2)
        for a in res2.scalars().all():
            anomalies.setdefault(a.event_id, []).append(a)


    # Build unified output
    out = []
    for e in events:
        e_out = {
            "id": e.id,
            "upload_id": str(e.upload_id) if e.upload_id else None,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            "src_ip": str(e.src_ip) if e.src_ip else None,
            "dest_ip": str(e.dest_ip) if e.dest_ip else None,
            "user_agent": e.user_agent,
            "username": e.username,
            "url": e.url,
            "method": e.method,
            "status": e.status,
            "bytes": e.bytes,
            "raw_line": e.raw_line,
            "anomalies": []
        }
        for a in anomalies.get(e.id, []):
            # try parse numeric score
            try:
                score = float(a.score)
            except Exception:
                score = None
            e_out["anomalies"].append({
                "id": a.id,
                "detector": a.detector,
                "score": score,
                "reason": a.reason,
                "created_at": a.created_at.isoformat() if a.created_at else None
            })
        out.append(e_out)
    return out

async def get_user_by_username(db: AsyncSession, username: str):
    stmt = select(models.User).where(models.User.username == username)
    res = await db.execute(stmt)
    return res.scalars().first()


async def create_user(db: AsyncSession, username: str, password_hash: str, role: str = "admin", first_name: str = None, last_name: str = None):
    user = models.User(id=uuid.uuid4(), username=username, password_hash=password_hash, role=role, first_name=first_name, last_name=last_name)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def create_upload(db: AsyncSession, user_id, filename: str, size_bytes: int):
    upload = models.Upload(user_id=user_id, filename=filename, size_bytes=size_bytes)
    db.add(upload)
    await db.commit()
    await db.refresh(upload)
    logger.info(f"Upload record created: {upload.id}")
    return upload


async def get_upload_status(db: AsyncSession, upload_id):
    stmt = select(models.Upload).where(models.Upload.id == upload_id)
    res = await db.execute(stmt)
    upload = res.scalars().first()
    return upload.status if upload else None

async def insert_event_bulk(db: AsyncSession, events: list):
    # events: list of dicts matching Event columns
    stmt = insert(models.Event).values(events)
    await db.execute(stmt)
    await db.commit()


async def query_events(db: AsyncSession, start=None, end=None, ip=None, offset=0, limit=50):
    stmt = select(models.Event)
    if start:
        stmt = stmt.where(models.Event.timestamp >= start)
    if end:
        stmt = stmt.where(models.Event.timestamp <= end)
    if ip:
        stmt = stmt.where(models.Event.src_ip == ip)
    stmt = stmt.offset(offset).limit(limit).order_by(models.Event.timestamp.desc())
    res = await db.execute(stmt)
    return res.scalars().all()


async def get_event(db: AsyncSession, event_id: int):
    stmt = select(models.Event).where(models.Event.id == event_id)
    res = await db.execute(stmt)
    return res.scalars().first()


async def query_anomalies(db: AsyncSession, offset=0, limit=50):
    stmt = select(models.Anomaly).offset(offset).limit(limit).order_by(models.Anomaly.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

async def get_user_count(db: AsyncSession):
    stmt = select(func.count()).select_from(models.User)
    res = await db.execute(stmt)
    return res.scalar() or 0