import { supabase } from "../lib/supabase.js";
import { state, persist } from "../app/state.js";
import { newId, newPaymentCode } from "../lib/demo-store.js";

export async function listPayments() {
  if (supabase) {
    const { data, error } = await supabase.from("payments").select("*, profiles(display_name,phone), tournaments(title)").order("created_at", { ascending: false });
    if (error) throw error;
    state.store.payments = data.map(p => ({
      ...p,
      code: p.reference_code,
      player_name: p.profiles?.display_name || "Player",
      phone: p.profiles?.phone || "",
      tournament_name: p.tournaments?.title || "Competition"
    }));
    return state.store.payments;
  }
  return state.store.payments;
}
export async function createPaymentSubmission({ tournament, player, file }) {
  if (supabase) {
    const { data, error } = await supabase.rpc("create_payment_reference", { target_tournament_id: tournament.id });
    if (error) throw error;
    const payment = data;
    if (file) {
      const path = `${player.id}/${payment.id}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const upload = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: false });
      if (upload.error) throw upload.error;
      await supabase.from("payments").update({ proof_path: path }).eq("id", payment.id);
    }
    return payment;
  }
  const payment = {
    id: newId("pay"), code: newPaymentCode(), player_id: player.id, player_name: player.name,
    phone: player.phone, tournament_id: tournament.id, tournament_name: tournament.title,
    amount: Number(tournament.entry_fee), currency: tournament.currency || "UGX",
    status: "pending", proof_name: file?.name || "No file uploaded", created_at: new Date().toISOString()
  };
  state.store.payments.unshift(payment);
  state.store.activity.unshift({ id: newId("a"), type: "payment", message: `Payment ${payment.code} submitted for verification`, created_at: new Date().toISOString() });
  persist(); return payment;
}
export async function attachPaymentProof(paymentId, file) {
  if (!file) return;
  if (!file.type?.startsWith("image/")) throw new Error("Upload an image file as payment evidence.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Payment evidence must be 5 MB or smaller.");
  if (supabase) {
    const path = `${state.session.id}/${paymentId}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const upload = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: false });
    if (upload.error) throw upload.error;
    const { error } = await supabase.rpc("player_attach_payment_proof", { target_payment_id: paymentId, proof_storage_path: path });
    if (error) throw error;
    return;
  }
  const payment = state.store.payments.find(p => p.id === paymentId);
  if (payment) payment.proof_name = file.name;
  persist();
}

export async function getPaymentProofUrl(path) {
  if (!supabase || !path) return null;
  const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 90);
  if (error) throw error;
  return data.signedUrl;
}

export async function verifyPayment(id, status, note = "") {
  if (supabase) {
    const { error } = await supabase.rpc("operator_review_payment", { target_payment_id: id, decision: status, review_note: note });
    if (error) throw error; return;
  }
  const payment = state.store.payments.find(p => p.id === id);
  if (payment) { payment.status = status; payment.review_note = note; payment.reviewed_at = new Date().toISOString(); }
  state.store.activity.unshift({ id: newId("a"), type: "payment", message: `Payment ${payment?.code || id} marked ${status}`, created_at: new Date().toISOString() });
  persist();
}