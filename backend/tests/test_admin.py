"""Backend admin panel tests for GEIFEM.

Covers:
- Admin login/logout/verify (X-Admin-Token flow)
- Admin stats aggregation
- Admin contact management (list/filter/patch/delete)
- Admin newsletter management (list/delete)
- Articles CRUD (admin) + public endpoints
"""
import os
import uuid
import pytest
import requests

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
ADMIN_PASSWORD = "geifem2026admin"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and data["token"]
    return data["token"]


@pytest.fixture(scope="module")
def auth_session(admin_token):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "X-Admin-Token": admin_token})
    return s


# =========== Admin Auth ===========
class TestAdminAuth:
    def test_login_success(self, session):
        r = session.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "token" in data
        assert "expires_at" in data
        assert isinstance(data["token"], str) and len(data["token"]) > 20

    def test_login_wrong_password(self, session):
        r = session.post(f"{API}/admin/login", json={"password": "wrongpass"}, timeout=15)
        assert r.status_code == 401

    def test_verify_valid(self, session, admin_token):
        r = session.get(f"{API}/admin/verify", headers={"X-Admin-Token": admin_token}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("valid") is True

    def test_verify_missing_token(self, session):
        r = session.get(f"{API}/admin/verify", timeout=15)
        assert r.status_code == 401

    def test_verify_invalid_token(self, session):
        r = session.get(f"{API}/admin/verify", headers={"X-Admin-Token": "not-a-valid-token"}, timeout=15)
        assert r.status_code == 401


# =========== Admin Stats ===========
class TestAdminStats:
    def test_stats_shape(self, auth_session):
        r = auth_session.get(f"{API}/admin/stats", timeout=15)
        assert r.status_code == 200
        data = r.json()
        for key in ("contacts_total", "contacts_new", "contacts_last_7_days",
                    "newsletter_total", "articles_total", "articles_published"):
            assert key in data, f"missing key {key}"
            assert isinstance(data[key], int)

    def test_stats_requires_auth(self, session):
        r = session.get(f"{API}/admin/stats", timeout=15)
        assert r.status_code == 401


# =========== Admin Contact Management ===========
class TestAdminContacts:
    created_id = None
    created_email = f"test_admin_{uuid.uuid4().hex[:8]}@example.com"

    def test_seed_contact_via_public(self, session):
        # Create a real contact through public endpoint
        payload = {
            "nombre": "TEST_ADMIN_Contact",
            "email": TestAdminContacts.created_email,
            "servicio": "consultoria",
            "mensaje": "Mensaje de prueba para el panel admin.",
        }
        r = session.post(f"{API}/contact", json=payload, timeout=45)
        assert r.status_code == 200
        TestAdminContacts.created_id = r.json()["id"]

    def test_list_contacts(self, auth_session):
        r = auth_session.get(f"{API}/admin/contacts", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "count" in data
        assert "contacts" in data
        assert isinstance(data["contacts"], list)
        # No _id leakage
        for c in data["contacts"]:
            assert "_id" not in c
        # Our seeded contact must be there
        ids = [c.get("id") for c in data["contacts"]]
        assert TestAdminContacts.created_id in ids

    def test_list_contacts_requires_auth(self, session):
        r = session.get(f"{API}/admin/contacts", timeout=15)
        assert r.status_code == 401

    def test_filter_by_status_new(self, auth_session):
        r = auth_session.get(f"{API}/admin/contacts?status=new", timeout=15)
        assert r.status_code == 200
        data = r.json()
        for c in data["contacts"]:
            assert c.get("status") == "new"

    def test_patch_contact_status(self, auth_session):
        assert TestAdminContacts.created_id
        r = auth_session.patch(
            f"{API}/admin/contacts/{TestAdminContacts.created_id}",
            json={"status": "contacted"},
            timeout=15,
        )
        assert r.status_code == 200
        assert r.json().get("success") is True
        # Verify persistence
        r2 = auth_session.get(f"{API}/admin/contacts", timeout=15)
        match = next((c for c in r2.json()["contacts"] if c["id"] == TestAdminContacts.created_id), None)
        assert match is not None
        assert match.get("status") == "contacted"

    def test_patch_invalid_status_rejected(self, auth_session):
        r = auth_session.patch(
            f"{API}/admin/contacts/{TestAdminContacts.created_id}",
            json={"status": "not-a-status"},
            timeout=15,
        )
        assert r.status_code == 422

    def test_delete_contact(self, auth_session):
        assert TestAdminContacts.created_id
        r = auth_session.delete(f"{API}/admin/contacts/{TestAdminContacts.created_id}", timeout=15)
        assert r.status_code == 200
        # Verify gone
        r2 = auth_session.get(f"{API}/admin/contacts", timeout=15)
        ids = [c.get("id") for c in r2.json()["contacts"]]
        assert TestAdminContacts.created_id not in ids

    def test_delete_missing_contact_404(self, auth_session):
        r = auth_session.delete(f"{API}/admin/contacts/nonexistent-id", timeout=15)
        assert r.status_code == 404


# =========== Admin Newsletter Management ===========
class TestAdminNewsletter:
    email = f"test_admin_news_{uuid.uuid4().hex[:8]}@example.com"
    sub_id = None

    def test_seed_subscriber(self, session):
        r = session.post(f"{API}/newsletter", json={"email": TestAdminNewsletter.email}, timeout=45)
        assert r.status_code == 200

    def test_list_subscribers(self, auth_session):
        r = auth_session.get(f"{API}/admin/newsletter", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "count" in data
        assert "subscribers" in data
        emails = [s.get("email") for s in data["subscribers"]]
        assert TestAdminNewsletter.email.lower() in emails
        # capture id
        for s in data["subscribers"]:
            if s.get("email") == TestAdminNewsletter.email.lower():
                TestAdminNewsletter.sub_id = s.get("id")
                break
        assert TestAdminNewsletter.sub_id

    def test_list_newsletter_requires_auth(self, session):
        r = session.get(f"{API}/admin/newsletter", timeout=15)
        assert r.status_code == 401

    def test_delete_subscriber(self, auth_session):
        assert TestAdminNewsletter.sub_id
        r = auth_session.delete(f"{API}/admin/newsletter/{TestAdminNewsletter.sub_id}", timeout=15)
        assert r.status_code == 200
        # Verify gone
        r2 = auth_session.get(f"{API}/admin/newsletter", timeout=15)
        emails = [s.get("email") for s in r2.json()["subscribers"]]
        assert TestAdminNewsletter.email.lower() not in emails


# =========== Articles CRUD ===========
class TestArticlesCRUD:
    published_id = None
    unpublished_id = None

    payload_published = {
        "title": "TEST_ Estrategia Empresarial 2026",
        "category": "Estrategia",
        "excerpt": "Un análisis detallado sobre las tendencias empresariales para 2026 en Colombia.",
        "content": "Contenido extenso del artículo sobre estrategia empresarial y crecimiento sostenible en 2026.",
        "image": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
        "author": "TEST Autor",
        "read_time": "6 min",
        "published": True,
    }

    payload_unpublished = {
        "title": "TEST_ Borrador Interno",
        "category": "Draft",
        "excerpt": "Este es un borrador que no debe aparecer en el listado público.",
        "content": "Contenido del borrador que solo el admin puede ver.",
        "image": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800",
        "published": False,
    }

    def test_create_published_article(self, auth_session):
        r = auth_session.post(f"{API}/admin/articles", json=self.payload_published, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        assert "id" in data
        TestArticlesCRUD.published_id = data["id"]

    def test_create_unpublished_article(self, auth_session):
        r = auth_session.post(f"{API}/admin/articles", json=self.payload_unpublished, timeout=15)
        assert r.status_code == 200
        TestArticlesCRUD.unpublished_id = r.json()["id"]

    def test_create_requires_auth(self, session):
        r = session.post(f"{API}/admin/articles", json=self.payload_published, timeout=15)
        assert r.status_code == 401

    def test_admin_list_shows_all(self, auth_session):
        r = auth_session.get(f"{API}/admin/articles", timeout=15)
        assert r.status_code == 200
        data = r.json()
        ids = [a.get("id") for a in data["articles"]]
        assert TestArticlesCRUD.published_id in ids
        assert TestArticlesCRUD.unpublished_id in ids
        # content excluded in list view
        for a in data["articles"]:
            assert "content" not in a

    def test_admin_get_single_has_content(self, auth_session):
        r = auth_session.get(f"{API}/admin/articles/{TestArticlesCRUD.published_id}", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == TestArticlesCRUD.published_id
        assert data["title"] == self.payload_published["title"]
        assert data["content"] == self.payload_published["content"]

    def test_public_list_only_published(self, session):
        r = session.get(f"{API}/articles", timeout=15)
        assert r.status_code == 200
        data = r.json()
        ids = [a.get("id") for a in data["articles"]]
        assert TestArticlesCRUD.published_id in ids
        assert TestArticlesCRUD.unpublished_id not in ids
        # content excluded from public list view
        for a in data["articles"]:
            assert "content" not in a
            assert "_id" not in a

    def test_public_get_published(self, session):
        r = session.get(f"{API}/articles/{TestArticlesCRUD.published_id}", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == self.payload_published["title"]
        assert "content" in data

    def test_public_get_unpublished_404(self, session):
        r = session.get(f"{API}/articles/{TestArticlesCRUD.unpublished_id}", timeout=15)
        assert r.status_code == 404

    def test_patch_article(self, auth_session):
        new_title = "TEST_ Estrategia Empresarial 2026 (actualizado)"
        r = auth_session.patch(
            f"{API}/admin/articles/{TestArticlesCRUD.published_id}",
            json={"title": new_title},
            timeout=15,
        )
        assert r.status_code == 200
        # Verify persistence
        r2 = auth_session.get(f"{API}/admin/articles/{TestArticlesCRUD.published_id}", timeout=15)
        assert r2.json()["title"] == new_title

    def test_patch_publish_toggle(self, auth_session):
        # publish the draft
        r = auth_session.patch(
            f"{API}/admin/articles/{TestArticlesCRUD.unpublished_id}",
            json={"published": True},
            timeout=15,
        )
        assert r.status_code == 200
        # Now it should show in public list
        r2 = session_get_public(f"{API}/articles")
        ids = [a.get("id") for a in r2.json()["articles"]]
        assert TestArticlesCRUD.unpublished_id in ids

    def test_delete_articles(self, auth_session):
        for aid in [TestArticlesCRUD.published_id, TestArticlesCRUD.unpublished_id]:
            r = auth_session.delete(f"{API}/admin/articles/{aid}", timeout=15)
            assert r.status_code == 200
        # Verify gone
        r2 = auth_session.get(f"{API}/admin/articles", timeout=15)
        ids = [a.get("id") for a in r2.json()["articles"]]
        assert TestArticlesCRUD.published_id not in ids
        assert TestArticlesCRUD.unpublished_id not in ids


def session_get_public(url):
    return requests.get(url, timeout=15)
