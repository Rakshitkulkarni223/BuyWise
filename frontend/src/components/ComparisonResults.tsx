import React, { useMemo, useState } from 'react';
import { ExternalLink, Crown, ArrowUpDown, PackageX } from 'lucide-react';
import type { Product, SortOption } from '../types';
import { Badge } from './ui/Badge';
import { Switch } from './ui/Switch';
import { SupplierLogo } from './SupplierLogo';
import { ProductImage } from './ProductImage';
import { RatingStars } from './RatingStars';
import { formatINR, formatNumber, deliveryLabel } from '../lib/format';
import { cn } from '../lib/utils';

const SORTS: { value: SortOption; label: string }[] = [
  { value: 'lowest_price', label: 'Lowest Price' },
  { value: 'highest_rating', label: 'Highest Rating' },
  { value: 'fastest_delivery', label: 'Fastest Delivery' },
  { value: 'highest_discount', label: 'Highest Discount' },
];

const sorters: Record<SortOption, (a: Product, b: Product) => number> = {
  lowest_price: (a, b) => a.price - b.price,
  highest_rating: (a, b) => b.rating - a.rating,
  fastest_delivery: (a, b) => a.deliveryDays - b.deliveryDays,
  highest_discount: (a, b) => b.discount - a.discount,
};

export function ComparisonResults({
  products,
  recommendedSupplier,
  supplierColors,
  categoryIcon,
  initialSort = 'lowest_price',
}: {
  products: Product[];
  recommendedSupplier?: string;
  supplierColors: Record<string, string>;
  categoryIcon?: string;
  initialSort?: SortOption;
}) {
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);

  const view = useMemo(() => {
    let list = [...products];
    if (inStockOnly) list = list.filter((p) => p.availability);
    if (minRating > 0) list = list.filter((p) => p.rating >= minRating);
    list.sort(sorters[sortBy]);
    return list;
  }, [products, sortBy, inStockOnly, minRating]);

  const cheapest = useMemo(() => (products.length ? Math.min(...products.map((p) => p.price)) : 0), [products]);

  return (
    <div className="space-y-4" data-testid="comparison-results">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
            Supplier Comparison
          </h3>
          <Badge tone="neutral" data-testid="results-count">
            {view.length} of {products.length}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted">
            <span>In stock only</span>
            <Switch checked={inStockOnly} onCheckedChange={setInStockOnly} data-testid="filter-instock" />
          </label>
          <div className="relative">
            <select
              data-testid="filter-rating"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="h-9 appearance-none rounded-md border border-line bg-surface pl-3 pr-8 text-xs font-medium text-ink focus:outline-none focus:border-ink"
            >
              <option value={0}>Any rating</option>
              <option value={4}>4★ & up</option>
              <option value={4.5}>4.5★ & up</option>
            </select>
          </div>
          <div className="relative">
            <ArrowUpDown size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <select
              data-testid="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-9 appearance-none rounded-md border border-line bg-surface pl-8 pr-8 text-xs font-medium text-ink focus:outline-none focus:border-ink"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {view.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-line bg-surface py-12 text-muted">
          <PackageX size={28} />
          <p className="text-sm">No suppliers match these filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-md border border-line bg-surface lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-slate-50 text-left">
                  <th className="px-4 py-2.5 label-eyebrow">Supplier</th>
                  <th className="px-4 py-2.5 label-eyebrow">Product</th>
                  <th className="px-4 py-2.5 label-eyebrow text-right">Price</th>
                  <th className="px-4 py-2.5 label-eyebrow text-center">Discount</th>
                  <th className="px-4 py-2.5 label-eyebrow text-center">Rating</th>
                  <th className="px-4 py-2.5 label-eyebrow text-center">Delivery</th>
                  <th className="px-4 py-2.5 label-eyebrow text-center">Stock</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {view.map((p, idx) => {
                  const isBest = p.provider === recommendedSupplier;
                  return (
                    <tr
                      key={p.id}
                      data-testid={`comparison-row-${p.provider}`}
                      className={cn(
                        'border-b border-line last:border-0 transition-colors',
                        isBest ? 'bg-accent-soft/50' : idx % 2 ? 'bg-slate-50/40' : 'bg-surface',
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <SupplierLogo name={p.provider} color={supplierColors[p.provider]} size={30} />
                          <div>
                            <div className="font-semibold text-ink flex items-center gap-1.5">
                              {p.provider}
                              {isBest && (
                                <Badge tone="accent" className="gap-1">
                                  <Crown size={10} /> Best
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted">{p.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <ProductImage
                            src={p.image}
                            alt={p.title}
                            icon={categoryIcon}
                            className="h-9 w-9 rounded-md border border-line"
                          />
                          <span className="line-clamp-1 max-w-[200px] text-ink-soft">{p.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className={cn('data-num font-bold', p.price === cheapest ? 'text-success' : 'text-ink')}>
                          {formatINR(p.price)}
                        </div>
                        {p.discount > 0 && (
                          <div className="data-num text-[11px] text-muted line-through">
                            {formatINR(p.originalPrice)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.discount > 0 ? (
                          <Badge tone="success">{p.discount}% off</Badge>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-center">
                          <RatingStars rating={p.rating} />
                          <span className="text-[11px] text-muted">{formatNumber(p.reviews)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('data-num text-xs font-medium', p.deliveryDays === 0 ? 'text-accent' : 'text-ink-soft')}>
                          {deliveryLabel(p.deliveryDays)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.availability ? (
                          <Badge tone="success">In stock</Badge>
                        ) : (
                          <Badge tone="danger">Out</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={p.productUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                        >
                          View <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {view.map((p) => {
              const isBest = p.provider === recommendedSupplier;
              return (
                <div
                  key={p.id}
                  data-testid={`comparison-card-${p.provider}`}
                  className={cn(
                    'rounded-md border bg-surface p-4 shadow-card',
                    isBest ? 'border-accent/50 bg-accent-soft/40' : 'border-line',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <SupplierLogo name={p.provider} color={supplierColors[p.provider]} size={32} />
                      <div>
                        <div className="font-semibold text-ink flex items-center gap-1.5">
                          {p.provider}
                          {isBest && <Crown size={13} className="text-accent" />}
                        </div>
                        <RatingStars rating={p.rating} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn('data-num text-lg font-bold', p.price === cheapest ? 'text-success' : 'text-ink')}>
                        {formatINR(p.price)}
                      </div>
                      {p.discount > 0 && <Badge tone="success">{p.discount}% off</Badge>}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted">
                    <span>Delivery: {deliveryLabel(p.deliveryDays)}</span>
                    <span>{p.availability ? 'In stock' : 'Out of stock'}</span>
                    <a href={p.productUrl} target="_blank" rel="noreferrer" className="font-medium text-accent">
                      View →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
