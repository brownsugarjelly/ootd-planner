'use client';

import { useMemo } from 'react';
import { ALL_CATEGORIES } from '@/lib/types';
import { colorFamilyName } from '@/lib/colorUtils';
import { useWardrobeStore } from '@/lib/store';
import { humanize } from '@/lib/constants';

export function OutfitInfoPanel() {
  const items = useWardrobeStore((s) => s.items);
  const layers = useWardrobeStore((s) => s.layers);

  const wornItems = useMemo(() => {
    const list = ALL_CATEGORIES.flatMap((c) => layers[c])
      .filter((l) => !l.hidden)
      .map((l) => items.find((i) => i.id === l.itemId))
      .filter((i): i is NonNullable<typeof i> => Boolean(i));
    const seen = new Set<string>();
    return list.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
  }, [items, layers]);

  if (wornItems.length === 0) {
    return (
      <p className="text-sm text-ink-muted dark:text-dusk-muted">Add some pieces to see outfit details here.</p>
    );
  }

  const seasons = Array.from(new Set(wornItems.map((i) => humanize(i.season))));
  const occasions = Array.from(new Set(wornItems.flatMap((i) => i.occasion.map(humanize))));
  const colors = Array.from(new Set(wornItems.map((i) => i.primaryColor)));

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-ink-muted dark:text-dusk-muted">Pieces</span>
        <span className="font-medium text-ink dark:text-dusk-text">{wornItems.length}</span>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-dusk-muted">
          Palette
        </p>
        <div className="flex flex-wrap gap-2">
          {colors.map((hex) => (
            <div
              key={hex}
              className="flex items-center gap-1.5 rounded-full bg-canvas-soft px-2 py-1 dark:bg-dusk-surface2"
            >
              <span
                className="h-3.5 w-3.5 rounded-full border border-line dark:border-dusk-line"
                style={{ backgroundColor: hex }}
                aria-hidden="true"
              />
              <span className="text-xs text-ink-muted dark:text-dusk-muted">{colorFamilyName(hex)}</span>
            </div>
          ))}
        </div>
      </div>

      {seasons.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-ink-muted dark:text-dusk-muted">Season</span>
          <span className="text-right font-medium text-ink dark:text-dusk-text">{seasons.join(', ')}</span>
        </div>
      )}

      {occasions.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-ink-muted dark:text-dusk-muted">Occasion</span>
          <span className="text-right font-medium text-ink dark:text-dusk-text">{occasions.join(', ')}</span>
        </div>
      )}
    </div>
  );
}
