import { historyRepository } from '../repositories/HistoryRepository';
import { formatINR } from '../utils/currency';
import { CATEGORIES } from '../config/data';

function topByCount<T extends string>(items: T[]): { value: T | null; counts: Record<string, number> } {
  const counts: Record<string, number> = {};
  for (const it of items) {
    if (!it) continue;
    counts[it] = (counts[it] || 0) + 1;
  }
  let best: T | null = null;
  let max = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (v > max) {
      max = v;
      best = k as T;
    }
  }
  return { value: best, counts };
}

function monthKey(d: Date): string {
  return d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
}

const categoryName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name || slug;

export class DashboardService {
  static async summary(userId: string) {
    const history = await historyRepository.allByUser(userId);
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const monthlySavings = history
      .filter((h) => {
        const d = new Date((h as any).createdAt);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      })
      .reduce((sum, h) => sum + (h.estimatedSavings || 0), 0);

    const totalSavings = history.reduce((sum, h) => sum + (h.estimatedSavings || 0), 0);
    const supplier = topByCount(history.map((h) => h.recommendedSupplier).filter(Boolean) as string[]);
    const category = topByCount(history.map((h) => h.category).filter(Boolean) as string[]);
    const activeCategories = new Set(history.map((h) => h.category)).size;

    return {
      totalSearches: history.length,
      procurementRequests: history.filter((h) => h.recommendedSupplier).length,
      estimatedMonthlySavings: Math.round(monthlySavings),
      totalSavings: Math.round(totalSavings),
      preferredSupplier: supplier.value,
      topCategory: category.value ? categoryName(category.value) : null,
      topCategorySlug: category.value,
      activeCategories,
      projectedAnnualSavings: Math.round(monthlySavings * 12),
      recentSearches: history.slice(0, 6).map((h) => ({
        id: (h as any).id || String((h as any)._id),
        query: h.query,
        category: categoryName(h.category),
        categorySlug: h.category,
        suppliers: h.suppliers,
        recommendedSupplier: h.recommendedSupplier,
        estimatedSavings: h.estimatedSavings,
        bestPrice: h.bestPrice,
        timestamp: (h as any).createdAt,
      })),
    };
  }

  static async spend(userId: string) {
    const history = await historyRepository.allByUser(userId);

    const byMonth: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const bySupplier: Record<string, number> = {};

    for (const h of history) {
      const d = new Date((h as any).createdAt);
      const mk = monthKey(d);
      byMonth[mk] = (byMonth[mk] || 0) + (h.bestPrice || 0);
      const cName = categoryName(h.category);
      byCategory[cName] = (byCategory[cName] || 0) + (h.bestPrice || 0);
      if (h.recommendedSupplier) {
        bySupplier[h.recommendedSupplier] = (bySupplier[h.recommendedSupplier] || 0) + 1;
      }
    }

    return {
      monthlySpend: Object.entries(byMonth).map(([month, amount]) => ({ month, amount: Math.round(amount) })),
      categorySpend: Object.entries(byCategory)
        .map(([category, amount]) => ({ category, amount: Math.round(amount) }))
        .sort((a, b) => b.amount - a.amount),
      supplierUsage: Object.entries(bySupplier)
        .map(([supplier, count]) => ({ supplier, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  static async savings(userId: string) {
    const history = await historyRepository.allByUser(userId);
    const byMonth: Record<string, number> = {};
    for (const h of history) {
      const d = new Date((h as any).createdAt);
      const mk = monthKey(d);
      byMonth[mk] = (byMonth[mk] || 0) + (h.estimatedSavings || 0);
    }
    return {
      savingsTrend: Object.entries(byMonth).map(([month, amount]) => ({ month, amount: Math.round(amount) })),
      totalSavings: Math.round(history.reduce((s, h) => s + (h.estimatedSavings || 0), 0)),
    };
  }

  static async insights(userId: string) {
    const history = await historyRepository.allByUser(userId);
    const insights: { icon: string; text: string; tone: 'success' | 'info' | 'warning' }[] = [];

    if (!history.length) {
      return {
        insights: [
          { icon: 'Sparkles', text: 'Run your first search to unlock AI-generated procurement insights.', tone: 'info' as const },
        ],
      };
    }

    const monthSavings = history
      .filter((h) => {
        const d = new Date((h as any).createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, h) => s + (h.estimatedSavings || 0), 0);

    if (monthSavings > 0) {
      insights.push({
        icon: 'TrendingUp',
        text: `You saved ${formatINR(monthSavings)} this month by following AI recommendations.`,
        tone: 'success',
      });
      insights.push({
        icon: 'PiggyBank',
        text: `At this rate your business could save approximately ${formatINR(monthSavings * 12)} annually by switching to recommended suppliers.`,
        tone: 'success',
      });
    }

    // Best-priced supplier per category (by avg bestPrice).
    const supplierWins = topByCount(history.map((h) => h.recommendedSupplier).filter(Boolean) as string[]);
    if (supplierWins.value) {
      insights.push({
        icon: 'Award',
        text: `${supplierWins.value} is your most frequently recommended supplier — it wins on your priorities most often.`,
        tone: 'info',
      });
    }

    const cat = topByCount(history.map((h) => h.category).filter(Boolean) as string[]);
    if (cat.value) {
      insights.push({
        icon: 'Layers',
        text: `${categoryName(cat.value)} is your most active procurement category with ${cat.counts[cat.value]} searches.`,
        tone: 'info',
      });
    }

    return { insights };
  }
}
