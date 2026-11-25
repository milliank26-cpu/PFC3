import { completeProfile } from "../services/auth.service.js";
import { field, badge } from "../components/ui.js";

export function onboardingPage(session) {
  return `<main class="auth-layout"><section class="auth-visual"><div class="auth-brand"><span class="brand-mark">PFC</span><span>PLAY FOR CASH</span></div><div class="auth-hero-copy"><p class="eyebrow">PLAYER SETUP</p><h1>MAKE<br><em>YOUR MARK.</em></h1><p>Your email is verified. Add your player details to finish setting up your PFC identity.</p></div><div class="auth-foot">Your username is your public gaming identity. Your full name and phone number help us manage competition entries and payments.</div></section><section class="auth-panel"><div class="auth-box"><div class="auth-top"><div><p class="eyebrow">ONE-TIME SETUP</p><h2>Complete your profile</h2></div>${badge("Email verified","success")}</div><p class="field-hint">Signed in as ${escapeHtml(session.email || "your email")}</p><form id="onboarding-form">${field("Full name","fullName","","text",true,"Your real full name")}${field("Choose a username","username","","text",true,"e.g. gamer_256")}${field("Phone number","phone","","tel",true,"+2567XXXXXXXX")}<p class="field-hint">Username: 3–20 letters, numbers or underscores. Use the phone number you will use for PFC payment entries.</p><button class="btn btn-primary btn-wide" type="submit">Save and enter PFC</button><p class="form-message" id="onboarding-message"></p></form></div></section></main>`;
}
export function bindOnboarding(root, session, onComplete) {
  root.querySelector("#onboarding-form")?.addEventListener("submit", async e => {
    e.preventDefault(); const fd = new FormData(e.currentTarget); const msg = root.querySelector("#onboarding-message");
    try { const updated = await completeProfile({ fullName: fd.get("fullName"), username: fd.get("username"), phone: fd.get("phone") }); onComplete(updated); }
    catch (err) { msg.textContent = err.message || "We could not save your profile. Please try again."; }
  });
}
function escapeHtml(value) { return String(value || "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])); }
