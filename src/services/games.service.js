import { supabase } from "../lib/supabase.js";
import { state, persist } from "../app/state.js";
import { newId } from "../lib/demo-store.js";

export async function listGames() {
  if (supabase) {
    const { data, error } = await supabase.from("games").select("*").order("name");
    if (error) throw error;
    state.store.games = data;
    return data;
  }
  return state.store.games;
}
export async function saveGame(game) {
  const payload = { ...game, id: game.id || newId("g") };
  if (supabase) {
    const { data, error } = await supabase.from("games").upsert(payload).select().single();
    if (error) throw error;
    state.store.games = data;
    return data;
  }
  const idx = state.store.games.findIndex(g => g.id === payload.id);
  if (idx >= 0) state.store.games[idx] = payload; else state.store.games.unshift(payload);
  persist(); return payload;
}
export async function deleteGame(id) {
  if (supabase) {
    const { error } = await supabase.from("games").update({ active: false }).eq("id", id);
    if (error) throw error; return;
  }
  const game = state.store.games.find(g => g.id === id);
  if (game) game.active = false;
  persist();
}