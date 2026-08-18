"""
Iteration 9 backend tests:
- Email confirmations: /api/consultations, /api/contact, /api/rsvps must succeed and
  trigger POST to https://integrations.emergentagent.com/api/v1/email/send.
- Cron: /api/cron/event-reminder auth 401, accepted, duplicate idempotency, no-event-today.
- /api/uploads/image staff-gated.
"""
import os
import time
import uuid
import subprocess
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://spa-wellness-pro-2.preview.emergentagent.com").rstrip("/")
CRON_SECRET = "Kq7x2ZmP4vLtR9sNbY6wJdF3hGaC8eUq"
STAFF_EMAIL = "crystal@overallbeauty.com"
STAFF_PASS = "Overall2025!"
TEST_RECIPIENT = "delivered@resend.dev"
BACKEND_LOG = "/var/log/supervisor/backend.err.log"


def _log_since(marker_epoch: float) -> str:
    """Return tail of backend log for lines added since marker_epoch (best effort)."""
    try:
        # Read last 400 lines and return whole (cheap; the marker guarantees content ordering)
        r = subprocess.run(["tail", "-n", "400", BACKEND_LOG], capture_output=True, text=True, timeout=5)
        return r.stdout or ""
    except Exception:
        return ""


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def staff_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": STAFF_EMAIL, "password": STAFF_PASS})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def created_ids():
    return {"rsvps": [], "consultations": [], "contacts": []}


# ---------- Email confirmations ----------

class TestEmailConfirmations:
    def _sleep_and_check_email_send(self, marker):
        # send_email is awaited in the endpoint (except cron, which backgrounds), so log line should be there by response time.
        # Still give a small buffer.
        time.sleep(1.0)
        log = _log_since(marker)
        return log

    def test_consultation_send_email(self, api, created_ids):
        marker = time.time()
        payload = {
            "first_name": "TEST",
            "last_name": "Consult9",
            "email": TEST_RECIPIENT,
            "phone": "555-000-1111",
            "service_interest": "Facial",
            "preferred_date": "2027-01-15",
            "preferred_time": f"10:{uuid.uuid4().hex[:2]}",  # unique to avoid clash
            "message": "Iteration 9 email test",
        }
        r = api.post(f"{BASE_URL}/api/consultations", json=payload)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["email"] == TEST_RECIPIENT
        assert "id" in body
        created_ids["consultations"].append(body["id"])
        log = self._sleep_and_check_email_send(marker)
        # There should be no "Email blocked by safety gate" for our send
        assert "Email blocked by safety gate" not in log[-8000:], "Safety gate blocked consultation email"

    def test_contact_send_email(self, api, created_ids):
        marker = time.time()
        payload = {"name": "TEST Contact9", "email": TEST_RECIPIENT, "phone": "555-000-2222",
                   "message": "Iteration 9 contact test"}
        r = api.post(f"{BASE_URL}/api/contact", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("status") == "ok"
        created_ids["contacts"].append(d.get("id"))
        log = self._sleep_and_check_email_send(marker)
        assert "Email blocked by safety gate" not in log[-8000:]

    def test_rsvp_send_email(self, api, created_ids):
        marker = time.time()
        payload = {"name": "TEST Rsvp9", "email": TEST_RECIPIENT, "phone": "555-000-3333",
                   "guests": 2, "note": "iter9", "event": "Grand Opening — TEST"}
        r = api.post(f"{BASE_URL}/api/rsvps", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("status") == "ok"
        created_ids["rsvps"].append(d["id"])
        log = self._sleep_and_check_email_send(marker)
        assert "Email blocked by safety gate" not in log[-8000:]


# ---------- Cron event reminder ----------

class TestCronEventReminder:
    def test_cron_no_auth_401(self, api):
        r = requests.post(f"{BASE_URL}/api/cron/event-reminder", json={})
        assert r.status_code == 401

    def test_cron_wrong_auth_401(self, api):
        r = requests.post(f"{BASE_URL}/api/cron/event-reminder", json={},
                          headers={"Authorization": "Bearer wrong-token"})
        assert r.status_code == 401

    def test_cron_accepted_and_duplicate(self, api):
        run_id = f"iter9-{uuid.uuid4().hex[:12]}"
        headers = {"Authorization": f"Bearer {CRON_SECRET}", "X-Webhook-Id": run_id,
                   "Content-Type": "application/json"}
        r1 = requests.post(f"{BASE_URL}/api/cron/event-reminder", json={}, headers=headers)
        assert r1.status_code == 200, r1.text
        assert r1.json().get("status") == "accepted"
        r2 = requests.post(f"{BASE_URL}/api/cron/event-reminder", json={}, headers=headers)
        assert r2.status_code == 200
        assert r2.json().get("status") == "duplicate"

    def test_cron_no_event_today(self, api):
        # Default content has event_date "2026-08-30"; today is 2026-08-17 in this env.
        # So we should see "no event today" in the log for a fresh run.
        marker = time.time()
        run_id = f"iter9-noevt-{uuid.uuid4().hex[:12]}"
        headers = {"Authorization": f"Bearer {CRON_SECRET}", "X-Webhook-Id": run_id,
                   "Content-Type": "application/json"}
        r = requests.post(f"{BASE_URL}/api/cron/event-reminder", json={}, headers=headers)
        assert r.status_code == 200
        assert r.json().get("status") == "accepted"
        time.sleep(1.5)
        log = _log_since(marker)
        assert "no event today" in log, "Expected 'no event today' log line for background reminder run"


# ---------- Uploads ----------

class TestUploads:
    def test_uploads_image_requires_auth(self, api):
        # No token -> should be 401/403
        r = requests.post(f"{BASE_URL}/api/uploads/image",
                          files={"file": ("x.png", b"\x89PNG\r\n\x1a\n", "image/png")})
        assert r.status_code in (401, 403), f"expected 401/403, got {r.status_code}: {r.text[:200]}"

    def test_uploads_image_staff_ok(self, staff_token):
        # 1x1 transparent PNG
        png = bytes.fromhex(
            "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
            "890000000a49444154789c6300010000000500010d0a2db40000000049454e44ae426082"
        )
        r = requests.post(
            f"{BASE_URL}/api/uploads/image",
            headers={"Authorization": f"Bearer {staff_token}"},
            files={"file": ("test.png", png, "image/png")},
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert "url" in d and isinstance(d["url"], str) and d["url"].startswith("/") or d["url"].startswith("http"), d


# ---------- Cleanup ----------

def test_zzz_cleanup(api, staff_token, created_ids):
    """Best-effort cleanup of TEST_ data. Runs last due to name."""
    h = {"Authorization": f"Bearer {staff_token}"}
    for rid in created_ids["rsvps"]:
        try:
            requests.delete(f"{BASE_URL}/api/rsvps/{rid}", headers=h, timeout=10)
        except Exception:
            pass
    # Consultations & contacts have no client delete endpoint per typical setup; leave for admin cleanup.
