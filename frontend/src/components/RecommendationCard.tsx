import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, ExternalLink, TrendingDown, Gauge } from 'lucide-react';
import type { Recommendation } from '../types';
import { Badge } from './ui/Badge';
import { SupplierLogo } from './SupplierLogo';
import { formatINR } from '../lib/format';
import { cn } from '../lib/utils';

const PROFILE_LABEL: Record<string, string> = {
  balanced: 'Balanced',
  startup: 'Startup',
  hospital: 'Hospital',
  restaurant: 'Restaurant',
};

export function RecommendationCard({
  rec,
  supplierColors,
}: {
  rec: Recommendation;
  supplierColors: Record<string, string>;
}) {
  const confidencePct = Math.round(rec.confidence * 100);
  const confTone = rec.confidence >= 0.6 ? 'success' : rec.confidence >= 0.3 ? 'accent' : 'warning';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      data-testid="recommendation-card"
      className="relative overflow-hidden rounded-md border border-accent/40 bg-accent-soft/40 shadow-card"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-accent to-transparent animate-scan" />
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-accent/20 px-5 py-3">
        <div className="flex items-center gap-2 text-accent">
          <Sparkles size={16} />
          <span className="label-eyebrow text-accent">AI Recommendation</span>
        </div>
        <Badge tone="accent" data-testid="recommendation-profile">
          {PROFILE_LABEL[rec.weightProfile] || rec.weightProfile} profile
        </Badge>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: supplier + reasons */}
        <div>
          <div className="flex items-center gap-3">
            <SupplierLogo name={rec.supplier} color={supplierColors[rec.supplier]} size={44} />
            <div>
              <div className="label-eyebrow">Recommended supplier</div>
              <div
                className="font-display text-2xl font-bold tracking-tight text-ink"
                data-testid="recommended-supplier-name"
              >
                {rec.supplier}
              </div>
            </div>
          </div>

          <p className="mt-3 text-sm text-muted">
            for <span className="font-medium text-ink">{rec.product.title}</span>
          </p>

          <ul className="mt-4 space-y-2">
            {rec.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-ink-soft">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-bg text-emerald-600">
                  <Check size={11} strokeWidth={3} />
                </span>
                {reason}
              </li>
            ))}
          </ul>

          <a
            href={rec.product.productUrl}
            target="_blank"
            rel="noreferrer"
            data-testid="recommendation-buy-link"
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Buy from {rec.supplier} <ExternalLink size={15} />
          </a>
        </div>

        {/* Right: savings + confidence + factors */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-line bg-surface p-3.5">
              <div className="label-eyebrow flex items-center gap-1.5">
                <TrendingDown size={12} /> Est. savings
              </div>
              <div className="data-num mt-1.5 text-2xl font-bold text-success" data-testid="recommendation-savings">
                {formatINR(rec.estimatedSavings)}
              </div>
            </div>
            <div className="rounded-md border border-line bg-surface p-3.5">
              <div className="label-eyebrow flex items-center gap-1.5">
                <Gauge size={12} /> Confidence
              </div>
              <div className="data-num mt-1.5 text-2xl font-bold text-ink" data-testid="recommendation-confidence">
                {confidencePct}%
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    confTone === 'success' ? 'bg-success' : confTone === 'accent' ? 'bg-accent' : 'bg-warning',
                  )}
                  style={{ width: `${Math.max(6, confidencePct)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border border-line bg-surface p-3.5">
            <div className="label-eyebrow mb-2.5">Decision factors</div>
            <div className="space-y-2">
              {rec.factors.map((f) => (
                <div key={f.label} className="flex items-center gap-2.5">
                  <span className="w-20 shrink-0 text-xs text-muted">{f.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-ink/80"
                      style={{ width: `${Math.round(f.score * 100)}%` }}
                    />
                  </div>
                  <span className="data-num w-9 shrink-0 text-right text-[11px] text-muted">
                    {Math.round(f.weight * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
