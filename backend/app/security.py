from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, SECRET_KEY

CHANNEL_TOKEN_EXPIRE_MINUTES = 30
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


# ---- user (login) tokens -> carry the username in "sub" ----

def create_access_token(username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": username, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None


def get_current_username(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    """FastAPI dependency: validates Bearer auth and returns the username."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing or invalid Authorization header.")

    username = decode_access_token(credentials.credentials)
    if username is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token.")

    return username


# ---- channel tokens -> carry the channel_name in "channel", scoped per channel ----

def create_channel_token(channel_name: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=CHANNEL_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"channel": channel_name, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def decode_channel_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("channel")
    except jwt.PyJWTError:
        return None


def verify_channel_access(channel_name: str, x_channel_token: str | None) -> None:
    """
    Plain (non-dependency) check: does X-Channel-Token grant access to channel_name?
    Used directly inside routes where channel_name is resolved from a file_id
    rather than being a path param (so it can't be bound via Depends()).
    Raises 403 if missing/invalid/mismatched.
    """
    token_channel = decode_channel_token(x_channel_token) if x_channel_token else None
    if token_channel is None or token_channel != channel_name:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Missing or invalid channel token.")


def get_channel_from_token(channel_name: str, x_channel_token: str | None = Header(default=None)) -> None:
    """
    FastAPI dependency for write-access routes: verifies X-Channel-Token
    is valid AND scoped to the channel_name in the URL. Raises 403 otherwise.
    """
    verify_channel_access(channel_name, x_channel_token)