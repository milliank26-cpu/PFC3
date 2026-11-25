import { state } from "./state.js";
import { renderApp } from "./shell.js";

const allowed = {
  player: ["home", "games", "competitions", "leaderboard", "profile", "support"],
  operator: ["overview", "players", "games", "tournaments", "payments", "support", "activity", "settings"]
};

export function navigate(page, mode = state.mode) {
  state.mode = mode;
  state.page = allowed[mode]?.includes(page) ? page : (mode === "operator" ? "overview" : "home");
  location.hash = `/${mode}/${state.page}`;
  renderApp();
}
export function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, "").split("/");
  const mode = parts[0] === "operator" ? "operator" : "player";
  const page = parts[1] || (mode === "operator" ? "overview" : "home");
  state.mode = mode;
  state.page = allowed[mode]?.includes(page) ? page : (mode === "operator" ? "overview" : "home");
}
window.addEventListener("hashchange", () => {
  parseRoute();
  renderApp();
});