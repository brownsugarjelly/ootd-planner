'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Mail, Lock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FieldLabel, TextField } from '@/components/ui/Field';
import { useWardrobeStore } from '@/lib/store';

export function NotConfiguredScreen() {
  return (
    <div className="flex h-dvh items-center justify-center bg-canvas px-4 dark:bg-dusk-bg">
      <div className="max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-soft dark:border-dusk-line dark:bg-dusk-surface">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-thread-50 text-thread-600 dark:bg-thread-900/30 dark:text-thread-300">
          <ExternalLink size={20} aria-hidden="true" />
        </div>
        <h1 className="font-display text-lg text-ink dark:text-dusk-text">Connect your backend to continue</h1>
        <p className="mt-2 text-sm text-ink-muted dark:text-dusk-muted">
          This app syncs your wardrobe through Supabase. Add{' '}
          <code className="rounded bg-canvas-soft px-1 py-0.5 text-xs dark:bg-dusk-surface2">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{' '}
          and{' '}
          <code className="rounded bg-canvas-soft px-1 py-0.5 text-xs dark:bg-dusk-surface2">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>{' '}
          as environment variables (see the README for the exact steps), then reload.
        </p>
      </div>
    </div>
  );
}

type Mode = 'sign-in' | 'sign-up' | 'magic-link';

export function AuthScreen() {
  const signInWithPassword = useWardrobeStore((s) => s.signInWithPassword);
  const signUpWithPassword = useWardrobeStore((s) => s.signUpWithPassword);
  const signInWithMagicLink = useWardrobeStore((s) => s.signInWithMagicLink);

  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'sign-in') {
        const err = await signInWithPassword(email, password);
        if (err) setError(err);
      } else if (mode === 'sign-up') {
        const err = await signUpWithPassword(email, password);
        if (err) setError(err);
        else setInfo('Account created — check your email to confirm, then sign in.');
      } else {
        const err = await signInWithMagicLink(email);
        if (err) setError(err);
        else setInfo('Check your email for a sign-in link.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-dvh items-center justify-center bg-canvas px-4 dark:bg-dusk-bg">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 shadow-soft dark:border-dusk-line dark:bg-dusk-surface">
        <h1 className="font-display text-xl text-ink dark:text-dusk-text">Wardrobe</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-dusk-muted">
          Sign in to sync your closet across every device.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <FieldLabel label="Email" htmlFor="auth-email">
            <div className="relative">
              <Mail
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-dusk-muted"
                aria-hidden="true"
              />
              <TextField
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                placeholder="you@example.com"
              />
            </div>
          </FieldLabel>

          {mode !== 'magic-link' && (
            <FieldLabel label="Password" htmlFor="auth-password">
              <div className="relative">
                <Lock
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-dusk-muted"
                  aria-hidden="true"
                />
                <TextField
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  placeholder="••••••••"
                />
              </div>
            </FieldLabel>
          )}

          {error && <p className="text-sm text-thread-600 dark:text-thread-300">{error}</p>}
          {info && <p className="text-sm text-sage-600 dark:text-sage-300">{info}</p>}

          <Button type="submit" variant="primary" size="lg" disabled={busy} className="justify-center">
            {busy
              ? 'Please wait…'
              : mode === 'sign-in'
                ? 'Sign in'
                : mode === 'sign-up'
                  ? 'Create account'
                  : 'Send magic link'}
          </Button>
        </form>

        <div className="mt-5 flex flex-col items-center gap-1.5 text-sm">
          {mode !== 'sign-in' && (
            <button
              type="button"
              onClick={() => setMode('sign-in')}
              className="text-thread-600 hover:underline dark:text-thread-300"
            >
              Already have an account? Sign in
            </button>
          )}
          {mode !== 'sign-up' && (
            <button
              type="button"
              onClick={() => setMode('sign-up')}
              className="text-thread-600 hover:underline dark:text-thread-300"
            >
              New here? Create an account
            </button>
          )}
          {mode !== 'magic-link' && (
            <button
              type="button"
              onClick={() => setMode('magic-link')}
              className="text-ink-muted hover:underline dark:text-dusk-muted"
            >
              Or email me a sign-in link instead
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
