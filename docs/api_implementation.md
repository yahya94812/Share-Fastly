# Share Fastly API Reference

Base URL (local dev): `http://localhost:8000`

## Authentication model

Two independent token types are used. They are **not interchangeable**.

| Token | Obtained via | Sent as | Carries | Lifetime |
|---|---|---|---|---|
| Access token | `POST /auth/signup`, `POST /auth/login` | `Authorization: Bearer <token>` | `username` | 60 min |
| Channel token | `POST /channels/{channel_name}/access` | `X-Channel-Token: <token>` | `channel_name` | 30 min |

- The **access token** proves *who you are* and is required for account-scoped actions (creating a channel, listing your own channels).
- The **channel token** proves *you know a specific channel's password* and is required for reading a private channel's contents, and for **any** write to a channel's files (public or private). It is scoped to exactly one `channel_name` — a token issued for `channel-a` will be rejected on `channel-b`.

All request/response bodies are JSON unless noted otherwise.

---

## Auth

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

`username` is auto-derived from the local part of the email (e.g. `jane` from `jane@example.com`); a numeric suffix is appended on collision.

**Errors**

- `409 Conflict` – Email already exists.

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

Creates a new channel.

**Authentication**

```
Authorization: Bearer <access_token>
```

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

Returns all channels created by the authenticated user, including their passwords (visible to the owner only).

**Authentication**

```
Authorization: Bearer <access_token>
```

**Response `200 OK`**

```json
[
  {
    "channel_name": "string",
    "channel_type": "public | private",
    "channel_password": "string",
    "created_at": "timestamp"
  }
]
```

**Errors**

- `401 Unauthorized` – Missing or invalid access token.

---

### `GET /channels/list`

Returns all publicly discoverable channels. No authentication required.

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

Authenticates access to a channel by password and returns a short-lived channel token scoped to that channel.

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

**Errors**

- `403 Forbidden` – Incorrect password.
- `404 Not Found` – Channel not found.

---

## Files

### `GET /channels/{channel_name}/files`

Lists all files in the specified channel.

**Authentication**

- Public channel: none required.
- Private channel:

```
X-Channel-Token: <channel_token>
```

**Response `200 OK`**

```json
[
  {
    "file_id": "number",
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

- `403 Forbidden` – Missing or invalid channel token (private channel only).
- `404 Not Found` – Channel not found.

---

### `POST /channels/{channel_name}/files`

Requests a SAS URL for uploading a file. Requires write permission — a valid channel token is required regardless of whether the channel is public or private.

**Headers**

```
X-Channel-Token: <channel_token>
```

**Request Body**

```json
{
  "original_file_name": "invoice.pdf"
}
```

**Response `200 OK`**

```json
{
  "blob_name": "6d1dba93-f7c0-4e1e-b3a7-cba2c4cfbb88.pdf",
  "upload_url": "https://.../uploads/6d1dba93-f7c0-4e1e-b3a7-cba2c4cfbb88.pdf?<sas>"
}
```

The caller `PUT`s the file bytes directly to `upload_url` (with header `x-ms-blob-type: BlockBlob`), then calls `.../files/complete`.

**Errors**

- `403 Forbidden` – Missing or invalid channel token.

---

### `POST /channels/{channel_name}/files/complete`

Notifies the server that the upload to `upload_url` completed successfully.

**Headers**

```
X-Channel-Token: <channel_token>
```

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
- Retrieves blob metadata (size, content type).
- Stores the file metadata in the database.

**Response `204 No Content`**

**Errors**

- `400 Bad Request` – Invalid request body.
- `403 Forbidden` – Missing or invalid channel token.
- `404 Not Found` – Uploaded blob not found, or channel not found.

---

### `GET /files/{file_id}/download`

Returns a time-limited SAS URL for downloading a file.

**Authentication**

- Public channel: none required.
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

- `403 Forbidden` – Missing or invalid channel token (private channel only).
- `404 Not Found` – File not found.

---

### `DELETE /files/{file_id}`

Deletes a file (both its DB record and the underlying blob). Requires write permission — a valid channel token is required regardless of channel type.

**Headers**

```
X-Channel-Token: <channel_token>
```

**Response `204 No Content`**

**Errors**

- `403 Forbidden` – Missing or invalid channel token.
- `404 Not Found` – File not found.

---

### `POST /files/{file_id}/like`

Likes a file. No authentication required.

**Response `200 OK`**

```json
{
  "liked": true,
  "like_count": "number"
}
```

**Errors**

- `404 Not Found` – File not found.

---

## Error response shape

All errors follow FastAPI's default shape:

```json
{
  "detail": "human-readable message"
}
```