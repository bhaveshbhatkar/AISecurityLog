"""
Pydantic schemas used by backend and worker. Keep model-only, no endpoint logic.
"""
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: str
    exp: int

class UserCreate(BaseModel):
    username: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserOut(BaseModel):
    id: UUID
    username: str
    role: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    class Config:
        orm_mode = True

class UploadCreate(BaseModel):
    filename: str
    size_bytes: int

class UploadOut(BaseModel):
    id: UUID
    filename: str
    size_bytes: int
    status: str
    created_at: datetime

    class Config:
        orm_mode = True

class EventOut(BaseModel):
    id: int
    upload_id: Optional[UUID]
    timestamp: Optional[datetime]
    src_ip: Optional[str]
    dest_ip: Optional[str]
    user_agent: Optional[str]
    username: Optional[str]
    url: Optional[str]
    method: Optional[str]
    status: Optional[int]
    bytes: Optional[int]
    raw_line: Optional[str]

    class Config:
        orm_mode = True

class AnomalyOut(BaseModel):
    id: int
    event_id: int
    detector: Optional[str]
    score: Optional[str]
    reason: Optional[str]
    created_at: Optional[datetime]

    class Config:
        orm_mode = True

class LoginRequest(BaseModel):
    username: str
    password: str

class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: str = "admin"   # default role for first user
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class ParsedEvent(BaseModel):
    timestamp: Optional[datetime]
    src_ip: Optional[str]
    dest_ip: Optional[str]
    user_agent: Optional[str]
    username: Optional[str]
    url: Optional[str]
    method: Optional[str]
    status: Optional[int]
    bytes: Optional[int]
    raw_line: Optional[str]
    requests_per_ip: Optional[int]
    entropy: Optional[float]
    domain: Optional[str]
    url_length: Optional[int]
    ua_length: Optional[int]
    hour: Optional[int]
    bytes_sent: Optional[int]


class QueryRequest(BaseModel):
    prompt: str