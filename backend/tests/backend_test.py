"""
ProcureAI backend integration tests.

Covers:
- Health
- Auth (register, login, /me, invalid creds, protected route)
- Categories & suppliers
- Core search -> compare -> recommend flow + weight profile ranking
- Recommendations endpoint
- History (list/delete)
- Dashboard / analytics / insights
- Preferences GET/PUT persistence
- Weight profiles list
"""
import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback from frontend/.env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass

API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@procureai.com", "password": "Admin@123"}
BUYER = {"email": "buyer@procureai.com", "password": "Buyer@123"}


def _ok(resp):
    """Envelope { success: true, data: ... } helper."""
    assert resp.headers.get("content-type", "").startswith("application/json"), resp.text[:200]
    body = resp.json()
    assert body.get("success") is True, body
    return body.get("data")


# -------------------- Fixtures --------------------

@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json=ADMIN, timeout=20)
    assert r.status_code == 200, r.text
    data = _ok(r)
    assert "token" in data and "user" in data
    return data["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# -------------------- Health --------------------

def test_health(s):
    r = s.get(f"{API}/health", timeout=10)
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True and body["status"] == "ok"


# -------------------- Auth --------------------

class TestAuth:
    def test_login_admin(self, s):
        r = s.post(f"{API}/auth/login", json=ADMIN, timeout=20)
        assert r.status_code == 200, r.text
        data = _ok(r)
        assert isinstance(data["token"], str) and len(data["token"]) > 10
        assert data["user"]["email"] == ADMIN["email"]
        assert data["user"].get("role") == "admin"

    def test_login_invalid(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN["email"], "password": "wrong"}, timeout=20)
        assert r.status_code == 401
        body = r.json()
        assert body.get("success") is False
        assert "error" in body or "message" in body

    def test_register_new_user(self, s):
        # Backend normalizes emails to lowercase; use lower-case prefix
        unique = f"test_{uuid.uuid4().hex[:8]}@procureai.com"
        payload = {
            "name": "TEST User",
            "email": unique,
            "password": "Test@1234",
            "businessType": "startup",
        }
        r = s.post(f"{API}/auth/register", json=payload, timeout=20)
        assert r.status_code in (200, 201), r.text
        data = _ok(r)
        assert "token" in data
        assert data["user"]["email"] == unique
        # Login with new user
        r2 = s.post(f"{API}/auth/login", json={"email": unique, "password": "Test@1234"}, timeout=20)
        assert r2.status_code == 200
        _ok(r2)

    def test_me_with_token(self, s, admin_headers):
        r = s.get(f"{API}/auth/me", headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        data = _ok(r)
        assert data["email"] == ADMIN["email"]

    def test_protected_without_token(self, s):
        r = s.get(f"{API}/categories", timeout=20)
        assert r.status_code == 401, f"Expected 401 unauth, got {r.status_code}: {r.text[:200]}"

    def test_dashboard_without_token(self, s):
        r = s.get(f"{API}/dashboard", timeout=20)
        assert r.status_code == 401


# -------------------- Categories & Suppliers --------------------

class TestCatalog:
    def test_categories_list(self, s, admin_headers):
        r = s.get(f"{API}/categories", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        data = _ok(r)
        assert isinstance(data, list)
        assert len(data) == 8, f"Expected 8 categories, got {len(data)}"
        slugs = [c.get("slug") for c in data]
        assert "fashion" in slugs

    def test_fashion_suppliers(self, s, admin_headers):
        r = s.get(f"{API}/categories/fashion/suppliers", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        data = _ok(r)
        names = {sup.get("name") for sup in data}
        expected = {"Myntra", "Ajio", "Amazon", "Flipkart", "Tata CLiQ"}
        assert expected.issubset(names), f"Expected {expected}, got {names}"

    def test_all_suppliers(self, s, admin_headers):
        r = s.get(f"{API}/suppliers", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        data = _ok(r)
        assert isinstance(data, list) and len(data) > 5

    def test_toggle_supplier(self, s, admin_headers):
        # Pick first supplier
        r = s.get(f"{API}/suppliers", headers=admin_headers, timeout=20)
        suppliers = _ok(r)
        sup = suppliers[0]
        sid = sup.get("id") or sup.get("_id")
        original = sup.get("enabled", True)
        r2 = s.patch(
            f"{API}/suppliers/{sid}",
            headers=admin_headers,
            json={"enabled": not original},
            timeout=20,
        )
        assert r2.status_code == 200, r2.text
        updated = _ok(r2)
        assert updated.get("enabled") == (not original)
        # toggle back
        s.patch(f"{API}/suppliers/{sid}", headers=admin_headers, json={"enabled": original}, timeout=20)


# -------------------- Weight profiles --------------------

class TestWeightProfiles:
    def test_list(self, s, admin_headers):
        r = s.get(f"{API}/weight-profiles", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        data = _ok(r)
        keys = {p.get("key") for p in data}
        assert {"balanced", "startup", "hospital", "restaurant"}.issubset(keys), keys


# -------------------- Core search + recommendation --------------------

def _do_search(s, headers, query="Nike Shoes", category="fashion", weight="startup", suppliers=None):
    payload = {"category": category, "query": query, "weightProfile": weight}
    if suppliers is not None:
        payload["suppliers"] = suppliers
    r = s.post(f"{API}/search", headers=headers, json=payload, timeout=60)
    assert r.status_code == 200, r.text
    return _ok(r)


class TestSearch:
    def test_search_returns_results_and_recommendation(self, s, admin_headers):
        data = _do_search(s, admin_headers)
        # results
        results = data.get("results") or data.get("comparisons") or []
        assert isinstance(results, list) and len(results) > 0, f"no results: {data}"
        # recommendation shape
        rec = data.get("recommendation")
        assert rec is not None, data
        assert isinstance(rec.get("reasons"), list) and len(rec["reasons"]) > 0
        assert isinstance(rec.get("estimatedSavings"), (int, float))
        assert rec["estimatedSavings"] >= 0
        confidence = rec.get("confidence")
        assert isinstance(confidence, (int, float))
        assert 0 <= confidence <= 1, f"confidence out of range: {confidence}"
        assert isinstance(rec.get("factors"), list)
        assert isinstance(rec.get("scoreboard"), list)
        # recommended supplier must appear in results (results use 'provider')
        supplier_names = {r.get("provider") for r in results}
        rec_sup = rec.get("supplier")
        rec_sup_name = rec_sup.get("name") if isinstance(rec_sup, dict) else rec_sup
        assert rec_sup_name in supplier_names, f"rec supplier {rec_sup_name} not in {supplier_names}"

    def test_weight_profiles_can_change_ranking(self, s, admin_headers):
        results = {}
        for profile in ["startup", "hospital", "restaurant"]:
            d = _do_search(s, admin_headers, weight=profile)
            rec = d["recommendation"]
            sb = rec.get("scoreboard") or []
            top_score = sb[0].get("score") if sb else None
            rec_sup = rec.get("supplier")
            rec_sup_name = rec_sup.get("name") if isinstance(rec_sup, dict) else rec_sup
            results[profile] = (rec_sup_name, top_score)
        # Not strictly required that supplier differs, but scoreboards / scores should differ
        # across at least two profiles.
        unique = set(results.values())
        assert len(unique) >= 2, f"Weight profile did not affect output at all: {results}"


# -------------------- Recommendation endpoint --------------------

class TestRecommendation:
    def test_recommend_from_products(self, s, admin_headers):
        # First run a search to get a products list
        d = _do_search(s, admin_headers)
        results = d.get("results") or []
        assert results
        r = s.post(
            f"{API}/recommendations",
            headers=admin_headers,
            json={"products": results, "weightProfile": "balanced"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        data = _ok(r)
        rec = data.get("recommendation", data)  # endpoint wraps under 'recommendation'
        assert rec.get("supplier") is not None
        assert 0 <= rec["confidence"] <= 1


# -------------------- History --------------------

class TestHistory:
    def test_list_and_delete(self, s, admin_headers):
        # Ensure at least one search
        _do_search(s, admin_headers, query=f"TEST_hist_{uuid.uuid4().hex[:6]}")
        time.sleep(0.5)
        r = s.get(f"{API}/history", headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        history = _ok(r)
        assert isinstance(history, list) and len(history) > 0
        item = history[0]
        hid = item.get("id") or item.get("_id")
        assert hid
        r2 = s.delete(f"{API}/history/{hid}", headers=admin_headers, timeout=20)
        assert r2.status_code in (200, 204), r2.text
        # verify removed
        r3 = s.get(f"{API}/history", headers=admin_headers, timeout=20)
        remaining_ids = {(h.get("id") or h.get("_id")) for h in _ok(r3)}
        assert hid not in remaining_ids


# -------------------- Dashboard / analytics --------------------

class TestDashboard:
    def test_dashboard_payload(self, s, admin_headers):
        r = s.get(f"{API}/dashboard", headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = _ok(r)
        for key in [
            "totalSearches",
            "estimatedMonthlySavings",
            "preferredSupplier",
            "topCategory",
            "activeCategories",
            "recentSearches",
        ]:
            assert key in d, f"missing key {key} in dashboard: {list(d.keys())}"
        assert isinstance(d["recentSearches"], list)

    def test_analytics_spend(self, s, admin_headers):
        r = s.get(f"{API}/analytics/spend", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        _ok(r)

    def test_analytics_savings(self, s, admin_headers):
        r = s.get(f"{API}/analytics/savings", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        _ok(r)

    def test_insights(self, s, admin_headers):
        r = s.get(f"{API}/insights", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        _ok(r)


# -------------------- Preferences --------------------

class TestPreferences:
    def test_get_and_update(self, s, admin_headers):
        r = s.get(f"{API}/preferences", headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        prefs = _ok(r)
        assert isinstance(prefs, dict)
        new_prefs = {
            "defaultCategory": "fashion",
            "sortPreference": "lowest_price",
            "weightProfile": "startup",
            "businessType": "startup",
        }
        r2 = s.put(f"{API}/preferences", headers=admin_headers, json=new_prefs, timeout=20)
        assert r2.status_code == 200, r2.text
        updated = _ok(r2)
        for k, v in new_prefs.items():
            assert updated.get(k) == v, f"{k} = {updated.get(k)} expected {v}"
        # Re-fetch verifies persistence
        r3 = s.get(f"{API}/preferences", headers=admin_headers, timeout=20)
        fetched = _ok(r3)
        for k, v in new_prefs.items():
            assert fetched.get(k) == v
