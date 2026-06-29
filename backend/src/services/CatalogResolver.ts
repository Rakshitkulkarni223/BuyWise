import catalog from '../mock-data/catalog.json';
import { DEFAULT_CATEGORY_BASE_PRICE } from '../config/data';

export interface ProductTemplate {
  id: string;
  title: string;
  brand: string;
  basePrice: number;
  image: string;
  keywords: string[];
}

const CATALOG = catalog as Record<string, ProductTemplate[]>;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function scoreTemplate(tpl: ProductTemplate, tokens: string[]): number {
  const haystack = [tpl.title, tpl.brand, ...tpl.keywords].join(' ').toLowerCase();
  let score = 0;
  for (const tok of tokens) {
    if (tpl.keywords.some((k) => k.toLowerCase() === tok)) score += 3;
    else if (haystack.includes(tok)) score += 1.5;
  }
  return score;
}

/**
 * Resolve a search query within a category to a single canonical product.
 * All adapters use this so every supplier prices the SAME product, producing
 * a clean side-by-side supplier comparison. Falls back to a synthetic product
 * (titled by the query) so a search is never empty.
 */
export class CatalogResolver {
  static getTemplates(category: string): ProductTemplate[] {
    return CATALOG[category] || [];
  }

  static resolve(category: string, query: string): ProductTemplate {
    const tokens = tokenize(query);
    const templates = CATALOG[category] || [];

    let best: ProductTemplate | null = null;
    let bestScore = 0;
    for (const tpl of templates) {
      const s = scoreTemplate(tpl, tokens);
      if (s > bestScore) {
        bestScore = s;
        best = tpl;
      }
    }

    if (best && bestScore > 0) return best;

    const cleanQuery = query.trim() || 'Procurement Item';
    const title = cleanQuery
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return {
      id: `generic-${category}-${cleanQuery.toLowerCase().replace(/\s+/g, '-')}`,
      title,
      brand: 'Generic',
      basePrice: DEFAULT_CATEGORY_BASE_PRICE[category] || 1000,
      image: '',
      keywords: tokens,
    };
  }
}
