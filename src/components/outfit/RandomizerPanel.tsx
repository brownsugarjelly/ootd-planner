'use client';

import { useState } from 'react';
import { Shuffle, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { useWardrobeStore } from '@/lib/store';
import { COLOR_MATCH_MODES } from '@/lib/colorMatch';

export function RandomizerPanel() {
  const randomizeOutfit = useWardrobeStore((s) => s.randomizeOutfit);
  const randomizer = useWardrobeStore((s) => s.settings.randomizer);
  const updateSettings = useWardrobeStore((s) => s.updateSettings);
  const colorMode = useWardrobeStore((s) => s.colorMode);
  const [showSettings, setShowSettings] = useState(false);

  function patchRandomizer(patch: Partial<typeof randomizer>) {
    updateSettings({ randomizer: { ...randomizer, ...patch } });
  }

  const modeLabel = COLOR_MATCH_MODES.find((m) => m.id === colorMode)?.label ?? 'Random';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Button variant="primary" size="md" className="flex-1" onClick={randomizeOutfit}>
          <Shuffle size={16} aria-hidden="true" />
          Random Outfit
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-expanded={showSettings}
          aria-label="Randomizer settings"
          onClick={() => setShowSettings((v) => !v)}
        >
          <Settings2 size={16} aria-hidden="true" />
        </Button>
      </div>

      {showSettings && (
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-canvas-soft p-3 dark:border-dusk-line dark:bg-dusk-surface2 animate-rise-in">
          <Toggle
            label="Random accessories"
            description="Include optional categories when randomizing"
            checked={randomizer.includeAccessories}
            onChange={(v) => patchRandomizer({ includeAccessories: v })}
          />
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="max-accessories" className="text-sm font-medium text-ink dark:text-dusk-text">
              Max accessory count
            </label>
            <input
              id="max-accessories"
              type="range"
              min={0}
              max={5}
              value={randomizer.maxAccessoryCount}
              onChange={(e) => patchRandomizer({ maxAccessoryCount: Number(e.target.value) })}
              className="w-28 accent-thread-600"
            />
            <span className="w-4 text-right text-sm tabular-nums text-ink-muted dark:text-dusk-muted">
              {randomizer.maxAccessoryCount}
            </span>
          </div>
          <Toggle
            label="Exclude favorites"
            description="Leave favorited pieces out of random picks"
            checked={randomizer.excludeFavorites}
            onChange={(v) =>
              patchRandomizer({ excludeFavorites: v, favoritesOnly: v ? false : randomizer.favoritesOnly })
            }
          />
          <Toggle
            label="Favorites only"
            description="Only randomize among favorited pieces"
            checked={randomizer.favoritesOnly}
            onChange={(v) =>
              patchRandomizer({ favoritesOnly: v, excludeFavorites: v ? false : randomizer.excludeFavorites })
            }
          />
        </div>
      )}
      <p className="text-xs text-ink-muted dark:text-dusk-muted">
        Using <span className="font-medium text-ink dark:text-dusk-text">{modeLabel}</span> color logic — change it
        in Color Matching below.
      </p>
    </div>
  );
}
