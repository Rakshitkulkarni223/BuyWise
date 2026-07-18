import React, { useState, useCallback, useMemo } from 'react';
import { Store, ChevronDown, CheckCheck, Square, Building2, MapPin } from 'lucide-react';
import type { Supplier } from '../types';
import type { SupplierHubSupplierSummary } from '../types_supplier';
import { SUPPLIER_TYPE_LABELS } from '../types_supplier';
import { Switch } from './ui/Switch';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';

interface SupplierSourceSelectorProps {
  marketplaceSuppliers: Supplier[];
  supplierHubSuppliers: SupplierHubSupplierSummary[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  onSelectAllMarketplace: () => void;
  onSelectNoneMarketplace: () => void;
  onSelectAllSupplierHub: () => void;
  onSelectNoneSupplierHub: () => void;
}

function SupplierGroup({
  title,
  icon,
  suppliers,
  selected,
  onToggle,
  onSelectAll,
  onSelectNone,
  defaultExpanded = true,
  renderBadge,
  locationFilter,
}: {
  title: string;
  icon: React.ReactNode;
  suppliers: { name: string; color?: string }[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  defaultExpanded?: boolean;
  renderBadge?: (supplier: { name: string; color?: string }) => React.ReactNode;
  locationFilter?: string;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const selectedCount = suppliers.filter((s) => selected.has(s.name)).length;
  const allSelected = selectedCount === suppliers.length && suppliers.length > 0;
  const noneSelected = selectedCount === 0;

  // Filter suppliers by location if a filter is set
  const visibleSuppliers = useMemo(() => {
    if (!locationFilter) return suppliers;
    return suppliers.filter((s) => {
      const shSupplier = s as SupplierHubSupplierSummary;
      const loc = shSupplier.city && shSupplier.state
        ? `${shSupplier.city}, ${shSupplier.state}`
        : shSupplier.city || '';
      return loc === locationFilter;
    });
  }, [suppliers, locationFilter]);

  const handleGroupToggle = useCallback(() => {
    try {
      if (allSelected) {
        onSelectNone();
      } else {
        onSelectAll();
      }
    } catch (e) {
      console.error('Failed to toggle group', e);
    }
  }, [allSelected, onSelectAll, onSelectNone]);

  return (
    <div className="rounded-md border border-line bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-line">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => { try { setExpanded((v) => !v); } catch { /* silent */ } }}
            className="flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-accent"
          >
            <ChevronDown
              size={15}
              className={cn('transition-transform', !expanded && '-rotate-90')}
            />
            {icon}
            {title}
          </button>
          <span className="text-xs text-muted">
            ({selectedCount}/{suppliers.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGroupToggle}
            className={cn(
              'inline-flex items-center gap-1 text-xs font-medium transition-colors',
              allSelected ? 'text-accent' : 'text-muted hover:text-ink',
            )}
          >
            {allSelected ? <CheckCheck size={12} /> : <Square size={12} />}
            {allSelected ? 'All' : 'Toggle'}
          </button>
          <Switch
            checked={allSelected}
            onCheckedChange={handleGroupToggle}
          />
        </div>
      </div>

      {/* Supplier list */}
      {expanded && visibleSuppliers.length > 0 && (
        <div className="grid gap-1.5 p-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSuppliers.map((s) => (
            <label
              key={s.name}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-2.5 rounded-md border px-3 py-2 transition-colors',
                selected.has(s.name) ? 'border-ink/30 bg-bg' : 'border-line bg-surface',
              )}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: s.color || '#64748B' }}
                />
                <span className="truncate text-sm font-medium text-ink">{s.name}</span>
                {renderBadge && renderBadge(s)}
              </span>
              <Switch
                checked={selected.has(s.name)}
                onCheckedChange={() => onToggle(s.name)}
              />
            </label>
          ))}
        </div>
      )}

      {expanded && visibleSuppliers.length === 0 && (
        <div className="px-3 py-4 text-center text-xs text-muted">
          {locationFilter ? `No suppliers in ${locationFilter}.` : 'No suppliers in this group.'}
        </div>
      )}
    </div>
  );
}

export function SupplierSourceSelector({
  marketplaceSuppliers,
  supplierHubSuppliers,
  selected,
  onToggle,
  onSelectAllMarketplace,
  onSelectNoneMarketplace,
  onSelectAllSupplierHub,
  onSelectNoneSupplierHub,
}: SupplierSourceSelectorProps) {
  const hasSupplierHub = supplierHubSuppliers.length > 0;
  const [locationFilter, setLocationFilter] = useState<string>('');

  // Extract unique cities from supplier hub suppliers
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    for (const s of supplierHubSuppliers) {
      if (s.city && s.state) {
        cities.add(`${s.city}, ${s.state}`);
      } else if (s.city) {
        cities.add(s.city);
      }
    }
    return sorted(Array.from(cities));
  }, [supplierHubSuppliers]);

  function sorted(arr: string[]) {
    try {
      return arr.sort((a, b) => a.localeCompare(b));
    } catch {
      return arr;
    }
  }

  return (
    <div className="space-y-3" data-testid="supplier-source-selector">
      <SupplierGroup
        title="Marketplace Suppliers"
        icon={<Store size={14} className="text-accent" />}
        suppliers={marketplaceSuppliers}
        selected={selected}
        onToggle={onToggle}
        onSelectAll={onSelectAllMarketplace}
        onSelectNone={onSelectNoneMarketplace}
        defaultExpanded={true}
      />

      {hasSupplierHub && (
        <>
          {/* Location filter */}
          {availableCities.length > 1 && (
            <div className="flex items-center gap-2 px-1">
              <MapPin size={13} className="text-muted" />
              <select
                value={locationFilter}
                onChange={(e) => { try { setLocationFilter(e.target.value); } catch { /* silent */ } }}
                className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
              >
                <option value="">All locations</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {locationFilter && (
                <button
                  type="button"
                  onClick={() => { try { setLocationFilter(''); } catch { /* silent */ } }}
                  className="text-xs text-muted hover:text-ink transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          <SupplierGroup
            title="My Supplier Network"
            icon={<Building2 size={14} className="text-accent" />}
            suppliers={supplierHubSuppliers}
            selected={selected}
            onToggle={onToggle}
            onSelectAll={onSelectAllSupplierHub}
            onSelectNone={onSelectNoneSupplierHub}
            defaultExpanded={true}
            locationFilter={locationFilter}
            renderBadge={(s) => {
              const shSupplier = supplierHubSuppliers.find((sh) => sh.name === s.name);
              if (!shSupplier) return null;
              const typeLabel = SUPPLIER_TYPE_LABELS[shSupplier.supplierType] || shSupplier.supplierType;
              return (
                <div className="flex items-center gap-1 shrink-0">
                  {shSupplier.city && (
                    <Badge tone="neutral" className="text-[10px] px-1.5 py-0.5 gap-0.5">
                      <MapPin size={8} /> {shSupplier.city}
                    </Badge>
                  )}
                  <Badge tone="neutral" className="text-[10px] px-1.5 py-0.5">
                    {typeLabel}
                  </Badge>
                </div>
              );
            }}
          />
        </>
      )}
    </div>
  );
}
