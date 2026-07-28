'use client';

import clsx from 'clsx';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hideLabel?: boolean;
  description?: string;
}

export function Toggle({ checked, onChange, label, hideLabel, description }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-1">
      <span className={clsx('flex flex-col', hideLabel && 'sr-only')}>
        <span className="text-sm font-medium text-ink dark:text-dusk-text">{label}</span>
        {description && <span className="text-xs text-ink-muted dark:text-dusk-muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={hideLabel ? label : undefined}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas dark:focus-visible:ring-offset-dusk-bg',
          checked ? 'bg-thread-600' : 'bg-line dark:bg-dusk-line',
        )}
      >
        <span
          className={clsx(
            'inline-block h-5 w-5 transform rounded-full bg-white shadow-softer transition-transform duration-200',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </label>
  );
}
