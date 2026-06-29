import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../lib/utils';

export function RatingStars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <Star size={13} className="fill-amber-400 text-amber-400" />
      <span className="data-num text-xs font-semibold text-ink">{rating.toFixed(1)}</span>
    </span>
  );
}
