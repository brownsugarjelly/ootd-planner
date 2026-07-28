'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl2 border border-dashed border-line px-6 py-10 text-center dark:border-dusk-line">
      <div className="rounded-full bg-canvas-soft p-3 text-thread-500 dark:bg-dusk-surface2">
        <Icon size={22} aria-hidden="true" />
      </div>
      <div>
        <p className="font-display text-base text-ink dark:text-dusk-text">{title}</p>
        {description && <p className="mt-1 text-sm text-ink-muted dark:text-dusk-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
