import { Product, SearchFilters, SortOption } from '../types';
import { getSortStrategy } from './sortStrategies';

/**
 * Comparison Service: filters, de-duplicates and sorts the normalized product
 * list produced by the provider adapters.
 */
export class ComparisonService {
  static apply(
    products: Product[],
    sortBy?: SortOption,
    filters?: SearchFilters,
  ): Product[] {
    let list = ComparisonService.dedupe(products);
    list = ComparisonService.filter(list, filters);
    list.sort(getSortStrategy(sortBy));
    return list;
  }

  private static dedupe(products: Product[]): Product[] {
    const seen = new Set<string>();
    const out: Product[] = [];
    for (const p of products) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
    }
    return out;
  }

  private static filter(products: Product[], filters?: SearchFilters): Product[] {
    if (!filters) return products;
    return products.filter((p) => {
      if (filters.brand && !p.brand.toLowerCase().includes(filters.brand.toLowerCase())) return false;
      if (filters.supplier && p.provider !== filters.supplier) return false;
      if (typeof filters.minRating === 'number' && p.rating < filters.minRating) return false;
      if (typeof filters.maxPrice === 'number' && p.price > filters.maxPrice) return false;
      if (filters.inStockOnly && !p.availability) return false;
      return true;
    });
  }
}
