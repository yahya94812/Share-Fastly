from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import Channel
from app.schemas import (
    ChannelAccessRequest,
    ChannelAccessResponse,
    ChannelCreateRequest,
    ChannelCreateResponse,
    OwnedChannelResponse,
    PublicChannelResponse,
)
from app.security import create_channel_token, get_current_username

router = APIRouter(prefix="/channels", tags=["channels"])

# channel_type is stored as a Bool in the DB: True = public, False = private.
PUBLIC = True
PRIVATE = False


@router.post("", response_model=ChannelCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_channel(
    payload: ChannelCreateRequest,
    username: str = Depends(get_current_username),
):
    async with AsyncSessionLocal() as db:
        existing = await db.get(Channel, payload.channel_name)
        if existing is not None:
            raise HTTPException(status.HTTP_409_CONFLICT, "Channel name already exists.")

        channel = Channel(
            channel_name=payload.channel_name,
            channel_password=payload.channel_password,  # stored as plaintext, per DB design
            username=username,
            channel_type=PUBLIC if payload.channel_type == "public" else PRIVATE,
        )
        db.add(channel)
        await db.commit()

        return ChannelCreateResponse(channel_name=channel.channel_name)


@router.get("", response_model=list[OwnedChannelResponse])
async def list_my_channels(username: str = Depends(get_current_username)):
    async with AsyncSessionLocal() as db:
        result = await db.scalars(select(Channel).where(Channel.username == username))
        channels = result.all()

        return [
            OwnedChannelResponse(
                channel_name=c.channel_name,
                channel_type="public" if c.channel_type == PUBLIC else "private",
                channel_password=c.channel_password,
                created_at=c.created_at,
            )
            for c in channels
        ]


@router.get("/list", response_model=list[PublicChannelResponse])
async def list_public_channels():
    async with AsyncSessionLocal() as db:
        result = await db.scalars(select(Channel).where(Channel.channel_type == PUBLIC))
        channels = result.all()

        return [
            PublicChannelResponse(channel_name=c.channel_name, created_at=c.created_at)
            for c in channels
        ]


@router.post("/{channel_name}/access", response_model=ChannelAccessResponse)
async def access_channel(channel_name: str, payload: ChannelAccessRequest):
    async with AsyncSessionLocal() as db:
        channel = await db.get(Channel, channel_name)
        if channel is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Channel not found.")

        if payload.password != channel.channel_password:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Incorrect password.")

        return ChannelAccessResponse(channel_token=create_channel_token(channel_name))