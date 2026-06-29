import React from 'react';
import type { WeightProfile, WeightProfileKey } from '../types';
import { cn } from '../lib/utils';

export function WeightProfileSelector({
  profiles,
  value,
  onChange,
}: {
  profiles: WeightProfile[];
  value: WeightProfileKey;
  onChange: (v: WeightProfileKey) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" data-testid="weight-profile-selector">
      {profiles.map((p) => {
        const active = p.key === value;
        return (
          <button
            key={p.key}
            type="button"
            data-testid={`weight-profile-${p.key}`}
            onClick={() => onChange(p.key)}
            title={p.description}
            className={cn(
              'rounded-md border px-3 py-2.5 text-left transition-colors duration-200',
              active ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink hover:border-ink/40',
            )}
          >
            <div className="text-sm font-semibold tracking-tight">{p.label}</div>
            <div className={cn('mt-0.5 text-[11px] leading-snug', active ? 'text-white/70' : 'text-muted')}>
              {p.description}
            </div>
          </button>
        );
      })}
    </div>
  );
}
