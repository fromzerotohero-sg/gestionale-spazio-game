import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseConfigError = isSupabaseConfigured
  ? null
  : 'Supabase non configurato. Imposta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (in locale: app/.env — su Vercel: Settings → Environment Variables, poi Redeploy).';

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
