'use client';

import { X } from 'lucide-react';
import clsx from 'clsx';

interface ChipProps {
  label: string;
  onRemove?: () => void;
  active?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function Chip({ label, onRemove, active, onClick, size = 'md' }: ChipProps) {
  const Comp = onClick ? 'button' : 'span';
  return (
    <Comp
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      aria-pressed={onClick ? active : undefined}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        active
          ? 'border-thread-500 bg-thread-50 text-thread-700 dark:border-thread-400 dark:bg-thread-900/40 dark:text-thread-200'
          : 'border-line bg-canvas-soft text-ink-muted hover:border-thread-300 hover:text-ink dark:border-dusk-line dark:bg-dusk-surface2 dark:text-dusk-muted dark:hover:text-dusk-text',
        onClick && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400',
      )}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${label} tag`}
          className="rounded-full p-0.5 hover:bg-thread-200/60 dark:hover:bg-thread-800/60"
        >
          <X size={12} aria-hidden="true" />
        </button>
      )}
    </Comp>
  );
}
