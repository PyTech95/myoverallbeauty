"""Iteration 5 backend tests — 'Add to calendar' feature in client confirmation email.

Covers:
  1. Unit tests on _calendar_bundle / _client_confirmation_html (direct import)
  2. POST /api/consultations regression (200 + Consultation shape unchanged)
  3. Slot-conflict 409 (same date+time twice)
  4. Dual business-notification email regression via backend log tail
     (2 business + 1 client = 3 POSTs to integrations.emergentagent.com)
  5. Cleanup of TEST_ consultations at the end
"""
import base64
import os
import re
import subprocess
import sys
import time
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import requests

# ------------------------------------------------------------------
# import server module for direct unit testing of helpers
# ------------------------------------------------------------------
sys.path.insert(0, "/app/backend")
from server import (  # noqa: E402
    _calendar_bundle,
    _client_confirmation_html,
    _parse_slot_to_local,
    Consultation,
)

def _resolve_base_url() -> str:
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if not v:
        # Fallback: parse from /app/frontend/.env
        try:
            with open("/app/frontend/.env", "r") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("REACT_APP_BACKEND_URL="):
                        v = line.split("=", 1)[1].strip().strip('"').strip("'")
                        break
        except Exception:
            v = None
    assert v, "REACT_APP_BACKEND_URL missing from env and frontend/.env"
    return v.rstrip("/")


BASE_URL = _resolve_base_url()
API = f"{BASE_URL}/api"

STAFF_EMAIL = "crystal@overallbeauty.com"
STAFF_PASSWORD = "Overall2025!"


# ------------------------------------------------------------------
# helpers
# ------------------------------------------------------------------
def _next_weekday_iso(days_ahead: int = 6) -> str:
    d = datetime.now(timezone.utc).date() + timedelta(days=days_ahead)
    while d.weekday() >= 5:
        d += timedelta(days=1)
    return d.isoformat()


def _login_staff(session: requests.Session) -> str:
    r = session.post(
        f"{API}/auth/login",
        json={"email": STAFF_EMAIL, "password": STAFF_PASSWORD},
        timeout=30,
    )
    assert r.status_code == 200, f"staff login failed: {r.status_code} {r.text}"
    return r.json()["token"]


def _make_consultation(date_str="2026-02-05", time_str="10:00 AM", **overrides) -> Consultation:
    payload = {
        "first_name": "TESTiter5",
        "last_name": "TESTclient",
        "email": "test.iter5@gmail.com",
        "phone": "305-555-0100",
        "service_interest": "Injectables — Botox",
        "preferred_date": date_str,
        "preferred_time": time_str,
        "message": "hello",
    }
    payload.update(overrides)
    return Consultation(**payload)


# ==================================================================
# 1. Unit tests on _calendar_bundle
# ==================================================================
class TestCalendarBundleHelpers:
    """Direct helper-level assertions (no HTTP)."""

    def test_bundle_present_and_keys(self):
        c = _make_consultation("2026-02-05", "10:00 AM")
        bundle = _calendar_bundle(c)
        assert bundle is not None
        assert set(bundle.keys()) == {"google", "outlook", "ics"}

    def test_google_link_shape(self):
        c = _make_consultation("2026-02-05", "10:00 AM")
        bundle = _calendar_bundle(c)
        g = bundle["google"]
        assert "calendar.google.com/calendar/render" in g
        # dates=YYYYMMDDTHHMMSS/YYYYMMDDTHHMMSS with no 'Z'
        m = re.search(r"dates=(\d{8}T\d{6})%2F(\d{8}T\d{6})", g)
        assert m, f"dates param missing/wrong shape in: {g}"
        start_str, end_str = m.group(1), m.group(2)
        start = datetime.strptime(start_str, "%Y%m%dT%H%M%S")
        end = datetime.strptime(end_str, "%Y%m%dT%H%M%S")
        assert (end - start) == timedelta(minutes=45)
        assert start == datetime(2026, 2, 5, 10, 0, 0)
        # No trailing Z (floating local)
        assert "T100000Z" not in g and "T104500Z" not in g

    def test_outlook_link_shape(self):
        c = _make_consultation("2026-02-05", "10:00 AM")
        bundle = _calendar_bundle(c)
        o = bundle["outlook"]
        assert "outlook.live.com/calendar/0/deeplink/compose" in o
        assert "startdt=2026-02-05T10%3A00%3A00" in o
        assert "enddt=2026-02-05T10%3A45%3A00" in o

    def test_ics_data_url_and_vcalendar_contents(self):
        c = _make_consultation("2026-02-05", "10:00 AM")
        bundle = _calendar_bundle(c)
        ics_url = bundle["ics"]
        assert ics_url.startswith("data:text/calendar;base64,")
        b64 = ics_url.split(",", 1)[1]
        raw = base64.b64decode(b64).decode("utf-8")
        raw = raw.replace("\r\n", "\n")  # normalise CRLF for regex convenience

        assert "BEGIN:VCALENDAR" in raw
        assert "END:VCALENDAR" in raw
        assert "BEGIN:VEVENT" in raw
        assert "END:VEVENT" in raw
        # Floating local time (no Z, no TZID=) on DTSTART/DTEND
        m_start = re.search(r"^DTSTART:(\S+)$", raw, re.M)
        m_end = re.search(r"^DTEND:(\S+)$", raw, re.M)
        assert m_start and m_end, f"DTSTART/DTEND missing in ics:\n{raw}"
        dtstart_val = m_start.group(1)
        dtend_val = m_end.group(1)
        assert dtstart_val == "20260205T100000", dtstart_val
        assert dtend_val == "20260205T104500", dtend_val
        assert "Z" not in dtstart_val and "Z" not in dtend_val
        # SUMMARY/LOCATION
        assert "SUMMARY:Complimentary Consultation — Overall Beauty & Wellness" in raw
        assert re.search(r"^LOCATION:.*Farmingdale.*$", raw, re.M), raw

    def test_bundle_none_when_no_date_or_time(self):
        c1 = _make_consultation(preferred_date=None, preferred_time="10:00 AM")
        c2 = _make_consultation(preferred_date="2026-02-05", preferred_time=None)
        c3 = _make_consultation(preferred_date=None, preferred_time=None)
        assert _calendar_bundle(c1) is None
        assert _calendar_bundle(c2) is None
        assert _calendar_bundle(c3) is None

    def test_parse_slot_supports_both_formats(self):
        d1 = _parse_slot_to_local("2026-02-05", "10:00 AM")
        d2 = _parse_slot_to_local("2026-02-05", "13:30")
        assert d1 == datetime(2026, 2, 5, 10, 0, 0)
        assert d2 == datetime(2026, 2, 5, 13, 30, 0)
        assert _parse_slot_to_local("", "10:00 AM") is None
        assert _parse_slot_to_local("2026-02-05", "") is None
        assert _parse_slot_to_local("2026-02-05", "nonsense") is None


# ==================================================================
# 2. _client_confirmation_html injection tests
# ==================================================================
class TestClientConfirmationHtml:
    def test_html_contains_calendar_block_and_three_hrefs(self):
        c = _make_consultation("2026-02-05", "10:00 AM")
        html = _client_confirmation_html(c)
        assert "Add to calendar" in html
        # Google
        assert "calendar.google.com/calendar/render" in html
        # Apple/Outlook via .ics data URL
        assert "data:text/calendar;base64," in html
        # Outlook Web
        assert "outlook.live.com/calendar/0/deeplink/compose" in html
        # There are three <a href=...> anchors in the calendar block
        anchors = re.findall(r"<a\s+href=\"([^\"]+)\"", html)
        # At least our 3 calendar links present
        joined = " ".join(anchors)
        assert "calendar.google.com" in joined
        assert "outlook.live.com" in joined
        assert any(a.startswith("data:text/calendar;base64,") for a in anchors)

    def test_html_omits_calendar_block_when_date_missing(self):
        c = _make_consultation(preferred_date=None, preferred_time="10:00 AM")
        html = _client_confirmation_html(c)
        assert "Add to calendar" not in html
        assert "calendar.google.com" not in html
        assert "data:text/calendar" not in html
        assert 'href=""' not in html  # no empty anchors
        # Still greets the client
        assert "Thank you, TESTiter5" in html

    def test_html_omits_calendar_block_when_time_missing(self):
        c = _make_consultation(preferred_date="2026-02-05", preferred_time=None)
        html = _client_confirmation_html(c)
        assert "Add to calendar" not in html
        assert "calendar.google.com" not in html
        assert "data:text/calendar" not in html
        assert 'href=""' not in html


# ==================================================================
# 3. Integration: POST /api/consultations returns 200 + shape unchanged
#    + backend log tail shows 3 emails posted
# ==================================================================
BACKEND_LOG = "/var/log/supervisor/backend.out.log"
BACKEND_ERR = "/var/log/supervisor/backend.err.log"


def _tail_backend_logs(lines: int = 400) -> str:
    out = ""
    for p in (BACKEND_LOG, BACKEND_ERR):
        try:
            out += subprocess.check_output(["tail", "-n", str(lines), p], text=True)
        except Exception:  # noqa: BLE001
            pass
    return out


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def staff_token(api):
    return _login_staff(api)


@pytest.fixture(scope="module")
def unique_slot(api):
    """Pick a real available slot from the schedule and return (date, time)."""
    date = _next_weekday_iso(days_ahead=6)
    r = api.get(f"{API}/schedule/availability", params={"date": date})
    assert r.status_code == 200, r.text
    slots = r.json().get("available", [])
    assert slots, f"no slots for {date}: {r.json()}"
    # Pick the last slot to reduce collision odds with other tests
    return date, slots[-1]


class TestConsultationPostRegression:
    def test_post_returns_200_and_shape(self, api, unique_slot):
        date, slot = unique_slot
        # Bookkeeping marker in log
        marker = uuid.uuid4().hex[:8]
        payload = {
            "first_name": f"TESTiter5A{marker}",
            "last_name": "TESTclient",
            "email": f"test.iter5.a.{marker}@gmail.com",
            "phone": "305-555-0111",
            "service_interest": "Injectables — Botox",
            "preferred_date": date,
            "preferred_time": slot,
            "message": "iteration 5 regression",
        }
        # Snapshot log position, then POST
        before = len(_tail_backend_logs(2000))
        r = api.post(f"{API}/consultations", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        body = r.json()

        # Shape unchanged
        expected_keys = {
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "service_interest",
            "preferred_date",
            "preferred_time",
            "message",
            "status",
            "created_at",
            "user_id",
        }
        assert expected_keys.issubset(body.keys()), body.keys()
        assert body["first_name"] == payload["first_name"]
        assert body["email"] == payload["email"]
        assert body["status"] == "new"
        assert body["preferred_date"] == date
        assert body["preferred_time"] == slot
        assert body["user_id"] is None  # anonymous submit

        # Give the email futures a moment to run
        time.sleep(4)

        logs = _tail_backend_logs(2000)
        # Count POSTs to integrations.emergentagent.com since 'before' offset (approximate)
        recent = logs[before:] if before < len(logs) else logs[-4000:]
        # server.py uses httpx; look for the send_email trace / URL string
        email_url_hits = recent.count("integrations.emergentagent.com")
        # 2 business + 1 client = 3
        assert email_url_hits >= 3, (
            f"expected >=3 email attempts, got {email_url_hits}\n---LOG---\n{recent[-3000:]}"
        )

    def test_slot_conflict_409(self, api, unique_slot):
        """Book the SAME date+time twice; 2nd attempt must 409."""
        date, slot = unique_slot
        # First booking (may be already booked by the prior test — try a different slot)
        r_avail = api.get(f"{API}/schedule/availability", params={"date": date})
        slots = r_avail.json().get("available", [])
        assert slots, "no slots available for 409 test"
        # Pick first slot for a fresh double-book
        target = slots[0]
        marker = uuid.uuid4().hex[:6]
        payload = {
            "first_name": f"TESTiter5B{marker}",
            "last_name": "TESTclient",
            "email": f"test.iter5.b.{marker}@gmail.com",
            "phone": "305-555-0112",
            "service_interest": "Skincare",
            "preferred_date": date,
            "preferred_time": target,
            "message": "409 test first",
        }
        r1 = api.post(f"{API}/consultations", json=payload, timeout=90)
        assert r1.status_code == 200, r1.text

        payload2 = dict(payload)
        payload2["first_name"] = f"TESTiter5C{marker}"
        payload2["email"] = f"test.iter5.c.{marker}@gmail.com"
        payload2["message"] = "409 test dup"
        r2 = api.post(f"{API}/consultations", json=payload2, timeout=90)
        assert r2.status_code == 409, r2.text
        detail = r2.json().get("detail", "").lower()
        assert "available" in detail or "slot" in detail

    def test_html_pipeline_uses_calendar_block(self, api, staff_token):
        """After creating a booking with date+time, the staff-visible consultation
        model still has preferred_date/time, so _client_confirmation_html on it
        would render the calendar block. This is an end-to-end sanity check.
        """
        # List staff consultations
        api.headers.update({"Authorization": f"Bearer {staff_token}"})
        r = api.get(f"{API}/consultations", timeout=30)
        api.headers.pop("Authorization", None)
        assert r.status_code == 200, r.text
        rows = r.json()
        assert isinstance(rows, list)
        # Find one of ours from this run
        ours = [x for x in rows if x.get("first_name", "").startswith("TESTiter5")]
        assert ours, "no TESTiter5 consultations found"
        sample = ours[0]
        assert sample.get("preferred_date") and sample.get("preferred_time")
        # Re-hydrate and render
        c = Consultation(**{k: v for k, v in sample.items() if k != "_id"})
        html = _client_confirmation_html(c)
        assert "Add to calendar" in html
        assert "calendar.google.com/calendar/render" in html
        assert "outlook.live.com/calendar/0/deeplink/compose" in html
        assert "data:text/calendar;base64," in html


# ==================================================================
# 4. Cleanup TEST_ / TESTiter5 consultations at the end (module-scope)
# ==================================================================
@pytest.fixture(scope="module", autouse=True)
def _cleanup_test_consultations():
    yield
    # Best-effort DB cleanup via mongo (server runs on same host / same MONGO_URL)
    try:
        import pymongo

        client = pymongo.MongoClient(os.environ.get("MONGO_URL"))
        dbname = os.environ.get("DB_NAME")
        if dbname:
            res = client[dbname].consultations.delete_many(
                {"first_name": {"$regex": "^TEST"}}
            )
            print(f"[cleanup] removed {res.deleted_count} TEST consultations")
    except Exception as e:  # noqa: BLE001
        print(f"[cleanup] skipped: {e}")
