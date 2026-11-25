import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { config, isSupabaseConfigured } from "../config/env.js";

export const supabase = isSupabaseConfigured
  ? createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null;

export function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured. Add your project URL and anon key to config.js.");
  return supabase;
}
