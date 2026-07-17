from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select, update

from app.azure_blobs import (
    delete_blob,
    generate_blob_name,
    generate_download_sas,
    generate_upload_sas,
    get_blob_metadata,
)
from app.database import AsyncSessionLocal
from app.models import Channel, File
from app.schemas import (
    CompleteUploadRequest,
    DownloadResponse,
    FileListItem,
    LikeResponse,
    UploadRequest,
    UploadSasResponse,
)
from app.security import get_channel_from_token, verify_channel_access

router = APIRouter(tags=["files"])

PUBLIC = True  # matches Channel.channel_type convention from the channels router


async def _get_channel_or_404(db, channel_name: str) -> Channel:
    channel = await db.get(Channel, channel_name)
    if channel is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Channel not found.")
    return channel


async def _get_file_or_404(db, file_id: int) -> File:
    file = await db.get(File, file_id)
    if file is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found.")
    return file


# ---------------------------------------------------------------------------
# GET /channels/{channel_name}/files
# ---------------------------------------------------------------------------
@router.get("/channels/{channel_name}/files", response_model=list[FileListItem])
async def list_files(channel_name: str, x_channel_token: str | None = Header(default=None)):
    async with AsyncSessionLocal() as db:
        channel = await _get_channel_or_404(db, channel_name)

        if channel.channel_type != PUBLIC:
            verify_channel_access(channel_name, x_channel_token)

        result = await db.scalars(select(File).where(File.channel_name == channel_name))
        files = result.all()

        return [
            FileListItem(
                file_id=f.file_id,
                file_name=f.original_file_name,
                file_size=f.file_size,
                mime_type=f.mime_type,
                number_of_downloads=f.number_of_downloads,
                number_of_likes=f.number_of_likes,
                created_at=f.created_at,
            )
            for f in files
        ]


# ---------------------------------------------------------------------------
# POST /channels/{channel_name}/files  (request upload SAS)
# ---------------------------------------------------------------------------
@router.post(
    "/channels/{channel_name}/files",
    response_model=UploadSasResponse,
    dependencies=[Depends(get_channel_from_token)],
)
async def request_upload(channel_name: str, payload: UploadRequest):
    blob_name = generate_blob_name(payload.original_file_name)
    sas = generate_upload_sas(blob_name)
    return UploadSasResponse(blob_name=sas["blob_name"], upload_url=sas["upload_url"])


# ---------------------------------------------------------------------------
# POST /channels/{channel_name}/files/complete
# ---------------------------------------------------------------------------
@router.post(
    "/channels/{channel_name}/files/complete",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_channel_from_token)],
)
async def complete_upload(channel_name: str, payload: CompleteUploadRequest):
    metadata = get_blob_metadata(payload.blob_name)
    if metadata is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Uploaded blob not found.")

    async with AsyncSessionLocal() as db:
        await _get_channel_or_404(db, channel_name)

        file = File(
            raw_file_name=payload.blob_name,
            original_file_name=payload.original_file_name,
            file_size=metadata["file_size"],
            mime_type=metadata["mime_type"],
            channel_name=channel_name,
        )
        db.add(file)
        await db.commit()


# ---------------------------------------------------------------------------
# GET /files/{file_id}/download
# ---------------------------------------------------------------------------
@router.get("/files/{file_id}/download", response_model=DownloadResponse)
async def download_file(file_id: int, x_channel_token: str | None = Header(default=None)):
    async with AsyncSessionLocal() as db:
        file = await _get_file_or_404(db, file_id)
        channel = await _get_channel_or_404(db, file.channel_name)

        if channel.channel_type != PUBLIC:
            verify_channel_access(channel.channel_name, x_channel_token)

        await db.execute(
            update(File)
            .where(File.file_id == file_id)
            .values(number_of_downloads=File.number_of_downloads + 1)
        )
        await db.commit()

    sas = generate_download_sas(file.raw_file_name)
    return DownloadResponse(download_url=sas["download_url"])


# ---------------------------------------------------------------------------
# DELETE /files/{file_id}
# ---------------------------------------------------------------------------
@router.delete("/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(file_id: int, x_channel_token: str | None = Header(default=None)):
    async with AsyncSessionLocal() as db:
        file = await _get_file_or_404(db, file_id)
        verify_channel_access(file.channel_name, x_channel_token)

        await db.delete(file)
        await db.commit()

    # DB row is gone even if the blob delete below fails; not ideal for strict
    # consistency, but matches the simple flow described in the API spec.
    delete_blob(file.raw_file_name)


# ---------------------------------------------------------------------------
# POST /files/{file_id}/like
# ---------------------------------------------------------------------------
@router.post("/files/{file_id}/like", response_model=LikeResponse)
async def like_file(file_id: int):
    async with AsyncSessionLocal() as db:
        await _get_file_or_404(db, file_id)

        await db.execute(
            update(File)
            .where(File.file_id == file_id)
            .values(number_of_likes=File.number_of_likes + 1)
        )
        await db.commit()

        file = await db.get(File, file_id)
        return LikeResponse(liked=True, like_count=file.number_of_likes)