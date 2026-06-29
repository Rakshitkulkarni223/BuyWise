import { Product } from '../types';

/**
 * Provider Adapter contract (Adapter Pattern).
 * Every procurement source — whether a mock dataset today or a real
 * marketplace API tomorrow — implements this single interface, so the Search,
 * Comparison, and Recommendation services never know which provider they talk to.
 */
export interface ProviderAdapter {
  readonly name: string;
  search(query: string, category: string): Promise<Product[]>;
}
