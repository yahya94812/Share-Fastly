const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Core request helper. Always returns parsed JSON (or null for 204s).
 * Throws ApiError with a human-readable message on failure.
 */
async function request(path, { method = 'GET', body, headers = {} } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      'Cannot reach the server. Check your connection and try again.',
      0
    );
  }

  if (res.status === 204) return null;

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // non-JSON body, ignore
    }
  }

  if (!res.ok) {
    const message = data?.detail || fallbackMessage(res.status);
    throw new ApiError(typeof message === 'string' ? message : fallbackMessage(res.status), res.status);
  }

  return data;
}

function fallbackMessage(status) {
  switch (status) {
    case 400:
      return 'That request could not be processed.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have access to do that.';
    case 404:
      return 'That could not be found.';
    case 409:
      return 'That already exists.';
    case 500:
      return 'Something went wrong on the server. Please try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

function authHeader(accessToken) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function channelHeader(channelToken) {
  return channelToken ? { 'X-Channel-Token': channelToken } : {};
}

export const api = {
  // Auth
  signup: (email, password) => request('/auth/signup', { method: 'POST', body: { email, password } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),

  // Channels
  createChannel: (accessToken, { channel_name, channel_type, channel_password }) =>
    request('/channels', {
      method: 'POST',
      headers: authHeader(accessToken),
      body: { channel_name, channel_type, channel_password },
    }),
  listMyChannels: (accessToken) =>
    request('/channels', { headers: authHeader(accessToken) }),
  listPublicChannels: () => request('/channels/list'),
  accessChannel: (channelName, password) =>
    request(`/channels/${encodeURIComponent(channelName)}/access`, {
      method: 'POST',
      body: { password },
    }),

  // Files
  listFiles: (channelName, channelToken) =>
    request(`/channels/${encodeURIComponent(channelName)}/files`, {
      headers: channelHeader(channelToken),
    }),
  requestUpload: (channelName, channelToken, originalFileName) =>
    request(`/channels/${encodeURIComponent(channelName)}/files`, {
      method: 'POST',
      headers: channelHeader(channelToken),
      body: { original_file_name: originalFileName },
    }),
  completeUpload: (channelName, channelToken, blobName, originalFileName) =>
    request(`/channels/${encodeURIComponent(channelName)}/files/complete`, {
      method: 'POST',
      headers: channelHeader(channelToken),
      body: { blob_name: blobName, original_file_name: originalFileName },
    }),
  getDownloadUrl: (fileId, channelToken) =>
    request(`/files/${fileId}/download`, { headers: channelHeader(channelToken) }),
  deleteFile: (fileId, channelToken) =>
    request(`/files/${fileId}`, { method: 'DELETE', headers: channelHeader(channelToken) }),
  likeFile: (fileId) => request(`/files/${fileId}/like`, { method: 'POST' }),

  // Raw blob upload (Azure SAS URL) — not through our API base
  uploadToBlob: async (uploadUrl, file) => {
    let res;
    try {
      res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });
    } catch {
      throw new ApiError('Upload failed. Check your connection and try again.', 0);
    }
    if (!res.ok) {
      throw new ApiError('Upload failed while sending the file. Please try again.', res.status);
    }
  },
};
