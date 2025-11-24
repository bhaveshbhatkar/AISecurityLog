"""
SQLAlchemy models shared between backend and worker.
Keep this file strictly only for table definitions.
"""
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.sql import func
import uuid

from shared.db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(128), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(50), default="analyst")
    first_name = Column(String(128), nullable=True)
    last_name = Column(String(128), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Upload(Base):
    __tablename__ = "uploads"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    filename = Column(String(512))
    size_bytes = Column(BigInteger)
    status = Column(String(50), default="queued")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Event(Base):
    __tablename__ = "events"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    upload_id = Column(UUID(as_uuid=True), ForeignKey("uploads.id", ondelete="CASCADE"), index=True)
    timestamp = Column(DateTime(timezone=True), index=True)
    src_ip = Column(String(45), index=True)
    dest_ip = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    username = Column(String(256), nullable=True)
    url = Column(Text, nullable=True)
    method = Column(String(16), nullable=True)
    status = Column(Integer, nullable=True)
    bytes = Column(BigInteger, nullable=True)
    raw_line = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Anomaly(Base):
    __tablename__ = "anomalies"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    event_id = Column(BigInteger, ForeignKey("events.id", ondelete="CASCADE"), index=True)
    detector = Column(String(128))
    score = Column(String(32))
    reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())