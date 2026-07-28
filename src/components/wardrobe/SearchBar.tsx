'use client';

import { Search, X } from 'lucide-react';
import { useWardrobeStore } from '@/lib/store';

export function SearchBar() {
  const query = useWardrobeStore((s) => s.filters.query);
  const setFilters = useWardrobeStore((s) => s.setFilters);

  return (
    <div className="relative">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-dusk-muted"
        aria-hidden="true"
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setFilters({ query: e.target.value })}
        placeholder="Search name, tag, material, brand…"
        aria-label="Search wardrobe"
        className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-9 text-sm text-ink placeholder:text-ink-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400 dark:border-dusk-line dark:bg-dusk-surface2 dark:text-dusk-text"
      />
      {query && (
        <button
          type="button"
          onClick={() => setFilters({ query: '' })}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-muted hover:bg-canvas-soft dark:text-dusk-muted dark:hover:bg-dusk-surface"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
