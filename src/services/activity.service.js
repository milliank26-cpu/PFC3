import { supabase } from "../lib/supabase.js";
import { state } from "../app/state.js";
export async function listActivity() {
  if (supabase) {
    const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    state.store.activity = data.map(a => ({ ...a, message: a.details?.message || a.action, type: a.actor_role || "system" }));
    return state.store.activity;
  }
  return state.store.activity;
}