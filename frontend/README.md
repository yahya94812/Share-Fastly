# Share Fastly — Frontend

A React + Vite frontend for Share Fastly, built against the Share Fastly API (auth, channels, files).

## Stack

- React 19 + React Router 7 (client-side routing)
- Tailwind CSS v4 (utility styling, no component library)
- lucide-react (icons)
- Vite

## Getting started

```bash
npm install
npm run dev
```

The app expects the API at `http://localhost:8000` by default. Change this in `.env`:

```
VITE_API_BASE_URL=http://localhost:8000
```

## Routes

| Route | Screen |
|---|---|
| `/` | Welcome (first-time visitors) → redirects to Explore or Dashboard otherwise |
| `/explore` | Public channel directory, search, access a private channel |
| `/dashboard` | Your channels (requires sign-in; prompts a login/signup modal inline if not) |
| `/channel/:channelName` | Files in a channel — upload, download, like, delete |

## How auth is handled

- **Access tokens** (account-level) are stored with an issued-at timestamp and treated as expired after 28 days, matching the backend's `ACCESS_TOKEN_EXPIRE_MINUTES`. Expiry is checked on load and polled while the app is open; an expired session quietly signs the user out.
- **Channel tokens** are cached per channel name with their own 7-day expiry window and are never reused across channels.
- On the Dashboard, opening one of your own channels fetches a fresh channel token automatically (you already know the password), so there's no extra prompt.
- On Explore or via a direct link, opening a channel first tries to read its files with whatever token (if any) is cached. A `403` response means the channel is private — the app then asks for the password inline instead of guessing the channel's type ahead of time.
- Uploading to a channel you haven't unlocked yet (typically a public channel you're only reading) asks for the password once, then proceeds straight to the upload dialog.
- "Log out of channels" (Explore) clears cached channel tokens only. "Log out" (Dashboard) clears the account session too.

## Notes

- Likes are tracked per-browser in `localStorage` to prevent repeat likes on the same file from the same device (the API itself has no per-user like tracking).
- File upload/download go directly against the signed Azure Blob URLs the API returns; the API server is only asked to mint the URL and to confirm completion, per the API spec.
