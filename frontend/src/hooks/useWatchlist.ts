import { useState, useCallback, useEffect } from 'react';

export interface WatchlistItem {
  id: string;
  title: string;
  category: string;
  supplier: string;
  price: number;
  targetPrice: number;
  image: string;
  productUrl: string;
  addedAt: string;
}

const STORAGE_KEY = 'procureai_watchlist';

function loadWatchlist(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(items: WatchlistItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // silent
  }
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>(() => loadWatchlist());

  useEffect(() => {
    try {
      saveWatchlist(items);
    } catch {
      // silent
    }
  }, [items]);

  const addItem = useCallback((item: Omit<WatchlistItem, 'id' | 'addedAt'>) => {
    try {
      setItems((prev) => {
        // Don't add duplicates (same title + supplier)
        if (prev.some((p) => p.title === item.title && p.supplier === item.supplier)) return prev;
        return [
          ...prev,
          {
            ...item,
            id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            addedAt: new Date().toISOString(),
          },
        ];
      });
    } catch {
      // silent
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    try {
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      // silent
    }
  }, []);

  const updateTargetPrice = useCallback((id: string, targetPrice: number) => {
    try {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, targetPrice } : item)),
      );
    } catch {
      // silent
    }
  }, []);

  const isWatching = useCallback(
    (title: string, supplier: string) => {
      try {
        return items.some((item) => item.title === title && item.supplier === supplier);
      } catch {
        return false;
      }
    },
    [items],
  );

  const clearAll = useCallback(() => {
    try {
      setItems([]);
    } catch {
      // silent
    }
  }, []);

  return { items, addItem, removeItem, updateTargetPrice, isWatching, clearAll };
}
