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

export interface DateRange {
  from?: Date;
  to?: Date;
}

export class DashboardService {
  static async summary(userId: string, range?: DateRange) {
    const history = await historyRepository.allByUser(userId, range?.from, range?.to);
    const now = new Date();
    const totalSavings = history.reduce((sum, h) => sum + (h.estimatedSavings || 0), 0);

    let monthlySavings: number;
    if (range?.from || range?.to) {
      // Date range selected: compute average monthly savings over the span
      const earliest = range.from || (history.length ? new Date((history[history.length - 1] as any).createdAt) : now);
      const latest = range.to || now;
      const diffMs = Math.max(latest.getTime() - earliest.getTime(), 1);
      const months = Math.max(diffMs / (1000 * 60 * 60 * 24 * 30), 1);
      monthlySavings = totalSavings / months;
    } else {
      // No range: use current calendar month
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      monthlySavings = history
        .filter((h) => {
          const d = new Date((h as any).createdAt);
          return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        })
        .reduce((sum, h) => sum + (h.estimatedSavings || 0), 0);
    }

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

  static async spend(userId: string, range?: DateRange) {
    const history = await historyRepository.allByUser(userId, range?.from, range?.to);

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

  static async savings(userId: string, range?: DateRange) {
    const history = await historyRepository.allByUser(userId, range?.from, range?.to);
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

  static async insights(userId: string, range?: DateRange) {
    const history = await historyRepository.allByUser(userId, range?.from, range?.to);
    const insights: { icon: string; text: string; tone: 'success' | 'info' | 'warning' }[] = [];

    if (!history.length) {
      return {
        insights: [
          { icon: 'Sparkles', text: 'Run your first search to unlock AI-generated procurement insights.', tone: 'info' as const },
        ],
      };
    }

    const totalSavings = history.reduce((s, h) => s + (h.estimatedSavings || 0), 0);
    let periodSavings: number;
    let periodLabel: string;

    if (range?.from || range?.to) {
      const now = new Date();
      const earliest = range.from || (history.length ? new Date((history[history.length - 1] as any).createdAt) : now);
      const latest = range.to || now;
      const diffMs = Math.max(latest.getTime() - earliest.getTime(), 1);
      const months = Math.max(diffMs / (1000 * 60 * 60 * 24 * 30), 1);
      periodSavings = totalSavings / months;
      periodLabel = 'per month in this period';
    } else {
      const now = new Date();
      periodSavings = history
        .filter((h) => {
          const d = new Date((h as any).createdAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((s, h) => s + (h.estimatedSavings || 0), 0);
      periodLabel = 'this month';
    }

    if (periodSavings > 0) {
      insights.push({
        icon: 'TrendingUp',
        text: `You saved ${formatINR(periodSavings)} ${periodLabel} by following AI recommendations.`,
        tone: 'success',
      });
      insights.push({
        icon: 'PiggyBank',
        text: `At this rate your business could save approximately ${formatINR(periodSavings * 12)} annually by switching to recommended suppliers.`,
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

  static async businessImpact(userId: string, range?: DateRange) {
    try {
      const history = await historyRepository.allByUser(userId, range?.from, range?.to);
      const now = new Date();

      const totalSearches = history.length;
      const totalSavings = history.reduce((s, h) => s + (h.estimatedSavings || 0), 0);
      const optimizedPurchases = history.filter((h) => h.recommendedSupplier).length;
      const uniqueSuppliers = new Set(history.map((h) => h.recommendedSupplier).filter(Boolean)).size;
      const totalProductsCompared = history.reduce((s, h) => s + (h.suppliers?.length || 0), 0);

      // Avg time per manual comparison: ~45 min; ProcureAI: ~3 min => 42 min saved each
      const MANUAL_MINUTES = 45;
      const AI_MINUTES = 3;
      const minutesSaved = totalSearches * (MANUAL_MINUTES - AI_MINUTES);
      const hoursSaved = Math.round(minutesSaved / 60);

      const avgSavingPerPurchase = optimizedPurchases > 0 ? Math.round(totalSavings / optimizedPurchases) : 0;

      // Monthly savings
      let monthlySavings: number;
      if (range?.from || range?.to) {
        const earliest = range!.from || (history.length ? new Date((history[history.length - 1] as any).createdAt) : now);
        const latest = range!.to || now;
        const months = Math.max((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24 * 30), 1);
        monthlySavings = totalSavings / months;
      } else {
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        monthlySavings = history
          .filter((h) => {
            const d = new Date((h as any).createdAt);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
          })
          .reduce((s, h) => s + (h.estimatedSavings || 0), 0);
      }

      // AI recommendation accuracy (% searches that had a recommendation)
      const accuracyPct = totalSearches > 0 ? Math.round((optimizedPurchases / totalSearches) * 100) : 0;

      // Procurement efficiency = manual work eliminated %
      const manualEliminatedPct = totalSearches > 0 ? Math.round(((MANUAL_MINUTES - AI_MINUTES) / MANUAL_MINUTES) * 100) : 0;

      return {
        totalSavings: Math.round(totalSavings),
        monthlySavings: Math.round(monthlySavings),
        annualProjection: Math.round(monthlySavings * 12),
        totalSearches,
        optimizedPurchases,
        hoursSaved,
        avgSavingPerPurchase,
        suppliersCompared: uniqueSuppliers,
        productsCompared: totalProductsCompared,
        aiAccuracyPct: accuracyPct,
        manualEliminatedPct,
        efficiencyScore: Math.min(100, Math.round((accuracyPct * 0.4) + (manualEliminatedPct * 0.3) + (Math.min(totalSearches, 100) * 0.3))),
      };
    } catch (e) {
      throw e;
    }
  }
}
