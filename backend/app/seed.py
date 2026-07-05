"""
Database seeder: categories, suppliers, demo user, sample search history.
Port of config/seed.ts.
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta

from bson import ObjectId

from app.auth import hash_password, verify_password
from app.config import (
    CATEGORIES,
    CATEGORY_SUPPLIERS,
    SUPPLIER_PROFILES,
    env,
)
from app.database import get_db
from app.services.core import SearchService


async def _seed_categories() -> None:
    try:
        db = get_db()
        for c in CATEGORIES:
            await db.categories.update_one(
                {"slug": c["slug"]},
                {"$set": {"name": c["name"], "icon": c["icon"], "description": c["description"], "enabled": True, "updatedAt": datetime.utcnow()},
                 "$setOnInsert": {"createdAt": datetime.utcnow()}},
                upsert=True,
            )
    except Exception as e:
        print(f"[WARN] seed categories failed: {e}")


async def _seed_suppliers() -> None:
    try:
        db = get_db()
        for category, suppliers in CATEGORY_SUPPLIERS.items():
            for name in suppliers:
                profile = SUPPLIER_PROFILES.get(name, {})
                await db.suppliers.update_one(
                    {"name": name, "category": category},
                    {"$set": {"color": profile.get("color", "#64748B"), "enabled": True, "updatedAt": datetime.utcnow()},
                     "$setOnInsert": {"createdAt": datetime.utcnow()}},
                    upsert=True,
                )
    except Exception as e:
        print(f"[WARN] seed suppliers failed: {e}")


async def _seed_user(email: str, password: str, name: str) -> dict:
    try:
        db = get_db()
        user = await db.users.find_one({"email": email.lower()})
        if not user:
            pw_hash = hash_password(password)
            result = await db.users.insert_one({
                "email": email.lower(),
                "passwordHash": pw_hash,
                "name": name,
                "role": "user",
                "businessType": "general",
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            })
            user = await db.users.find_one({"_id": result.inserted_id})
            print(f"[INFO] Seeded user: {email}")
        else:
            if not verify_password(password, user.get("passwordHash", "")):
                pw_hash = hash_password(password)
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"passwordHash": pw_hash, "updatedAt": datetime.utcnow()}},
                )
                print(f"[INFO] Updated password for {email}")

        await db.userpreferences.update_one(
            {"userId": user["_id"]},
            {"$setOnInsert": {"businessType": "general", "createdAt": datetime.utcnow(), "updatedAt": datetime.utcnow()}},
            upsert=True,
        )
        return user
    except Exception as e:
        print(f"[ERROR] Failed to seed user: {e}")
        raise


async def _seed_sample_history(user_id: ObjectId) -> None:
    try:
        db = get_db()
        existing = await db.searchhistories.count_documents({"userId": user_id})
        if existing > 0:
            return

        samples = [
            {"category": "fashion", "query": "Nike Running Shoes", "suppliers": ["Myntra", "Ajio", "Amazon", "Flipkart"], "daysAgo": 2},
            {"category": "fashion", "query": "Formal Suit Set", "suppliers": ["Myntra", "Ajio", "Amazon"], "daysAgo": 18},
            {"category": "electronics", "query": "Wireless Headphones", "suppliers": ["Amazon", "Flipkart", "Croma"], "daysAgo": 5},
            {"category": "grocery", "query": "Basmati Rice 25kg", "suppliers": ["Blinkit", "Zepto", "BigBasket", "JioMart"], "daysAgo": 9},
            {"category": "grocery", "query": "Premium Cooking Oil Pack", "suppliers": ["BigBasket", "JioMart", "Blinkit"], "daysAgo": 30},
            {"category": "grocery", "query": "Organic Spice Bundle", "suppliers": ["BigBasket", "Amazon", "JioMart"], "daysAgo": 52},
            {"category": "furniture", "query": "Ergonomic Office Chair", "suppliers": ["Pepperfry", "Urban Ladder", "IKEA"], "daysAgo": 14},
            {"category": "furniture", "query": "Standing Desk", "suppliers": ["IKEA", "Pepperfry", "Amazon"], "daysAgo": 38},
            {"category": "office", "query": "Printer Toner Cartridge", "suppliers": ["Amazon", "Flipkart", "Local Suppliers"], "daysAgo": 21},
            {"category": "office", "query": "A4 Copier Paper Bulk", "suppliers": ["Amazon", "Flipkart", "Local Suppliers"], "daysAgo": 45},
            {"category": "medical", "query": "First Aid Kit Professional", "suppliers": ["Apollo Pharmacy", "Netmeds", "Amazon"], "daysAgo": 33},
            {"category": "medical", "query": "Digital Blood Pressure Monitor", "suppliers": ["Apollo Pharmacy", "Amazon", "Flipkart"], "daysAgo": 55},
            {"category": "cleaning", "query": "Industrial Floor Cleaner", "suppliers": ["Amazon", "BigBasket", "JioMart"], "daysAgo": 41},
            {"category": "cleaning", "query": "Commercial Vacuum Cleaner", "suppliers": ["Amazon", "Flipkart", "Croma"], "daysAgo": 60},
        ]

        docs = []
        for s in samples:
            result = await SearchService.search_preview(s["query"], s["category"], s["suppliers"])
            date = datetime.utcnow() - timedelta(days=s["daysAgo"])
            docs.append({
                "userId": user_id,
                "query": s["query"],
                "category": s["category"],
                "suppliers": s["suppliers"],
                "resultCount": result["count"],
                "recommendedSupplier": result["recommendation"]["supplier"] if result.get("recommendation") else "",
                "bestPrice": result["recommendation"]["product"]["price"] if result.get("recommendation") else 0,
                "estimatedSavings": result["recommendation"]["estimatedSavings"] if result.get("recommendation") else 0,
                "weightProfile": "balanced",
                "createdAt": date,
                "updatedAt": date,
            })

        if docs:
            await db.searchhistories.insert_many(docs)
            print(f"[INFO] Seeded {len(docs)} sample searches for demo dashboard")
    except Exception as e:
        print(f"[WARN] seed sample history failed: {e}")


def _write_test_credentials() -> None:
    try:
        d = "/app/memory"
        if not os.path.exists(d):
            os.makedirs(d, exist_ok=True)
        content = f"""# Test Credentials \u2014 ProcureAI

## Demo Account
- Email: {env.DEMO_EMAIL}
- Password: {env.DEMO_PASSWORD}

## Auth
- Tokens are JWT (Bearer). Login returns {{ token, user }}. Send `Authorization: Bearer <token>`.
- Endpoints: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout

## Notes
- Backend: Python FastAPI on port {env.PORT}.
- All API routes are prefixed with /api.
- The demo account is seeded with ~14 sample searches so the dashboard/analytics are populated.
"""
        with open(os.path.join(d, "test_credentials.md"), "w") as f:
            f.write(content)
    except Exception as e:
        print(f"[WARN] Could not write test_credentials.md: {e}")


async def run_seed() -> None:
    try:
        await _seed_categories()
        await _seed_suppliers()
        demo_user = await _seed_user(env.DEMO_EMAIL, env.DEMO_PASSWORD, env.DEMO_NAME)
        await _seed_sample_history(demo_user["_id"])
        _write_test_credentials()
        print("[INFO] Seed complete")
    except Exception as e:
        print(f"[ERROR] Seed failed: {e}")
