import { supabase } from "../lib/supabase.js";
import { state, persist } from "../app/state.js";
import { newId } from "../lib/demo-store.js";

export async function listTournaments() {
  if (supabase) {
    const { data, error } = await supabase.from("tournaments").select("*, games(name), registrations(count)").order("starts_at");
    if (error) throw error;
    state.store.tournaments = data.map(t => ({ ...t, game_id: t.game_id, registered: t.registrations?.[0]?.count || 0, games: t.games }));
    return state.store.tournaments;
  }
  return state.store.tournaments.map(t => ({ ...t, games: state.store.games.find(g => g.id === t.game_id) || null }));
}
export async function saveTournament(item) {
  const payload = { ...item, id: item.id || newId("t") };
  if (supabase) {
    const { data, error } = await supabase.from("tournaments").upsert(payload).select().single();
    if (error) throw error; return data;
  }
  const idx = state.store.tournaments.findIndex(t => t.id === payload.id);
  if (idx >= 0) state.store.tournaments[idx] = payload; else state.store.tournaments.unshift(payload);
  persist(); return payload;
}
export async function updateTournamentStatus(id, status) {
  if (supabase) {
    const { error } = await supabase.from("tournaments").update({ status }).eq("id", id);
    if (error) throw error; return;
  }
  const t = state.store.tournaments.find(x => x.id === id);
  if (t) t.status = status;
  persist();
}