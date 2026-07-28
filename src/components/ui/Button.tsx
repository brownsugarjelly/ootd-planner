'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-thread-600 text-white hover:bg-thread-700 active:bg-thread-800 shadow-softer disabled:bg-thread-300 dark:bg-thread-500 dark:hover:bg-thread-600',
  secondary:
    'bg-canvas-soft text-ink border border-line hover:bg-white active:bg-line-soft disabled:opacity-50 dark:bg-dusk-surface2 dark:text-dusk-text dark:border-dusk-line dark:hover:bg-dusk-surface',
  outline:
    'bg-transparent text-ink border border-line hover:bg-canvas-soft disabled:opacity-50 dark:text-dusk-text dark:border-dusk-line dark:hover:bg-dusk-surface2',
  ghost:
    'bg-transparent text-ink hover:bg-canvas-soft active:bg-line-soft disabled:opacity-40 dark:text-dusk-text dark:hover:bg-dusk-surface2',
  danger:
    'bg-transparent text-thread-700 hover:bg-thread-50 active:bg-thread-100 disabled:opacity-40 dark:text-thread-300 dark:hover:bg-thread-900/30',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 gap-1.5 rounded-lg min-h-[36px]',
  md: 'text-sm px-4 py-2.5 gap-2 rounded-xl min-h-[44px]',
  lg: 'text-base px-5 py-3 gap-2 rounded-xl min-h-[48px]',
  icon: 'p-2.5 rounded-xl min-h-[44px] min-w-[44px] justify-center',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'secondary', size = 'md', children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center font-medium transition-colors duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas dark:focus-visible:ring-offset-dusk-bg',
        'disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
