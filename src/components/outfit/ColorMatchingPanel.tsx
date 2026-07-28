'use client';

import clsx from 'clsx';
import { Wand2 } from 'lucide-react';
import { COLOR_MATCH_MODES } from '@/lib/colorMatch';
import { useWardrobeStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';

export function ColorMatchingPanel() {
  const colorMode = useWardrobeStore((s) => s.colorMode);
  const setColorMode = useWardrobeStore((s) => s.setColorMode);
  const randomizeOutfit = useWardrobeStore((s) => s.randomizeOutfit);

  const active = COLOR_MATCH_MODES.find((m) => m.id === colorMode);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {COLOR_MATCH_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => setColorMode(mode.id)}
            aria-pressed={colorMode === mode.id}
            title={mode.description}
            className={clsx(
              'rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400',
              colorMode === mode.id
                ? 'border-thread-500 bg-thread-50 text-thread-700 dark:border-thread-400 dark:bg-thread-900/40 dark:text-thread-200'
                : 'border-line bg-white text-ink-muted hover:border-thread-300 hover:text-ink dark:border-dusk-line dark:bg-dusk-surface2 dark:text-dusk-muted dark:hover:text-dusk-text',
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {active && <p className="text-xs text-ink-muted dark:text-dusk-muted">{active.description}</p>}

      <Button variant="secondary" size="md" onClick={randomizeOutfit}>
        <Wand2 size={16} aria-hidden="true" />
        Generate with {active?.label ?? 'this mode'}
      </Button>
    </div>
  );
}
