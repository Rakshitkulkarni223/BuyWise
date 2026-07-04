"""
Core search pipeline: PRNG, CatalogResolver, MockProviderAdapter,
ComparisonService, RecommendationService, SearchService.

Faithfully replicates the Node.js/TypeScript logic so the API produces
identical results for the same inputs.
"""
from __future__ import annotations

import asyncio
import math
import random
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from app.config import (
    CATALOG,
    CATEGORY_SUPPLIERS,
    DEFAULT_CATEGORY_BASE_PRICE,
    SUPPLIER_PROFILES,
    WEIGHT_PROFILES,
    clamp,
    format_inr,
)


# ===================================================================
# Seeded PRNG (port of utils/prng.ts)
# ===================================================================

def _xfnv1a(s: str) -> int:
    try:
        h = 2166136261
        for ch in s:
            h = (h ^ ord(ch)) & 0xFFFFFFFF
            h = (h * 16777619) & 0xFFFFFFFF
        return h
    except Exception:
        return 0


def _mulberry32(seed: int):
    a = seed & 0xFFFFFFFF

    def _next():
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = a
        t = ((t ^ (t >> 15)) * (1 | t)) & 0xFFFFFFFF
        t2 = (t + (((t ^ (t >> 7)) * (61 | t)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        t2 = t2 ^ t
        return ((t2 ^ (t2 >> 14)) & 0xFFFFFFFF) / 4294967296
    return _next


class SeededRandom:
    def __init__(self, seed_string: str):
        try:
            self._rng = _mulberry32(_xfnv1a(seed_string))
        except Exception:
            self._rng = lambda: random.random()

    def next(self) -> float:
        return self._rng()

    def range(self, mn: float, mx: float) -> float:
        return mn + self._rng() * (mx - mn)

    def int(self, mn: int, mx: int) -> int:
        return math.floor(self.range(mn, mx + 1))

    def chance(self, probability: float) -> bool:
        return self._rng() < probability


# ===================================================================
# CatalogResolver (port of services/CatalogResolver.ts)
# ===================================================================

def _tokenize(text: str) -> list[str]:
    try:
        cleaned = re.sub(r"[^a-z0-9\s]", " ", text.lower())
        return [t for t in cleaned.split() if len(t) > 1]
    except Exception:
        return []


def _score_template(tpl: dict, tokens: list[str]) -> float:
    try:
        haystack = " ".join([tpl["title"], tpl["brand"]] + tpl["keywords"]).lower()
        score = 0.0
        for tok in tokens:
            if any(k.lower() == tok for k in tpl["keywords"]):
                score += 3
            elif tok in haystack:
                score += 1.5
        return score
    except Exception:
        return 0.0


class CatalogResolver:
    @staticmethod
    def resolve_or_null(category: str, query: str) -> Optional[dict]:
        try:
            tokens = _tokenize(query)
            templates = CATALOG.get(category, [])
            best, best_score = None, 0.0
            for tpl in templates:
                s = _score_template(tpl, tokens)
                if s > best_score:
                    best_score = s
                    best = tpl
            return best if best and best_score > 0 else None
        except Exception:
            return None

    @staticmethod
    def resolve(category: str, query: str) -> dict:
        try:
            tokens = _tokenize(query)
            templates = CATALOG.get(category, [])
            best, best_score = None, 0.0
            for tpl in templates:
                s = _score_template(tpl, tokens)
                if s > best_score:
                    best_score = s
                    best = tpl
            if best and best_score > 0:
                return best
            clean_query = query.strip() or "Procurement Item"
            title = " ".join(w.capitalize() for w in clean_query.split())
            return {
                "id": f"generic-{category}-{clean_query.lower().replace(' ', '-')}",
                "title": title,
                "brand": "Generic",
                "basePrice": DEFAULT_CATEGORY_BASE_PRICE.get(category, 1000),
                "image": "",
                "keywords": tokens,
            }
        except Exception:
            return {"id": "generic-fallback", "title": query, "brand": "Generic", "basePrice": 1000, "image": "", "keywords": []}


# ===================================================================
# MockProviderAdapter (port of adapters/MockProviderAdapter.ts)
# ===================================================================

class MockProviderAdapter:
    def __init__(self, profile: dict):
        try:
            self.profile = profile
            self.name: str = profile["name"]
        except Exception:
            raise

    async def search(self, query: str, category: str) -> list[dict]:
        try:
            await asyncio.sleep(0.04 + random.random() * 0.12)
            tpl = CatalogResolver.resolve_or_null(category, query)
            if not tpl:
                return []
            rng = SeededRandom(f"{query.lower().strip()}#{tpl['id']}#{self.name}")
            p = self.profile

            price_jitter = rng.range(0.8, 1.2)
            price = round((tpl["basePrice"] * p["priceFactor"] * price_jitter) / 10) * 10

            discount = int(clamp(round(p["discountBias"] + rng.range(-6, 8)), 0, 70))
            original_price = round(price / (1 - discount / 100) / 10) * 10

            rating = round(clamp(p["baseRating"] + rng.range(-0.4, 0.3), 3, 5) * 10) / 10
            reviews = rng.int(60, 9000)
            availability = rng.chance(p["stockProbability"])

            delivery_days = max(0, p["deliveryDays"] + rng.int(-1, 1))
            delivery_date = datetime.now(timezone.utc) + timedelta(days=delivery_days)

            return [{
                "id": f"{self.name.lower().replace(' ', '-')}-{tpl['id']}",
                "provider": self.name,
                "title": tpl["title"],
                "brand": tpl["brand"],
                "category": category,
                "image": tpl["image"],
                "price": price,
                "originalPrice": original_price,
                "discount": discount,
                "rating": rating,
                "reviews": reviews,
                "availability": availability,
                "deliveryDays": delivery_days,
                "deliveryDate": delivery_date.isoformat(),
                "warrantyMonths": p.get("warrantyMonths") or None,
                "returnPolicyDays": p.get("returnDays"),
                "productUrl": f"https://example.com/{self.name.lower().replace(' ', '')}/product/{tpl['id']}",
            }]
        except Exception as e:
            print(f"MockProviderAdapter[{self.name}] search failed: {e}")
            return []


# ===================================================================
# ProviderFactory
# ===================================================================

class ProviderFactory:
    @staticmethod
    def create(supplier_name: str) -> Optional[MockProviderAdapter]:
        try:
            profile = SUPPLIER_PROFILES.get(supplier_name)
            if not profile:
                return None
            return MockProviderAdapter(profile)
        except Exception:
            return None


# ===================================================================
# ComparisonService (port of services/ComparisonService.ts)
# ===================================================================

def _sort_key(sort_by: Optional[str]):
    try:
        if sort_by == "highest_rating":
            return lambda p: -p["rating"]
        if sort_by == "fastest_delivery":
            return lambda p: p["deliveryDays"]
        if sort_by == "highest_discount":
            return lambda p: -p["discount"]
        return lambda p: p["price"]  # lowest_price default
    except Exception:
        return lambda p: p.get("price", 0)


class ComparisonService:
    @staticmethod
    def apply(products: list[dict], sort_by: Optional[str] = None, filters: Optional[dict] = None) -> list[dict]:
        try:
            deduped = ComparisonService._dedupe(products)
            filtered = ComparisonService._filter(deduped, filters)
            filtered.sort(key=_sort_key(sort_by))
            return filtered
        except Exception:
            return products

    @staticmethod
    def _dedupe(products: list[dict]) -> list[dict]:
        try:
            seen: set[str] = set()
            out: list[dict] = []
            for p in products:
                if p["id"] in seen:
                    continue
                seen.add(p["id"])
                out.append(p)
            return out
        except Exception:
            return products

    @staticmethod
    def _filter(products: list[dict], filters: Optional[dict]) -> list[dict]:
        try:
            if not filters:
                return products
            out = []
            for p in products:
                if filters.get("brand") and filters["brand"].lower() not in p.get("brand", "").lower():
                    continue
                if filters.get("supplier") and p.get("provider") != filters["supplier"]:
                    continue
                if filters.get("minRating") is not None and p.get("rating", 0) < filters["minRating"]:
                    continue
                if filters.get("maxPrice") is not None and p.get("price", 0) > filters["maxPrice"]:
                    continue
                if filters.get("inStockOnly") and not p.get("availability"):
                    continue
                out.append(p)
            return out
        except Exception:
            return products


# ===================================================================
# RecommendationService (port of services/RecommendationService.ts)
# ===================================================================

class RecommendationService:
    @staticmethod
    def recommend(products: list[dict], profile_key: str = "balanced") -> Optional[dict]:
        try:
            if not products:
                return None

            profile = WEIGHT_PROFILES.get(profile_key, WEIGHT_PROFILES["balanced"])
            w = profile["weights"]
            weight_sum = (
                w["price"] + w["delivery"] + w["rating"] + w["discount"]
                + w["availability"] + w["warranty"] + w["returnPolicy"]
            ) or 1

            prices = [p["price"] for p in products]
            days = [p["deliveryDays"] for p in products]
            warranties = [p.get("warrantyMonths") or 0 for p in products]
            returns = [p.get("returnPolicyDays") or 0 for p in products]

            min_price, max_price = min(prices), max(prices)
            min_days, max_days = min(days), max(days)
            max_warranty = max(warranties)
            max_return = max(returns)

            def norm(val, mn, mx, invert=False):
                if mx == mn:
                    return 1
                s = (val - mn) / (mx - mn)
                return 1 - s if invert else s

            scored = []
            for p in products:
                ps = norm(p["price"], min_price, max_price, invert=True)
                ds = norm(p["deliveryDays"], min_days, max_days, invert=True)
                rs = p["rating"] / 5
                disc_s = clamp(p["discount"] / 100, 0, 1)
                avail_s = 1 if p["availability"] else 0
                war_s = ((p.get("warrantyMonths") or 0) / max_warranty) if max_warranty > 0 else 0
                ret_s = ((p.get("returnPolicyDays") or 0) / max_return) if max_return > 0 else 0

                factors = [
                    {"label": "Price", "weight": w["price"], "score": ps},
                    {"label": "Delivery", "weight": w["delivery"], "score": ds},
                    {"label": "Rating", "weight": w["rating"], "score": rs},
                    {"label": "Discount", "weight": w["discount"], "score": disc_s},
                    {"label": "Availability", "weight": w["availability"], "score": avail_s},
                    {"label": "Warranty", "weight": w["warranty"], "score": war_s},
                    {"label": "Return Policy", "weight": w["returnPolicy"], "score": ret_s},
                ]

                score = (
                    w["price"] * ps + w["delivery"] * ds + w["rating"] * rs
                    + w["discount"] * disc_s + w["availability"] * avail_s
                    + w["warranty"] * war_s + w["returnPolicy"] * ret_s
                ) / weight_sum

                scored.append({
                    "product": p,
                    "score": score,
                    "factors": [f for f in factors if f["weight"] > 0],
                })

            scored.sort(key=lambda x: -x["score"])
            top = scored[0]
            runner_up = scored[1] if len(scored) > 1 else None

            confidence = (
                clamp((top["score"] - runner_up["score"]) / top["score"], 0, 1)
                if runner_up and top["score"] > 0
                else 0.7
            )

            estimated_savings = max(0, max_price - top["product"]["price"])

            return {
                "supplier": top["product"]["provider"],
                "product": top["product"],
                "reasons": RecommendationService._build_reasons(
                    top["product"], products, min_price, max_price, min_days, max_warranty
                ),
                "estimatedSavings": estimated_savings,
                "confidence": round(confidence * 100) / 100,
                "weightProfile": profile_key,
                "factors": top["factors"],
                "scoreboard": [
                    {"supplier": s["product"]["provider"], "score": round(s["score"] * 1000) / 1000, "price": s["product"]["price"]}
                    for s in scored
                ],
            }
        except Exception:
            return None

    @staticmethod
    def _build_reasons(best: dict, all_products: list[dict], min_price, max_price, min_days, max_warranty) -> list[str]:
        try:
            reasons: list[str] = []
            others = [p for p in all_products if p["provider"] != best["provider"]]

            if best["price"] == min_price and others:
                priciest = max(all_products, key=lambda p: p["price"])
                diff = max_price - best["price"]
                if diff > 0:
                    reasons.append(f"{format_inr(diff)} cheaper than {priciest['provider']} (highest priced)")
                else:
                    reasons.append("Lowest price across all suppliers")
            elif others:
                cheaper = next((p for p in all_products if p["price"] < best["price"]), None)
                if cheaper:
                    reasons.append(f"Competitive price at {format_inr(best['price'])}")

            if best["deliveryDays"] == 0:
                reasons.append("Same-day delivery available")
            elif best["deliveryDays"] == min_days:
                d = best["deliveryDays"]
                reasons.append(f"Fastest delivery \u2014 {d} day{'s' if d > 1 else ''}")
            else:
                reasons.append(f"Delivery in {best['deliveryDays']} days")

            reviews = best["reviews"]
            reasons.append(f"Supplier rating {best['rating']}/5 ({reviews:,} reviews)")

            if best["discount"] > 0:
                reasons.append(f"{best['discount']}% discount applied")

            reasons.append("In stock and ready to ship" if best["availability"] else "Currently low on stock")

            wm = best.get("warrantyMonths")
            if wm and wm > 0:
                reasons.append(f"{wm}-month warranty included")

            return reasons[:5]
        except Exception:
            return []


# ===================================================================
# SearchService (port of services/SearchService.ts)
# ===================================================================

class SearchService:
    @staticmethod
    async def gather(query: str, category: str, suppliers: list[str]) -> list[dict]:
        """Query every supplier adapter in parallel."""
        try:
            adapters = [
                a for a in (ProviderFactory.create(name) for name in suppliers) if a is not None
            ]
            results = await asyncio.gather(
                *[a.search(query, category) for a in adapters],
                return_exceptions=True,
            )
            products: list[dict] = []
            for i, r in enumerate(results):
                if isinstance(r, list):
                    products.extend(r)
                else:
                    print(f'Provider "{adapters[i].name}" failed: {r}')
            return products
        except Exception:
            return []

    @staticmethod
    async def search(user_id: str, req: dict) -> dict:
        try:
            category = req.get("category", "")
            query = req.get("query", "").strip()
            if not query:
                raise ValueError("Search query is required")
            if not category:
                raise ValueError("Category is required")

            valid = CATEGORY_SUPPLIERS.get(category, [])
            suppliers = req.get("suppliers") or []
            suppliers = [s for s in suppliers if s in valid] if suppliers else []
            if not suppliers:
                suppliers = valid
            if not suppliers:
                raise ValueError(f"Unknown category: {category}")

            products = await SearchService.gather(query, category, suppliers)
            results = ComparisonService.apply(
                products, req.get("sortBy"), req.get("filters")
            )
            recommendation = RecommendationService.recommend(results, req.get("weightProfile", "balanced"))

            return {
                "query": query,
                "category": category,
                "count": len(results),
                "results": results,
                "recommendation": recommendation,
            }
        except Exception:
            raise

    @staticmethod
    async def search_preview(query: str, category: str, suppliers: list[str]) -> dict:
        """Like search() but without history persistence. Used by the seeder."""
        try:
            valid = CATEGORY_SUPPLIERS.get(category, [])
            enabled = [s for s in suppliers if s in valid]
            supplier_list = enabled if enabled else valid

            products = await SearchService.gather(query, category, supplier_list)
            results = ComparisonService.apply(products, "lowest_price")
            recommendation = RecommendationService.recommend(results, "balanced")
            return {"query": query, "category": category, "count": len(results), "results": results, "recommendation": recommendation}
        except Exception:
            return {"query": query, "category": category, "count": 0, "results": [], "recommendation": None}
