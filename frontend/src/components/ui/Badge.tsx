import React from 'react';
import { cn } from '../../lib/utils';

type Tone = 'neutral' | 'success' | 'accent' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  neutral: 'bg-bg text-ink-soft',
  success: 'bg-success-bg text-success',
  accent: 'bg-accent-soft text-accent',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-accent-soft text-danger',
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
