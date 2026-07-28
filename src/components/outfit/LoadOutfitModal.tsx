'use client';

import { useState } from 'react';
import { Heart, Trash2, ShirtIcon } from 'lucide-react';
import clsx from 'clsx';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useWardrobeStore } from '@/lib/store';

interface LoadOutfitModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoadOutfitModal({ open, onClose }: LoadOutfitModalProps) {
  const outfits = useWardrobeStore((s) => s.outfits);
  const loadOutfit = useWardrobeStore((s) => s.loadOutfit);
  const deleteOutfitById = useWardrobeStore((s) => s.deleteOutfitById);
  const toggleFavoriteOutfit = useWardrobeStore((s) => s.toggleFavoriteOutfit);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const visible = favoritesOnly ? outfits.filter((o) => o.favorite) : outfits;
  const sorted = [...visible].sort((a, b) => b.dateEdited.localeCompare(a.dateEdited));

  return (
    <Modal open={open} onClose={onClose} title="Saved outfits" maxWidthClass="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-muted dark:text-dusk-muted">{outfits.length} saved</p>
        <Button
          variant={favoritesOnly ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFavoritesOnly((v) => !v)}
        >
          <Heart size={14} aria-hidden="true" />
          Favorites
        </Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={ShirtIcon}
          title="No saved outfits yet"
          description="Build a look and use Save Outfit to keep it here."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sorted.map((outfit) => (
            <div
              key={outfit.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-white dark:border-dusk-line dark:bg-dusk-surface2"
            >
              <button
                type="button"
                onClick={() => {
                  loadOutfit(outfit.id);
                  onClose();
                }}
                className="flex aspect-square items-center justify-center overflow-hidden bg-canvas-soft dark:bg-dusk-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400"
              >
                {outfit.thumbnailUrl ? (
                  <img src={outfit.thumbnailUrl} alt={outfit.name} className="h-full w-full object-cover" />
                ) : (
                  <ShirtIcon size={28} className="text-ink-muted dark:text-dusk-muted" aria-hidden="true" />
                )}
              </button>
              <div className="flex items-center justify-between gap-1 px-2.5 py-2">
                <p className="min-w-0 flex-1 truncate text-xs font-medium text-ink dark:text-dusk-text">
                  {outfit.name}
                </p>
                <button
                  type="button"
                  onClick={() => toggleFavoriteOutfit(outfit.id)}
                  aria-label={outfit.favorite ? `Unfavorite ${outfit.name}` : `Favorite ${outfit.name}`}
                  aria-pressed={outfit.favorite}
                  className="rounded-md p-1 hover:bg-canvas-soft dark:hover:bg-dusk-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400"
                >
                  <Heart
                    size={14}
                    className={clsx(outfit.favorite ? 'fill-thread-500 text-thread-500' : 'text-ink-muted dark:text-dusk-muted')}
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => deleteOutfitById(outfit.id)}
                  aria-label={`Delete ${outfit.name}`}
                  className="rounded-md p-1 text-ink-muted hover:bg-thread-50 hover:text-thread-600 dark:text-dusk-muted dark:hover:bg-thread-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
