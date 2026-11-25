import { state } from "./state.js";
import { icon, avatar, badge } from "../components/ui.js";
import { playerPage, bindPlayer } from "../pages/player.page.js";
import { operatorPage, bindOperator } from "../pages/operator.page.js";
import { signOut } from "../services/auth.service.js";
import { authPage, bindAuth } from "../pages/auth.page.js";
import { config } from "../config/env.js";
import { onboardingPage, bindOnboarding } from "../pages/onboarding.page.js";

const playerNav=[["home","Home","home"],["games","Games","gamepad"],["competitions","Compete","trophy"],["leaderboard","Ranks","chart"],["profile","My PFC","user"],["support","Support","message"]];
const operatorNav=[["overview","Overview","home"],["players","Players","users"],["games","Games & rules","gamepad"],["tournaments","Tournaments","trophy"],["payments","Payments","credit"],["support","Support","message"],["activity","Activity","activity"],["settings","Settings","settings"]];

export function toast(message,type="info") {
  const root=document.querySelector("#toast-root");
  const el=document.createElement("div");el.className=`toast toast-${type}`;el.textContent=message;root.append(el);
  setTimeout(()=>el.remove(),3600);
}
export async function renderApp() {
  const root=document.querySelector("#app");
  if(!state.session) {
    root.innerHTML=authPage();
    bindAuth(root,session=>{state.mode=session.role==="operator"?"operator":"player";state.page=state.mode==="operator"?"overview":"home";location.hash=`/${state.mode}/${state.page}`;renderApp();},toast);
    return;
  }
  if(state.session.needsOnboarding) {
    root.innerHTML=onboardingPage(state.session);
    bindOnboarding(root,state.session,session=>{state.session=session;state.mode="player";state.page="home";location.hash="#/player/home";renderApp();});
    return;
  }
  if(state.mode==="operator" && state.session.role!=="operator") {
    state.mode="player";state.page="home";
  }
  const nav=state.mode==="operator"?operatorNav:playerNav;
  const activePage=state.page;
  root.innerHTML=`<div class="app-shell ${state.mode}-shell">
    <header class="topbar"><a class="brand" href="#/${state.mode}/${state.mode==="operator"?"overview":"home"}"><span class="brand-mark">PFC</span><span class="brand-copy"><strong>PLAY FOR CASH</strong><small>PLAY. COMPETE. BELONG.</small></span></a><div class="topbar-right">${state.mode==="operator"?badge("OPERATOR CONSOLE","info"):badge("PLAYER ARENA","success")}<button class="icon-btn notification-btn" aria-label="Notifications">${icon("bell")}</button><div class="user-chip">${avatar(state.session.name)}<span>${state.session.name}</span></div><button class="icon-btn" data-action="logout" aria-label="Sign out">${icon("logout")}</button></div></header>
    <div class="app-body"><aside class="sidebar"><div class="sidebar-label">${state.mode==="operator"?"PLATFORM CONTROL":"YOUR PFC"}</div><nav>${nav.map(([key,label,ico])=>`<a href="#/${state.mode}/${key}" class="nav-link ${activePage===key?"active":""}">${icon(ico)}<span>${label}</span></a>`).join("")}</nav><div class="sidebar-bottom"><div class="sidebar-promo"><span class="promo-mark">✦</span><strong>${state.mode==="operator"?"One platform. Full control.":"Make your mark."}</strong><small>${state.mode==="operator"?"Monitor, manage and grow PFC.":"Your game. Your community."}</small></div><button class="nav-link signout-link" data-action="logout">${icon("logout")}<span>Sign out</span></button></div></aside>
    <main class="main-content"><div class="mobile-context">${state.mode==="operator"?"OPERATOR CONSOLE":"PLAYER ARENA"}</div><div id="page-content" class="page-content"><div class="loading-state">Loading PFC…</div></div></main></div>
    <nav class="mobile-nav">${nav.slice(0,5).map(([key,label,ico])=>`<a href="#/${state.mode}/${key}" class="${activePage===key?"active":""}">${icon(ico)}<span>${label}</span></a>`).join("")}</nav>
    <footer class="app-footer"><span>© ${new Date().getFullYear()} PFC — Play. Compete. Belong.</span><span>${config.demoMode?"DEMO MODE":"CONNECTED MODE"}</span></footer>
  </div>`;
  root.querySelectorAll("[data-action='logout']").forEach(b=>b.addEventListener("click",async()=>{await signOut();renderApp();}));
  const content=root.querySelector("#page-content");
  try {
    content.innerHTML=state.mode==="operator"?await operatorPage(state.page):await playerPage(state.page);
    if(state.mode==="operator")bindOperator(content,toast,renderApp);
    else bindPlayer(content,toast,renderApp);
    content.addEventListener("click",e=>{if(e.target.closest("[data-action='go-competitions']"))location.hash="#/player/competitions";});
  } catch(error) {
    console.error("PFC page error:",error);
    content.innerHTML=`<section class="error-panel"><h2>We couldn't load this page</h2><p>Something went wrong while loading this section. Please try again. If it continues, contact PFC support.</p><button class="btn btn-primary" id="retry-page">Try again</button><small>Reference: PFC-${Date.now().toString(36).toUpperCase()}</small></section>`;
    content.querySelector("#retry-page").addEventListener("click",renderApp);
  }
}