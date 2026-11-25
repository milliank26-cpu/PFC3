import { state, persist } from "../app/state.js";
import { pageHeader, statCard, badge, button, avatar, emptyState, field, selectField, modal } from "../components/ui.js";
import { miniBars, donut } from "../components/charts.js";
import { money, shortDate, dateTime, escapeHtml } from "../lib/format.js";
import { saveGame, deleteGame } from "../services/games.service.js";
import { saveTournament, updateTournamentStatus } from "../services/tournaments.service.js";
import { listPlayers, setPlayerStatus } from "../services/players.service.js";
import { listGames } from "../services/games.service.js";
import { listTournaments } from "../services/tournaments.service.js";
import { listPayments, verifyPayment, getPaymentProofUrl } from "../services/payments.service.js";
import { listSupport, updateTicket } from "../services/support.service.js";
import { listActivity } from "../services/activity.service.js";
import { newId } from "../lib/demo-store.js";

const tone = s => ({active:"success",open:"warning",pending:"warning",verified:"success",rejected:"danger",suspended:"danger",banned:"danger",restricted:"warning",live:"info",completed:"neutral",draft:"neutral"}[s]||"neutral");
const gameName = id => state.store.games.find(g=>g.id===id)?.name || "Unknown game";

export async function operatorPage(page) {
  const [players,payments,support,activity] = await Promise.all([listPlayers(),listPayments(),listSupport(),listActivity(),listGames(),listTournaments()]);
  if (page==="overview") return overview(players,payments,support,activity);
  if (page==="players") return playersPage(players);
  if (page==="games") return gamesPage();
  if (page==="tournaments") return tournamentsPage();
  if (page==="payments") return paymentsPage(payments);
  if (page==="support") return supportPage(support);
  if (page==="activity") return activityPage(activity);
  if (page==="settings") return settingsPage();
  return overview(players,payments,support,activity);
}
function overview(players,payments,support,activity) {
  const pending=payments.filter(p=>p.status==="pending").length;
  const active=players.filter(p=>p.status==="active").length;
  const total=state.store.tournaments.length;
  const collections=payments.filter(p=>p.status==="verified").reduce((n,p)=>n+Number(p.amount||0),0);
  return `${pageHeader("Operator overview","Your command centre for everything happening across PFC.",button("Create tournament",{action:"create-tournament",iconName:"plus"}))}
  <div class="stat-grid">${statCard("Total players",players.length,`${active} active accounts`,"users")}${statCard("Competitions",total,"Across all game formats","trophy")}${statCard("Payments to review",pending,"Require operator attention","credit")}${statCard("Verified collections",money(collections),"Demo payment records","chart")}</div>
  <div class="dashboard-grid"><section class="panel"><div class="panel-head"><div><h2>Platform activity</h2><p>Sample event activity by day.</p></div>${badge("Demo analytics","warning")}</div>${miniBars([4,7,5,10,8,13,9],["M","T","W","T","F","S","S"])}</section><section class="panel"><div class="panel-head"><div><h2>Player account health</h2><p>Current player status distribution.</p></div></div>${donut(active,Math.max(1,players.length),"active")}<div class="legend-list"><span><i class="dot dot-green"></i> Active ${active}</span><span><i class="dot dot-orange"></i> Restricted ${players.length-active}</span></div></section></div>
  <div class="dashboard-grid"><section class="panel"><div class="panel-head"><div><h2>Payment verification queue</h2><p>Review references and evidence.</p></div><a href="#/operator/payments" class="text-link">Open queue →</a></div>${payments.filter(p=>p.status==="pending").slice(0,4).map(paymentRow).join("") || emptyState("All caught up","There are no pending payment submissions.")}</section><section class="panel"><div class="panel-head"><div><h2>Recent platform activity</h2><p>Latest recorded actions.</p></div><a href="#/operator/activity" class="text-link">View all →</a></div>${activity.slice(0,5).map(a=>`<div class="activity-row"><div><strong>${escapeHtml(a.message || a.action || a.event_type)}</strong><small>${dateTime(a.created_at)}</small></div>${badge(a.type||"event","neutral")}</div>`).join("")}</section></div>`;
}
function playersPage(players) {
  return `${pageHeader("Players","View accounts, monitor participation and apply fair account controls.",`<div class="header-actions">${button("Export list",{action:"export-players",variant:"secondary"})}</div>`)}<div class="toolbar"><div class="search-box">⌕ <input id="player-search" placeholder="Search name or phone number"></div><span class="muted">${players.length} player accounts</span></div><div class="panel"><div class="table-wrap"><table id="players-table"><thead><tr><th>Player</th><th>Phone</th><th>Joined</th><th>Status</th><th>Activity</th><th>Control</th></tr></thead><tbody>${players.map(p=>`<tr data-search="${escapeHtml((p.name||p.display_name||"")+" "+(p.phone||"")) .toLowerCase()}"><td><div class="person-cell">${avatar(p.name||p.display_name)}<strong>${escapeHtml(p.name||p.display_name||"Player")}</strong></div></td><td>${escapeHtml(p.phone||"—")}</td><td>${shortDate(p.joined_at||p.created_at)}</td><td>${badge(p.status||"active",tone(p.status||"active"))}</td><td>${p.competitions||0} events · ${p.wins||0} wins</td><td><button class="btn btn-sm btn-secondary" data-action="manage-player" data-id="${p.id}">Manage</button></td></tr>`).join("")}</tbody></table></div></div><p class="field-hint">Account restrictions must have a documented reason. In production, notify the player and provide a review or appeal route. High-impact bans should require owner-level approval.</p>`;
}
function gamesPage() {
  return `${pageHeader("Game library","Add games and configure the rules and winner-determination method for each one.",button("Add game",{action:"add-game",iconName:"plus"}))}<div class="game-admin-grid">${state.store.games.map(g=>`<article class="game-admin-card"><div class="game-admin-cover" style="background-image:linear-gradient(180deg,transparent,#151827),url('${escapeHtml(g.image_url||"./assets/images/game-image-placeholder.svg")}')"></div><div class="game-admin-body"><div class="row-between">${badge(g.active?"Active":"Inactive",g.active?"success":"neutral")}<span class="muted">${escapeHtml(g.category||"Game")}</span></div><h3>${escapeHtml(g.name)}</h3><p>${escapeHtml(g.description||"")}</p><div class="game-rule-summary"><span>Format</span><strong>${escapeHtml((g.format||"").replaceAll("_"," "))}</strong><span>Winner</span><strong>${escapeHtml(g.winner_method||"Not configured")}</strong><span>Time limit</span><strong>${g.time_limit_minutes||"—"} min</strong><span>Players</span><strong>${g.min_players||"—"}–${g.max_players||"—"}</strong></div><div class="card-foot"><button class="btn btn-secondary btn-sm" data-action="edit-game" data-id="${g.id}">Edit game & rules</button><button class="btn btn-ghost btn-sm" data-action="toggle-game" data-id="${g.id}">${g.active?"Deactivate":"Activate"}</button></div></div></article>`).join("")}</div>`;
}
function tournamentsPage() {
  return `${pageHeader("Tournaments","Create, publish, edit and control every PFC competition.",button("Create tournament",{action:"create-tournament",iconName:"plus"}))}<div class="panel"><div class="table-wrap"><table><thead><tr><th>Competition</th><th>Game</th><th>Entry / Prize</th><th>Players</th><th>Start</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.store.tournaments.map(t=>`<tr><td><strong>${escapeHtml(t.title)}</strong><small class="table-sub">${escapeHtml(t.access||"public")}</small></td><td>${escapeHtml(gameName(t.game_id))}</td><td>${money(t.entry_fee,t.currency)} / ${money(t.prize_pool,t.currency)}</td><td>${t.registered||0} / ${t.max_players||"—"}</td><td>${shortDate(t.starts_at)}</td><td>${badge(t.status,tone(t.status))}</td><td><div class="table-actions"><button class="btn btn-sm btn-secondary" data-action="edit-tournament" data-id="${t.id}">Edit</button><button class="btn btn-sm btn-ghost" data-action="tournament-status" data-id="${t.id}">Status</button></div></td></tr>`).join("")}</tbody></table></div></div>`;
}
function paymentsPage(payments) {
  const pending=payments.filter(p=>p.status==="pending");
  return `${pageHeader("Payment verification","Match the unique PFC reference, player phone number, amount and evidence before deciding.",`${badge(`${pending.length} pending`,"warning")}`)}<div class="notice notice-warning"><strong>Verification policy:</strong> a receipt image is supporting evidence, not proof that funds have settled. Confirm against the payment provider or the authorised receiving account before marking verified.</div><div class="panel"><div class="table-wrap"><table><thead><tr><th>Reference</th><th>Player / phone</th><th>Competition</th><th>Amount</th><th>Evidence</th><th>Status</th><th>Review</th></tr></thead><tbody>${payments.map(p=>`<tr><td><strong class="code-text">${escapeHtml(p.code||p.reference_code||p.id)}</strong><small class="table-sub">${dateTime(p.created_at)}</small></td><td><strong>${escapeHtml(p.player_name||p.profiles?.display_name||"Player")}</strong><small class="table-sub">${escapeHtml(p.phone||p.profiles?.phone||"")}</small></td><td>${escapeHtml(p.tournament_name||p.tournaments?.title||"Competition")}</td><td><strong>${money(p.amount,p.currency)}</strong></td><td>${p.proof_path?`<button class="btn btn-sm btn-secondary" data-action="view-proof" data-id="${p.id}">View image</button>`:escapeHtml(p.proof_name||"No proof")}</td><td>${badge(p.status,tone(p.status))}</td><td>${p.status==="pending"?`<div class="table-actions"><button class="btn btn-sm btn-primary" data-action="verify-payment" data-id="${p.id}">Review</button></div>`:"—"}</td></tr>`).join("")}</tbody></table></div></div>`;
}
function paymentRow(p) {
  return `<div class="activity-row"><div><strong>${escapeHtml(p.code)} · ${escapeHtml(p.player_name)}</strong><small>${escapeHtml(p.phone)} · ${money(p.amount,p.currency)}</small></div><button class="btn btn-sm btn-secondary" data-action="verify-payment" data-id="${p.id}">Review</button></div>`;
}
function supportPage(tickets) {
  return `${pageHeader("Support inbox","Read player messages and track issues reported from the player portal.")}<div class="support-admin-list">${tickets.map(t=>`<article class="panel ticket-card"><div class="panel-head"><div><h3>${escapeHtml(t.subject)}</h3><p>${escapeHtml(t.player_name||t.profiles?.display_name||"Player")} · ${escapeHtml(t.phone||t.profiles?.phone||"")} · ${dateTime(t.created_at)}</p></div>${badge(t.status,tone(t.status))}</div><p>${escapeHtml(t.message)}</p><div class="card-foot"><span class="muted">Ticket ${escapeHtml(t.id)}</span><button class="btn btn-sm btn-secondary" data-action="ticket-status" data-id="${t.id}">${t.status==="open"?"Mark resolved":"Reopen ticket"}</button></div></article>`).join("") || emptyState("No support tickets","Player messages will appear here.")}</div>`;
}
function activityPage(activity) {
  return `${pageHeader("Platform activity","A chronological view of recorded actions and system events.")}<div class="panel"><div class="activity-feed">${activity.map(a=>`<div class="activity-row"><span class="activity-dot"></span><div class="activity-copy"><strong>${escapeHtml(a.message||a.action||a.event_type||"Platform event")}</strong><small>${dateTime(a.created_at)} · ${escapeHtml(a.type||a.actor_role||"system")}</small></div></div>`).join("")}</div></div>`;
}
function settingsPage() {
  return `${pageHeader("Platform settings","Manage global platform controls and review the current build environment.")}<div class="settings-grid"><section class="panel"><div class="panel-head"><div><h2>Platform controls</h2><p>These controls affect the whole player experience.</p></div></div><label class="setting-row"><span><strong>New player registration</strong><small>Allow new accounts to be created.</small></span><input type="checkbox" id="registration-toggle" ${state.store.settings.registration_enabled?"checked":""}></label><label class="setting-row"><span><strong>Maintenance mode</strong><small>Show a maintenance notice to players.</small></span><input type="checkbox" id="maintenance-toggle" ${state.store.settings.maintenance_mode?"checked":""}></label><button class="btn btn-primary" data-action="save-settings">Save platform settings</button></section><section class="panel"><div class="panel-head"><div><h2>Demo environment</h2><p>Current build review tools.</p></div>${badge("Local demo","warning")}</div><p class="muted">The sample data is stored in this browser only. It is not a live PFC database.</p><button class="btn btn-danger" data-action="reset-demo">Reset demo data</button></section><section class="panel"><div class="panel-head"><div><h2>Operator permissions</h2><p>Recommended production roles.</p></div></div><div class="permission-row"><strong>Owner</strong><span>Full platform control, role management and high-impact approvals.</span></div><div class="permission-row"><strong>Operator</strong><span>Games, competitions, players and payment review within assigned permissions.</span></div><div class="permission-row"><strong>Moderator</strong><span>Player reports, support and limited account restrictions.</span></div></section></div>`;
}

export function bindOperator(root, toast, refresh) {
  root.querySelector("#player-search")?.addEventListener("input",e=>{
    const q=e.target.value.toLowerCase();
    root.querySelectorAll("#players-table tbody tr").forEach(tr=>tr.hidden=!tr.dataset.search.includes(q));
  });
  root.addEventListener("click", async e=>{
    const btn=e.target.closest("[data-action]"); if(!btn)return;
    const id=btn.dataset.id, action=btn.dataset.action;
    try {
      if(action==="add-game"||action==="edit-game") showGameModal(root, action==="edit-game"?state.store.games.find(g=>g.id===id):null, refresh);
      if(action==="create-tournament"||action==="edit-tournament") showTournamentModal(root, action==="edit-tournament"?state.store.tournaments.find(t=>t.id===id):null, refresh);
      if(action==="manage-player") showPlayerModal(root,state.store.players.find(p=>p.id===id),refresh);
      if(action==="verify-payment") showPaymentModal(root,state.store.payments.find(p=>p.id===id),refresh);
      if(action==="view-proof") {
        const payment=state.store.payments.find(p=>p.id===id);
        if(payment?.proof_path) {
          const url=await getPaymentProofUrl(payment.proof_path);
          if(url) root.insertAdjacentHTML("beforeend",modal("Payment evidence",`<img src="${escapeHtml(url)}" alt="Player payment evidence" style="width:100%;height:auto;border-radius:12px"><p class="field-hint">Private file link expires after 90 seconds. Verify the transaction against the receiving account/provider.</p>`,"Close"));
        } else toast("No uploaded image is available for this payment.","warning");
      }
      if(action==="ticket-status") { const t=state.store.support.find(x=>x.id===id); await updateTicket(id,t.status==="open"?"resolved":"open"); toast("Support ticket updated.","success"); refresh(); }
      if(action==="toggle-game") { const g=state.store.games.find(x=>x.id===id); await saveGame({...g,active:!g.active}); toast("Game status updated.","success"); refresh(); }
      if(action==="tournament-status") showTournamentStatusModal(root,state.store.tournaments.find(t=>t.id===id),refresh);
      if(action==="save-settings") saveSettings(root,toast);
      if(action==="reset-demo") { if(confirm("Reset all local demo data?")) { localStorage.removeItem("pfc-demo-store-v1"); location.reload(); } }
      if(action==="export-players") exportPlayers();
    } catch(err){toast(err.message||"Action failed.","danger");}
  });
}
function showGameModal(root,g,refresh) {
  root.insertAdjacentHTML("beforeend",modal(g?"Edit game and rules":"Add a game",`
    ${field("Game name","name",g?.name||"", "text",true,"e.g. Subway Surfers")}
    ${field("Category","category",g?.category||"Mobile","text",true,"Mobile, Sports, Arcade")}
    ${field("Image URL","image_url",g?.image_url||"","url",false,"https://...")}
    <label class="field"><span>Description</span><textarea name="description" rows="2">${escapeHtml(g?.description||"")}</textarea></label>
    ${selectField("Competition format","format",[{value:"score_challenge",label:"Individual score challenge"},{value:"head_to_head",label:"Head-to-head"},{value:"bracket",label:"Knockout bracket"},{value:"league",label:"League / round robin"},{value:"team",label:"Team competition"}],g?.format||"score_challenge")}
    ${field("How is the winner determined?","winner_method",g?.winner_method||"Highest verified score","text",true,"Describe the exact winner rule")}
    ${field("Normal match / round duration (minutes)","duration_minutes",g?.duration_minutes||10,"number",true)}
    ${field("Maximum time limit (minutes)","time_limit_minutes",g?.time_limit_minutes||10,"number",true)}
    ${field("Minimum players","min_players",g?.min_players||2,"number",true)}
    ${field("Maximum players","max_players",g?.max_players||16,"number",true)}
    <label class="field"><span>Game rules and player conduct</span><textarea name="rules" rows="5" required>${escapeHtml(g?.rules||"")}</textarea></label>
    ${field("Tie-breaker method","tie_breaker",g?.tie_breaker||"","text",false,"How are tied results decided?")}
    <label class="check-line"><input type="checkbox" name="active" ${g?.active===false?"":"checked"}> Game is available to players</label>
    <p class="field-hint">Rules are configuration, not executable code. Winner-scoring automation must be implemented and tested securely for each game format.</p>
  `,"Save game"));
  root.querySelector("#modal-form").addEventListener("submit",async e=>{
    e.preventDefault(); const fd=new FormData(e.target);
    const payload=Object.fromEntries(fd.entries());
    payload.id=g?.id; payload.active=fd.get("active")==="on";
    ["duration_minutes","time_limit_minutes","min_players","max_players"].forEach(k=>payload[k]=Number(payload[k]));
    try { await saveGame(payload); closeModal(); toast("Game and rules saved.","success"); refresh(); } catch(err){toast(err.message,"danger");}
  },{once:true});
}
function showTournamentModal(root,t,refresh) {
  const gameOptions=state.store.games.map(g=>({value:g.id,label:g.name}));
  root.insertAdjacentHTML("beforeend",modal(t?"Edit tournament":"Create tournament",`
    ${field("Competition title","title",t?.title||"","text",true,"e.g. Weekend Championship")}
    ${selectField("Game","game_id",gameOptions,t?.game_id||gameOptions[0]?.value)}
    ${field("Entry fee (UGX)","entry_fee",t?.entry_fee??0,"number",true)}
    ${field("Prize pool (UGX)","prize_pool",t?.prize_pool??0,"number",true)}
    ${field("Minimum participants","min_players",t?.min_players||2,"number",true)}
    ${field("Maximum participants","max_players",t?.max_players||16,"number",true)}
    ${field("Start date and time","starts_at",t?.starts_at?new Date(t.starts_at).toISOString().slice(0,16):"","datetime-local",true)}
    ${selectField("Who can enter?",[{value:"public",label:"Anyone (public)"},{value:"invite_only",label:"Restricted / invite only"}].map(x=>({...x})).length?"access":"access",[{value:"public",label:"Anyone (public)"},{value:"invite_only",label:"Restricted / invite only"}],t?.access||"public")}
    ${selectField("Initial status","status",[{value:"draft",label:"Draft (not visible)"},{value:"open",label:"Open for registration"},{value:"paused",label:"Paused"}],t?.status||"draft")}
    <label class="field"><span>Description</span><textarea name="description" rows="3">${escapeHtml(t?.description||"")}</textarea></label>
    <p class="field-hint">The game rules are inherited from the selected game. Review the game rule configuration before publishing.</p>
  `,"Save tournament"));
  root.querySelector("#modal-form").addEventListener("submit",async e=>{
    e.preventDefault();const fd=new FormData(e.target);
    const payload=Object.fromEntries(fd.entries());payload.id=t?.id;payload.entry_fee=Number(payload.entry_fee);payload.prize_pool=Number(payload.prize_pool);payload.min_players=Number(payload.min_players);payload.max_players=Number(payload.max_players);payload.registered=t?.registered||0;payload.currency="UGX";payload.starts_at=new Date(payload.starts_at).toISOString();
    try { await saveTournament(payload);closeModal();toast("Tournament saved.","success");refresh(); }catch(err){toast(err.message,"danger");}
  },{once:true});
}
function showPlayerModal(root,p,refresh) {
  if(!p)return;
  root.insertAdjacentHTML("beforeend",modal("Manage player",`<div class="person-cell">${avatar(p.name)}<div><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.phone)}</small></div></div><p class="muted">Current status: ${escapeHtml(p.status)}</p>${selectField("New account status","status",[{value:"active",label:"Active"},{value:"restricted",label:"Restricted"},{value:"suspended",label:"Suspended"},{value:"banned",label:"Banned"}],p.status)}<label class="field"><span>Reason (required)</span><textarea name="reason" rows="3" required placeholder="Record the specific rule or policy concern."></textarea></label><div class="notice notice-warning">High-impact restrictions should follow PFC's moderation policy. Notify the player and provide an appeal/review path.</div>`,"Apply account status"));
  root.querySelector("#modal-form").addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(e.target);try{await setPlayerStatus(p.id,fd.get("status"),fd.get("reason"));closeModal();toast("Player account status updated and action recorded.","success");refresh();}catch(err){toast(err.message,"danger");}},{once:true});
}
function showPaymentModal(root,p,refresh) {
  if(!p)return;
  root.insertAdjacentHTML("beforeend",modal("Review payment",`<div class="payment-code">${escapeHtml(p.code)}</div><div class="detail-grid"><div><small>Player</small><strong>${escapeHtml(p.player_name)}</strong></div><div><small>Phone</small><strong>${escapeHtml(p.phone)}</strong></div><div><small>Amount</small><strong>${money(p.amount,p.currency)}</strong></div><div><small>Competition</small><strong>${escapeHtml(p.tournament_name)}</strong></div></div><div class="notice notice-warning">Compare this reference, phone and amount with the actual receiving account/provider record. Do not approve based on an image alone.</div>${selectField("Decision","status",[{value:"verified",label:"Verified — funds confirmed"},{value:"rejected",label:"Rejected — mismatch / invalid"}],"verified")}<label class="field"><span>Review note</span><textarea name="note" rows="3" required placeholder="Record how the payment was checked."></textarea></label>`,"Save review"));
  root.querySelector("#modal-form").addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(e.target);try{await verifyPayment(p.id,fd.get("status"),fd.get("note"));closeModal();toast("Payment review recorded.","success");refresh();}catch(err){toast(err.message,"danger");}},{once:true});
}
function showTournamentStatusModal(root,t,refresh) {
  if(!t)return;
  root.insertAdjacentHTML("beforeend",modal("Change competition status",`${selectField("Status","status",[{value:"draft",label:"Draft"},{value:"open",label:"Open"},{value:"paused",label:"Paused"},{value:"live",label:"Live"},{value:"completed",label:"Completed"},{value:"cancelled",label:"Cancelled"}],t.status)}<p class="field-hint">Pausing or cancelling an event should trigger the applicable player communication and refund workflow.</p>`,"Update status"));
  root.querySelector("#modal-form").addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(e.target);try{await updateTournamentStatus(t.id,fd.get("status"));closeModal();toast("Competition status updated.","success");refresh();}catch(err){toast(err.message,"danger");}},{once:true});
}
function saveSettings(root,toast) {
  state.store.settings.registration_enabled=root.querySelector("#registration-toggle").checked;
  state.store.settings.maintenance_mode=root.querySelector("#maintenance-toggle").checked;
  persist();toast("Demo settings saved.","success");
}
function exportPlayers() {
  const rows=[["Name","Phone","Status","Competitions","Wins"],...state.store.players.map(p=>[p.name,p.phone,p.status,p.competitions||0,p.wins||0])];
  const csv=rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="pfc-players.csv";a.click();URL.revokeObjectURL(a.href);
}
function closeModal(){document.querySelector("#modal-backdrop")?.remove();}
