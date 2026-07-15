# API Documentation

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

**Response `200 OK`**

```json
{
  "upload_url": "https://<storage-account>.blob.core.windows.net/<container>/uploads/{filename}?<sas-token>"
}
```

The client must replace `{filename}` with a random hashed filename (appended with the original file extension) before uploading the file to Azure Blob Storage.

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
  "blob_name": "uploads/a7c91f8d3b2e4c6f.pdf",
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