from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Depends, Cookie
from sqlalchemy.ext.asyncio import AsyncSession


from .core.config import settings
from .crud import get_user_by_username
from shared.db import get_db


pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str):
    return pwd_context.hash(password)


def create_access_token(subject: str, expires_delta: timedelta = None):
    to_encode = {"sub": subject}
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


async def get_current_user(session: str = Cookie(None), db: AsyncSession = Depends(get_db)):
    # For simplicity, session contains JWT. In production use secure cookie and rotation.
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(session, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid session")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid session")
    user = await get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user