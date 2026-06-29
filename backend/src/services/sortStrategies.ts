import { Product, SortOption } from '../types';

/**
 * Strategy Pattern: sorting algorithms selectable at runtime. Adding a new sort
 * is a new entry in this registry — comparison logic stays untouched.
 */
export type SortStrategy = (a: Product, b: Product) => number;

export const SORT_STRATEGIES: Record<SortOption, SortStrategy> = {
  lowest_price: (a, b) => a.price - b.price,
  highest_rating: (a, b) => b.rating - a.rating,
  fastest_delivery: (a, b) => a.deliveryDays - b.deliveryDays,
  highest_discount: (a, b) => b.discount - a.discount,
};

export function getSortStrategy(option?: SortOption): SortStrategy {
  return SORT_STRATEGIES[option ?? 'lowest_price'] ?? SORT_STRATEGIES.lowest_price;
}
