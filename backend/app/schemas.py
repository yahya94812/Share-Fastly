from datetime import datetime
from typing import Literal

from pydantic import BaseModel

ChannelType = Literal["public", "private"]


class SignupRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    username: str


class ChannelCreateRequest(BaseModel):
    channel_name: str
    channel_type: ChannelType
    channel_password: str


class ChannelCreateResponse(BaseModel):
    channel_name: str


class OwnedChannelResponse(BaseModel):
    channel_name: str
    channel_type: ChannelType
    channel_password: str
    created_at: datetime


class PublicChannelResponse(BaseModel):
    channel_name: str
    created_at: datetime


class ChannelAccessRequest(BaseModel):
    password: str


class ChannelAccessResponse(BaseModel):
    channel_token: str


class FileListItem(BaseModel):
    file_id: int
    file_name: str
    file_size: int
    mime_type: str
    number_of_downloads: int
    number_of_likes: int
    created_at: datetime


class UploadRequest(BaseModel):
    original_file_name: str


class UploadSasResponse(BaseModel):
    blob_name: str
    upload_url: str


class CompleteUploadRequest(BaseModel):
    blob_name: str
    original_file_name: str


class DownloadResponse(BaseModel):
    download_url: str


class LikeResponse(BaseModel):
    liked: bool
    like_count: int