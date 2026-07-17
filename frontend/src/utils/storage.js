// Token lifetimes, mirrored from the backend config.
const ACCESS_TOKEN_TTL_MIN = 60 * 24 * 7 * 4; // 28 days
const CHANNEL_TOKEN_TTL_MIN = 60 * 24 * 7; // 7 days

const KEYS = {
  ACCESS_TOKEN: 'sf_access_token',
  USERNAME: 'sf_username',
  ACCESS_ISSUED_AT: 'sf_access_issued_at',
  CHANNEL_TOKENS: 'sf_channel_tokens', // { [channelName]: { token, issuedAt } }
  LIKED_FILES: 'sf_liked_files', // array of file ids
};

function minutesSince(timestamp) {
  return (Date.now() - timestamp) / 60000;
}

// ---- Account (access token) ----

export function saveSession(accessToken, username) {
  localStorage.setItem(KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(KEYS.USERNAME, username);
  localStorage.setItem(KEYS.ACCESS_ISSUED_AT, String(Date.now()));
}

export function clearSession() {
  localStorage.removeItem(KEYS.ACCESS_TOKEN);
  localStorage.removeItem(KEYS.USERNAME);
  localStorage.removeItem(KEYS.ACCESS_ISSUED_AT);
}

export function getSession() {
  const accessToken = localStorage.getItem(KEYS.ACCESS_TOKEN);
  const username = localStorage.getItem(KEYS.USERNAME);
  const issuedAt = Number(localStorage.getItem(KEYS.ACCESS_ISSUED_AT) || 0);

  if (!accessToken || !username || !issuedAt) return null;

  if (minutesSince(issuedAt) >= ACCESS_TOKEN_TTL_MIN) {
    clearSession();
    return null;
  }

  return { accessToken, username };
}

// ---- Channel tokens (per channel) ----

function readChannelTokenMap() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.CHANNEL_TOKENS) || '{}');
  } catch {
    return {};
  }
}

function writeChannelTokenMap(map) {
  localStorage.setItem(KEYS.CHANNEL_TOKENS, JSON.stringify(map));
}

export function saveChannelToken(channelName, token) {
  const map = readChannelTokenMap();
  map[channelName] = { token, issuedAt: Date.now() };
  writeChannelTokenMap(map);
}

export function getChannelToken(channelName) {
  const map = readChannelTokenMap();
  const entry = map[channelName];
  if (!entry) return null;

  if (minutesSince(entry.issuedAt) >= CHANNEL_TOKEN_TTL_MIN) {
    delete map[channelName];
    writeChannelTokenMap(map);
    return null;
  }

  return entry.token;
}

export function clearChannelToken(channelName) {
  const map = readChannelTokenMap();
  delete map[channelName];
  writeChannelTokenMap(map);
}

export function clearAllChannelTokens() {
  localStorage.removeItem(KEYS.CHANNEL_TOKENS);
}

// ---- Liked files (per-browser, prevents duplicate likes) ----

export function getLikedFiles() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEYS.LIKED_FILES) || '[]'));
  } catch {
    return new Set();
  }
}

export function markFileLiked(fileId) {
  const liked = getLikedFiles();
  liked.add(fileId);
  localStorage.setItem(KEYS.LIKED_FILES, JSON.stringify([...liked]));
}

// ---- First-visit tracking (drives the Welcome screen) ----

const VISITED_KEY = 'sf_has_visited';

export function hasVisitedBefore() {
  return localStorage.getItem(VISITED_KEY) === '1';
}

export function markVisited() {
  localStorage.setItem(VISITED_KEY, '1');
}
