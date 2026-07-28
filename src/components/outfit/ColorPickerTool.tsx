'use client';

import { useMemo, useState } from 'react';
import { Pipette } from 'lucide-react';
import { useWardrobeStore } from '@/lib/store';
import { rankItemsByColorDistance } from '@/lib/colorMatch';
import { CATEGORY_META } from '@/lib/constants';

export function ColorPickerTool() {
  const items = useWardrobeStore((s) => s.items);
  const targetColor = useWardrobeStore((s) => s.targetColor);
  const setTargetColor = useWardrobeStore((s) => s.setTargetColor);
  const addLayer = useWardrobeStore((s) => s.addLayer);
  const [hexDraft, setHexDraft] = useState(targetColor ?? '#B85C6B');

  const suggestions = useMemo(() => {
    if (!targetColor) return [];
    return rankItemsByColorDistance(
      items.filter((i) => !i.archived),
      targetColor,
    ).slice(0, 6);
  }, [items, targetColor]);

  function commit(hex: string) {
    setHexDraft(hex);
    setTargetColor(hex);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="target-color" className="sr-only">
          Target color
        </label>
        <input
          id="target-color"
          type="color"
          value={hexDraft}
          onChange={(e) => commit(e.target.value)}
          className="h-9 w-9 cursor-pointer rounded-lg border border-line bg-transparent p-0.5 dark:border-dusk-line"
        />
        <input
          type="text"
          value={hexDraft}
          onChange={(e) => setHexDraft(e.target.value)}
          onBlur={(e) => /^#([0-9A-Fa-f]{6})$/.test(e.target.value) && commit(e.target.value)}
          className="w-24 rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400 dark:border-dusk-line dark:bg-dusk-surface2 dark:text-dusk-text"
          maxLength={7}
        />
        {targetColor && (
          <button
            type="button"
            onClick={() => setTargetColor(null)}
            className="text-xs font-medium text-thread-600 hover:underline dark:text-thread-300"
          >
            Clear
          </button>
        )}
        <span className="ml-auto flex items-center gap-1 text-xs text-ink-muted dark:text-dusk-muted">
          <Pipette size={13} aria-hidden="true" />
          Seeds Randomize &amp; Color Matching
        </span>
      </div>

      {targetColor && (
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-dusk-muted">
            Closest matches
          </p>
          {suggestions.length === 0 ? (
            <p className="text-xs text-ink-muted dark:text-dusk-muted">No wardrobe items yet.</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {suggestions.map(({ item, score }) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addLayer(item.category, item.id)}
                  title={`${item.name} — ${CATEGORY_META[item.category].label}`}
                  className="flex w-16 shrink-0 flex-col items-center gap-1 rounded-lg p-1 hover:bg-canvas-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400 dark:hover:bg-dusk-surface2"
                >
                  <span className="relative block h-14 w-14 overflow-hidden rounded-lg border border-line bg-canvas-soft dark:border-dusk-line dark:bg-dusk-surface2">
                    <img
                      src={item.thumbnailUrl ?? item.imageUrl}
                      alt=""
                      className="h-full w-full object-contain p-1"
                      draggable={false}
                    />
                  </span>
                  <span className="w-full truncate text-center text-[10px] text-ink-muted dark:text-dusk-muted">
                    {Math.round(score * 100)}% match
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
