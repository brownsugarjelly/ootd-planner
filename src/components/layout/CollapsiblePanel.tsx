'use client';

import clsx from 'clsx';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

interface CollapsiblePanelProps {
  side: 'left' | 'right';
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  widthClass?: string;
}

/**
 * The toggle button lives in a sibling wrapper that never collapses, so it's
 * always clickable to reopen the panel — previously it was rendered inside
 * the collapsing container itself and disappeared along with it.
 */
export function CollapsiblePanel({
  side,
  collapsed,
  onToggle,
  children,
  widthClass = 'w-80',
}: CollapsiblePanelProps) {
  return (
    <div className="relative flex shrink-0">
      <div
        className={clsx(
          'h-full border-line bg-canvas transition-all duration-300 dark:border-dusk-line dark:bg-dusk-bg',
          side === 'left' ? 'border-r' : 'border-l',
          collapsed ? 'w-0 overflow-hidden border-0' : widthClass,
        )}
      >
        <div className={clsx('h-full', widthClass, collapsed && 'pointer-events-none opacity-0')}>{children}</div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? `Show ${side} panel` : `Hide ${side} panel`}
        className={clsx(
          'absolute top-1/2 z-20 flex h-16 w-6 -translate-y-1/2 items-center justify-center rounded-full',
          'border border-line bg-white text-ink-muted shadow-softer hover:text-ink dark:border-dusk-line dark:bg-dusk-surface2 dark:text-dusk-muted dark:hover:text-dusk-text',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400',
          side === 'left' ? '-right-3' : '-left-3',
        )}
      >
        {side === 'left' ? (
          collapsed ? (
            <ChevronsRight size={13} aria-hidden="true" />
          ) : (
            <ChevronsLeft size={13} aria-hidden="true" />
          )
        ) : collapsed ? (
          <ChevronsLeft size={13} aria-hidden="true" />
        ) : (
          <ChevronsRight size={13} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
