import re

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import User
from app.schemas import AuthResponse, LoginRequest, SignupRequest
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


async def _unique_username(db, email: str) -> str:
    base = re.sub(r"[^a-zA-Z0-9_-]", "", email.split("@")[0]).lower()[:50] or "user"
    username = base
    i = 1
    while await db.get(User, username):
        i += 1
        username = f"{base}{i}"[:50]
    return username


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest):
    async with AsyncSessionLocal() as db:
        if await db.scalar(select(User).where(User.email == payload.email)):
            raise HTTPException(status.HTTP_409_CONFLICT, "Email already exists.")

        username = await _unique_username(db, payload.email)
        user = User(
            username=username,
            email=payload.email,
            password_hash=hash_password(payload.password),
        )
        db.add(user)
        await db.commit()

        return AuthResponse(access_token=create_access_token(username), username=username)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    async with AsyncSessionLocal() as db:
        user = await db.scalar(select(User).where(User.email == payload.email))
        if not user or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials.")

        return AuthResponse(access_token=create_access_token(user.username), username=user.username)