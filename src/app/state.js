import { loadStore } from "../lib/demo-store.js";

export const state = {
  mode: "player",
  page: "home",
  session: null,
  store: loadStore(),
  toastTimer: null
};

export function persist() {
  localStorage.setItem("pfc-demo-store-v1", JSON.stringify(state.store));
}
export function setSession(session) {
  state.session = session;
  sessionStorage.setItem("pfc-session", JSON.stringify(session));
}
export function clearSession() {
  state.session = null;
  sessionStorage.removeItem("pfc-session");
}
export function restoreSession() {
  try { state.session = JSON.parse(sessionStorage.getItem("pfc-session") || "null"); }
  catch { state.session = null; }
}