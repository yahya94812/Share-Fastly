# File Upload Flow (Azure Blob Storage + SAS)

## Overview

Files are uploaded directly from the client to Azure Blob Storage using a SAS token, bypassing the backend for the actual transfer. After a successful upload, the client notifies the backend, which verifies the blob and persists its metadata.

**Flow summary:** Client requests SAS URL → Client uploads directly to Azure → Client notifies backend → Backend verifies and stores metadata.

---

## 1. Request SAS Token

The client requests a pre-signed upload URL from the backend.

**Endpoint**
```
POST /channels/{channel_name}/files
```

**Headers**
| Header | Description |
|---|---|
| `X-Channel-Token` | Channel token with write permission |

**Response `200 OK`**
```json
{
  "upload_url": "https://<storage-account>.blob.core.windows.net/<container>/uploads/{filename}?<sas-token>"
}
```

Before uploading, the client must replace `{filename}` in the URL with a randomly generated hashed filename, preserving the original file extension.

**Errors**
| Status | Reason |
|---|---|
| `403 Forbidden` | Missing or invalid channel token |

---

## 2. Client Upload

The client:

1. Generates a unique hashed filename, keeping the original extension (e.g. `uploads/a7c91f8d3b2e4c6f.pdf`).
2. Uploads the file directly to Azure Blob Storage using the SAS URL from Step 1.

---

## 3. Notify Backend

Once the upload succeeds, the client notifies the backend so it can record the file.

**Endpoint**
```
POST /channels/{channel_name}/files/complete
```

**Headers**
| Header | Description |
|---|---|
| `X-Channel-Token` | Channel token with write permission |

**Request Body**
```json
{
  "blob_name": "uploads/a7c91f8d3b2e4c6f.pdf",
  "original_file_name": "invoice.pdf"
}
```

**Response**
`204 No Content`

**Errors**
| Status | Reason |
|---|---|
| `400 Bad Request` | Invalid request body |
| `403 Forbidden` | Missing or invalid channel token |
| `404 Not Found` | Uploaded blob not found |

---

## 4. Backend Verification

On receiving the completion notice, the backend:

1. Validates the `X-Channel-Token`.
2. Verifies the blob exists in Azure Blob Storage.
3. Retrieves blob properties (size, content type, last modified).
4. Constructs the blob URL from the storage account, container, and `blob_name`.
5. Saves the file metadata to the database.