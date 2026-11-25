import { state, restoreSession } from "./app/state.js";
import { parseRoute } from "./app/router.js";
import { renderApp } from "./app/shell.js";

restoreSession();
parseRoute();
if (state.session) {
  state.mode = state.session.role === "operator" ? "operator" : "player";
  if (!location.hash) state.page = state.mode === "operator" ? "overview" : "home";
}
renderApp();
