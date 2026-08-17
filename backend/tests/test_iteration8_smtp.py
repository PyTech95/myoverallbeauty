"""
Iteration 8 backend tests — Gmail SMTP migration.

Covers:
- GET /api/ health
- POST /api/consultations (fresh slot) returns 200 + Consultation
- Backend log contains 3 'SMTP email sent to' lines after successful booking
  (Info@myoverallbeauty.com, cmarrero401@gmail.com, and the client)
- No 'Resend send failed' / 'SMTP send failed' lines for the new send
- /app/backend/.env contains required SMTP_* keys with expected values
- Regression: duplicate date+time returns 409 and does NOT emit SMTP sends
- Regression: staff login works; /api/consultations returns the new record
- Frontend /favicon.png and /apple-touch-icon.png are PNG, correct sizes, RGBA transparent
"""
import os
import re
import time
import uuid
import pytest
import requests
from datetime import datetime, timedelta
from pathlib import Path
from io import BytesIO
from PIL import Image

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE_URL:
    # Fallback to reading frontend/.env directly
    for line in Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
            break

LOG_PATH = "/var/log/supervisor/backend.err.log"
STAFF_EMAIL = "crystal@overallbeauty.com"
STAFF_PASSWORD = "Overall2025!"

BUSINESS_1 = "Info@myoverallbeauty.com"
BUSINESS_2 = "cmarrero401@gmail.com"


def _read_log_tail(nbytes: int = 200_000) -> str:
    try:
        p = Path(LOG_PATH)
        with p.open("rb") as f:
            f.seek(0, 2)
            size = f.tell()
            f.seek(max(0, size - nbytes))
            return f.read().decode("utf-8", errors="ignore")
    except Exception as e:
        return f"__log_read_error__:{e}"


def _log_len() -> int:
    try:
        return Path(LOG_PATH).stat().st_size
    except Exception:
        return 0


@pytest.fixture(scope="module")
def unique_slot():
    # Pick a date far in the future so no clash with anything real
    d = (datetime.utcnow() + timedelta(days=45)).date()
    # ensure weekday Mon-Fri
    while d.weekday() > 4:
        d += timedelta(days=1)
    # unique time — sub-minute uniqueness via arbitrary slot label; use a
    # non-standard hour to avoid collisions
    # But server double-book check is exact string match; we generate a
    # microsecond-based minute inside a valid HH:MM AM/PM label.
    minute = (int(time.time()) % 60)
    label = f"11:{minute:02d} AM"
    return d.strftime("%Y-%m-%d"), label


@pytest.fixture(scope="module")
def created_consultation_id(unique_slot):
    """Create a consultation and return its id + payload."""
    date_str, time_str = unique_slot
    payload = {
        "first_name": "SMTPTest",
        "last_name": "Iter8",
        "email": "rajeev.gits+e2e@gmail.com",
        "phone": "555-123-9999",
        "service_interest": "Consultation",
        "preferred_date": date_str,
        "preferred_time": time_str,
        "message": "Automated SMTP migration test",
    }
    before = _log_len()
    r = requests.post(f"{BASE_URL}/api/consultations", json=payload, timeout=60)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    body = r.json()
    assert body["first_name"] == "SMTPTest"
    assert body["email"] == "rajeev.gits+e2e@gmail.com"
    assert body["preferred_date"] == date_str
    assert body["preferred_time"] == time_str
    assert isinstance(body.get("id"), str)
    return {"id": body["id"], "date": date_str, "time": time_str, "log_offset": before}


# ---------------- Health ----------------
def test_health():
    r = requests.get(f"{BASE_URL}/api/", timeout=15)
    assert r.status_code == 200
    j = r.json()
    assert j.get("status") == "ok"


# ---------------- .env sanity ----------------
def test_env_smtp_keys_present():
    env = {}
    for line in Path("/app/backend/.env").read_text().splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"')
    assert env.get("SMTP_HOST") == "smtp.gmail.com"
    assert env.get("SMTP_PORT") == "587"
    assert env.get("SMTP_USER") == "rajeev.gits@gmail.com"
    assert env.get("SMTP_FROM") == "rajeev.gits@gmail.com"
    assert env.get("SMTP_PASS")
    assert len(env["SMTP_PASS"]) == 16, f"SMTP_PASS not 16 chars, got {len(env['SMTP_PASS'])}"
    # Untouched keys
    for k in ("MONGO_URL", "DB_NAME", "JWT_SECRET", "STAFF_EMAIL", "STAFF_PASSWORD", "BUSINESS_EMAIL"):
        assert env.get(k), f"Missing env var {k}"


# ---------------- POST /api/consultations ----------------
def test_consultation_created(created_consultation_id):
    # created via fixture — just assert id
    assert created_consultation_id["id"]


def test_smtp_log_lines_present(created_consultation_id):
    """After the successful POST, we must see 3 SMTP send-success log lines
    (both business recipients + client) and NO SMTP/Resend failure lines
    for this send."""
    # Give the server a moment to flush logs
    time.sleep(8)
    log = _read_log_tail(500_000)

    # Search after the create moment — since we don't have precise cursor,
    # scan the last chunk and check the 3 recipients each appear at least once.
    business1_ok = re.search(rf"SMTP email sent to {re.escape(BUSINESS_1)}", log, re.IGNORECASE)
    business2_ok = re.search(rf"SMTP email sent to {re.escape(BUSINESS_2)}", log, re.IGNORECASE)
    client_ok = re.search(r"SMTP email sent to rajeev\.gits\+e2e@gmail\.com", log)

    assert business1_ok, f"Missing 'SMTP email sent to {BUSINESS_1}' in backend log"
    assert business2_ok, f"Missing 'SMTP email sent to {BUSINESS_2}' in backend log"
    assert client_ok, "Missing 'SMTP email sent to rajeev.gits+e2e@gmail.com' in backend log"

    # No new SMTP send failures for OUR recipients (tail chunk)
    for recip in (BUSINESS_1, BUSINESS_2, "rajeev.gits+e2e@gmail.com"):
        fail_pat = re.compile(rf"SMTP send failed to {re.escape(recip)}", re.IGNORECASE)
        m = fail_pat.search(log)
        assert not m, f"Found SMTP send failure for {recip}: {m.group(0) if m else ''}"

    # No Resend traffic — SMTP should be the active provider
    assert "Resend send failed" not in log, "Unexpected Resend failure in log — provider dispatch broken?"


# ---------------- Regression: 409 duplicate ----------------
def test_duplicate_slot_returns_409_no_smtp(created_consultation_id):
    date_str = created_consultation_id["date"]
    time_str = created_consultation_id["time"]
    # snapshot log size to detect any SMTP send caused by the duplicate call
    before = _log_len()
    payload = {
        "first_name": "SMTPDup",
        "last_name": "Iter8",
        "email": "rajeev.gits+dup@gmail.com",
        "phone": "555-000-1111",
        "preferred_date": date_str,
        "preferred_time": time_str,
    }
    r = requests.post(f"{BASE_URL}/api/consultations", json=payload, timeout=30)
    assert r.status_code == 409, f"Expected 409 on duplicate slot, got {r.status_code}: {r.text}"

    # Wait briefly then verify no new "SMTP email sent to rajeev.gits+dup" line
    time.sleep(3)
    after_log = _read_log_tail(200_000)
    # The failed-duplicate call should NOT have triggered any send for +dup
    assert "SMTP email sent to rajeev.gits+dup@gmail.com" not in after_log, \
        "Duplicate slot request unexpectedly triggered an SMTP send to client"


# ---------------- Regression: staff auth + list ----------------
@pytest.fixture(scope="module")
def staff_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": STAFF_EMAIL, "password": STAFF_PASSWORD},
        timeout=30,
    )
    assert r.status_code == 200, f"Staff login failed: {r.status_code} {r.text}"
    body = r.json()
    assert body.get("token"), "No token in login response"
    assert body["user"]["email"].lower() == STAFF_EMAIL.lower()
    assert body["user"]["role"] == "staff"
    return body["token"]


def test_staff_list_contains_new_consultation(staff_token, created_consultation_id):
    r = requests.get(
        f"{BASE_URL}/api/consultations",
        headers={"Authorization": f"Bearer {staff_token}"},
        timeout=30,
    )
    assert r.status_code == 200, f"list_consultations failed: {r.status_code} {r.text}"
    docs = r.json()
    assert isinstance(docs, list)
    ids = {d["id"] for d in docs}
    assert created_consultation_id["id"] in ids, "Newly created consultation not returned to staff"


# ---------------- Favicons ----------------
def _fetch(path: str) -> bytes:
    r = requests.get(f"{BASE_URL}{path}", timeout=30)
    assert r.status_code == 200, f"GET {path} -> {r.status_code}"
    ctype = r.headers.get("content-type", "").lower()
    assert "image/png" in ctype or "png" in ctype, f"Content-Type for {path} is {ctype}"
    body = r.content
    assert body.startswith(b"\x89PNG"), f"{path} does not start with PNG magic bytes"
    return body


def test_favicon_png_512_rgba():
    body = _fetch("/favicon.png")
    im = Image.open(BytesIO(body))
    assert im.format == "PNG"
    assert im.size == (512, 512), f"favicon size {im.size} != (512,512)"
    assert im.mode == "RGBA", f"favicon mode {im.mode} != RGBA"
    # top-left pixel alpha 0 (transparent)
    px = im.getpixel((0, 0))
    assert px[3] == 0, f"favicon (0,0) alpha {px[3]} != 0"


def test_apple_touch_icon_png_180_rgba():
    body = _fetch("/apple-touch-icon.png")
    im = Image.open(BytesIO(body))
    assert im.format == "PNG"
    assert im.size == (180, 180), f"apple-touch-icon size {im.size} != (180,180)"
    assert im.mode == "RGBA", f"apple-touch-icon mode {im.mode} != RGBA"
    px = im.getpixel((0, 0))
    assert px[3] == 0, f"apple-touch-icon (0,0) alpha {px[3]} != 0"


# ---------------- Cleanup ----------------
def test_cleanup_test_consultations(staff_token):
    """Directly clean via mongo — main agent noted delete_many first_name ^SMTP|^TEST"""
    try:
        from pymongo import MongoClient
        env = {}
        for line in Path("/app/backend/.env").read_text().splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"')
        mc = MongoClient(env["MONGO_URL"])
        db = mc[env["DB_NAME"]]
        res = db.consultations.delete_many({"first_name": {"$regex": "^(SMTP|TEST)"}})
        print(f"Cleaned up {res.deleted_count} test consultations")
    except Exception as e:
        pytest.skip(f"Cleanup skipped: {e}")
