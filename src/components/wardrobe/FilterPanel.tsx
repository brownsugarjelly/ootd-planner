'use client';

import { useMemo } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Chip } from '@/components/ui/Chip';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { useWardrobeStore } from '@/lib/store';
import { CATEGORY_META, MATERIALS, OCCASIONS, PATTERNS, SEASONS, humanize } from '@/lib/constants';
import { ALL_CATEGORIES } from '@/lib/types';
import { collectAllTags, collectBrands } from '@/lib/filterItems';

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function FilterPanel({ onClose }: { onClose?: () => void }) {
  const items = useWardrobeStore((s) => s.items);
  const filters = useWardrobeStore((s) => s.filters);
  const setFilters = useWardrobeStore((s) => s.setFilters);
  const resetFilters = useWardrobeStore((s) => s.resetFilters);

  const brands = useMemo(() => collectBrands(items), [items]);
  const tags = useMemo(() => collectAllTags(items), [items]);

  const activeCount =
    filters.categories.length +
    filters.materials.length +
    filters.occasions.length +
    filters.seasons.length +
    filters.patterns.length +
    filters.brands.length +
    filters.tags.length +
    (filters.favoritesOnly ? 1 : 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-ink dark:text-dusk-text">
          <SlidersHorizontal size={15} aria-hidden="true" />
          <span className="font-display text-sm">Filters</span>
          {activeCount > 0 && (
            <span className="rounded-full bg-thread-100 px-1.5 py-0.5 text-[10px] font-medium text-thread-700 dark:bg-thread-900/40 dark:text-thread-200">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-medium text-thread-600 hover:underline dark:text-thread-300"
            >
              Clear all
            </button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Done
            </Button>
          )}
        </div>
      </div>

      <Toggle
        label="Favorites only"
        checked={filters.favoritesOnly}
        onChange={(v) => setFilters({ favoritesOnly: v })}
      />

      <FilterGroup title="Category">
        {ALL_CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={CATEGORY_META[c].label}
            size="sm"
            active={filters.categories.includes(c)}
            onClick={() => setFilters({ categories: toggleInArray(filters.categories, c) })}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Material">
        {MATERIALS.map((m) => (
          <Chip
            key={m}
            label={humanize(m)}
            size="sm"
            active={filters.materials.includes(m)}
            onClick={() => setFilters({ materials: toggleInArray(filters.materials, m) })}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Occasion">
        {OCCASIONS.map((o) => (
          <Chip
            key={o}
            label={humanize(o)}
            size="sm"
            active={filters.occasions.includes(o)}
            onClick={() => setFilters({ occasions: toggleInArray(filters.occasions, o) })}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Season">
        {SEASONS.map((s) => (
          <Chip
            key={s}
            label={humanize(s)}
            size="sm"
            active={filters.seasons.includes(s)}
            onClick={() => setFilters({ seasons: toggleInArray(filters.seasons, s) })}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Pattern">
        {PATTERNS.map((p) => (
          <Chip
            key={p}
            label={humanize(p)}
            size="sm"
            active={filters.patterns.includes(p)}
            onClick={() => setFilters({ patterns: toggleInArray(filters.patterns, p) })}
          />
        ))}
      </FilterGroup>

      {brands.length > 0 && (
        <FilterGroup title="Brand">
          {brands.map((b) => (
            <Chip
              key={b}
              label={b}
              size="sm"
              active={filters.brands.includes(b)}
              onClick={() => setFilters({ brands: toggleInArray(filters.brands, b) })}
            />
          ))}
        </FilterGroup>
      )}

      {tags.length > 0 && (
        <FilterGroup title="Tags">
          {tags.map((t) => (
            <Chip
              key={t}
              label={t}
              size="sm"
              active={filters.tags.includes(t)}
              onClick={() => setFilters({ tags: toggleInArray(filters.tags, t) })}
            />
          ))}
        </FilterGroup>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-dusk-muted">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
