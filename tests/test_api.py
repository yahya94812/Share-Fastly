"""
End-to-end smoke test for the Share Fastly API.

Runs the full happy-path flow across auth -> channels -> files against a
live server, plus the key error cases (409 / 401 / 403 / 404). Not a pytest
suite by design - just run it top to bottom and read the PASS/FAIL output.

Usage:
    pip install requests
    uvicorn main:app --reload        # in another terminal
    python tests/test_api.py

Requires a real Azure Storage account behind the server (STORAGE_ACCOUNT_*
env vars) since the upload step performs an actual PUT to a SAS URL.
"""

import sys
import time
import uuid

import requests

BASE_URL = "http://localhost:8000"

PASS = 0
FAIL = 0


def check(label: str, condition: bool, extra: str = "") -> None:
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  PASS  {label}")
    else:
        FAIL += 1
        print(f"  FAIL  {label}  {extra}")


def section(title: str) -> None:
    print(f"\n=== {title} ===")


def main() -> None:
    run_id = uuid.uuid4().hex[:8]
    email = f"test-{run_id}@example.com"
    password = "supersecret1"

    # ---------------------------------------------------------------
    section("Auth: signup")
    # ---------------------------------------------------------------
    r = requests.post(f"{BASE_URL}/auth/signup", json={"email": email, "password": password})
    check("signup -> 201", r.status_code == 201, r.text)
    body = r.json()
    check("signup returns access_token", "access_token" in body)
    check("signup returns username", "username" in body)
    access_token = body["access_token"]
    username = body["username"]
    auth_headers = {"Authorization": f"Bearer {access_token}"}

    r = requests.post(f"{BASE_URL}/auth/signup", json={"email": email, "password": password})
    check("duplicate signup -> 409", r.status_code == 409, r.text)

    # ---------------------------------------------------------------
    section("Auth: login")
    # ---------------------------------------------------------------
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    check("login -> 200", r.status_code == 200, r.text)
    check("login returns matching username", r.json().get("username") == username)

    r = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": "wrong-password"})
    check("login with wrong password -> 401", r.status_code == 401, r.text)

    # ---------------------------------------------------------------
    section("Channels: create")
    # ---------------------------------------------------------------
    public_channel = f"public-{run_id}"
    private_channel = f"private-{run_id}"
    channel_password = "channelpass1"

    r = requests.post(
        f"{BASE_URL}/channels",
        headers=auth_headers,
        json={
            "channel_name": public_channel,
            "channel_type": "public",
            "channel_password": channel_password,
        },
    )
    check("create public channel -> 201", r.status_code == 201, r.text)

    r = requests.post(
        f"{BASE_URL}/channels",
        headers=auth_headers,
        json={
            "channel_name": private_channel,
            "channel_type": "private",
            "channel_password": channel_password,
        },
    )
    check("create private channel -> 201", r.status_code == 201, r.text)

    r = requests.post(
        f"{BASE_URL}/channels",
        headers=auth_headers,
        json={
            "channel_name": public_channel,
            "channel_type": "public",
            "channel_password": channel_password,
        },
    )
    check("duplicate channel name -> 409", r.status_code == 409, r.text)

    r = requests.post(
        f"{BASE_URL}/channels",
        json={
            "channel_name": f"noauth-{run_id}",
            "channel_type": "public",
            "channel_password": channel_password,
        },
    )
    check("create channel without auth -> 401", r.status_code == 401, r.text)

    # ---------------------------------------------------------------
    section("Channels: list mine / list public")
    # ---------------------------------------------------------------
    r = requests.get(f"{BASE_URL}/channels", headers=auth_headers)
    check("list my channels -> 200", r.status_code == 200, r.text)
    mine = {c["channel_name"] for c in r.json()}
    check("my channels include both created channels", {public_channel, private_channel} <= mine)

    r = requests.get(f"{BASE_URL}/channels/list")
    check("list public channels -> 200", r.status_code == 200, r.text)
    public_names = {c["channel_name"] for c in r.json()}
    check("public list includes public channel", public_channel in public_names)
    check("public list excludes private channel", private_channel not in public_names)

    # ---------------------------------------------------------------
    section("Channels: access")
    # ---------------------------------------------------------------
    r = requests.post(f"{BASE_URL}/channels/{private_channel}/access", json={"password": channel_password})
    check("access private channel -> 200", r.status_code == 200, r.text)
    private_token = r.json()["channel_token"]
    private_headers = {"X-Channel-Token": private_token}

    r = requests.post(f"{BASE_URL}/channels/{public_channel}/access", json={"password": channel_password})
    check("access public channel -> 200", r.status_code == 200, r.text)
    public_token = r.json()["channel_token"]
    public_headers = {"X-Channel-Token": public_token}

    r = requests.post(f"{BASE_URL}/channels/{private_channel}/access", json={"password": "wrong"})
    check("wrong channel password -> 403", r.status_code == 403, r.text)

    r = requests.post(f"{BASE_URL}/channels/does-not-exist-{run_id}/access", json={"password": "x"})
    check("access nonexistent channel -> 404", r.status_code == 404, r.text)

    # ---------------------------------------------------------------
    section("Files: list on empty channel")
    # ---------------------------------------------------------------
    r = requests.get(f"{BASE_URL}/channels/{public_channel}/files")
    check("list files, public, no auth -> 200", r.status_code == 200, r.text)
    check("public channel starts empty", r.json() == [])

    r = requests.get(f"{BASE_URL}/channels/{private_channel}/files")
    check("list files, private, no token -> 403", r.status_code == 403, r.text)

    r = requests.get(f"{BASE_URL}/channels/{private_channel}/files", headers=private_headers)
    check("list files, private, with token -> 200", r.status_code == 200, r.text)

    # ---------------------------------------------------------------
    section("Files: upload flow (public channel)")
    # ---------------------------------------------------------------
    file_content = f"hello from the share-fastly test suite ({run_id})".encode()
    original_file_name = "test-note.txt"

    r = requests.post(f"{BASE_URL}/channels/{public_channel}/files", json={"original_file_name": original_file_name})
    check("request upload SAS without token -> 403", r.status_code == 403, r.text)

    r = requests.post(
        f"{BASE_URL}/channels/{public_channel}/files",
        headers=public_headers,
        json={"original_file_name": original_file_name},
    )
    check("request upload SAS -> 200", r.status_code == 200, r.text)
    sas_body = r.json()
    check("upload SAS response has blob_name", "blob_name" in sas_body)
    check("upload SAS response has upload_url", "upload_url" in sas_body)
    blob_name = sas_body["blob_name"]
    upload_url = sas_body["upload_url"]

    put_resp = requests.put(
        upload_url,
        data=file_content,
        headers={"x-ms-blob-type": "BlockBlob", "Content-Type": "text/plain"},
    )
    check("PUT file bytes to SAS URL -> 201", put_resp.status_code == 201, put_resp.text)

    r = requests.post(
        f"{BASE_URL}/channels/{public_channel}/files/complete",
        headers=public_headers,
        json={"blob_name": blob_name, "original_file_name": original_file_name},
    )
    check("complete upload -> 204", r.status_code == 204, r.text)

    r = requests.post(
        f"{BASE_URL}/channels/{public_channel}/files/complete",
        headers=public_headers,
        json={"blob_name": f"never-uploaded-{run_id}.txt", "original_file_name": "x.txt"},
    )
    check("complete upload, blob never uploaded -> 404", r.status_code == 404, r.text)

    # ---------------------------------------------------------------
    section("Files: list after upload")
    # ---------------------------------------------------------------
    r = requests.get(f"{BASE_URL}/channels/{public_channel}/files")
    check("list files after upload -> 200", r.status_code == 200, r.text)
    files = r.json()
    check("uploaded file appears in list", any(f["file_name"] == original_file_name for f in files))
    uploaded = next(f for f in files if f["file_name"] == original_file_name)
    file_id = uploaded["file_id"]
    check("file_size matches uploaded content", uploaded["file_size"] == len(file_content), uploaded)
    check("downloads start at 0", uploaded["number_of_downloads"] == 0)
    check("likes start at 0", uploaded["number_of_likes"] == 0)

    # ---------------------------------------------------------------
    section("Files: download")
    # ---------------------------------------------------------------
    r = requests.get(f"{BASE_URL}/files/{file_id}/download")
    check("download public file, no auth -> 200", r.status_code == 200, r.text)
    download_url = r.json()["download_url"]

    dl = requests.get(download_url)
    check("GET the download_url returns the same bytes", dl.content == file_content)

    r = requests.get(f"{BASE_URL}/channels/{public_channel}/files")
    updated = next(f for f in r.json() if f["file_id"] == file_id)
    check("download count incremented", updated["number_of_downloads"] == 1, updated)

    r = requests.get(f"{BASE_URL}/files/999999999/download")
    check("download nonexistent file -> 404", r.status_code == 404, r.text)

    # ---------------------------------------------------------------
    section("Files: like")
    # ---------------------------------------------------------------
    r = requests.post(f"{BASE_URL}/files/{file_id}/like")
    check("like file -> 200", r.status_code == 200, r.text)
    check("like_count is 1", r.json()["like_count"] == 1, r.json())

    r = requests.post(f"{BASE_URL}/files/{file_id}/like")
    check("like file again -> like_count 2", r.json()["like_count"] == 2, r.json())

    r = requests.post(f"{BASE_URL}/files/999999999/like")
    check("like nonexistent file -> 404", r.status_code == 404, r.text)

    # ---------------------------------------------------------------
    section("Files: delete")
    # ---------------------------------------------------------------
    r = requests.delete(f"{BASE_URL}/files/{file_id}")
    check("delete file without token -> 403", r.status_code == 403, r.text)

    r = requests.delete(f"{BASE_URL}/files/{file_id}", headers=public_headers)
    check("delete file with token -> 204", r.status_code == 204, r.text)

    r = requests.get(f"{BASE_URL}/channels/{public_channel}/files")
    remaining = [f for f in r.json() if f["file_id"] == file_id]
    check("file no longer listed after delete", remaining == [])

    r = requests.delete(f"{BASE_URL}/files/{file_id}", headers=public_headers)
    check("delete already-deleted file -> 404", r.status_code == 404, r.text)

    # ---------------------------------------------------------------
    section("Summary")
    # ---------------------------------------------------------------
    print(f"\n{PASS} passed, {FAIL} failed")
    if FAIL:
        sys.exit(1)


if __name__ == "__main__":
    try:
        requests.get(BASE_URL, timeout=2)
    except requests.exceptions.ConnectionError:
        print(f"Could not reach {BASE_URL}. Start the server first: uvicorn main:app --reload")
        sys.exit(1)

    main()