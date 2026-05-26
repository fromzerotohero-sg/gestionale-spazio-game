import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/** Base URL only — no trailing /rest/v1 (the client adds it). */
export function normalizeSupabaseUrl(raw: string): string {
  return raw
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1\/?$/i, '');
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  ? normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
  : undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseProjectHost = supabaseUrl
  ? new URL(supabaseUrl).host
  : null;

export const supabaseConfigError = isSupabaseConfigured
  ? null
  : 'Supabase non configurato. Imposta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (in locale: app/.env — su Vercel: Settings → Environment Variables, poi Redeploy).';

export const isWrongSupabaseProject =
  supabaseProjectHost !== null &&
  supabaseProjectHost.includes('zcgynarwbouaaamioegr');

let client: SupabaseClient<Database> | null = null;

if (isSupabaseConfigured) {
  client = createClient<Database>(supabaseUrl!, supabaseAnonKey!);
} else if (import.meta.env.DEV) {
  console.warn(supabaseConfigError);
}

export function getSupabase(): SupabaseClient<Database> {
  if (!client) {
    throw new Error(supabaseConfigError ?? 'Supabase non configurato');
  }
  return client;
}
