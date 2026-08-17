"""Auth + role-gated consultation tests for Overall Beauty & Wellness (iteration 2).

Covers:
  * Staff seed on startup (login with seeded creds)
  * POST /api/auth/register (client role, duplicate 400)
  * POST /api/auth/login (client OK, staff OK, wrong pw 401)
  * GET  /api/auth/me (with/without token)
  * GET  /api/consultations (client 403, staff 200)
  * GET  /api/consultations/mine (matches user_id OR email)
  * POST /api/consultations anonymous still works
  * POST /api/consultations with client token stamps user_id
  * PATCH /api/consultations/{id}/status (staff-only, validates status enum)
"""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://spa-wellness-pro-2.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

STAFF_EMAIL = "crystal@overallbeauty.com"
STAFF_PASSWORD = "Overall2025!"


def _rand_email(prefix="test"):
    return f"test.{prefix}.{uuid.uuid4().hex[:10]}@gmail.com"


# ------------- Fixtures -------------
@pytest.fixture(scope="module")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def staff_token(http):
    r = http.post(f"{API}/auth/login", json={"email": STAFF_EMAIL, "password": STAFF_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Staff login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "staff"
    return data["token"]


@pytest.fixture(scope="module")
def client_creds(http):
    """Register a fresh client used across module."""
    email = _rand_email("client")
    payload = {
        "email": email,
        "password": "Testing123!",
        "first_name": "TestClient",
        "last_name": "Fixture",
        "phone": "305-555-1000",
    }
    r = http.post(f"{API}/auth/register", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    return {"email": email, "password": payload["password"], "token": data["token"], "user": data["user"]}


# ------------- Staff seed / login -------------
class TestStaffSeed:
    def test_staff_login_success(self, http):
        r = http.post(f"{API}/auth/login", json={"email": STAFF_EMAIL, "password": STAFF_PASSWORD}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user"]["email"] == STAFF_EMAIL
        assert data["user"]["role"] == "staff"
        assert isinstance(data["token"], str) and len(data["token"]) > 20

    def test_staff_wrong_password_401(self, http):
        r = http.post(f"{API}/auth/login", json={"email": STAFF_EMAIL, "password": "nope-nope"}, timeout=30)
        assert r.status_code == 401


# ------------- Register -------------
class TestRegister:
    def test_register_creates_client(self, http):
        email = _rand_email("newclient")
        r = http.post(f"{API}/auth/register", json={
            "email": email,
            "password": "Passw0rd!",
            "first_name": "Alice",
            "last_name": "Client",
            "phone": "305-555-2222",
        }, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and isinstance(data["token"], str)
        assert data["user"]["email"] == email
        assert data["user"]["role"] == "client"
        assert data["user"]["first_name"] == "Alice"
        # ensure /me works with this token
        me = http.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {data['token']}"}, timeout=30)
        assert me.status_code == 200
        assert me.json()["email"] == email

    def test_register_duplicate_email_400(self, http):
        email = _rand_email("dupe")
        payload = {
            "email": email,
            "password": "Passw0rd!",
            "first_name": "Dupe",
            "last_name": "Test",
        }
        r1 = http.post(f"{API}/auth/register", json=payload, timeout=30)
        assert r1.status_code == 200
        r2 = http.post(f"{API}/auth/register", json=payload, timeout=30)
        assert r2.status_code == 400

    def test_register_short_password_422(self, http):
        r = http.post(f"{API}/auth/register", json={
            "email": _rand_email("short"),
            "password": "abc",
            "first_name": "X",
            "last_name": "Y",
        }, timeout=30)
        assert r.status_code == 422


# ------------- /auth/me -------------
class TestMe:
    def test_me_no_token_401(self, http):
        r = http.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401

    def test_me_invalid_token_401(self, http):
        r = http.get(f"{API}/auth/me", headers={"Authorization": "Bearer invalid.token.here"}, timeout=30)
        assert r.status_code == 401

    def test_me_with_staff_token(self, http, staff_token):
        r = http.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {staff_token}"}, timeout=30)
        assert r.status_code == 200
        assert r.json()["role"] == "staff"


# ------------- Consultations role-gating -------------
class TestConsultationsRoleGating:
    def test_list_consultations_client_403(self, http, client_creds):
        r = http.get(f"{API}/consultations", headers={"Authorization": f"Bearer {client_creds['token']}"}, timeout=30)
        assert r.status_code == 403

    def test_list_consultations_no_auth_401(self, http):
        r = http.get(f"{API}/consultations", timeout=30)
        assert r.status_code == 401

    def test_list_consultations_staff_200(self, http, staff_token):
        r = http.get(f"{API}/consultations", headers={"Authorization": f"Bearer {staff_token}"}, timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        # newest first check
        created_ats = [x.get("created_at") for x in rows if x.get("created_at")]
        assert created_ats == sorted(created_ats, reverse=True)


# ------------- Anonymous consultation still works -------------
class TestAnonymousBooking:
    def test_anon_create_consultation(self, http):
        payload = {
            "first_name": "TESTAnon",
            "last_name": "User",
            "email": f"TEST_anon_{uuid.uuid4().hex[:6]}@gmail.com",
            "phone": "305-555-3333",
            "service_interest": "Botox",
            "preferred_date": "2026-06-01",
            "preferred_time": f"TEST-{uuid.uuid4().hex[:8]}",
            "message": "anon booking test",
        }
        r = http.post(f"{API}/consultations", json=payload, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["status"] == "new"
        assert d.get("user_id") in (None, "")  # anon should not have a user_id


# ------------- Client booking stamps user_id + /mine -------------
class TestClientBookingAndMine:
    def test_client_booking_stamps_user_id_and_appears_in_mine(self, http, client_creds):
        headers = {"Authorization": f"Bearer {client_creds['token']}"}
        # book using the client's email so /mine matches on either user_id or email
        payload = {
            "first_name": "TESTClient",
            "last_name": "Booking",
            "email": client_creds["email"],
            "phone": "305-555-4444",
            "service_interest": "Sculptra",
            "preferred_date": "2026-07-04",
            "preferred_time": f"TEST-{uuid.uuid4().hex[:8]}",
            "message": "client booking test",
        }
        cr = http.post(f"{API}/consultations", json=payload, headers=headers, timeout=60)
        assert cr.status_code == 200, cr.text
        created = cr.json()
        assert created["user_id"] == client_creds["user"]["id"]

        # /mine returns this record
        mr = http.get(f"{API}/consultations/mine", headers=headers, timeout=30)
        assert mr.status_code == 200
        mine = mr.json()
        assert any(x["id"] == created["id"] for x in mine)
        # Every returned row should belong to this user
        for x in mine:
            assert (x.get("user_id") == client_creds["user"]["id"]) or (x.get("email") == client_creds["email"])

    def test_mine_matches_email_even_without_user_id(self, http, client_creds):
        """A consultation submitted anonymously but with the client's email
        should still appear in /mine via the email fallback."""
        headers = {"Authorization": f"Bearer {client_creds['token']}"}
        payload = {
            "first_name": "TESTEmailMatch",
            "last_name": "Anon",
            "email": client_creds["email"],
            "phone": "305-555-5555",
            "service_interest": "Radiesse",
            "preferred_date": "2026-08-15",
            "preferred_time": f"TEST-{uuid.uuid4().hex[:8]}",
        }
        # POST anonymously (no auth header)
        cr = http.post(f"{API}/consultations", json=payload, timeout=60)
        assert cr.status_code == 200, cr.text

        mr = http.get(f"{API}/consultations/mine", headers=headers, timeout=30)
        assert mr.status_code == 200
        emails = [x.get("email") for x in mr.json()]
        assert client_creds["email"] in emails

    def test_mine_no_auth_401(self, http):
        r = http.get(f"{API}/consultations/mine", timeout=30)
        assert r.status_code == 401


# ------------- Staff status PATCH -------------
class TestStatusPatch:
    def test_status_patch_staff_only(self, http, staff_token, client_creds):
        # Create a consultation first
        payload = {
            "first_name": "TESTStatus",
            "last_name": "Update",
            "email": f"TEST_status_{uuid.uuid4().hex[:6]}@gmail.com",
            "phone": "305-555-6666",
        }
        cr = http.post(f"{API}/consultations", json=payload, timeout=60)
        assert cr.status_code == 200
        cid = cr.json()["id"]

        # client cannot update
        bad = http.patch(
            f"{API}/consultations/{cid}/status",
            json={"status": "contacted"},
            headers={"Authorization": f"Bearer {client_creds['token']}"},
            timeout=30,
        )
        assert bad.status_code == 403

        # staff can update
        ok = http.patch(
            f"{API}/consultations/{cid}/status",
            json={"status": "contacted"},
            headers={"Authorization": f"Bearer {staff_token}"},
            timeout=30,
        )
        assert ok.status_code == 200
        assert ok.json()["status"] == "contacted"

        # GET verify persistence via listing
        listing = http.get(f"{API}/consultations", headers={"Authorization": f"Bearer {staff_token}"}, timeout=30)
        assert listing.status_code == 200
        row = next((x for x in listing.json() if x["id"] == cid), None)
        assert row and row["status"] == "contacted"

    def test_status_patch_invalid_value_422(self, http, staff_token):
        # Create one
        payload = {
            "first_name": "TESTInvalid",
            "last_name": "Status",
            "email": f"TEST_inv_{uuid.uuid4().hex[:6]}@gmail.com",
            "phone": "305-555-7777",
        }
        cr = http.post(f"{API}/consultations", json=payload, timeout=60)
        cid = cr.json()["id"]
        r = http.patch(
            f"{API}/consultations/{cid}/status",
            json={"status": "banana"},
            headers={"Authorization": f"Bearer {staff_token}"},
            timeout=30,
        )
        assert r.status_code == 422

    def test_status_patch_unknown_id_404(self, http, staff_token):
        r = http.patch(
            f"{API}/consultations/nonexistent-id/status",
            json={"status": "contacted"},
            headers={"Authorization": f"Bearer {staff_token}"},
            timeout=30,
        )
        assert r.status_code == 404

    def test_all_valid_statuses_accepted(self, http, staff_token):
        # Create one target
        payload = {
            "first_name": "TESTCycle",
            "last_name": "Statuses",
            "email": f"TEST_cycle_{uuid.uuid4().hex[:6]}@gmail.com",
            "phone": "305-555-8888",
        }
        cid = http.post(f"{API}/consultations", json=payload, timeout=60).json()["id"]
        for s in ["new", "contacted", "scheduled", "completed", "cancelled"]:
            r = http.patch(
                f"{API}/consultations/{cid}/status",
                json={"status": s},
                headers={"Authorization": f"Bearer {staff_token}"},
                timeout=30,
            )
            assert r.status_code == 200, f"{s}: {r.text}"
            assert r.json()["status"] == s
