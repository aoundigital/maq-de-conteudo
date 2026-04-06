import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppSettings, HistoryItem } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

let _client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}

/* ─── Settings ─────────────────────────────────────────── */

export async function saveSettingsRemote(email: string, settings: AppSettings): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await getClient().from('settings').upsert(
    { email, data: settings, updated_at: new Date().toISOString() },
    { onConflict: 'email' }
  );
  if (error) console.error('[Supabase] saveSettings:', error.message);
}

export async function loadSettingsRemote(email: string): Promise<AppSettings | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getClient()
    .from('settings')
    .select('data')
    .eq('email', email)
    .maybeSingle();
  if (error) { console.error('[Supabase] loadSettings:', error.message); return null; }
  return (data?.data as AppSettings) ?? null;
}

/* ─── History ───────────────────────────────────────────── */

export async function saveHistoryItemRemote(email: string, item: HistoryItem): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await getClient().from('history').upsert(
    { id: item.id, email, data: item, created_at: item.date },
    { onConflict: 'id' }
  );
  if (error) console.error('[Supabase] saveHistory:', error.message);
}

export async function loadHistoryRemote(email: string): Promise<HistoryItem[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await getClient()
    .from('history')
    .select('data')
    .eq('email', email)
    .order('created_at', { ascending: false });
  if (error) { console.error('[Supabase] loadHistory:', error.message); return []; }
  return (data ?? []).map((row) => row.data as HistoryItem);
}

export async function deleteHistoryItemRemote(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await getClient().from('history').delete().eq('id', id);
  if (error) console.error('[Supabase] deleteHistory:', error.message);
}
