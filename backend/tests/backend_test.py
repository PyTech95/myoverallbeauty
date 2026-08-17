"""Backend tests for Overall Beauty & Wellness API.

Covers:
  * GET /api/  health
  * POST /api/consultations (valid + validation + persistence)
  * GET /api/consultations (list, newest-first)
  * POST /api/contact
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://spa-wellness-pro-2.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


# ---- Health --------------------------------------------------------------
class TestHealth:
    def test_root_status_ok(self, api_client):
        r = api_client.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok"
        assert "service" in data


# ---- Consultations -------------------------------------------------------
class TestConsultations:
    def _payload(self, suffix=None):
        suffix = suffix or uuid.uuid4().hex[:8]
        # Use a unique preferred_time per-payload to avoid the 409 slot conflict
        # added in iteration 3 (POST /api/consultations now blocks double-booking).
        return {
            "first_name": "TESTFirst",
            "last_name": "TESTLast",
            "email": f"TEST_{suffix}@gmail.com",
            "phone": "305-555-0134",
            "service_interest": "Injectables — Botox",
            "preferred_date": "2026-02-14",
            "preferred_time": f"TEST-SLOT-{suffix}",
            "message": "Excited to book a consultation.",
        }

    def test_create_consultation_valid(self, api_client):
        payload = self._payload()
        r = api_client.post(f"{API}/consultations", json=payload, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        # required response fields
        assert data["first_name"] == payload["first_name"]
        assert data["last_name"] == payload["last_name"]
        assert data["email"] == payload["email"]
        assert data["phone"] == payload["phone"]
        assert data["service_interest"] == payload["service_interest"]
        assert data["preferred_date"] == payload["preferred_date"]
        assert data["preferred_time"] == payload["preferred_time"]
        assert data["status"] == "new"
        assert isinstance(data.get("id"), str) and len(data["id"]) > 0
        assert isinstance(data.get("created_at"), str) and len(data["created_at"]) > 0

    def test_missing_email_returns_422(self, api_client):
        payload = self._payload()
        payload.pop("email")
        r = api_client.post(f"{API}/consultations", json=payload, timeout=30)
        assert r.status_code == 422

    def test_invalid_email_returns_422(self, api_client):
        payload = self._payload()
        payload["email"] = "not-an-email"
        r = api_client.post(f"{API}/consultations", json=payload, timeout=30)
        assert r.status_code == 422

    def test_missing_first_name_returns_422(self, api_client):
        payload = self._payload()
        payload["first_name"] = ""
        r = api_client.post(f"{API}/consultations", json=payload, timeout=30)
        assert r.status_code == 422

    def test_persistence_and_newest_first(self, api_client):
        # create a unique record
        marker = uuid.uuid4().hex[:8]
        payload = self._payload(suffix=marker)
        create = api_client.post(f"{API}/consultations", json=payload, timeout=60)
        assert create.status_code == 200, create.text
        created = create.json()

        # list (now staff-only — login as seeded staff)
        login = api_client.post(
            f"{API}/auth/login",
            json={"email": "crystal@overallbeauty.com", "password": "Overall2025!"},
            timeout=30,
        )
        assert login.status_code == 200, f"staff login failed: {login.text}"
        token = login.json()["token"]
        listing = api_client.get(
            f"{API}/consultations",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30,
        )
        assert listing.status_code == 200
        rows = listing.json()
        assert isinstance(rows, list)
        assert len(rows) >= 1

        # our record is present
        ids = [r.get("id") for r in rows]
        assert created["id"] in ids, "Newly created consultation not found in list"

        # newest first
        created_ats = [r.get("created_at") for r in rows if r.get("created_at")]
        assert created_ats == sorted(created_ats, reverse=True), "List is not sorted newest first"

        # no mongo _id leaked
        assert all("_id" not in r for r in rows)


# ---- Contact -------------------------------------------------------------
class TestContact:
    def test_contact_valid(self, api_client):
        payload = {
            "name": "TEST Contact",
            "email": f"TEST_contact_{uuid.uuid4().hex[:6]}@gmail.com",
            "phone": "305-555-9911",
            "message": "Hello, I would love more info.",
        }
        r = api_client.post(f"{API}/contact", json=payload, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("status") == "ok"
        assert isinstance(data.get("id"), str)

    def test_contact_missing_fields_422(self, api_client):
        r = api_client.post(f"{API}/contact", json={"name": "x"}, timeout=30)
        assert r.status_code == 422

    def test_contact_invalid_email_422(self, api_client):
        payload = {
            "name": "TEST Bad",
            "email": "not-email",
            "message": "hi",
        }
        r = api_client.post(f"{API}/contact", json=payload, timeout=30)
        assert r.status_code == 422
