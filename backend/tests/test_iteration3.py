"""Iteration 3 backend tests:
   * /api/schedule/config (GET/PUT)
   * /api/schedule/availability
   * /api/consultations slot-conflict 409 + dual business email
   * /api/content GET/PUT (staff-only)
"""
import os
import time
import uuid
import pytest
import requests
from datetime import datetime, timedelta, timezone

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://spa-wellness-pro-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

STAFF_EMAIL = "crystal@overallbeauty.com"
STAFF_PASSWORD = "Overall2025!"


# ---------- helpers ----------
def _login(session: requests.Session, email: str, password: str) -> str:
    r = session.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["token"]


def _register_client(session: requests.Session) -> tuple[str, str]:
    email = f"test.iter3.{uuid.uuid4().hex[:8]}@gmail.com"
    r = session.post(
        f"{API}/auth/register",
        json={
            "email": email,
            "password": "SuperSecret123",
            "first_name": "TESTiter3",
            "last_name": "TESTclient",
            "phone": "305-555-0199",
        },
        timeout=30,
    )
    assert r.status_code == 200, r.text
    return r.json()["token"], email


def _next_weekday_iso(days_ahead: int = 3) -> str:
    """Return YYYY-MM-DD at least `days_ahead` days ahead and on a weekday (Mon-Fri)."""
    d = datetime.now(timezone.utc).date() + timedelta(days=days_ahead)
    while d.weekday() >= 5:
        d += timedelta(days=1)
    return d.isoformat()


def _next_sunday_iso(min_days: int = 3) -> str:
    d = datetime.now(timezone.utc).date() + timedelta(days=min_days)
    while d.weekday() != 6:
        d += timedelta(days=1)
    return d.isoformat()


@pytest.fixture(scope="module")
def staff_token():
    s = requests.Session()
    return _login(s, STAFF_EMAIL, STAFF_PASSWORD)


@pytest.fixture(scope="module")
def client_creds():
    s = requests.Session()
    token, email = _register_client(s)
    return token, email


@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ============================================================
# GET/PUT /api/schedule/config
# ============================================================
class TestScheduleConfig:
    def test_get_default_schedule(self, api_client):
        r = api_client.get(f"{API}/schedule/config")
        assert r.status_code == 200
        cfg = r.json()
        # Defaults per PRD
        assert cfg.get("start_time") == "09:00"
        assert cfg.get("end_time") == "17:00"
        assert cfg.get("slot_duration_min") == 45
        assert cfg.get("advance_days") == 60
        assert cfg.get("lead_time_hours") == 12
        # working_days [1..5] (Mon..Fri assumed 0=Mon)
        wd = cfg.get("working_days")
        assert isinstance(wd, list) and len(wd) == 5

    def test_put_requires_staff(self, api_client):
        # No auth -> 401
        r = api_client.put(f"{API}/schedule/config", json={"start_time": "10:00"})
        assert r.status_code == 401

    def test_put_forbidden_for_client(self, api_client, client_creds):
        token, _ = client_creds
        api_client.headers.update({"Authorization": f"Bearer {token}"})
        r = api_client.put(f"{API}/schedule/config", json={
            "working_days": [0, 1, 2, 3, 4], "start_time": "09:00", "end_time": "17:00",
            "slot_duration_min": 45, "buffer_min": 0, "blackout_dates": [],
            "lead_time_hours": 12, "advance_days": 60, "timezone": "America/New_York",
        })
        assert r.status_code == 403

    def test_put_malformed_returns_422(self, api_client, staff_token):
        api_client.headers.update({"Authorization": f"Bearer {staff_token}"})
        # slot_duration_min is expected to be int; sending a non-int string that cannot coerce.
        r = api_client.put(f"{API}/schedule/config", json={"slot_duration_min": "not-a-number"})
        assert r.status_code == 422

    def test_put_updates_and_get_returns_new(self, api_client, staff_token):
        api_client.headers.update({"Authorization": f"Bearer {staff_token}"})
        payload = {
            "working_days": [0, 1, 2, 3, 4],
            "start_time": "08:00",
            "end_time": "18:00",
            "slot_duration_min": 30,
            "buffer_min": 0,
            "blackout_dates": [],
            "lead_time_hours": 12,
            "advance_days": 60,
            "timezone": "America/New_York",
        }
        r = api_client.put(f"{API}/schedule/config", json=payload)
        assert r.status_code == 200, r.text
        # Verify GET reflects update
        api_client.headers.pop("Authorization", None)
        r2 = api_client.get(f"{API}/schedule/config")
        assert r2.status_code == 200
        cfg = r2.json()
        assert cfg["start_time"] == "08:00"
        assert cfg["end_time"] == "18:00"
        assert cfg["slot_duration_min"] == 30

    def test_reset_to_defaults(self, api_client, staff_token):
        """Restore defaults for downstream tests."""
        api_client.headers.update({"Authorization": f"Bearer {staff_token}"})
        payload = {
            "working_days": [0, 1, 2, 3, 4],
            "start_time": "09:00",
            "end_time": "17:00",
            "slot_duration_min": 45,
            "buffer_min": 0,
            "blackout_dates": [],
            "lead_time_hours": 12,
            "advance_days": 60,
            "timezone": "America/New_York",
        }
        r = api_client.put(f"{API}/schedule/config", json=payload)
        assert r.status_code == 200


# ============================================================
# GET /api/schedule/availability
# ============================================================
class TestAvailability:
    def test_weekday_returns_slots(self, api_client):
        date = _next_weekday_iso(days_ahead=3)
        r = api_client.get(f"{API}/schedule/availability", params={"date": date})
        assert r.status_code == 200
        data = r.json()
        assert data["date"] == date
        assert isinstance(data.get("available"), list)
        assert len(data["available"]) > 0
        assert data.get("slot_minutes") == 45

    def test_sunday_returns_day_off(self, api_client):
        date = _next_sunday_iso()
        r = api_client.get(f"{API}/schedule/availability", params={"date": date})
        assert r.status_code == 200
        data = r.json()
        assert data["available"] == []
        assert data.get("reason") == "day_off"

    def test_past_date_out_of_range(self, api_client):
        past = (datetime.now(timezone.utc).date() - timedelta(days=2)).isoformat()
        r = api_client.get(f"{API}/schedule/availability", params={"date": past})
        assert r.status_code == 200
        data = r.json()
        assert data["available"] == []
        assert data.get("reason") == "out_of_range"

    def test_blackout_reason(self, api_client, staff_token):
        blackout = _next_weekday_iso(days_ahead=4)
        # Add blackout via PUT (staff)
        api_client.headers.update({"Authorization": f"Bearer {staff_token}"})
        r = api_client.put(f"{API}/schedule/config", json={
            "working_days": [0, 1, 2, 3, 4],
            "start_time": "09:00",
            "end_time": "17:00",
            "slot_duration_min": 45,
            "buffer_min": 0,
            "blackout_dates": [blackout],
            "lead_time_hours": 12,
            "advance_days": 60,
            "timezone": "America/New_York",
        })
        assert r.status_code == 200
        # Public GET availability for that date
        api_client.headers.pop("Authorization", None)
        r2 = api_client.get(f"{API}/schedule/availability", params={"date": blackout})
        assert r2.status_code == 200
        data = r2.json()
        assert data["available"] == []
        assert data.get("reason") == "blackout"

        # Cleanup: remove blackout
        api_client.headers.update({"Authorization": f"Bearer {staff_token}"})
        api_client.put(f"{API}/schedule/config", json={
            "working_days": [0, 1, 2, 3, 4],
            "start_time": "09:00",
            "end_time": "17:00",
            "slot_duration_min": 45,
            "buffer_min": 0,
            "blackout_dates": [],
            "lead_time_hours": 12,
            "advance_days": 60,
            "timezone": "America/New_York",
        })


# ============================================================
# Consultation slot conflict 409
# ============================================================
class TestSlotConflict:
    def test_double_booking_returns_409(self, api_client):
        date = _next_weekday_iso(days_ahead=5)
        # Fetch a valid slot from availability
        r = api_client.get(f"{API}/schedule/availability", params={"date": date})
        assert r.status_code == 200
        slots = r.json().get("available", [])
        assert slots, "no available slots to test conflict"
        slot = slots[0]

        payload = {
            "first_name": "TESTconflictA",
            "last_name": "TESTconflictA",
            "email": f"test.conflict.a.{uuid.uuid4().hex[:6]}@gmail.com",
            "phone": "305-555-1000",
            "service_interest": "Injectables — Botox",
            "preferred_date": date,
            "preferred_time": slot,
            "message": "first booking",
        }
        r1 = api_client.post(f"{API}/consultations", json=payload, timeout=60)
        assert r1.status_code == 200, r1.text

        # Second booking, same date+time -> 409
        payload2 = dict(payload)
        payload2["first_name"] = "TESTconflictB"
        payload2["email"] = f"test.conflict.b.{uuid.uuid4().hex[:6]}@gmail.com"
        r2 = api_client.post(f"{API}/consultations", json=payload2, timeout=60)
        assert r2.status_code == 409, r2.text
        detail = r2.json().get("detail", "")
        assert "available" in detail.lower() or "slot" in detail.lower()


# ============================================================
# GET/PUT /api/content
# ============================================================
class TestContent:
    def test_get_content_default_or_dict(self, api_client):
        r = api_client.get(f"{API}/content")
        assert r.status_code == 200
        assert isinstance(r.json(), dict)

    def test_put_requires_staff(self, api_client, client_creds):
        token, _ = client_creds
        api_client.headers.update({"Authorization": f"Bearer {token}"})
        r = api_client.put(f"{API}/content", json={"data": {"banner": {"text": "X"}}})
        assert r.status_code == 403

    def test_put_no_auth_returns_401(self, api_client):
        r = api_client.put(f"{API}/content", json={"data": {"banner": {"text": "X"}}})
        assert r.status_code == 401

    def test_put_persists_overrides(self, api_client, staff_token):
        api_client.headers.update({"Authorization": f"Bearer {staff_token}"})
        override = {"banner": {"text": "TEST OVERRIDE"}}
        r = api_client.put(f"{API}/content", json={"data": override})
        assert r.status_code == 200, r.text
        # Verify GET
        api_client.headers.pop("Authorization", None)
        r2 = api_client.get(f"{API}/content")
        assert r2.status_code == 200
        got = r2.json()
        assert got.get("banner") == {"text": "TEST OVERRIDE"}

    def test_reset_content(self, api_client, staff_token):
        api_client.headers.update({"Authorization": f"Bearer {staff_token}"})
        # Overwrite with empty data - the doc will remain, but banner will not be present
        # Note: PUT $set doesn't remove other fields, so we send empty data - banner remains.
        # To truly reset, we'd need a delete. We simulate reset by setting banner=null.
        r = api_client.put(f"{API}/content", json={"data": {"banner": None}})
        assert r.status_code == 200
