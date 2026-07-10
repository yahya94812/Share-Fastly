## API Endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/auth/signup` | No | Create a new user account with email, password, and optional username (defaults to email) |
| POST | `/auth/login` | No | Authenticate with email + password, returns access token |
| POST | `/channels` | Yes (user token) | Create a new channel (public or private) with a name and password |
| GET | `/channels/list` | No | List all public channels (name + created_at only) — anyone can browse |
| GET | `/channels` | Yes (user token) | List all channels (public + private) created by the caller, including `channel_password` for private ones |
| POST | `/channels/{channel_name}/access` | No | Verify channel password, returns a short-lived `channel_token` scoped to that channel with read/write permission |
| GET | `/channels/{channel_name}/files` | No (public) / channel_token (private) | List files in a channel |
| POST | `/channels/{channel_name}/files` | channel_token (write) | Upload a file to a channel |
| GET | `/files/{file_id}/download` | No (public) / channel_token (private) | Download a file, increments `number_of_downloads` |
| DELETE | `/files/{file_id}` | channel_token (write) | Delete a file from its channel |
| POST | `/files/{file_id}/like` | Yes (user token) | Like a file (idempotent) |
| DELETE | `/files/{file_id}/like` | Yes (user token) | Remove like from a file |

12 endpoints