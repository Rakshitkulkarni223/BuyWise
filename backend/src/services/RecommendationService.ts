import { Product, Recommendation, RecommendationFactor, WeightProfileKey } from '../types';
import { WEIGHT_PROFILES } from '../config/data';
import { clamp, formatINR } from '../utils/currency';

interface Scored {
  product: Product;
  score: number;
  factors: RecommendationFactor[];
}

/**
 * AI Procurement Decision Engine.
 * Normalizes every factor to 0..1, multiplies by a configurable weight, and sums
 * to a final score. The supplier with the highest score is recommended; the gap
 * to the runner-up drives the confidence. Produces human-readable reasons.
 */
export class RecommendationService {
  static recommend(
    products: Product[],
    profileKey: WeightProfileKey = 'balanced',
  ): Recommendation | null {
    if (!products.length) return null;

    const profile = WEIGHT_PROFILES[profileKey] || WEIGHT_PROFILES.balanced;
    const w = profile.weights;
    const weightSum =
      w.price + w.delivery + w.rating + w.discount + w.availability + w.warranty + w.returnPolicy || 1;

    const prices = products.map((p) => p.price);
    const days = products.map((p) => p.deliveryDays);
    const warranties = products.map((p) => p.warrantyMonths || 0);
    const returns = products.map((p) => p.returnPolicyDays || 0);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minDays = Math.min(...days);
    const maxDays = Math.max(...days);
    const maxWarranty = Math.max(...warranties);
    const maxReturn = Math.max(...returns);

    const norm = (val: number, min: number, max: number, invert = false): number => {
      if (max === min) return 1;
      const s = (val - min) / (max - min);
      return invert ? 1 - s : s;
    };

    const scored: Scored[] = products.map((p) => {
      const priceScore = norm(p.price, minPrice, maxPrice, true);
      const deliveryScore = norm(p.deliveryDays, minDays, maxDays, true);
      const ratingScore = p.rating / 5;
      const discountScore = clamp(p.discount / 100, 0, 1);
      const availabilityScore = p.availability ? 1 : 0;
      const warrantyScore = maxWarranty > 0 ? (p.warrantyMonths || 0) / maxWarranty : 0;
      const returnScore = maxReturn > 0 ? (p.returnPolicyDays || 0) / maxReturn : 0;

      const factors: RecommendationFactor[] = [
        { label: 'Price', weight: w.price, score: priceScore },
        { label: 'Delivery', weight: w.delivery, score: deliveryScore },
        { label: 'Rating', weight: w.rating, score: ratingScore },
        { label: 'Discount', weight: w.discount, score: discountScore },
        { label: 'Availability', weight: w.availability, score: availabilityScore },
        { label: 'Warranty', weight: w.warranty, score: warrantyScore },
        { label: 'Return Policy', weight: w.returnPolicy, score: returnScore },
      ];

      const score =
        (w.price * priceScore +
          w.delivery * deliveryScore +
          w.rating * ratingScore +
          w.discount * discountScore +
          w.availability * availabilityScore +
          w.warranty * warrantyScore +
          w.returnPolicy * returnScore) /
        weightSum;

      return { product: p, score, factors: factors.filter((f) => f.weight > 0) };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored[0];
    const runnerUp = scored[1];

    const confidence = runnerUp && top.score > 0
      ? clamp((top.score - runnerUp.score) / top.score, 0, 1)
      : 0.7;

    const estimatedSavings = Math.max(0, maxPrice - top.product.price);

    return {
      supplier: top.product.provider,
      product: top.product,
      reasons: RecommendationService.buildReasons(top.product, products, {
        minPrice,
        maxPrice,
        minDays,
        maxWarranty,
      }),
      estimatedSavings,
      confidence: Math.round(confidence * 100) / 100,
      weightProfile: profileKey,
      factors: top.factors,
      scoreboard: scored.map((s) => ({
        supplier: s.product.provider,
        score: Math.round(s.score * 1000) / 1000,
        price: s.product.price,
      })),
    };
  }

  private static buildReasons(
    best: Product,
    all: Product[],
    stats: { minPrice: number; maxPrice: number; minDays: number; maxWarranty: number },
  ): string[] {
    const reasons: string[] = [];
    const others = all.filter((p) => p.provider !== best.provider);

    if (best.price === stats.minPrice && others.length) {
      const priciest = all.reduce((a, b) => (b.price > a.price ? b : a));
      const diff = stats.maxPrice - best.price;
      if (diff > 0) {
        reasons.push(`${formatINR(diff)} cheaper than ${priciest.provider} (highest priced)`);
      } else {
        reasons.push('Lowest price across all suppliers');
      }
    } else if (others.length) {
      const cheaper = all.find((p) => p.price < best.price);
      if (cheaper) {
        reasons.push(`Competitive price at ${formatINR(best.price)}`);
      }
    }

    if (best.deliveryDays === 0) {
      reasons.push('Same-day delivery available');
    } else if (best.deliveryDays === stats.minDays) {
      reasons.push(`Fastest delivery — ${best.deliveryDays} day${best.deliveryDays > 1 ? 's' : ''}`);
    } else {
      reasons.push(`Delivery in ${best.deliveryDays} days`);
    }

    reasons.push(`Supplier rating ${best.rating}/5 (${best.reviews.toLocaleString('en-IN')} reviews)`);

    if (best.discount > 0) {
      reasons.push(`${best.discount}% discount applied`);
    }

    reasons.push(best.availability ? 'In stock and ready to ship' : 'Currently low on stock');

    if (best.warrantyMonths && best.warrantyMonths > 0) {
      reasons.push(`${best.warrantyMonths}-month warranty included`);
    }

    return reasons.slice(0, 5);
  }
}
