import React from 'react';
import { cn } from '../lib/utils';

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function SupplierLogo({
  name,
  color,
  size = 32,
  className,
}: {
  name: string;
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn('inline-flex items-center justify-center rounded-md font-display font-bold text-white shrink-0', className)}
      style={{
        background: color || '#64748B',
        width: size,
        height: size,
        fontSize: size * 0.4,
      }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
