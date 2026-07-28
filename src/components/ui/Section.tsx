'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function Section({ title, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = `section-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="border-b border-line py-4 dark:border-dusk-line last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400 rounded-md"
      >
        <span className="font-display text-sm text-ink dark:text-dusk-text">{title}</span>
        <ChevronDown
          size={16}
          className={clsx('text-ink-muted transition-transform dark:text-dusk-muted', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div id={id} className="mt-3 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}
