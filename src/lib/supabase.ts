import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.PUBLIC_SUPABASE_URL ?? "";
const KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "";

let client: ReturnType<typeof createClient> | null = null;

export function getClient() {
  if (client) return client;
  if (!URL || !KEY) return null;
  client = createClient(URL, KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return client;
}

export function isConfigured(): boolean {
  return !!(URL && KEY);
}
