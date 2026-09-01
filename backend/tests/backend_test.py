"""Backend tests for GEIFEM Consulting website.

Covers:
- Contact form (POST/GET /api/contact) with validation
- Newsletter subscription (POST/GET /api/newsletter) with idempotency
- Economic indicators (GET /api/economic-indicators) with caching + no _id leakage
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # Read from frontend/.env as fallback
    env_path = "/app/frontend/.env"
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().strip('"')
                    break

BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"


def _admin_token(session) -> str:
    """Login as admin and return the session token (iteration_3: needed for GET /contact & /newsletter)."""
    r = session.post(f"{API}/admin/login", json={"password": "geifem2026admin"}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ============ Health ============
class TestHealth:
    def test_root(self, session):
        r = session.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert r.json().get("message") == "Hello World"


# ============ Contact ============
class TestContact:
    valid_payload = {
        "nombre": "TEST_María González",
        "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
        "telefono": "+57 300 1234567",
        "empresa": "Consultora XYZ",
        "servicio": "consultoria",
        "mensaje": "Necesito asesoría estratégica para mi empresa en Colombia."
    }

    def test_create_contact_success(self, session):
        r = session.post(f"{API}/contact", json=self.valid_payload, timeout=45)
        assert r.status_code == 200, f"got {r.status_code}: {r.text}"
        data = r.json()
        assert data.get("success") is True
        assert "id" in data
        # UUID format
        uuid.UUID(data["id"])
        # persist id for verify
        TestContact.created_id = data["id"]
        TestContact.created_email = self.valid_payload["email"]

    def test_contact_persisted_in_list(self, session):
        assert hasattr(TestContact, "created_id")
        # iteration_3: /api/contact GET now requires admin auth
        token = _admin_token(session)
        r = session.get(f"{API}/contact", timeout=15, headers={"X-Admin-Token": token})
        assert r.status_code == 200
        contacts = r.json()
        assert isinstance(contacts, list)
        assert len(contacts) > 0
        # Should not contain _id
        for c in contacts:
            assert "_id" not in c
        # Find our record
        match = next((c for c in contacts if c.get("id") == TestContact.created_id), None)
        assert match is not None, "Created contact not found in list"
        assert match["nombre"] == self.valid_payload["nombre"]
        assert match["email"] == self.valid_payload["email"]
        assert match["servicio"] == self.valid_payload["servicio"]
        assert match["mensaje"] == self.valid_payload["mensaje"]

    def test_contact_list_sorted_desc(self, session):
        # Create another contact and verify it appears at/near the top
        p = dict(self.valid_payload)
        p["email"] = f"test_{uuid.uuid4().hex[:8]}@example.com"
        p["nombre"] = "TEST_Segundo Contacto"
        r = session.post(f"{API}/contact", json=p, timeout=45)
        assert r.status_code == 200
        new_id = r.json()["id"]

        token = _admin_token(session)
        r2 = session.get(f"{API}/contact", timeout=15, headers={"X-Admin-Token": token})
        contacts = r2.json()
        # Newest should be near the top (first entry)
        assert contacts[0].get("id") == new_id, "Contacts not sorted desc by created_at"

    def test_contact_invalid_email(self, session):
        p = dict(self.valid_payload)
        p["email"] = "not-an-email"
        r = session.post(f"{API}/contact", json=p, timeout=15)
        assert r.status_code == 422

    def test_contact_missing_nombre(self, session):
        p = dict(self.valid_payload)
        p.pop("nombre")
        r = session.post(f"{API}/contact", json=p, timeout=15)
        assert r.status_code == 422

    def test_contact_missing_email(self, session):
        p = dict(self.valid_payload)
        p.pop("email")
        r = session.post(f"{API}/contact", json=p, timeout=15)
        assert r.status_code == 422

    def test_contact_missing_servicio(self, session):
        p = dict(self.valid_payload)
        p.pop("servicio")
        r = session.post(f"{API}/contact", json=p, timeout=15)
        assert r.status_code == 422

    def test_contact_missing_mensaje(self, session):
        p = dict(self.valid_payload)
        p.pop("mensaje")
        r = session.post(f"{API}/contact", json=p, timeout=15)
        assert r.status_code == 422

    def test_contact_short_mensaje(self, session):
        p = dict(self.valid_payload)
        p["email"] = f"test_{uuid.uuid4().hex[:8]}@example.com"
        p["mensaje"] = "hi"  # < 5 chars
        r = session.post(f"{API}/contact", json=p, timeout=15)
        assert r.status_code == 422


# ============ Newsletter ============
class TestNewsletter:
    email = f"test_news_{uuid.uuid4().hex[:8]}@example.com"

    def test_subscribe_new(self, session):
        r = session.post(f"{API}/newsletter", json={"email": self.email}, timeout=45)
        assert r.status_code == 200, f"got {r.status_code}: {r.text}"
        data = r.json()
        assert data.get("success") is True
        assert data.get("already_subscribed") is False

    def test_subscribe_duplicate_idempotent(self, session):
        r = session.post(f"{API}/newsletter", json={"email": self.email}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("success") is True
        assert data.get("already_subscribed") is True

    def test_subscribe_duplicate_case_insensitive(self, session):
        r = session.post(f"{API}/newsletter", json={"email": self.email.upper()}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("already_subscribed") is True, "Email should be normalized to lowercase"

    def test_subscribe_invalid_email(self, session):
        r = session.post(f"{API}/newsletter", json={"email": "invalid"}, timeout=15)
        assert r.status_code == 422

    def test_list_newsletter(self, session):
        # iteration_3: newsletter GET now requires admin auth
        token = _admin_token(session)
        r = session.get(f"{API}/newsletter", timeout=15, headers={"X-Admin-Token": token})
        assert r.status_code == 200
        data = r.json()
        assert "count" in data
        assert "subscribers" in data
        assert isinstance(data["subscribers"], list)
        assert data["count"] == len(data["subscribers"])
        # No mongo _id in subscribers
        for s in data["subscribers"]:
            assert "_id" not in s
        # Our email must be present
        emails = [s.get("email") for s in data["subscribers"]]
        assert self.email.lower() in emails


# ============ Economic Indicators ============
class TestEconomicIndicators:
    def test_get_indicators(self, session):
        r = session.get(f"{API}/economic-indicators", timeout=60)
        assert r.status_code == 200
        data = r.json()
        assert "indicators" in data
        indicators = data["indicators"]
        assert isinstance(indicators, list)
        assert len(indicators) == 10, f"expected 10 indicators, got {len(indicators)}"
        for ind in indicators:
            for field in ("symbol", "name", "value", "unit", "change", "trend"):
                assert field in ind, f"missing {field} in {ind}"
            assert ind["trend"] in ("up", "down")
            # No mongo id leaks
            assert "_id" not in ind

    def test_get_indicators_cached_second_call(self, session):
        # first call (may or may not be cached)
        _ = session.get(f"{API}/economic-indicators", timeout=60)
        # second call should be cached
        r = session.get(f"{API}/economic-indicators", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("cached") is True, "Second call should be served from cache"
        assert "last_updated" in data
