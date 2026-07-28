'use client';

import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { UploadZone } from './UploadZone';
import { SearchBar } from './SearchBar';
import { FilterPanel } from './FilterPanel';
import { WardrobeGrid } from './WardrobeGrid';
import { EditItemModal } from './EditItemModal';
import { Button } from '@/components/ui/Button';
import { useWardrobeStore } from '@/lib/store';
import type { ClothingItem } from '@/lib/types';
import { filterClothingItems } from '@/lib/filterItems';

export function WardrobePanel() {
  const items = useWardrobeStore((s) => s.items);
  const filters = useWardrobeStore((s) => s.filters);
  const setFilters = useWardrobeStore((s) => s.setFilters);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => filterClothingItems(items, filters), [items, filters]);

  const activeFilterCount =
    filters.categories.length +
    filters.materials.length +
    filters.occasions.length +
    filters.seasons.length +
    filters.patterns.length +
    filters.brands.length +
    filters.tags.length +
    (filters.favoritesOnly ? 1 : 0);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-4 py-4 dark:border-dusk-line">
        <h2 className="font-display text-lg text-ink dark:text-dusk-text">Wardrobe</h2>
        <p className="text-xs text-ink-muted dark:text-dusk-muted">{items.length} items in your closet, synced to your account</p>
      </div>

      <div className="border-b border-line px-4 py-4 dark:border-dusk-line">
        <UploadZone />
      </div>

      <div className="flex flex-col gap-2.5 border-b border-line px-4 py-3 dark:border-dusk-line">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchBar />
          </div>
          <Button
            variant={activeFilterCount > 0 ? 'primary' : 'outline'}
            size="md"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            {activeFilterCount > 0 && <span className="ml-0.5">{activeFilterCount}</span>}
          </Button>
        </div>
        {filtersOpen && (
          <div className="max-h-80 overflow-y-auto rounded-xl border border-line bg-canvas-soft p-3 dark:border-dusk-line dark:bg-dusk-surface2 animate-rise-in">
            <FilterPanel onClose={() => setFiltersOpen(false)} />
          </div>
        )}
        {items.some((i) => i.archived) && (
          <label className="flex items-center gap-2 text-xs text-ink-muted dark:text-dusk-muted">
            <input
              type="checkbox"
              checked={filters.includeArchived}
              onChange={(e) => setFilters({ includeArchived: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-line accent-thread-600 dark:border-dusk-line"
            />
            Show archived
          </label>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <WardrobeGrid items={filtered} onEdit={setEditingItem} />
      </div>

      <EditItemModal item={editingItem} onClose={() => setEditingItem(null)} />
    </div>
  );
}
