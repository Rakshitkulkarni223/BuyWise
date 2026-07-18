"""
SerpAPI Google Shopping Provider Adapter — fetches real product data from
Google Shopping via the SerpAPI service.

Returns products in the same dict format as MockProviderAdapter so they
flow through the existing search, comparison, recommendation, and basket
pipelines without any changes.

Optional: if SERPAPI_KEY is not set, search() returns [] silently.
"""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx

from app.config import env


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_delivery_days(delivery_text: str) -> int:
    """Extract estimated delivery days from SerpAPI delivery string."""
    try:
        if not delivery_text:
            return 5
        text = delivery_text.lower()
        # "Free delivery by Thu, Jul 24" — estimate days from keywords
        if "today" in text or "same day" in text:
            return 0
        if "tomorrow" in text:
            return 1
        # "delivery by <date>" — try to parse relative
        day_match = re.search(r"(\d+)\s*(?:day|business day)", text)
        if day_match:
            return int(day_match.group(1))
        # "Free delivery" without date — assume 3-5 days
        if "free" in text:
            return 4
        return 5
    except Exception:
        return 5


def _parse_price(price_val) -> Optional[float]:
    """Parse price from SerpAPI — could be float, int, or string like '₹1,299'."""
    try:
        if price_val is None:
            return None
        if isinstance(price_val, (int, float)):
            return round(float(price_val))
        # String: remove currency symbols, commas, spaces
        cleaned = re.sub(r"[^\d.]", "", str(price_val))
        if cleaned:
            return round(float(cleaned))
        return None
    except Exception:
        return None


def _extract_brand(title: str) -> str:
    """Extract a likely brand name from the product title (first word or two)."""
    try:
        if not title:
            return "Generic"
        parts = title.split()
        if len(parts) >= 1:
            return parts[0]
        return "Generic"
    except Exception:
        return "Generic"


# ---------------------------------------------------------------------------
# SerpAPI Provider Adapter
# ---------------------------------------------------------------------------

class SerpAPIProviderAdapter:
    """Fetches real Google Shopping results via SerpAPI.

    Implements the same interface as MockProviderAdapter:
        async search(query: str, category: str) -> list[dict]
    """

    SERPAPI_URL = "https://serpapi.com/search.json"

    def __init__(self):
        try:
            self.name = "Google Shopping"
            self.api_key = getattr(env, "SERPAPI_KEY", "") or ""
        except Exception:
            self.name = "Google Shopping"
            self.api_key = ""

    async def search(self, query: str, category: str) -> list[dict]:
        """Query Google Shopping via SerpAPI and return normalized product dicts."""
        try:
            if not self.api_key:
                return []

            params = {
                "engine": "google_shopping",
                "q": query,
                "api_key": self.api_key,
                "gl": "in",          # India
                "hl": "en",          # English
                "num": 10,           # Limit results to conserve quota
            }

            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(self.SERPAPI_URL, params=params)

            if resp.status_code != 200:
                print(f"[WARN] SerpAPI returned status {resp.status_code}: {resp.text[:200]}")
                return []

            data = resp.json()
            shopping_results = data.get("shopping_results", [])
            if not shopping_results:
                return []

            products: list[dict] = []
            now = datetime.now(timezone.utc)

            for item in shopping_results:
                try:
                    title = item.get("title", "")
                    if not title:
                        continue

                    # Price
                    price = _parse_price(item.get("extracted_price") or item.get("price"))
                    if price is None or price <= 0:
                        continue

                    # Original price / discount
                    old_price_raw = item.get("extracted_old_price") or item.get("old_price")
                    original_price = _parse_price(old_price_raw)
                    if original_price and original_price > price:
                        discount = int(round((1 - price / original_price) * 100))
                    else:
                        original_price = price
                        discount = 0

                    # Rating & reviews
                    rating = item.get("rating")
                    if rating is not None:
                        rating = round(min(5.0, max(0.0, float(rating))) * 10) / 10
                    else:
                        rating = 0.0

                    reviews = item.get("reviews", 0)
                    if isinstance(reviews, str):
                        reviews = int(re.sub(r"[^\d]", "", reviews) or "0")

                    # Source / seller — use real seller name (e.g. "Amazon.in", "Flipkart")
                    source = item.get("source") or "Online Store"

                    # Delivery
                    delivery_text = item.get("delivery") or ""
                    delivery_days = _parse_delivery_days(delivery_text)
                    delivery_date = now + timedelta(days=delivery_days)

                    # Product URL & image
                    product_url = item.get("link") or item.get("product_link") or ""
                    image = item.get("thumbnail") or ""

                    # Product ID
                    product_id_raw = item.get("product_id") or item.get("serpapi_product_api") or title[:20]
                    product_id = f"gshop-{hash(product_id_raw) % 1000000}"

                    products.append({
                        "id": product_id,
                        "provider": source,
                        "title": title,
                        "brand": _extract_brand(title),
                        "category": category,
                        "image": image,
                        "price": price,
                        "originalPrice": original_price,
                        "discount": discount,
                        "rating": rating,
                        "reviews": reviews,
                        "availability": True,
                        "deliveryDays": delivery_days,
                        "deliveryDate": delivery_date.isoformat(),
                        "warrantyMonths": None,
                        "returnPolicyDays": None,
                        "productUrl": product_url,
                        "supplierSource": "google_shopping",
                    })
                except Exception:
                    continue

            print(f"[INFO] SerpAPI returned {len(products)} products for query='{query}'")
            return products

        except httpx.TimeoutException:
            print(f"[WARN] SerpAPI timeout for query='{query}'")
            return []
        except Exception as e:
            print(f"[WARN] SerpAPI search failed: {e}")
            return []
