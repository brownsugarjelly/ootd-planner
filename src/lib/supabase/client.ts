'use client';

import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

let client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Lazily creates the Supabase browser client. Returns null when the two
 * NEXT_PUBLIC_SUPABASE_* env vars haven't been set yet, so the rest of the
 * app can show a clear "connect your backend" screen instead of crashing.
 */
export function getSupabaseClient() {
  if (!supabaseConfigured) return null;
  if (!client) {
    client = createBrowserClient(url as string, anonKey as string);
  }
  return client;
}
