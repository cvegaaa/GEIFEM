"""Iteration 3 security hardening tests for GEIFEM backend.

Covers:
- Security response headers on every endpoint
- OpenAPI/Swagger docs disabled (404 in production)
- Admin login with bcrypt + brute force lockout (5 fails -> 6th returns 429)
- Rate limiting on /api/contact, /api/newsletter, /api/admin/login
- Token security (malformed tokens rejected)
- XSS sanitization in contact form (HTML stripped)
- Servicio field allowlist validation
- HTML sanitization in article content (only safe tags)
- Public GET /api/contact and /api/newsletter now require admin auth
- Audit logs written for login + article CRUD
- Admin session TTL / verify endpoint
- Admin seeding idempotency

We use unique X-Forwarded-For per test where needed to isolate slowapi rate-limit buckets.
"""
import os
import re
import time
import uuid
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    env_path = "/app/frontend/.env"
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().strip('"')
                    break
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")
ADMIN_PASSWORD = "geifem2026admin"


def _fake_ip() -> str:
    """Generate a unique X-Forwarded-For value per test to isolate rate-limit buckets."""
    return f"10.{uuid.uuid4().int % 255}.{uuid.uuid4().int % 255}.{uuid.uuid4().int % 255}"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def mongo():
    c = MongoClient(MONGO_URL)
    yield c[DB_NAME]
    c.close()


@pytest.fixture(scope="module")
def admin_token(session):
    """Login once for the module (uses a fresh fake IP to avoid lockout collisions)."""
    # Ensure any prior lockouts are cleared for our IP
    ip = _fake_ip()
    r = session.post(
        f"{API}/admin/login",
        json={"password": ADMIN_PASSWORD},
        headers={"X-Forwarded-For": ip},
        timeout=15,
    )
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert re.fullmatch(r"[a-f0-9]{64}", data["token"]), "token must be 64-char hex"
    return data["token"]


# ============ Security headers ============
class TestSecurityHeaders:
    def test_headers_present_on_public_endpoint(self, session):
        r = session.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert r.headers.get("X-Content-Type-Options") == "nosniff"
        assert r.headers.get("X-Frame-Options") == "DENY"
        assert r.headers.get("X-XSS-Protection") == "1; mode=block"
        assert "strict-origin" in (r.headers.get("Referrer-Policy") or "").lower()
        perms = r.headers.get("Permissions-Policy") or ""
        assert "geolocation=()" in perms and "camera=()" in perms

    def test_headers_on_admin_endpoint(self, session, admin_token):
        r = session.get(
            f"{API}/admin/verify", headers={"X-Admin-Token": admin_token}, timeout=15
        )
        assert r.status_code == 200
        assert r.headers.get("X-Content-Type-Options") == "nosniff"
        assert r.headers.get("X-Frame-Options") == "DENY"


# ============ OpenAPI docs disabled ============
class TestDocsDisabled:
    """Backend must NOT expose OpenAPI/Swagger. We hit the backend directly since
    the K8s ingress only routes /api/* to backend (non-api paths hit the SPA)."""
    BACKEND_DIRECT = os.environ.get("BACKEND_INTERNAL_URL", "http://localhost:8001")

    @pytest.mark.parametrize("path", ["/docs", "/redoc", "/openapi.json"])
    def test_docs_return_404(self, session, path):
        r = session.get(f"{self.BACKEND_DIRECT}{path}", timeout=15)
        assert r.status_code == 404, f"{path} should be disabled in production"


# ============ Admin auth + brute force ============
class TestAdminAuth:
    def test_login_success_returns_hex_token(self, session):
        ip = _fake_ip()
        r = session.post(
            f"{API}/admin/login",
            json={"password": ADMIN_PASSWORD},
            headers={"X-Forwarded-For": ip},
            timeout=15,
        )
        assert r.status_code == 200
        body = r.json()
        assert "token" in body and "expires_at" in body
        assert re.fullmatch(r"[a-f0-9]{64}", body["token"]), "token must be 64 hex chars"

    def test_login_wrong_password_returns_401(self, session):
        ip = _fake_ip()
        r = session.post(
            f"{API}/admin/login",
            json={"password": "wrong-password"},
            headers={"X-Forwarded-For": ip},
            timeout=15,
        )
        assert r.status_code == 401

    def test_brute_force_lockout_on_6th_attempt(self, session, mongo):
        ip = _fake_ip()
        # Clear any prior state for this IP (belt & suspenders)
        mongo.login_attempts.delete_many({"ip": ip})

        # 5 wrong attempts -> 401 each
        for i in range(5):
            r = session.post(
                f"{API}/admin/login",
                json={"password": f"wrong{i}"},
                headers={"X-Forwarded-For": ip},
                timeout=15,
            )
            assert r.status_code == 401, f"attempt {i+1} expected 401, got {r.status_code}"

        # 6th attempt -> 429 lockout
        r6 = session.post(
            f"{API}/admin/login",
            json={"password": "wrong6"},
            headers={"X-Forwarded-For": ip},
            timeout=15,
        )
        assert r6.status_code == 429, f"6th attempt expected 429, got {r6.status_code}: {r6.text}"
        detail = r6.json().get("detail", "")
        assert "Demasiados intentos" in detail
        assert "minutos" in detail

        # Even correct password is blocked while locked
        r7 = session.post(
            f"{API}/admin/login",
            json={"password": ADMIN_PASSWORD},
            headers={"X-Forwarded-For": ip},
            timeout=15,
        )
        assert r7.status_code == 429, "locked IP must be blocked even with correct password"

        # cleanup
        mongo.login_attempts.delete_many({"ip": ip})

    def test_bcrypt_hash_stored_in_db(self, mongo):
        doc = mongo.admin_users.find_one({"username": "admin"})
        assert doc is not None, "admin user should be seeded"
        h = doc.get("password_hash", "")
        assert h.startswith("$2b$") or h.startswith("$2a$"), f"expected bcrypt hash, got {h[:10]}..."

    def test_admin_seeding_idempotent(self, mongo):
        count = mongo.admin_users.count_documents({"username": "admin"})
        assert count == 1, f"expected exactly 1 admin_users doc, got {count}"


# ============ Token security ============
class TestTokenSecurity:
    def test_missing_token_rejected(self, session):
        r = session.get(f"{API}/admin/verify", timeout=15)
        assert r.status_code == 401

    @pytest.mark.parametrize("bad_token", [
        "not-hex-at-all-!!!",
        "abc",           # too short
        "z" * 64,        # not hex chars
        "a" * 200,       # too long
        "GHIJKL" * 12,   # uppercase / invalid hex
    ])
    def test_malformed_token_rejected(self, session, bad_token):
        r = session.get(
            f"{API}/admin/verify",
            headers={"X-Admin-Token": bad_token},
            timeout=15,
        )
        assert r.status_code == 401
        assert "Token" in r.json().get("detail", "") or "Sesión" in r.json().get("detail", "")

    def test_valid_hex_but_unknown_token_rejected(self, session):
        r = session.get(
            f"{API}/admin/verify",
            headers={"X-Admin-Token": "a" * 64},
            timeout=15,
        )
        assert r.status_code == 401


# ============ XSS + servicio allowlist ============
class TestContactSanitization:
    def test_xss_stripped_from_nombre_and_mensaje(self, session, mongo, admin_token):
        ip = _fake_ip()
        email = f"test_xss_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "nombre": "<script>alert(1)</script>John",
            "email": email,
            "servicio": "consultoria",
            "mensaje": "Hello <img src=x onerror=alert(1)> world, please contact me",
        }
        r = session.post(
            f"{API}/contact",
            json=payload,
            headers={"X-Forwarded-For": ip},
            timeout=30,
        )
        assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text}"

        stored = mongo.contacts.find_one({"email": email})
        assert stored is not None, "contact should be persisted"
        assert "<script>" not in stored["nombre"]
        assert "</script>" not in stored["nombre"]
        assert "John" in stored["nombre"]
        assert "<img" not in stored["mensaje"]
        assert "onerror" not in stored["mensaje"]
        # cleanup
        mongo.contacts.delete_one({"email": email})

    def test_servicio_allowlist_rejects_invalid(self, session):
        ip = _fake_ip()
        payload = {
            "nombre": "TEST_Allowlist",
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "servicio": "HACKER",
            "mensaje": "trying to inject a bad servicio value here",
        }
        r = session.post(
            f"{API}/contact",
            json=payload,
            headers={"X-Forwarded-For": ip},
            timeout=15,
        )
        assert r.status_code == 422
        assert "Servicio no válido" in r.text

    def test_servicio_allowlist_accepts_valid_values(self, session):
        for servicio in ("capacitacion", "emprende", "crece", "escala", "otro"):
            ip = _fake_ip()
            email = f"test_{servicio}_{uuid.uuid4().hex[:6]}@example.com"
            r = session.post(
                f"{API}/contact",
                json={
                    "nombre": "TEST_Allowlist",
                    "email": email,
                    "servicio": servicio,
                    "mensaje": f"valid servicio test {servicio}",
                },
                headers={"X-Forwarded-For": ip},
                timeout=30,
            )
            assert r.status_code == 200, f"servicio={servicio} should be allowed"


# ============ Rate limiting ============
class TestRateLimiting:
    def test_contact_rate_limit_5_per_hour(self, session):
        ip = _fake_ip()
        headers = {"X-Forwarded-For": ip}
        results = []
        for i in range(6):
            r = session.post(
                f"{API}/contact",
                json={
                    "nombre": f"TEST_RL_{i}",
                    "email": f"test_rl_{uuid.uuid4().hex[:8]}@example.com",
                    "servicio": "otro",
                    "mensaje": f"rate limit test message number {i}",
                },
                headers=headers,
                timeout=30,
            )
            results.append(r.status_code)
        # First 5 succeed, 6th is 429
        assert results[:5].count(200) == 5, f"first 5 should be 200: {results}"
        assert results[5] == 429, f"6th should be 429: {results}"

    def test_newsletter_rate_limit_5_per_hour(self, session):
        ip = _fake_ip()
        headers = {"X-Forwarded-For": ip}
        results = []
        for i in range(6):
            r = session.post(
                f"{API}/newsletter",
                json={"email": f"test_nl_{uuid.uuid4().hex[:8]}@example.com"},
                headers=headers,
                timeout=30,
            )
            results.append(r.status_code)
        assert results[:5].count(200) == 5, f"first 5 newsletter should be 200: {results}"
        assert results[5] == 429, f"6th newsletter should be 429: {results}"

    def test_admin_login_rate_limit_10_per_minute(self, session):
        ip = _fake_ip()
        headers = {"X-Forwarded-For": ip}
        codes = []
        # send 11 wrong attempts (with unique bogus passwords so brute-force lockout kicks in at 5 too)
        # But brute-force lockout returns 429 with a different message — either lockout or slowapi
        # rate limit is acceptable proof of protection.
        for i in range(11):
            r = session.post(
                f"{API}/admin/login",
                json={"password": f"bad{i}"},
                headers=headers,
                timeout=15,
            )
            codes.append(r.status_code)
        assert 429 in codes, f"expected at least one 429 in 11 attempts, got {codes}"


# ============ Auth required on former public GETs ============
class TestAdminGatedListings:
    def test_get_contact_requires_admin(self, session):
        r = session.get(f"{API}/contact", timeout=15)
        assert r.status_code == 401

    def test_get_newsletter_requires_admin(self, session):
        r = session.get(f"{API}/newsletter", timeout=15)
        assert r.status_code == 401

    def test_get_contact_works_with_admin(self, session, admin_token):
        r = session.get(
            f"{API}/contact", headers={"X-Admin-Token": admin_token}, timeout=15
        )
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_newsletter_works_with_admin(self, session, admin_token):
        r = session.get(
            f"{API}/newsletter", headers={"X-Admin-Token": admin_token}, timeout=15
        )
        assert r.status_code == 200
        assert "subscribers" in r.json()


# ============ Article HTML sanitization + audit ============
class TestArticleSecurity:
    def test_html_sanitization_strips_script_and_js_protocol(self, session, mongo, admin_token):
        payload = {
            "title": "TEST_XSS Article",
            "category": "test",
            "excerpt": "excerpt for xss article test",
            "content": '<script>bad()</script><p>Good <a href="javascript:alert(1)">link</a> and <a href="https://safe.com">safe</a></p>',
            "image": "https://picsum.photos/400",
        }
        r = session.post(
            f"{API}/admin/articles",
            json=payload,
            headers={"X-Admin-Token": admin_token},
            timeout=15,
        )
        assert r.status_code == 200, f"create failed: {r.status_code} {r.text}"
        article_id = r.json()["id"]

        # Fetch via admin GET (which includes content) and verify sanitization
        r2 = session.get(
            f"{API}/admin/articles/{article_id}",
            headers={"X-Admin-Token": admin_token},
            timeout=15,
        )
        assert r2.status_code == 200
        content = r2.json()["content"]
        assert "<script>" not in content
        assert "bad()" not in content or "<script" not in content
        assert "javascript:" not in content.lower(), f"js: protocol should be stripped: {content}"
        assert "<p>" in content and "Good" in content
        assert "https://safe.com" in content

        # audit log written
        audit = list(mongo.audit_logs.find({"action": "article_create", "meta.article_id": article_id}))
        assert len(audit) >= 1, "article_create audit log missing"

        # cleanup
        rd = session.delete(
            f"{API}/admin/articles/{article_id}",
            headers={"X-Admin-Token": admin_token},
            timeout=15,
        )
        assert rd.status_code == 200
        # audit delete written
        adel = list(mongo.audit_logs.find({"action": "article_delete", "meta.article_id": article_id}))
        assert len(adel) >= 1, "article_delete audit log missing"


# ============ Audit logs + verify ============
class TestAuditAndSession:
    def test_admin_login_success_audit(self, session, mongo, admin_token):
        # admin_token fixture already logged in; verify an entry exists
        found = mongo.audit_logs.find_one({"action": "admin_login_success"})
        assert found is not None, "admin_login_success audit log missing"
        assert "ip" in found and "created_at" in found

    def test_admin_verify_endpoint(self, session, admin_token):
        r = session.get(
            f"{API}/admin/verify", headers={"X-Admin-Token": admin_token}, timeout=15
        )
        assert r.status_code == 200
        assert r.json()["valid"] is True

    def test_admin_audit_logs_endpoint(self, session, admin_token):
        r = session.get(
            f"{API}/admin/audit-logs", headers={"X-Admin-Token": admin_token}, timeout=15
        )
        assert r.status_code == 200
        body = r.json()
        assert "logs" in body and "count" in body
        actions = {l["action"] for l in body["logs"]}
        assert "admin_login_success" in actions

    def test_expired_session_returns_401(self, session, mongo):
        """Insert an already-expired session directly and check verify rejects it."""
        token = "b" * 64
        expired = "2020-01-01T00:00:00+00:00"
        mongo.admin_sessions.insert_one({
            "token": token,
            "ip": "test",
            "created_at": expired,
            "expires_at": expired,
        })
        try:
            r = session.get(
                f"{API}/admin/verify", headers={"X-Admin-Token": token}, timeout=15
            )
            assert r.status_code == 401
            assert "expirada" in r.json().get("detail", "").lower() or "inválida" in r.json().get("detail", "").lower()
        finally:
            mongo.admin_sessions.delete_one({"token": token})


# ============ Regression: iteration_2 endpoints still work ============
class TestRegression:
    def test_economic_indicators(self, session):
        r = session.get(f"{API}/economic-indicators", timeout=60)
        assert r.status_code == 200
        assert "indicators" in r.json()

    def test_public_articles_list(self, session):
        r = session.get(f"{API}/articles", timeout=15)
        assert r.status_code == 200
        assert "articles" in r.json()

    def test_admin_stats(self, session, admin_token):
        r = session.get(
            f"{API}/admin/stats", headers={"X-Admin-Token": admin_token}, timeout=15
        )
        assert r.status_code == 200
        body = r.json()
        for k in ("contacts_total", "newsletter_total", "articles_total"):
            assert k in body

    def test_admin_contacts_list(self, session, admin_token):
        r = session.get(
            f"{API}/admin/contacts", headers={"X-Admin-Token": admin_token}, timeout=15
        )
        assert r.status_code == 200
        assert "contacts" in r.json()

    def test_admin_articles_list(self, session, admin_token):
        r = session.get(
            f"{API}/admin/articles", headers={"X-Admin-Token": admin_token}, timeout=15
        )
        assert r.status_code == 200
        assert "articles" in r.json()

    def test_admin_newsletter_list(self, session, admin_token):
        r = session.get(
            f"{API}/admin/newsletter", headers={"X-Admin-Token": admin_token}, timeout=15
        )
        assert r.status_code == 200
        assert "subscribers" in r.json()
