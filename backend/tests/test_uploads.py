"""Upload endpoint tests - bug retest for image upload feature."""
import io
import os
import struct
import zlib
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")).rstrip("/")
STAFF_EMAIL = "crystal@overallbeauty.com"
STAFF_PASSWORD = "Overall2025!"


def _make_png(w=2, h=2):
    """Return bytes of a minimal valid PNG."""
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    raw = b""
    for _ in range(h):
        raw += b"\x00" + b"\xff\x00\x00" * w
    idat = zlib.compress(raw)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


@pytest.fixture(scope="module")
def staff_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": STAFF_EMAIL, "password": STAFF_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
    return r.json()["access_token"] if "access_token" in r.json() else r.json().get("token")


class TestUploads:
    def test_upload_requires_auth(self):
        png = _make_png()
        r = requests.post(f"{BASE_URL}/api/uploads/image", files={"file": ("t.png", png, "image/png")})
        assert r.status_code == 401, f"expected 401, got {r.status_code}: {r.text[:200]}"

    def test_upload_png_success(self, staff_token):
        png = _make_png()
        r = requests.post(
            f"{BASE_URL}/api/uploads/image",
            headers={"Authorization": f"Bearer {staff_token}"},
            files={"file": ("test.png", png, "image/png")},
        )
        assert r.status_code == 200, f"{r.status_code}: {r.text[:200]}"
        data = r.json()
        assert "url" in data and data["url"].startswith("/api/uploads/")
        assert data["filename"] and data["filename"].endswith(".png")
        assert data["size"] == len(png)
        assert data["content_type"] == "image/png"
        # verify GET returns exact bytes
        get = requests.get(f"{BASE_URL}{data['url']}")
        assert get.status_code == 200
        assert get.content == png
        # save for the next test
        TestUploads._uploaded_url = data["url"]
        TestUploads._uploaded_filename = data["filename"]

    def test_upload_wrong_content_type(self, staff_token):
        r = requests.post(
            f"{BASE_URL}/api/uploads/image",
            headers={"Authorization": f"Bearer {staff_token}"},
            files={"file": ("t.txt", b"hello", "text/plain")},
        )
        assert r.status_code == 415, f"expected 415, got {r.status_code}: {r.text[:200]}"

    def test_path_traversal_blocked(self):
        # Try encoded traversal
        for candidate in ["..%2Fserver.py", "..%2F..%2Fserver.py", "%2E%2E%2Fserver.py"]:
            r = requests.get(f"{BASE_URL}/api/uploads/{candidate}")
            assert r.status_code in (400, 404), f"{candidate}: got {r.status_code}"
            # ensure not leaking python source
            assert b"FastAPI" not in r.content and b"api_router" not in r.content

    def test_get_nonexistent_upload(self):
        r = requests.get(f"{BASE_URL}/api/uploads/does_not_exist_xyz.png")
        assert r.status_code == 404
