import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Zap, Store, CheckCheck, Square, Sparkles } from 'lucide-react';
import type { Category, SearchResponse, SortOption, Supplier, WeightProfile, WeightProfileKey } from '../types';
import { api, apiError } from '../lib/api';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Switch } from '../components/ui/Switch';
import { Badge } from '../components/ui/Badge';
import { WeightProfileSelector } from '../components/WeightProfileSelector';
import { RecommendationCard } from '../components/RecommendationCard';
import { ComparisonResults } from '../components/ComparisonResults';
import { getIcon } from '../lib/icons';
import { cn } from '../lib/utils';

const EXAMPLES: Record<string, string[]> = {
  electronics: ['UltraBook Laptop', 'Galaxy Smartphone', 'Noise Cancelling Headphones'],
  grocery: ['Basmati Rice', 'Cooking Oil', 'Fresh Vegetables'],
  fashion: ['Nike Shoes', 'Cotton T-Shirt', 'Denim Jeans'],
  furniture: ['Office Chair', 'Standing Desk', 'Fabric Sofa'],
  office: ['A4 Copier Paper', 'Ballpoint Pens', 'Inkjet Printer'],
  cleaning: ['Floor Cleaner', 'Hand Sanitizer', 'Tissue Rolls'],
  medical: ['Surgical Masks', 'Nitrile Gloves', 'Pulse Oximeter'],
  industrial: ['Power Drill', 'Safety Helmets', 'Wrench Set'],
};

export function SearchPage() {
  const location = useLocation();
  const preset = location.state as { category?: string; query?: string } | null;

  const [categories, setCategories] = useState<Category[]>([]);
  const [profiles, setProfiles] = useState<WeightProfile[]>([]);
  const [category, setCategory] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState(preset?.query || '');
  const [weightProfile, setWeightProfile] = useState<WeightProfileKey>('balanced');
  const [sortPref, setSortPref] = useState<SortOption>('lowest_price');
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const autoRan = useRef(false);

  useEffect(() => {
    Promise.all([api.categories(), api.weightProfiles(), api.preferences()])
      .then(([cats, profs, pref]) => {
        setCategories(cats);
        setProfiles(profs);
        setWeightProfile(pref.weightProfile);
        setSortPref(pref.sortPreference);
        setCategory(preset?.category || pref.defaultCategory || cats[0]?.slug || '');
      })
      .catch((e) => setError(apiError(e)));
  }, []);

  useEffect(() => {
    if (!category) return;
    api
      .suppliersForCategory(category)
      .then((s) => {
        setSuppliers(s);
        setSelected(new Set(s.filter((x) => x.enabled).map((x) => x.name)));
      })
      .catch((e) => setError(apiError(e)));
  }, [category]);

  // Auto-run a preset search coming from Dashboard / History
  useEffect(() => {
    if (autoRan.current) return;
    if (preset?.query && suppliers.length) {
      autoRan.current = true;
      runSearch(preset.query, suppliers.map((s) => s.name));
    }
  }, [suppliers]);

  const supplierColors = useMemo(
    () => Object.fromEntries(suppliers.map((s) => [s.name, s.color])),
    [suppliers],
  );

  const toggleSupplier = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const runSearch = async (overrideQuery?: string, overrideSuppliers?: string[]) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) {
      setError('Enter a product to search for.');
      return;
    }
    const names = overrideSuppliers ?? (selected.size ? [...selected] : suppliers.map((s) => s.name));
    if (!names.length) {
      setError('Select at least one supplier.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.search({
        category,
        suppliers: names,
        query: q,
        weightProfile,
        sortBy: sortPref,
      });
      setResult(res);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  const onProfileChange = (p: WeightProfileKey) => {
    setWeightProfile(p);
    if (result) runSearch(result.query, result.results.map((r) => r.provider));
  };

  const categoryIcon = categories.find((c) => c.slug === category)?.icon;

  return (
    <div className="space-y-7">
      <div>
        <div className="label-eyebrow">Procurement</div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Search &amp; Compare</h1>
        <p className="mt-1 text-sm text-muted">
          Pick a category and suppliers, then search once to compare every source.
        </p>
      </div>

      {/* Search panel */}
      <Card>
        <CardBody className="space-y-6">
          {/* Categories */}
          <div>
            <div className="label-eyebrow mb-2.5">1 · Category</div>
            <div className="flex flex-wrap gap-2" data-testid="category-selector">
              {categories.map((c) => {
                const Icon = getIcon(c.icon);
                const active = c.slug === category;
                return (
                  <button
                    key={c.slug}
                    data-testid={`category-${c.slug}`}
                    onClick={() => {
                      setQuery('');
                      setCategory(c.slug);
                      setResult(null);
                    }}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors duration-200',
                      active ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink-soft hover:border-ink/40',
                    )}
                  >
                    <Icon size={15} />
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Suppliers */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <div className="label-eyebrow flex items-center gap-1.5">
                <Store size={12} /> 2 · Suppliers ({selected.size}/{suppliers.length})
              </div>
              <div className="flex gap-3 text-xs">
                <button
                  data-testid="suppliers-select-all"
                  onClick={() => setSelected(new Set(suppliers.map((s) => s.name)))}
                  className="inline-flex items-center gap-1 font-medium text-muted hover:text-ink"
                >
                  <CheckCheck size={13} /> All
                </button>
                <button
                  data-testid="suppliers-select-none"
                  onClick={() => setSelected(new Set())}
                  className="inline-flex items-center gap-1 font-medium text-muted hover:text-ink"
                >
                  <Square size={13} /> None
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" data-testid="supplier-toggles">
              {suppliers.map((s) => (
                <label
                  key={s.id}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2.5 transition-colors',
                    selected.has(s.name) ? 'border-ink/30 bg-bg' : 'border-line bg-surface',
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-sm font-medium text-ink">{s.name}</span>
                  </span>
                  <Switch
                    checked={selected.has(s.name)}
                    onCheckedChange={() => toggleSupplier(s.name)}
                    data-testid={`supplier-toggle-${s.name}`}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Query + AI profile */}
          <div>
            <div className="label-eyebrow mb-2.5">3 · What do you need?</div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runSearch();
              }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  data-testid="search-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Nike Shoes, UltraBook Laptop, Basmati Rice…"
                  className="h-12 w-full rounded-md border border-line bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                />
              </div>
              <Button type="submit" size="lg" variant="accent" loading={loading} data-testid="search-submit-button">
                <Sparkles size={16} /> Search &amp; Compare
              </Button>
            </form>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">Try:</span>
              {(EXAMPLES[category] || []).map((ex) => (
                <button
                  key={ex}
                  data-testid={`example-${ex}`}
                  onClick={() => {
                    setQuery(ex);
                    runSearch(ex);
                  }}
                  className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-muted transition-colors hover:border-ink/40 hover:text-ink"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Weight profile */}
          <div>
            <div className="label-eyebrow mb-2.5 flex items-center gap-1.5">
              <Zap size={12} /> AI Weight Profile — what matters most to you
            </div>
            <WeightProfileSelector profiles={profiles} value={weightProfile} onChange={onProfileChange} />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger" data-testid="search-error">
              {error}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Results */}
      {loading && <SearchLoader />}

      {!loading && result && result.results.length > 0 && (
        <div className="space-y-6 animate-fade-up">
          {result.recommendation && (
            <RecommendationCard rec={result.recommendation} supplierColors={supplierColors} />
          )}
          <ComparisonResults
            products={result.results}
            recommendedSupplier={result.recommendation?.supplier}
            supplierColors={supplierColors}
            categoryIcon={categoryIcon}
            initialSort={sortPref}
          />
        </div>
      )}

      {!loading && result && result.results.length === 0 && (
        <Card>
          <CardBody className="py-12 text-center text-muted">No results found. Try another query or supplier set.</CardBody>
        </Card>
      )}

      {!loading && !result && (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-accent-soft text-accent">
              <Search size={22} />
            </span>
            <h3 className="font-display text-lg font-semibold text-ink">Run your first comparison</h3>
            <p className="max-w-md text-sm text-muted">
              ProcureAI queries every selected supplier in parallel, normalizes the results, and returns an
              explainable recommendation with quantified savings.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function SearchLoader() {
  const lines = [
    'Resolving enabled provider adapters…',
    'Querying suppliers in parallel (Promise.allSettled)…',
    'Normalizing products to common schema…',
    'Scoring suppliers with weighted decision engine…',
  ];
  return (
    <Card data-testid="search-loader">
      <CardBody className="font-mono text-xs text-muted">
        <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/3 bg-accent animate-scan" />
        </div>
        {lines.map((l, i) => (
          <div key={i} className="flex items-center gap-2 py-0.5" style={{ animationDelay: `${i * 120}ms` }}>
            <span className="text-success">▸</span> {l}
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
