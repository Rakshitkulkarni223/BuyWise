import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { RecommendationMode, RecommendationModeOption } from '../types';
import { cn } from '../lib/utils';

export function RecommendationModeSelector({
  modes,
  selected,
  onSelect,
}: {
  modes: RecommendationModeOption[];
  selected: RecommendationMode;
  onSelect: (mode: RecommendationMode) => void;
}) {
  try {
    return (
      <div className="flex flex-wrap items-center gap-2" data-testid="recommendation-mode-selector">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          <SlidersHorizontal size={13} /> Strategy:
        </div>
        {modes.map(mode => (
          <button
            key={mode.key}
            onClick={() => { try { onSelect(mode.key); } catch { /* silent */ } }}
            title={mode.description}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
              selected === mode.key
                ? 'bg-accent text-white shadow-sm'
                : 'border border-line bg-surface text-ink-soft hover:border-accent/40 hover:bg-accent-soft/20',
            )}
            data-testid={`mode-${mode.key}`}
          >
            {mode.label}
          </button>
        ))}
      </div>
    );
  } catch {
    return null;
  }
}
