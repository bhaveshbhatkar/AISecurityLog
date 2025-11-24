from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta


from shared.schemas import Token, LoginRequest, UserOut, CreateUserRequest
from shared.db import get_db
from ..crud import get_user_by_username, create_user, get_user_count
from ..auth import verify_password, get_password_hash, create_access_token, get_current_user


router = APIRouter()


@router.post("/login")
async def login(login_request: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """Authenticate and set JWT in httpOnly cookie"""
    user = await get_user_by_username(db, login_request.username)
    if not user or not verify_password(login_request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user.username, expires_delta=timedelta(minutes=60))
    # Set cookie
    response.set_cookie(key="session", value=token, httponly=True, samesite="lax", secure=False)
    return {"message": "login successful"}

@router.post("/create-initial-user", response_model=UserOut)
async def create_initial_user(payload: CreateUserRequest, db: AsyncSession = Depends(get_db)):
    """
    Create the first user in the system.
    Allowed ONLY if user table is empty.
    """
    user_count = await get_user_count(db)

    if user_count > 0:
        raise HTTPException(
            status_code=403,
            detail="Users already exist. Initial user creation disabled."
        )

    existing_user = await get_user_by_username(db, payload.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed = get_password_hash(payload.password)
    user = await create_user(db, payload.username, hashed, payload.role, payload.first_name, payload.last_name)

    return user

@router.post("/register", response_model=UserOut)
async def register(payload: CreateUserRequest, db: AsyncSession = Depends(get_db)):
    """
    Register a new user.
    """
    existing_user = await get_user_by_username(db, payload.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed = get_password_hash(payload.password)
    user = await create_user(db, payload.username, hashed, payload.role, payload.first_name, payload.last_name)
    return user

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: UserOut = Depends(get_current_user)):
    """
    Get current user details.
    """
    return current_user