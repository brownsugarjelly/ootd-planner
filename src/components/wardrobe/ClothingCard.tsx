'use client';

import { Heart, Pencil } from 'lucide-react';
import clsx from 'clsx';
import type { ClothingItem } from '@/lib/types';
import { useWardrobeStore } from '@/lib/store';
import { useLongPress } from '@/hooks/useLongPress';

interface ClothingCardProps {
  item: ClothingItem;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}

export function ClothingCard({ item, selected, onSelect, onEdit }: ClothingCardProps) {
  const toggleFavoriteItem = useWardrobeStore((s) => s.toggleFavoriteItem);
  const longPress = useLongPress(onEdit, onSelect);

  return (
    <div
      className={clsx(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-white transition-all dark:bg-dusk-surface2',
        selected
          ? 'border-thread-500 ring-2 ring-thread-300 dark:ring-thread-700'
          : 'border-line hover:border-thread-300 dark:border-dusk-line',
      )}
    >
      <button
        type="button"
        {...longPress}
        className="flex aspect-square touch-none items-center justify-center overflow-hidden bg-canvas-soft p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400 dark:bg-dusk-surface"
        aria-pressed={selected}
        aria-label={`Add ${item.name} to outfit — hold to view details`}
      >
        <img
          src={item.thumbnailUrl ?? item.imageUrl}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-contain"
          draggable={false}
        />
      </button>

      <div className="flex items-center justify-between gap-1 px-2 py-1.5">
        <p className="min-w-0 flex-1 truncate text-xs font-medium text-ink dark:text-dusk-text">{item.name}</p>
      </div>

      <div className="pointer-events-none absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={() => toggleFavoriteItem(item.id)}
          aria-label={item.favorite ? `Unfavorite ${item.name}` : `Favorite ${item.name}`}
          aria-pressed={item.favorite}
          className="pointer-events-auto rounded-full bg-white/90 p-1.5 text-ink shadow-softer hover:bg-white dark:bg-dusk-surface/90 dark:text-dusk-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400"
        >
          <Heart size={13} className={item.favorite ? 'fill-thread-500 text-thread-500' : ''} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${item.name}`}
          className="pointer-events-auto rounded-full bg-white/90 p-1.5 text-ink shadow-softer hover:bg-white dark:bg-dusk-surface/90 dark:text-dusk-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400"
        >
          <Pencil size={13} aria-hidden="true" />
        </button>
      </div>

      {item.favorite && (
        <span className="absolute left-1.5 top-1.5 rounded-full bg-white/90 p-1 text-thread-500 shadow-softer group-hover:opacity-0 dark:bg-dusk-surface/90">
          <Heart size={11} className="fill-current" aria-hidden="true" />
        </span>
      )}
    </div>
  );
}
