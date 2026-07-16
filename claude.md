# Context
# MVP for Share Fastly

## Philosophy : Ease of access
## Problem it solves : Difficulty in quick sharing/accessing of files, especially in new workspaces 

---

## Feature
1. uploading, viewing and downloading of files(documents, photos etc)
## Entities
1. user profile (creates channels)
2. channels (contain files)
3. files
## User
- login or signup via email and password 
- has a username (email id)
- can create public or private channels
### Channels
- channels are of 2 types (public and private)
- they have a unique names and have a password
- the user who creates channel can only see it's password from his profile
1. Public channels : public read access; write access (upload / delete) only on entering password for that channel   
2. Private : read and write access only on entering password for that channel 
## Technologies
1. React {for front end}
2. Python + Fast api {for back end}
3. postgres database
4. Azure Blob storage
5. jwt for auth

# DB design
### Tables
1. users
   3. username (PK)
   4. email (unique)
   5. password_hash
   6. created_at
---
1. channels
   3. channel_name (PK)
   4. channel_password        -- stored as plaintext, visible to owner
   5. username (FK -> users.username)
   6. channel_type (Bool: public/private)
   7. created_at
---
1. files
   1. file_id (PK)
   2. raw_file_name          -- the hashed file name with extension (in the blob)
   3. original_file_name     -- the actual file name not the hashed version
   4. file_size
   5. mime_type
   8. channel_name (FK -> channels.channel_name)
   9. number_of_downloads      -- raw counter, incremented on anonymous download
   10. number_of_likes         -- raw counter, incremented on anonymous likes
   10. created_at

# API design

## Authentication

### `POST /auth/signup`

Creates a new user account.

**Request Body**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response `201 Created`**

```json
{
  "access_token": "string",
  "username": "string"
}
```

**Errors**

- `409 Conflict` – Email already exists.
- `409 Conflict` – Username already exists.

---

### `POST /auth/login`

Authenticates a user.

**Request Body**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response `200 OK`**

```json
{
  "access_token": "string",
  "username": "string"
}
```

**Errors**

- `401 Unauthorized` – Invalid credentials.

---

## Channels

### `POST /channels`

**Authentication**

```
Authorization: Bearer <access_token>
```

Creates a new channel.

**Request Body**

```json
{
  "channel_name": "string",
  "channel_type": "public | private",
  "channel_password": "string"
}
```

**Response `201 Created`**

```json
{
  "channel_name": "string"
}
```

**Errors**

- `409 Conflict` – Channel name already exists.

---

### `GET /channels`

**Authentication**

```
Authorization: Bearer <access_token>
```

Returns all channels created by the authenticated user.

**Response `200 OK`**

```json
[
  {
    "channel_name": "string",
    "channel_type": "public|private",
    "channel_password": "string",
    "created_at": "timestamp"
  }, 
  {
    "channel_name": "string",
    "channel_type": "public|private",
    "channel_password": "string",
    "created_at": "timestamp"
  }
]
```

---

### `GET /channels/list`

Returns all publicly discoverable channels.

**Response `200 OK`**

```json
[
  {
    "channel_name": "string",
    "created_at": "timestamp"
  }
]
```

---

### `POST /channels/{channel_name}/access`

Authenticates access to a channel and returns a short-lived channel token.

**Request Body**

```json
{
  "password": "string"
}
```

**Response `200 OK`**

```json
{
  "channel_token": "string"
}
```

The token is scoped to the requested channel.

**Errors**

- `403 Forbidden` – Incorrect password.
- `404 Not Found` – Channel not found.

---

## Files

### `GET /channels/{channel_name}/files`

Lists all files in the specified channel.

**Authentication**

- Public channel: No authentication required.
- Private channel:

```
X-Channel-Token: <channel_token>
```

**Response `200 OK`**

```json
[
  {
    "file_id": "string",
    "file_name": "string",
    "file_size": "number",
    "mime_type": "string",
    "number_of_downloads": "number",
    "number_of_likes": "number",
    "created_at": "timestamp"
  }
]
```

**Errors**

- `403 Forbidden` – Missing or invalid channel token.

---

### `POST /channels/{channel_name}/files`

Requests a SAS URL for uploading a file.

**Headers**

```
X-Channel-Token: <channel_token>
```

(Requires write permission.)
**Request Body**

```json
{
  "original_file_name": "invoice.pdf"
}
```
**Response `200 OK`**

```json
{
{
    "blob_name": "6d1dba93-f7c0-4e1e-b3a7-cba2c4cfbb88.pdf",
    "upload_url": "https://.../uploads/6d1dba93-f7c0-4e1e-b3a7-cba2c4cfbb88.pdf?<sas>"
}
}
```

**Errors**

- `403 Forbidden` – Missing or invalid channel token.

---

### `POST /channels/{channel_name}/files/complete`

Notifies the server that the upload completed successfully.

**Headers**

```
X-Channel-Token: <channel_token>
```

(Requires write permission.)

**Request Body**

```json
{
  "blob_name": "6d1dba93-f7c0-4e1e-b3a7-cba2c4cfbb88.pdf",
  "original_file_name": "invoice.pdf"
}
```

**Server Actions**

- Validates the channel token.
- Verifies the blob exists in Azure Blob Storage.
- Retrieves blob metadata (size, content type, etc.).
- Stores the file metadata in the database.

**Response `204 No Content`**

**Errors**

- `400 Bad Request` – Invalid request body.
- `403 Forbidden` – Missing or invalid channel token.
- `404 Not Found` – Uploaded blob not found.

---

### `GET /files/{file_id}/download`

Returns a time-limited SAS URL for downloading a file.

**Authentication**

- Public channel: No authentication required.
- Private channel:

```
X-Channel-Token: <channel_token>
```

**Response `200 OK`**

```json
{
  "download_url": "https://<storage-account>.blob.core.windows.net/<container>/<blob-name>?<sas-token>"
}
```

**Server Actions**

- Validates channel access.
- Atomically increments `number_of_downloads`.

**Errors**

- `403 Forbidden` – Missing or invalid channel token.
- `404 Not Found` – File not found.

---

### `DELETE /files/{file_id}`

Deletes a file.

**Headers**

```
X-Channel-Token: <channel_token>
```

(Requires write permission.)

**Response `204 No Content`**

**Errors**

- `403 Forbidden` – Missing or invalid channel token.
- `404 Not Found` – File not found.

---

### `POST /files/{file_id}/like`

Likes a file.

**Response `200 OK`**

```json
{
  "liked": true,
  "like_count": "number"
}
```

# Backend Structure

fastapi app structure
backend/:
    main.py
    app/:
        routers/:
            __init__.py
            auth.py
            channels.py
            files.py
        helper modules...

# step1 : implement auth apis
now generate the auth apis in fastapi with jwt and postgres database.
the postgres database is already initialized as shown
```
# database.py

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
import os
from dotenv import load_dotenv

# Load the .env file variables into the system environment
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    pool_pre_ping=True,
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# models.py

from datetime import datetime

from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(50), primary_key=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    channels: Mapped[list["Channel"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )


class Channel(Base):
    __tablename__ = "channels"

    channel_name: Mapped[str] = mapped_column(String(100), primary_key=True)
    channel_password: Mapped[str] = mapped_column(String(255), nullable=False)
    username: Mapped[str] = mapped_column(
        String(50), ForeignKey("users.username", ondelete="CASCADE"), nullable=False
    )
    channel_type: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    owner: Mapped["User"] = relationship(back_populates="channels")
    files: Mapped[list["File"]] = relationship(
        back_populates="channel", cascade="all, delete-orphan"
    )


class File(Base):
    __tablename__ = "files"

    file_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    raw_file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    original_file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    channel_name: Mapped[str] = mapped_column(
        String(100), ForeignKey("channels.channel_name", ondelete="CASCADE"), nullable=False
    )
    number_of_downloads: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    number_of_likes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    channel: Mapped["Channel"] = relationship(back_populates="files")
```

and the existing directory structure is as follows:
```
(.venv) yahya@my-thinkpad:~/Desktop/Share-Fastly/backend$ tree ./
./
├── app
│   ├── database.py
│   ├── __init__.py
│   ├── models.py
│   ├── __pycache__
│   │   ├── database.cpython-312.pyc
│   │   ├── __init__.cpython-312.pyc
│   │   └── models.cpython-312.pyc
│   └── routers
│       └── __init__.py
├── db_init.py
└── main.py

4 directories, 9 files
```
so use the existing database.py and models.py to implement the auth apis in fastapi with jwt and postgres database.

step 2:
