"""Iteration 7 tests: RSVP endpoints + video upload endpoint.

Covers:
  * POST /api/rsvps (public) — validation, upsert-on-duplicate
  * GET /api/rsvps and /api/rsvps/summary (staff-only, 401/403)
  * PATCH /api/rsvps/{id}/status (staff-only, valid statuses)
  * DELETE /api/rsvps/{id} (staff-only)
  * POST /api/uploads/video (staff-only, mime + size)
"""
import io
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

STAFF_EMAIL = "crystal@overallbeauty.com"
STAFF_PASSWORD = "Overall2025!"


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    return s


@pytest.fixture(scope="module")
def staff_token(api_client):
    r = api_client.post(
        f"{API}/auth/login",
        json={"email": STAFF_EMAIL, "password": STAFF_PASSWORD},
        timeout=30,
    )
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def staff_headers(staff_token):
    return {"Authorization": f"Bearer {staff_token}"}


@pytest.fixture(scope="module")
def client_token(api_client):
    email = f"TEST_client_{uuid.uuid4().hex[:8]}@gmail.com"
    r = api_client.post(
        f"{API}/auth/register",
        json={"email": email, "password": "Testpass1!", "first_name": "TEST", "last_name": "Client"},
        timeout=30,
    )
    if r.status_code not in (200, 201):
        # Try /register or alt paths
        pytest.skip(f"client signup failed: {r.status_code} {r.text[:200]}")
    tok = r.json().get("token")
    assert tok, r.text
    return tok


# Track ids for cleanup
_created_rsvp_ids: list[str] = []


@pytest.fixture(scope="module", autouse=True)
def _cleanup(staff_headers, api_client):
    yield
    for rid in _created_rsvp_ids:
        try:
            api_client.delete(f"{API}/rsvps/{rid}", headers=staff_headers, timeout=15)
        except Exception:
            pass


# ---- POST /api/rsvps (public) -------------------------------------------
class TestCreateRsvp:
    def test_create_valid(self, api_client):
        payload = {
            "name": "TEST RSVP",
            "email": f"TEST_rsvp_{uuid.uuid4().hex[:8]}@gmail.com",
            "phone": "305-555-0100",
            "guests": 2,
            "note": "Excited!",
            "event": "Grand Opening",
        }
        r = api_client.post(f"{API}/rsvps", json=payload, timeout=30)
        assert r.status_code in (200, 201), r.text
        data = r.json()
        assert data.get("id")
        assert data.get("status") == "ok"
        assert data.get("updated") is False
        _created_rsvp_ids.append(data["id"])

    def test_invalid_email_422(self, api_client):
        r = api_client.post(
            f"{API}/rsvps",
            json={"name": "x", "email": "not-an-email", "guests": 1},
            timeout=15,
        )
        assert r.status_code == 422

    def test_guests_over_limit_422(self, api_client):
        r = api_client.post(
            f"{API}/rsvps",
            json={
                "name": "TEST big",
                "email": f"TEST_big_{uuid.uuid4().hex[:6]}@gmail.com",
                "guests": 11,
            },
            timeout=15,
        )
        assert r.status_code == 422

    def test_guests_zero_422(self, api_client):
        r = api_client.post(
            f"{API}/rsvps",
            json={
                "name": "TEST zero",
                "email": f"TEST_zero_{uuid.uuid4().hex[:6]}@gmail.com",
                "guests": 0,
            },
            timeout=15,
        )
        assert r.status_code == 422

    def test_duplicate_updates_existing(self, api_client, staff_headers):
        email = f"TEST_dup_{uuid.uuid4().hex[:8]}@gmail.com"
        event = "Grand Opening"
        payload = {"name": "DupOne", "email": email, "guests": 1, "event": event}
        r1 = api_client.post(f"{API}/rsvps", json=payload, timeout=15)
        assert r1.status_code in (200, 201), r1.text
        d1 = r1.json()
        _created_rsvp_ids.append(d1["id"])

        # repost with different guests count
        payload2 = {"name": "DupTwo", "email": email, "guests": 4, "event": event}
        r2 = api_client.post(f"{API}/rsvps", json=payload2, timeout=15)
        assert r2.status_code in (200, 201), r2.text
        d2 = r2.json()
        assert d2.get("id") == d1["id"], "duplicate should update, not create new"
        assert d2.get("updated") is True, f"expected updated:true, got {d2}"
        # verify persistence via staff list
        rlist = api_client.get(f"{API}/rsvps", headers=staff_headers, timeout=15)
        assert rlist.status_code == 200
        row = next((x for x in rlist.json() if x.get("id") == d1["id"]), None)
        assert row is not None
        assert row.get("guests") == 4
        assert row.get("name") == "DupTwo"


# ---- GET /api/rsvps (staff-only) ----------------------------------------
class TestListRsvps:
    def test_list_anonymous_401(self, api_client):
        r = api_client.get(f"{API}/rsvps", timeout=15)
        assert r.status_code == 401

    def test_list_client_403(self, api_client, client_token):
        r = api_client.get(
            f"{API}/rsvps",
            headers={"Authorization": f"Bearer {client_token}"},
            timeout=15,
        )
        assert r.status_code == 403

    def test_list_staff_ok(self, api_client, staff_headers):
        r = api_client.get(f"{API}/rsvps", headers=staff_headers, timeout=15)
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        # no mongo _id leaked
        assert all("_id" not in row for row in rows)

    def test_summary_anonymous_401(self, api_client):
        r = api_client.get(f"{API}/rsvps/summary", timeout=15)
        assert r.status_code == 401

    def test_summary_client_403(self, api_client, client_token):
        r = api_client.get(
            f"{API}/rsvps/summary",
            headers={"Authorization": f"Bearer {client_token}"},
            timeout=15,
        )
        assert r.status_code == 403

    def test_summary_staff_shape(self, api_client, staff_headers):
        # Create a going RSVP with 3 guests
        email = f"TEST_sum_{uuid.uuid4().hex[:8]}@gmail.com"
        r = api_client.post(
            f"{API}/rsvps",
            json={"name": "SumTest", "email": email, "guests": 3, "event": "Grand Opening"},
            timeout=15,
        )
        assert r.status_code in (200, 201)
        _created_rsvp_ids.append(r.json()["id"])

        r = api_client.get(f"{API}/rsvps/summary", headers=staff_headers, timeout=15)
        assert r.status_code == 200
        s = r.json()
        assert "total" in s and "going" in s and "attendees" in s
        assert isinstance(s["total"], int)
        assert isinstance(s["attendees"], int)
        assert s["attendees"] >= 3  # our 3 must be included (default status=going)


# ---- PATCH / DELETE ------------------------------------------------------
class TestPatchDelete:
    def _mk(self, api_client):
        email = f"TEST_pd_{uuid.uuid4().hex[:8]}@gmail.com"
        r = api_client.post(
            f"{API}/rsvps",
            json={"name": "PD", "email": email, "guests": 1, "event": "Grand Opening"},
            timeout=15,
        )
        assert r.status_code in (200, 201), r.text
        rid = r.json()["id"]
        _created_rsvp_ids.append(rid)
        return rid

    def test_patch_requires_auth(self, api_client):
        rid = self._mk(api_client)
        r = api_client.patch(f"{API}/rsvps/{rid}/status", json={"status": "maybe"}, timeout=15)
        assert r.status_code == 401

    def test_patch_client_forbidden(self, api_client, client_token):
        rid = self._mk(api_client)
        r = api_client.patch(
            f"{API}/rsvps/{rid}/status",
            json={"status": "maybe"},
            headers={"Authorization": f"Bearer {client_token}"},
            timeout=15,
        )
        assert r.status_code == 403

    def test_patch_valid_statuses(self, api_client, staff_headers):
        rid = self._mk(api_client)
        for s in ("going", "maybe", "cancelled"):
            r = api_client.patch(
                f"{API}/rsvps/{rid}/status",
                json={"status": s},
                headers=staff_headers,
                timeout=15,
            )
            assert r.status_code == 200, r.text
            assert r.json()["status"] == s

    def test_patch_invalid_status_422(self, api_client, staff_headers):
        rid = self._mk(api_client)
        r = api_client.patch(
            f"{API}/rsvps/{rid}/status",
            json={"status": "attending"},
            headers=staff_headers,
            timeout=15,
        )
        assert r.status_code == 422

    def test_patch_unknown_id_404(self, api_client, staff_headers):
        r = api_client.patch(
            f"{API}/rsvps/does-not-exist-xyz/status",
            json={"status": "going"},
            headers=staff_headers,
            timeout=15,
        )
        assert r.status_code == 404

    def test_delete_unknown_id_404(self, api_client, staff_headers):
        r = api_client.delete(
            f"{API}/rsvps/does-not-exist-xyz", headers=staff_headers, timeout=15
        )
        assert r.status_code == 404

    def test_delete_removes(self, api_client, staff_headers):
        rid = self._mk(api_client)
        r = api_client.delete(f"{API}/rsvps/{rid}", headers=staff_headers, timeout=15)
        assert r.status_code in (200, 204)
        # confirm not in list
        r2 = api_client.get(f"{API}/rsvps", headers=staff_headers, timeout=15)
        assert r2.status_code == 200
        assert rid not in [row.get("id") for row in r2.json()]
        if rid in _created_rsvp_ids:
            _created_rsvp_ids.remove(rid)


# ---- POST /api/uploads/video --------------------------------------------
# Minimal valid-ish mp4 header bytes (ftyp box)
MP4_BYTES = (
    b"\x00\x00\x00\x20ftypisom\x00\x00\x02\x00isomiso2avc1mp41"
    + b"\x00" * 64
)


class TestVideoUpload:
    def test_requires_auth(self, api_client):
        files = {"file": ("test.mp4", io.BytesIO(MP4_BYTES), "video/mp4")}
        r = api_client.post(f"{API}/uploads/video", files=files, timeout=30)
        assert r.status_code == 401

    def test_client_forbidden(self, api_client, client_token):
        files = {"file": ("test.mp4", io.BytesIO(MP4_BYTES), "video/mp4")}
        r = api_client.post(
            f"{API}/uploads/video",
            files=files,
            headers={"Authorization": f"Bearer {client_token}"},
            timeout=30,
        )
        assert r.status_code == 403

    def test_bad_content_type_415(self, api_client, staff_headers):
        files = {"file": ("test.txt", io.BytesIO(b"hello world"), "text/plain")}
        r = api_client.post(
            f"{API}/uploads/video", files=files, headers=staff_headers, timeout=30
        )
        assert r.status_code == 415

    def test_too_large_413(self, api_client, staff_headers):
        # 41 MB dummy bytes to exceed 40MB cap
        big = b"\x00" * (41 * 1024 * 1024)
        files = {"file": ("big.mp4", io.BytesIO(big), "video/mp4")}
        r = api_client.post(
            f"{API}/uploads/video", files=files, headers=staff_headers, timeout=120
        )
        assert r.status_code == 413

    def test_upload_and_fetch(self, api_client, staff_headers):
        files = {"file": ("small.mp4", io.BytesIO(MP4_BYTES), "video/mp4")}
        r = api_client.post(
            f"{API}/uploads/video", files=files, headers=staff_headers, timeout=60
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("url", "").startswith("/api/uploads/")
        # fetch it
        rf = requests.get(f"{BASE_URL}{d['url']}", timeout=30)
        assert rf.status_code == 200
        assert len(rf.content) == d["size"]
