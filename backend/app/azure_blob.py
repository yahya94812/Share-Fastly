import os
import uuid
from datetime import datetime, timedelta, timezone

from azure.core.exceptions import ResourceNotFoundError
from azure.storage.blob import (
    BlobServiceClient,
    BlobSasPermissions,
    generate_blob_sas,
)

from app.config import (
    STORAGE_ACCOUNT_NAME,
    STORAGE_ACCOUNT_KEY,
    CONTAINER_NAME,
)

if not (STORAGE_ACCOUNT_NAME and STORAGE_ACCOUNT_KEY and CONTAINER_NAME):
    raise RuntimeError(
        "Set STORAGE_ACCOUNT_NAME, STORAGE_ACCOUNT_KEY and CONTAINER_NAME in your .env file."
    )

ACCOUNT_URL = f"https://{STORAGE_ACCOUNT_NAME}.blob.core.windows.net"

blob_service_client = BlobServiceClient(
    account_url=ACCOUNT_URL,
    credential=STORAGE_ACCOUNT_KEY,
)
container_client = blob_service_client.get_container_client(CONTAINER_NAME)


def generate_blob_name(original_file_name: str) -> str:
    """
    Turns 'invoice.pdf' into a random, collision-proof blob name
    like '6d1dba93-f7c0-4e1e-b3a7-cba2c4cfbb88.pdf' (this becomes raw_file_name).
    """
    ext = os.path.splitext(original_file_name)[1]  # includes leading '.', or '' if none
    return f"{uuid.uuid4()}{ext}"


def generate_upload_sas(blob_name: str, expiry_minutes: int = 15) -> dict:
    """
    Generate a SAS token for uploading a blob.
    Used by POST /channels/{channel_name}/files.
    """
    sas_token = generate_blob_sas(
        account_name=STORAGE_ACCOUNT_NAME,
        container_name=CONTAINER_NAME,
        blob_name=blob_name,
        account_key=STORAGE_ACCOUNT_KEY,
        permission=BlobSasPermissions(
            read=False,
            write=True,
            create=True,
            delete=False,
            add=False,
            list=False,
        ),
        expiry=datetime.now(timezone.utc) + timedelta(minutes=expiry_minutes),
    )

    upload_url = f"{ACCOUNT_URL}/{CONTAINER_NAME}/{blob_name}?{sas_token}"

    return {
        "blob_name": blob_name,
        "blob_url": f"{ACCOUNT_URL}/{CONTAINER_NAME}/{blob_name}",
        "sas_token": sas_token,
        "upload_url": upload_url,
        "expires_in_minutes": expiry_minutes,
    }


def generate_download_sas(blob_name: str, expiry_minutes: int = 15) -> dict:
    """
    Generate a SAS token for downloading a blob.
    Used by GET /files/{file_id}/download.
    """
    sas_token = generate_blob_sas(
        account_name=STORAGE_ACCOUNT_NAME,
        container_name=CONTAINER_NAME,
        blob_name=blob_name,
        account_key=STORAGE_ACCOUNT_KEY,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.now(timezone.utc) + timedelta(minutes=expiry_minutes),
    )

    download_url = f"{ACCOUNT_URL}/{CONTAINER_NAME}/{blob_name}?{sas_token}"

    return {
        "blob_name": blob_name,
        "download_url": download_url,
        "expires_in_minutes": expiry_minutes,
    }


def get_blob_metadata(blob_name: str) -> dict | None:
    """
    Checks the blob exists and returns its size/content-type.
    Used by POST /channels/{channel_name}/files/complete.
    Returns None if the blob does not exist (caller should raise 404).
    """
    blob_client = container_client.get_blob_client(blob_name)
    try:
        props = blob_client.get_blob_properties()
    except ResourceNotFoundError:
        return None

    return {
        "file_size": props.size,
        "mime_type": props.content_settings.content_type or "application/octet-stream",
    }


def delete_blob(blob_name: str) -> bool:
    """
    Deletes a blob. Used by DELETE /files/{file_id}.
    Returns True if deleted, False if it was already gone.
    """
    blob_client = container_client.get_blob_client(blob_name)
    try:
        blob_client.delete_blob()
        return True
    except ResourceNotFoundError:
        return False