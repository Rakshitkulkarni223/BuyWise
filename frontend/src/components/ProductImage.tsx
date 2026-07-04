import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
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
  const [showPopover, setShowPopover] = useState(false);
  const Icon = getIcon(icon);

  const openPopover = useCallback(() => {
    try {
      if (src && !failed) setShowPopover(true);
    } catch {
      // silent
    }
  }, [src, failed]);

  const closePopover = useCallback(() => {
    try {
      setShowPopover(false);
    } catch {
      // silent
    }
  }, []);

  // Close on Escape key
  useEffect(() => {
    try {
      if (!showPopover) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closePopover();
      };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    } catch {
      // silent
    }
  }, [showPopover, closePopover]);

  if (!src || failed) {
    return (
      <div className={cn('flex items-center justify-center bg-bg text-muted', className)}>
        <Icon size={28} />
      </div>
    );
  }

  return (
    <>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        onClick={openPopover}
        className={cn('object-cover bg-bg cursor-pointer transition-transform hover:scale-105', className)}
        title="Click to enlarge"
      />

      {/* Lightbox popover */}
      {showPopover && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={closePopover}
        >
          <div
            className="relative flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
              <img
                src={src}
                alt={alt}
                className="max-h-[70vh] max-w-[70vw] object-contain"
              />
            </div>

            {/* Caption */}
            {alt && (
              <span className="rounded-full bg-white/90 px-4 py-1.5 text-sm font-medium text-slate-800 shadow-sm backdrop-blur-sm">
                {alt}
              </span>
            )}

            {/* Close button */}
            <button
              onClick={closePopover}
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-md transition-colors hover:bg-slate-100"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
