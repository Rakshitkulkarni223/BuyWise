import React, { useState } from 'react';
import { getIcon } from '../lib/icons';
import { cn } from '../lib/utils';

export function ProductImage({
  src,
  alt,
  icon,
  className,
}: {
  src?: string;
  alt: string;
  icon?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const Icon = getIcon(icon);

  if (!src || failed) {
    return (
      <div className={cn('flex items-center justify-center bg-bg text-muted', className)}>
        <Icon size={28} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('object-cover bg-bg', className)}
    />
  );
}
