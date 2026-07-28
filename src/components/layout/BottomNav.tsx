'use client';

import { Shirt, Star, SlidersHorizontal } from 'lucide-react';
import clsx from 'clsx';

export type MobileView = 'wardrobe' | 'canvas' | 'controls';

interface BottomNavProps {
  active: MobileView;
  onChange: (view: MobileView) => void;
}

const TABS: { id: MobileView; label: string; icon: typeof Shirt }[] = [
  { id: 'wardrobe', label: 'Wardrobe', icon: Shirt },
  { id: 'canvas', label: 'Outfit', icon: Star },
  { id: 'controls', label: 'Controls', icon: SlidersHorizontal },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      className="grid shrink-0 grid-cols-3 border-t border-line bg-canvas/95 backdrop-blur dark:border-dusk-line dark:bg-dusk-bg/95"
      aria-label="Primary"
    >
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-current={active === id ? 'page' : undefined}
          className={clsx(
            'flex min-h-[56px] flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400 focus-visible:ring-inset',
            active === id ? 'text-thread-600 dark:text-thread-300' : 'text-ink-muted dark:text-dusk-muted',
          )}
        >
          <Icon size={19} aria-hidden="true" />
          {label}
        </button>
      ))}
    </nav>
  );
}
