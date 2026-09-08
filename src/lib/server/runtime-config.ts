import 'server-only';
import { parseSupabaseConfig } from '../supabase/config';
import { parseAppConfig } from './app-config';
export function getRuntimeConfig() {
  const supabase = parseSupabaseConfig(process.env, { allowEmpty: true });
  if (!supabase) return null;
  return parseAppConfig(process.env);
}
