import { supabase } from "../lib/supabase.js";
import { state, persist } from "../app/state.js";

export async function listPlayers() {
  if (supabase) {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    state.store.players = data.map(p => ({ ...p, name: p.display_name }));
    return state.store.players;
  }
  return state.store.players;
}
export async function setPlayerStatus(id, status, reason) {
  if (!reason?.trim()) throw new Error("A reason is required for an account restriction.");
  if (supabase) {
    const { error } = await supabase.rpc("operator_set_player_status", { target_user_id: id, new_status: status, action_reason: reason.trim() });
    if (error) throw error; return;
  }
  const player = state.store.players.find(p => p.id === id);
  if (player) { player.status = status; player.status_reason = reason.trim(); }
  state.store.activity.unshift({ id: `a-${Date.now()}`, type: "moderation", message: `Player ${id} status changed to ${status}: ${reason}`, created_at: new Date().toISOString() });
  persist();
}