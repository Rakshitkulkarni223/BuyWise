import React from 'react';
import { cn } from '../../lib/utils';

type Tone = 'neutral' | 'success' | 'accent' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-ink-soft',
  success: 'bg-success-bg text-emerald-700',
  accent: 'bg-accent-soft text-accent',
  warning: 'bg-warning-bg text-amber-700',
  danger: 'bg-red-50 text-danger',
};

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-tight',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
