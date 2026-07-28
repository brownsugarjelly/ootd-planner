'use client';

import { Settings, Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AppHeaderProps {
  onOpenSettings: () => void;
}

export function AppHeader({ onOpenSettings }: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-canvas/95 px-4 backdrop-blur dark:border-dusk-line dark:bg-dusk-bg/95 sm:px-6">
      <div className="flex items-center gap-2">
        <span className="font-display text-lg tracking-tight text-ink dark:text-dusk-text">Wardrobe</span>
        <Heart size={14} className="fill-thread-400 text-thread-400" aria-hidden="true" />
        <span className="hidden text-xs text-ink-muted dark:text-dusk-muted sm:inline">
          your closet, laid out
        </span>
      </div>
      <Button variant="ghost" size="icon" onClick={onOpenSettings} aria-label="Open settings">
        <Settings size={18} aria-hidden="true" />
      </Button>
    </header>
  );
}
