import { state, persist } from "../app/state.js";
import { pageHeader, statCard, badge, button, avatar, emptyState, field, modal, selectField } from "../components/ui.js";
import { money, shortDate, escapeHtml } from "../lib/format.js";
import { listTournaments } from "../services/tournaments.service.js";
import { listGames } from "../services/games.service.js";
import { createPaymentSubmission, attachPaymentProof, listPayments } from "../services/payments.service.js";
import { createTicket, listSupport } from "../services/support.service.js";

const gameById = id => state.store.games.find(g => g.id === id);
const statusTone = s => ({ open:"success", live:"info", completed:"neutral", draft:"warning", full:"warning", pending:"warning", verified:"success", rejected:"danger" }[s] || "neutral");

export async function playerPage(page) {
  const tournaments = await listTournaments();
  const games = await listGames();
  await Promise.all([listPayments(), listSupport()]);
  if (page === "home" || page === "competitions") return competitionsPage(tournaments, page === "home");
  if (page === "games") return gamesPage(games);
  if (page === "leaderboard") return leaderboardPage();
  if (page === "profile") return profilePage();
  if (page === "support") return supportPage();
  return competitionsPage(tournaments, true);
}
function competitionsPage(tournaments, home) {
  const visible = tournaments.filter(t => t.status !== "draft" && (t.access || "public") === "public");
  const featured = visible.filter(t => ["open","live"].includes(t.status));
  return `${home ? `<section class="player-hero"><div class="hero-copy"><p class="eyebrow">WELCOME TO YOUR ARENA</p><h1>YOUR GAME.<br><span>YOUR MOMENT.</span></h1><p>Discover competitions, challenge other players and make your mark in the PFC community.</p><div class="hero-actions">${button("Explore competitions",{action:"go-competitions"})}<a class="btn btn-ghost" href="#/player/games">Explore games</a></div></div><div class="hero-art"><div class="hero-orbit orbit-one"></div><div class="hero-orbit orbit-two"></div><div class="hero-plate"><span>PLAY</span><strong>PFC</strong><span>COMPETE · BELONG</span></div></div></section>` : pageHeader("Competitions","Find your next challenge and review the rules before entering.")}
  <section class="content-section"><div class="section-heading"><div><p class="eyebrow">THE ARENA</p><h2>${home ? "Featured competitions" : "Open competitions"}</h2></div><a href="#/player/competitions" class="text-link">View all →</a></div>
  <div class="competition-grid">${featured.length ? featured.map(t => tournamentCard(t)).join("") : emptyState("No open competitions","Check back soon for the next PFC challenge.")}</div></section>
  ${home ? `<section class="content-section"><div class="section-heading"><div><p class="eyebrow">YOUR COMMUNITY</p><h2>More than a game</h2></div></div><div class="feature-grid"><article class="feature-card"><span class="feature-symbol">⚡</span><h3>Compete</h3><p>Take on challenges and test your abilities.</p></article><article class="feature-card"><span class="feature-symbol">✦</span><h3>Belong</h3><p>Build your player identity and connect with the PFC community.</p></article><article class="feature-card"><span class="feature-symbol">🏆</span><h3>Get recognized</h3><p>Track achievements and celebrate verified results.</p></article></div></section>` : ""}`;
}
function tournamentCard(t) {
  const game = t.games || gameById(t.game_id) || {};
  const pct = Math.min(100, Math.round((t.registered || 0) / Math.max(1, t.max_players || 1) * 100));
  return `<article class="competition-card"><div class="competition-art" style="background-image:linear-gradient(180deg,transparent,#10121c),url('${escapeHtml(game.image_url || "./assets/images/game-image-placeholder.svg")}')"><span class="game-tag">${escapeHtml(game.name || "PFC Game")}</span>${badge(t.status, statusTone(t.status))}</div><div class="competition-body"><h3>${escapeHtml(t.title)}</h3><p>${escapeHtml(t.description || "Join the PFC competition.")}</p><div class="competition-numbers"><div><small>Entry</small><strong>${money(t.entry_fee,t.currency)}</strong></div><div><small>Prize</small><strong class="gold-text">${money(t.prize_pool,t.currency)}</strong></div></div><div class="capacity-line"><span>${t.registered || 0} / ${t.max_players || "—"} players</span><span>${pct}%</span></div><div class="progress"><span style="width:${pct}%"></span></div><div class="card-foot"><small>${shortDate(t.starts_at)}</small><button class="btn btn-primary btn-sm" data-action="join-tournament" data-id="${t.id}" ${t.status !== "open" ? "disabled" : ""}>${t.status === "open" ? "View & join" : "Unavailable"}</button></div></div></article>`;
}
function gamesPage(games) {
  return `${pageHeader("Games","Explore the games currently supported by PFC.")}<section class="game-grid">${games.filter(g=>g.active).map(g=>`<article class="game-card"><div class="game-cover" style="background-image:linear-gradient(180deg,transparent,#10121c),url('${escapeHtml(g.image_url || "./assets/images/game-image-placeholder.svg")}')"></div><div class="game-card-body"><div class="eyebrow">${escapeHtml(g.category || "GAME")}</div><h3>${escapeHtml(g.name)}</h3><p>${escapeHtml(g.description || "")}</p><div class="game-meta"><span>${escapeHtml(g.format?.replaceAll("_"," ") || "Competition")}</span><span>${g.min_players || 2}+ players</span></div></div></article>`).join("")}</section>`;
}
function leaderboardPage() {
  const players = [...state.store.players].sort((a,b)=>(b.wins||0)-(a.wins||0));
  return `${pageHeader("Leaderboard","Celebrate verified achievements across the PFC community.")}<div class="panel"><div class="panel-head"><div><h2>Community leaders</h2><p>Demo rankings until live competition results are connected.</p></div>${badge("Sample data","warning")}</div><div class="table-wrap"><table><thead><tr><th>Rank</th><th>Player</th><th>Competitions</th><th>Wins</th></tr></thead><tbody>${players.map((p,i)=>`<tr><td><strong class="rank-number">${String(i+1).padStart(2,"0")}</strong></td><td><div class="person-cell">${avatar(p.name)}<strong>${escapeHtml(p.name)}</strong></div></td><td>${p.competitions || 0}</td><td><strong>${p.wins || 0}</strong></td></tr>`).join("")}</tbody></table></div></div>`;
}
function profilePage() {
  const player = state.session;
  const entries = state.store.payments.filter(p=>p.player_id===player.id || p.phone===player.phone);
  return `${pageHeader("My PFC","Your gaming identity, activity and competition history.")}<div class="profile-layout"><section class="profile-card"><div class="profile-banner"></div><div class="profile-info">${avatar(player.name,"xl")}<h2>${escapeHtml(player.name)}</h2><p>${escapeHtml(state.session.email || "")}</p><p>@${escapeHtml(state.session.username || "player")} · ${escapeHtml(player.phone || "Phone not set")}</p>${badge("PFC Player","success")}</div><div class="profile-stats"><div><strong>${entries.length}</strong><small>Entries</small></div><div><strong>—</strong><small>Verified wins</small></div><div><strong>Rookie</strong><small>Level</small></div></div></section><section class="panel"><div class="panel-head"><div><h2>Payment and entry history</h2><p>Reference codes and verification status.</p></div></div>${entries.length ? entries.map(p=>`<div class="activity-row"><div><strong>${escapeHtml(p.tournament_name)}</strong><small>${escapeHtml(p.code)} · ${shortDate(p.created_at)}</small></div><div>${badge(p.status,statusTone(p.status))}<strong>${money(p.amount,p.currency)}</strong></div></div>`).join("") : emptyState("No entries yet","Join a competition to start your PFC journey.")}</section></div>`;
}
function supportPage() {
  const tickets = state.store.support.filter(t=>t.phone===state.session.phone);
  return `${pageHeader("Support","Talk to the PFC team. Include a clear description so we can help.")}<div class="support-layout"><section class="panel"><div class="panel-head"><div><h2>Send a message</h2><p>Report a problem, ask a question or suggest an improvement.</p></div></div><form id="support-form" class="stack-form">${field("Subject","subject","","text",true,"What do you need help with?")}<label class="field"><span>Message</span><textarea name="message" rows="5" required placeholder="Describe what happened. Do not include your password or payment PIN."></textarea></label><button class="btn btn-primary" type="submit">Send to PFC support</button></form></section><section class="panel"><div class="panel-head"><div><h2>Your messages</h2><p>Follow up on your support requests.</p></div></div>${tickets.length ? tickets.map(t=>`<div class="activity-row"><div><strong>${escapeHtml(t.subject)}</strong><small>${shortDate(t.created_at)}</small></div>${badge(t.status,t.status==="open"?"warning":"success")}</div>`).join("") : emptyState("No messages yet","Your messages to PFC will appear here.")}</section></div>`;
}
export function bindPlayer(root, toast, refresh) {
  root.querySelectorAll("[data-action='join-tournament']").forEach(btn=>btn.addEventListener("click",()=>{
    const t=state.store.tournaments.find(x=>x.id===btn.dataset.id);
    if (!t) return;
    if (t.access==="invite_only") return toast("This competition is restricted. Contact PFC for access.","warning");
    const g=gameById(t.game_id);
    const ruleText=g?.rules || "Competition rules will be provided by the operator.";
    root.insertAdjacentHTML("beforeend", modal("Competition details",`<div class="notice notice-info">Review the rules and payment details before entering.</div><h3>${escapeHtml(t.title)}</h3><p>${escapeHtml(t.description || "")}</p><div class="detail-grid"><div><small>Entry fee</small><strong>${money(t.entry_fee,t.currency)}</strong></div><div><small>Prize</small><strong>${money(t.prize_pool,t.currency)}</strong></div></div><h4>Game rules</h4><p class="rules-copy">${escapeHtml(ruleText)}</p><p class="field-hint">Payment must be made using the same phone number used for your PFC account. The reference code links your payment submission to this entry.</p><input type="hidden" name="tournament_id" value="${t.id}"><label class="check-line"><input type="checkbox" name="accept" required> I have read and agree to the competition rules.</label>`,`Continue to payment`));
    root.querySelector("#modal-form").addEventListener("submit",async e=>{
      e.preventDefault();
      if (!e.target.accept.checked) return;
      try {
        const payment=await createPaymentSubmission({tournament:t,player:state.session});
        closeModal();
        root.insertAdjacentHTML("beforeend",modal("Payment submission",`<div class="payment-code">${escapeHtml(payment.code)}</div><p class="center muted">Your unique PFC payment reference</p><div class="notice notice-info">Pay using your registered phone number: <strong>${escapeHtml(state.session.phone)}</strong>. Upload your payment evidence below. Your entry remains pending until verified by PFC.</div><p><strong>Amount:</strong> ${money(t.entry_fee,t.currency)}</p><label class="field"><span>Payment proof image</span><input type="file" name="proof" accept="image/*"></label><p class="field-hint">Never upload your mobile money PIN, password or full card details.</p>`,`Submit for verification`));
        root.querySelector("#modal-form").addEventListener("submit",async ev=>{
          ev.preventDefault();
          const file=ev.target.querySelector('[name="proof"]').files[0];
          try { if(file) await attachPaymentProof(payment.id,file); closeModal(); toast(`Reference ${payment.code} created. Payment is awaiting operator verification.`,"success"); refresh(); }
          catch(err){ toast(err.message,"danger"); }
        },{once:true});
      } catch(err){ toast(err.message,"danger"); }
    },{once:true});
  }));
  root.querySelector("#support-form")?.addEventListener("submit",async e=>{
    e.preventDefault(); const fd=new FormData(e.target);
    try { await createTicket({player:state.session,subject:fd.get("subject"),message:fd.get("message")}); toast("Your message has been sent to PFC support.","success"); refresh(); }
    catch(err){toast(err.message,"danger");}
  });
}
function closeModal(){document.querySelector("#modal-backdrop")?.remove();}
