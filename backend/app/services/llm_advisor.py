"""
LLM Procurement Advisor — Gemini-powered natural language explanations.

Generates human-readable AI procurement advice from recommendation data
using Google Gemini 2.0 Flash. Falls back to template-based explanation
if no API key is set or if the API call fails.
"""
from __future__ import annotations

from app.config import env


def _format_inr(amount: float) -> str:
    """Format a number as Indian Rupee string."""
    try:
        if amount >= 100_000:
            return f"₹{amount / 100_000:.1f}L"
        if amount >= 1_000:
            return f"₹{amount:,.0f}"
        return f"₹{amount:.0f}"
    except Exception:
        return f"₹{amount}"


def _build_prompt(recommendation: dict, products: list[dict], mode: str) -> str:
    """Build a structured prompt for Gemini from recommendation data."""
    try:
        best = recommendation.get("product", {})
        supplier = recommendation.get("supplier", "Unknown")
        savings = recommendation.get("estimatedSavings", 0)
        confidence = recommendation.get("confidence", 0)
        factors = recommendation.get("factors", [])
        scoreboard = recommendation.get("scoreboard", [])

        # Build competitor summary
        competitors = []
        for p in products:
            if p["provider"] != supplier:
                competitors.append(
                    f"- {p['provider']}: ₹{p['price']:,.0f}, "
                    f"rating {p.get('rating', 0)}/5, "
                    f"{p.get('deliveryDays', 0)}d delivery"
                )

        competitor_text = "\n".join(competitors[:5]) if competitors else "No other suppliers"

        # Build factor summary
        factor_text = ", ".join(
            f"{f['label']}: {round(f['score'] * 100)}%"
            for f in factors
        ) if factors else "N/A"

        # Mode label mapping
        mode_labels = {
            "balanced": "Balanced (best overall value)",
            "lowest_cost": "Lowest Total Procurement Cost",
            "lowest_risk": "Lowest Procurement Risk",
            "fastest_delivery": "Fastest Delivery",
            "highest_reliability": "Highest Supplier Reliability",
            "best_long_term_value": "Best Long-Term Value",
        }
        mode_label = mode_labels.get(mode, mode)

        prompt = f"""You are a procurement advisor for an enterprise procurement platform called ProcureAI.

Based on the following data, write a concise 2-3 sentence natural language explanation of why this supplier was recommended. Write in a professional, confident tone. Use specific numbers (prices, delivery days, savings). Do NOT use bullet points or markdown formatting — write flowing prose.

PROCUREMENT STRATEGY: {mode_label}

RECOMMENDED SUPPLIER: {supplier}
- Product: {best.get('title', 'N/A')}
- Price: ₹{best.get('price', 0):,.0f}
- Rating: {best.get('rating', 0)}/5
- Delivery: {best.get('deliveryDays', 0)} days
- Discount: {best.get('discount', 0)}%

COMPETING SUPPLIERS:
{competitor_text}

SCORING FACTORS: {factor_text}
ESTIMATED SAVINGS: ₹{savings:,.0f}
AI CONFIDENCE: {round(confidence * 100)}%

Write the explanation now. Keep it under 80 words. Start with the supplier name."""

        return prompt
    except Exception:
        return ""


def _template_fallback(recommendation: dict, products: list[dict], mode: str) -> str:
    """Generate a template-based explanation when Gemini is unavailable."""
    try:
        supplier = recommendation.get("supplier", "Unknown")
        best = recommendation.get("product", {})
        price = best.get("price", 0)
        delivery = best.get("deliveryDays", 0)
        savings = recommendation.get("estimatedSavings", 0)
        others = [p for p in products if p["provider"] != supplier]

        parts = [f"{supplier} is recommended"]

        if mode == "lowest_cost":
            parts.append(f"because it offers the lowest total procurement cost at {_format_inr(price)}")
        elif mode == "lowest_risk":
            parts.append("because it has the lowest procurement risk while maintaining competitive pricing")
        elif mode == "fastest_delivery":
            parts.append(f"for urgent procurement with delivery in {delivery} day{'s' if delivery != 1 else ''}")
        elif mode == "highest_reliability":
            parts.append("because it has the highest delivery reliability, minimising supply chain disruptions")
        elif mode == "best_long_term_value":
            parts.append("for long-term procurement due to its strong supplier score and consistent reliability")
        else:
            parts.append(f"because it offers the best balance of cost ({_format_inr(price)}), "
                         f"{delivery}-day delivery, and reliability")

        if savings > 0:
            parts.append(f", saving an estimated {_format_inr(savings)} compared to the most expensive option")

        if others:
            cheapest_other = min(others, key=lambda p: p["price"])
            if cheapest_other["price"] < price:
                diff = price - cheapest_other["price"]
                parts.append(f". Although {cheapest_other['provider']} is {_format_inr(diff)} cheaper, "
                             f"{supplier} provides better overall value considering delivery and reliability")

        return "".join(parts) + "."
    except Exception:
        return ""


async def generate_explanation(recommendation: dict, products: list[dict], mode: str = "balanced") -> str:
    """Generate a natural language AI explanation for a procurement recommendation.

    Uses Google Gemini if GEMINI_API_KEY is set, otherwise falls back to template.
    Never raises — returns empty string on failure.
    """
    try:
        api_key = env.GEMINI_API_KEY
        if not api_key:
            return _template_fallback(recommendation, products, mode)

        prompt = _build_prompt(recommendation, products, mode)
        if not prompt:
            return _template_fallback(recommendation, products, mode)

        from google import genai

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )

        text = response.text.strip() if response.text else ""

        if not text:
            return _template_fallback(recommendation, products, mode)

        # Clean up any markdown formatting the model might add
        text = text.replace("**", "").replace("*", "").replace("#", "").strip()

        return text

    except Exception as e:
        print(f"[WARN] Gemini API failed, using template fallback: {e}")
        try:
            return _template_fallback(recommendation, products, mode)
        except Exception:
            return ""
