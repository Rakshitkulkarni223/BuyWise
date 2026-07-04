import { historyRepository } from '../repositories/HistoryRepository';
import { SearchHistory } from '../models/SearchHistory';
import { BasketHistory } from '../models/BasketHistory';

export class HistoryService {
  static list(userId: string) {
    try {
      return historyRepository.listByUser(userId);
    } catch (e) {
      throw e;
    }
  }

  static async paginated(userId: string, page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;

      // Fetch both collections in parallel
      const [searchDocs, basketDocs, searchCount, basketCount] = await Promise.all([
        SearchHistory.find({ userId }).sort({ createdAt: -1 }).lean(),
        BasketHistory.find({ userId }).sort({ createdAt: -1 }).lean(),
        SearchHistory.countDocuments({ userId }),
        BasketHistory.countDocuments({ userId }),
      ]);

      // Tag and normalize each entry
      const searchItems = searchDocs.map((d: any) => ({
        id: d._id,
        type: 'single' as const,
        query: d.query,
        category: d.category,
        suppliers: d.suppliers,
        resultCount: d.resultCount,
        recommendedSupplier: d.recommendedSupplier,
        bestPrice: d.bestPrice,
        estimatedSavings: d.estimatedSavings,
        weightProfile: d.weightProfile,
        createdAt: d.createdAt,
      }));

      const basketItems = basketDocs.map((d: any) => ({
        id: d._id,
        type: 'basket' as const,
        query: `Basket (${d.itemCount} item${d.itemCount !== 1 ? 's' : ''})`,
        category: d.category,
        suppliers: d.suppliers,
        resultCount: d.itemCount,
        recommendedSupplier: '',
        bestPrice: d.splitTotal,
        estimatedSavings: d.estimatedSavings,
        weightProfile: d.weightProfile,
        createdAt: d.createdAt,
        basketItems: (d.items || []).map((i: any) => ({
          query: i.query,
          quantity: i.quantity,
          supplier: i.supplier,
          price: i.price,
        })),
        recommendedPlan: d.recommendedPlan,
        supplierCount: d.supplierCount,
        splitTotal: d.splitTotal,
        baselineTotal: d.baselineTotal,
      }));

      // Merge, sort by createdAt desc, then paginate in-memory
      const all = [...searchItems, ...basketItems].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const total = searchCount + basketCount;
      const totalPages = Math.ceil(total / limit) || 1;
      const items = all.slice(skip, skip + limit);

      return { items, total, page, limit, totalPages };
    } catch (e) {
      throw e;
    }
  }

  static async remove(userId: string, id: string) {
    try {
      // Try deleting from both collections — one will match
      const [searchResult, basketResult] = await Promise.all([
        SearchHistory.findOneAndDelete({ _id: id, userId }),
        BasketHistory.findOneAndDelete({ _id: id, userId }),
      ]);
      return searchResult || basketResult;
    } catch (e) {
      throw e;
    }
  }
}
