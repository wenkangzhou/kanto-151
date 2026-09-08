import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { parseSupabaseConfig } from './config';

function getConfig() {
  return parseSupabaseConfig(process.env)!;
}

/** Request-scoped client. Pass the verified user's token to apply their RLS role. */
export function createSupabaseServerClient(accessToken?: string) {
  const config = getConfig();
  return createClient(config.url, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    ...(accessToken ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } } : {}),
  });
}

/** Elevated client: the calling handler must verify authorization before using it. */
export function createSupabaseAdminClient() {
  const config = getConfig();
  return createClient(config.url, config.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
