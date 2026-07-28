'use client';

import { forwardRef } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

const fieldBase =
  'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400 focus-visible:border-thread-400 ' +
  'dark:bg-dusk-surface2 dark:border-dusk-line dark:text-dusk-text dark:placeholder:text-dusk-muted/70';

interface FieldWrapProps {
  label: string;
  hideLabel?: boolean;
  htmlFor: string;
  children: React.ReactNode;
}

export function FieldLabel({ label, hideLabel, htmlFor, children }: FieldWrapProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className={clsx('text-xs font-medium text-ink-muted dark:text-dusk-muted', hideLabel && 'sr-only')}>
        {label}
      </label>
      {children}
    </div>
  );
}

export const TextField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextField({ className, ...props }, ref) {
    return <input ref={ref} className={clsx(fieldBase, className)} {...props} />;
  },
);

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextAreaField({ className, ...props }, ref) {
    return <textarea ref={ref} className={clsx(fieldBase, 'resize-none', className)} {...props} />;
  },
);

export const SelectField = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function SelectField({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={clsx(fieldBase, 'appearance-none pr-8', className)} {...props}>
        {children}
      </select>
    );
  },
);
