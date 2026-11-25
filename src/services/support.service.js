import { supabase } from "../lib/supabase.js";
import { state, persist } from "../app/state.js";
import { newId } from "../lib/demo-store.js";

export async function listSupport() {
  if (supabase) {
    const { data, error } = await supabase.from("support_tickets").select("*, profiles(display_name,phone)").order("created_at", { ascending: false });
    if (error) throw error;
    state.store.support = data.map(t => ({ ...t, player_name: t.profiles?.display_name || "Player", phone: t.profiles?.phone || "" }));
    return state.store.support;
  }
  return state.store.support;
}
export async function createTicket({ player, subject, message }) {
  if (supabase) {
    const { data, error } = await supabase.from("support_tickets").insert({ user_id: player.id, subject, message }).select().single();
    if (error) throw error;
    state.store.support = data.map(t => ({ ...t, player_name: t.profiles?.display_name || "Player", phone: t.profiles?.phone || "" }));
    return state.store.support;
  }
  const ticket = { id: newId("s"), player_name: player.name, phone: player.phone, subject, message, status: "open", created_at: new Date().toISOString() };
  state.store.support.unshift(ticket); persist(); return ticket;
}
export async function updateTicket(id, status) {
  if (supabase) {
    const { error } = await supabase.from("support_tickets").update({ status }).eq("id", id);
    if (error) throw error; return;
  }
  const ticket = state.store.support.find(t => t.id === id);
  if (ticket) ticket.status = status;
  persist();
}