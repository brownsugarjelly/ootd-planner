'use client';

import { useState } from 'react';
import * as Icons from 'lucide-react';
import { ChevronLeft, ChevronRight, Plus, Eye, EyeOff, Copy, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import clsx from 'clsx';
import { ALL_CATEGORIES, isRequiredCategory, type ClothingCategory } from '@/lib/types';
import { CATEGORY_META } from '@/lib/constants';
import { useWardrobeStore } from '@/lib/store';
import { useSwipe } from '@/hooks/useSwipe';

function CategoryRow({ category }: { category: ClothingCategory }) {
  const items = useWardrobeStore((s) => s.items);
  const layers = useWardrobeStore((s) => s.layers[category]);
  const addLayer = useWardrobeStore((s) => s.addLayer);
  const removeLayer = useWardrobeStore((s) => s.removeLayer);
  const toggleLayerHidden = useWardrobeStore((s) => s.toggleLayerHidden);
  const duplicateLayer = useWardrobeStore((s) => s.duplicateLayer);
  const moveLayer = useWardrobeStore((s) => s.moveLayer);
  const selectSticker = useWardrobeStore((s) => s.selectSticker);
  const selectedStickerLayerId = useWardrobeStore((s) => s.selectedStickerLayerId);

  const meta = CATEGORY_META[category];
  const required = isRequiredCategory(category);
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[meta.icon] ?? Icons.Circle;

  const pool = items.filter((i) => i.category === category && !i.archived);
  const [stagedIndex, setStagedIndex] = useState(0);
  const staged = pool.length > 0 ? pool[((stagedIndex % pool.length) + pool.length) % pool.length] : null;

  const swipeHandlers = useSwipe(
    () => pool.length > 0 && setStagedIndex((i) => i + 1),
    () => pool.length > 0 && setStagedIndex((i) => i - 1),
  );

  const sortedLayers = [...layers].sort((a, b) => b.order - a.order); // topmost first in the list

  return (
    <div className="py-3">
      <div className="mb-2 flex items-center gap-1.5 text-thread-500 dark:text-thread-300">
        <Icon size={15} aria-hidden="true" />
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-dusk-muted">
          {meta.label}
        </p>
        {!required && (
          <span className="rounded-full bg-canvas-soft px-1.5 py-0.5 text-[10px] text-ink-muted dark:bg-dusk-surface2 dark:text-dusk-muted">
            optional
          </span>
        )}
        <span className="ml-auto text-[10px] text-ink-muted dark:text-dusk-muted">{layers.length} worn</span>
      </div>

      <div className="flex items-center gap-2" {...swipeHandlers}>
        <button
          type="button"
          onClick={() => setStagedIndex((i) => i - 1)}
          disabled={pool.length === 0}
          aria-label={`Previous ${meta.label}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-canvas-soft disabled:opacity-30 dark:hover:bg-dusk-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-white px-2 py-1.5 dark:border-dusk-line dark:bg-dusk-surface2">
          {staged ? (
            <>
              <img
                src={staged.thumbnailUrl ?? staged.imageUrl}
                alt=""
                className="h-9 w-9 shrink-0 rounded-md border border-line object-contain p-0.5 dark:border-dusk-line"
              />
              <span className="min-w-0 flex-1 truncate text-sm text-ink dark:text-dusk-text">{staged.name}</span>
            </>
          ) : (
            <span className="text-sm text-ink-muted dark:text-dusk-muted">No {meta.label.toLowerCase()} yet</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setStagedIndex((i) => i + 1)}
          disabled={pool.length === 0}
          aria-label={`Next ${meta.label}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-canvas-soft disabled:opacity-30 dark:hover:bg-dusk-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => staged && addLayer(category, staged.id)}
          disabled={!staged}
          aria-label={`Add ${staged?.name ?? meta.label} to outfit`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-thread-600 text-white hover:bg-thread-700 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400"
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>

      {sortedLayers.length > 0 && (
        <div className="mt-2 flex flex-col gap-1.5">
          {sortedLayers.map((layer, i) => {
            const item = items.find((it) => it.id === layer.itemId);
            if (!item) return null;
            const isTopmost = i === 0;
            const isBottommost = i === sortedLayers.length - 1;
            return (
              <div
                key={layer.layerId}
                onClick={() => selectSticker(layer.layerId)}
                className={clsx(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5',
                  layer.hidden
                    ? 'border-line bg-canvas-soft opacity-50 dark:border-dusk-line dark:bg-dusk-surface2'
                    : selectedStickerLayerId === layer.layerId
                      ? 'border-thread-500 bg-thread-50 dark:border-thread-400 dark:bg-thread-900/30'
                      : 'border-line bg-white dark:border-dusk-line dark:bg-dusk-surface2',
                )}
              >
                <img
                  src={item.thumbnailUrl ?? item.imageUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-md border border-line object-contain p-0.5 dark:border-dusk-line"
                />
                <span className="min-w-0 flex-1 truncate text-xs text-ink dark:text-dusk-text">{item.name}</span>

                <IconBtn
                  label="Move up"
                  icon={ArrowUp}
                  disabled={isTopmost}
                  onClick={() => moveLayer(layer.layerId, 'up')}
                />
                <IconBtn
                  label="Move down"
                  icon={ArrowDown}
                  disabled={isBottommost}
                  onClick={() => moveLayer(layer.layerId, 'down')}
                />
                <IconBtn
                  label={layer.hidden ? 'Show' : 'Hide'}
                  icon={layer.hidden ? EyeOff : Eye}
                  onClick={() => toggleLayerHidden(layer.layerId)}
                />
                <IconBtn label="Duplicate" icon={Copy} onClick={() => duplicateLayer(layer.layerId)} />
                <IconBtn label="Remove" icon={Trash2} danger onClick={() => removeLayer(layer.layerId)} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IconBtn({
  label,
  icon: Icon,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  icon: Icons.LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={clsx(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-md disabled:opacity-25',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400',
        danger
          ? 'text-thread-600 hover:bg-thread-50 dark:text-thread-300 dark:hover:bg-thread-900/30'
          : 'text-ink-muted hover:bg-canvas-soft dark:text-dusk-muted dark:hover:bg-dusk-surface',
      )}
    >
      <Icon size={12} aria-hidden="true" />
    </button>
  );
}

export function CategoryLayerStack() {
  return (
    <div className="flex flex-col divide-y divide-line dark:divide-dusk-line">
      {ALL_CATEGORIES.map((category) => (
        <CategoryRow key={category} category={category} />
      ))}
    </div>
  );
}
