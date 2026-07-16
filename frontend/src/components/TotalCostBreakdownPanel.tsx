import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ChevronDown, Info } from 'lucide-react';
import type { TotalCostBreakdown } from '../types';
import { SupplierLogo } from './SupplierLogo';
import { Badge } from './ui/Badge';
import { formatINR } from '../lib/format';
import { cn } from '../lib/utils';

export function TotalCostBreakdownPanel({
  totalCosts,
  supplierColors,
}: {
  totalCosts: TotalCostBreakdown[];
  supplierColors: Record<string, string>;
}) {
  try {
    if (!totalCosts || totalCosts.length === 0) return null;

    const lowest = totalCosts[0];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        data-testid="total-cost-breakdown"
        className="rounded-md border border-line bg-surface shadow-card"
      >
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <Calculator size={16} className="text-accent" />
          <span className="label-eyebrow text-accent">Total Procurement Cost</span>
          <span className="ml-auto text-[10px] text-muted">Estimated</span>
        </div>

        <div className="space-y-2 p-4">
          {totalCosts.map((tc, i) => (
            <CostRow key={i} tc={tc} color={supplierColors[tc.supplier]} isLowest={tc.supplier === lowest.supplier} />
          ))}
        </div>

        <div className="border-t border-line px-4 py-2.5 text-[11px] text-muted">
          <Info size={11} className="mr-1 inline" />
          Total Cost = Product Price + Shipping + Processing + Handling + Hidden Costs
        </div>
      </motion.div>
    );
  } catch {
    return null;
  }
}

function CostRow({ tc, color, isLowest }: { tc: TotalCostBreakdown; color?: string; isLowest: boolean }) {
  const [expanded, setExpanded] = useState(false);

  try {
    return (
      <div className={cn('rounded-md border transition-colors', isLowest ? 'border-success/40 bg-success-bg/10' : 'border-line bg-bg/30')}>
        <button
          onClick={() => { try { setExpanded(v => !v); } catch { /* silent */ } }}
          className="flex w-full items-center justify-between gap-3 px-3 py-2.5"
        >
          <div className="flex items-center gap-2.5">
            <SupplierLogo name={tc.supplier} color={color} size={24} />
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink">{tc.supplier}</span>
                {isLowest && <Badge tone="success">Lowest Total Cost</Badge>}
              </div>
              <span className="text-xs text-muted">Product: {formatINR(tc.productPrice)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="data-num text-lg font-bold text-ink">{formatINR(tc.totalProcurementCost)}</span>
            <ChevronDown size={14} className={cn('text-muted transition-transform', expanded && 'rotate-180')} />
          </div>
        </button>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
            className="border-t border-line/50 px-3 py-3"
          >
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              <CostItem label="Product Price" value={tc.productPrice} />
              <CostItem label="Shipping (Est.)" value={tc.shipping} />
              <CostItem label="Processing" value={tc.processing} />
              <CostItem label="Handling" value={tc.handling} />
              <CostItem label="Hidden Cost (Est.)" value={tc.hiddenCost} accent />
              <CostItem label="Total" value={tc.totalProcurementCost} bold />
            </div>
          </motion.div>
        )}
      </div>
    );
  } catch {
    return null;
  }
}

function CostItem({ label, value, bold, accent }: { label: string; value: number; bold?: boolean; accent?: boolean }) {
  return (
    <div className="rounded bg-bg/40 px-2.5 py-1.5">
      <div className="text-[10px] text-muted">{label}</div>
      <div className={cn('data-num text-sm', bold ? 'font-bold text-ink' : accent ? 'font-semibold text-warning' : 'font-medium text-ink-soft')}>
        {formatINR(value)}
      </div>
    </div>
  );
}
