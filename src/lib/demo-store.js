const KEY = "pfc-demo-store-v1";
const now = new Date();
const future = days => new Date(now.getTime() + days * 86400000).toISOString();

const seed = () => ({
  players: [
    { id: "p-1001", name: "Alex Player", phone: "+256700000001", status: "active", joined_at: future(-30), competitions: 8, wins: 3 },
    { id: "p-1002", name: "Jordan Gamer", phone: "+256700000002", status: "active", joined_at: future(-18), competitions: 5, wins: 2 },
    { id: "p-1003", name: "Sam Competitor", phone: "+256700000003", status: "restricted", joined_at: future(-12), competitions: 2, wins: 0 }
  ],
  games: [
    { id: "g-subway", name: "Subway Surfers", category: "Mobile", description: "An individual score challenge. Players compete for the highest verified score.", image_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1000", active: true, format: "score_challenge", winner_method: "Highest verified score", duration_minutes: 10, time_limit_minutes: 10, min_players: 7, max_players: 30, tie_breaker: "One additional timed run; highest score wins.", rules: "Each player gets one official run. Screenshots or approved screen recordings are required. The highest valid score wins. No modified game clients or prohibited assists." },
    { id: "g-billiards", name: "Billiards", category: "Sports", description: "Head-to-head table competition.", image_url: "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=1000", active: true, format: "head_to_head", winner_method: "Official match result", duration_minutes: 30, time_limit_minutes: 45, min_players: 2, max_players: 16, tie_breaker: "A replay frame or agreed deciding game.", rules: "Players must follow the published table and foul rules. Match results must be confirmed by both players or an appointed referee." },
    { id: "g-football", name: "Football", category: "Sports", description: "Organised football gaming competitions.", image_url: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1000", active: true, format: "bracket", winner_method: "Match score and published tie-breakers", duration_minutes: 15, time_limit_minutes: 20, min_players: 4, max_players: 32, tie_breaker: "Extra time, then penalties where supported by the game rules.", rules: "Final game title, match length, team selection, connection rules and dispute process must be confirmed before registration opens." }
  ],
  tournaments: [
    { id: "t-2001", game_id: "g-subway", title: "Subway Surfers Challenge", entry_fee: 1000, prize_pool: 5000, currency: "UGX", min_players: 7, max_players: 30, registered: 5, status: "open", starts_at: future(2), description: "Bring your best run and compete for the top score.", access: "public" },
    { id: "t-2002", game_id: "g-billiards", title: "Quick Billiards Session", entry_fee: 2000, prize_pool: 10000, currency: "UGX", min_players: 2, max_players: 2, registered: 1, status: "open", starts_at: future(1), description: "Winner takes the published prize.", access: "public" },
    { id: "t-2003", game_id: "g-football", title: "Football Cup", entry_fee: 0, prize_pool: 0, currency: "UGX", min_players: 4, max_players: 16, registered: 8, status: "draft", starts_at: future(5), description: "Format and prize details awaiting operator approval.", access: "invite_only" }
  ],
  payments: [
    { id: "pay-1", code: "PFC-7K4Q2", player_id: "p-1001", player_name: "Alex Player", phone: "+256700000001", tournament_id: "t-2001", tournament_name: "Subway Surfers Challenge", amount: 1000, currency: "UGX", status: "pending", proof_name: "mobile-money-confirmation.jpg", created_at: future(-0.1) },
    { id: "pay-2", code: "PFC-8M2R9", player_id: "p-1002", player_name: "Jordan Gamer", phone: "+256700000002", tournament_id: "t-2002", tournament_name: "Quick Billiards Session", amount: 2000, currency: "UGX", status: "verified", proof_name: "receipt.jpg", created_at: future(-1) }
  ],
  support: [
    { id: "s-1", player_name: "Alex Player", phone: "+256700000001", subject: "Payment confirmation", message: "I submitted my payment proof. Please confirm my entry.", status: "open", created_at: future(-0.2) }
  ],
  activity: [
    { id: "a-1", type: "payment", message: "Payment PFC-7K4Q2 submitted for verification", created_at: future(-0.1) },
    { id: "a-2", type: "player", message: "A new player account was created", created_at: future(-1) },
    { id: "a-3", type: "competition", message: "Subway Surfers Challenge registration opened", created_at: future(-2) }
  ],
  settings: { platform_name: "PFC — Play. Compete. Belong.", registration_enabled: true, maintenance_mode: false }
});

export function loadStore() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* use fresh demo seed */ }
  const fresh = seed();
  saveStore(fresh);
  return fresh;
}
export function saveStore(store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}
export function resetStore() {
  const fresh = seed();
  saveStore(fresh);
  return fresh;
}
export function newId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
export function newPaymentCode() {
  return `PFC-${Math.random().toString(36).slice(2, 5).toUpperCase()}${Math.floor(10 + Math.random() * 89)}`;
}