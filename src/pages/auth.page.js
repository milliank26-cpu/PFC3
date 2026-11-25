import { button, field, badge } from "../components/ui.js";
import { signIn, signUp, requestPasswordReset, resendVerification, updateRecoveredPassword } from "../services/auth.service.js";
import { supabase } from "../lib/supabase.js";

export function authPage() {
  return `<main class="auth-layout">
    <section class="auth-visual">
      <div class="auth-brand"><span class="brand-mark">PFC</span><span>PLAY FOR CASH</span></div>
      <div class="auth-hero-copy"><p class="eyebrow">THE GAMING COMMUNITY</p><h1>PLAY.<br><em>COMPETE.</em><br>BELONG.</h1><p>Discover competitions. Challenge yourself. Make your mark.</p></div>
      <div class="auth-foot">A community where gaming, competition and rewards come together.</div>
    </section>
    <section class="auth-panel"><div class="auth-box">
      <div class="auth-top"><div><p class="eyebrow">WELCOME TO PFC</p><h2 id="auth-title">Sign in</h2></div>${badge("Email-secured access","success")}</div>
      <div class="auth-tabs"><button class="auth-tab active" data-auth-tab="signin">Sign in</button><button class="auth-tab" data-auth-tab="signup">Create account</button></div>
      <div id="auth-content">${signInForm()}</div>
      <p class="auth-footnote">By continuing, you agree to PFC's <a href="./terms.html" target="_blank" rel="noopener">Terms and Conditions</a>. Please read them before creating your account.</p>
    </div></section>
  </main>`;
}
function signInForm() {
  return `<form id="signin-form">${field("Email address","email","","email",true,"you@example.com")}${field("Password","password","","password",true,"Your password")}<div class="form-row between"><label class="check-line"><input type="checkbox" name="remember" checked> Remember this device</label><button type="button" class="text-btn" data-action="forgot-password">Forgot password?</button></div><button class="btn btn-primary btn-wide" type="submit">Sign in to PFC</button><p class="form-message" id="auth-message"></p><div class="auth-extra"><button type="button" class="text-btn" data-action="resend-verification">Resend verification email</button></div></form>`;
}
function signUpForm() {
  return `<form id="signup-form">${field("Email address","email","","email",true,"you@example.com")}${field("Create password","password","","password",true,"At least 10 characters, letters and numbers")}${field("Confirm password","confirmPassword","","password",true,"Enter your password again")}<p class="field-hint">We will send a verification link to this email. Your player name, username and phone number will be collected in the profile setup after verification.</p><label class="check-line terms-check"><input type="checkbox" name="acceptedTerms" required> I agree to the <a href="./terms.html" target="_blank" rel="noopener">Terms and Conditions</a>.</label><button class="btn btn-primary btn-wide" type="submit">Create PFC account</button><p class="form-message" id="auth-message"></p></form>`;
}
function recoveryForm() {
  return `<form id="recovery-form">${field("New password","newPassword","","password",true,"At least 10 characters, letters and numbers")}${field("Confirm new password","confirmPassword","","password",true,"Enter your new password again")}<button class="btn btn-primary btn-wide" type="submit">Save new password</button><p class="form-message" id="auth-message"></p></form>`;
}

export function bindAuth(root, onSuccess, toast) {
  const showMessage = message => { const el = root.querySelector("#auth-message"); if (el) el.textContent = message; };
  const showVerification = (email, demo = false) => {
    root.querySelector("#auth-title").textContent = "Verify your email";
    root.querySelector("#auth-content").innerHTML = `<div class="notice notice-info"><strong>One more step.</strong><p>${demo ? "Demo mode: no email is sent. When connected to Supabase, the verification message will be delivered to:" : "We have sent a verification link to:"} <strong>${escapeText(email)}</strong></p><p>Open the message and click its verification link. Once verified, return here and sign in.</p></div><button class="btn btn-primary btn-wide" type="button" data-action="resend-verification">Resend verification email</button><p class="form-message" id="auth-message"></p><button class="text-btn" type="button" data-action="back-signin">Back to sign in</button>`;
    root.querySelector("[data-action='resend-verification']")?.addEventListener("click", async () => { try { const r = await resendVerification(email); showMessage(r.demo ? "Demo mode: verification email is not sent." : "A new verification email has been sent. Check your inbox and spam folder."); } catch (e) { showMessage(e.message); } });
    root.querySelector("[data-action='back-signin']")?.addEventListener("click", () => { root.querySelector("#auth-title").textContent = "Sign in"; root.querySelector("#auth-content").innerHTML = signInForm(); bindForms(); });
  };
  function bindTabs() {
    root.querySelectorAll("[data-auth-tab]").forEach(btn => btn.addEventListener("click", () => {
      root.querySelectorAll("[data-auth-tab]").forEach(x => x.classList.toggle("active", x === btn));
      root.querySelector("#auth-title").textContent = btn.dataset.authTab === "signup" ? "Create your account" : "Sign in";
      root.querySelector("#auth-content").innerHTML = btn.dataset.authTab === "signup" ? signUpForm() : signInForm();
      bindForms();
    }));
  }
  function bindForms() {
    const signin = root.querySelector("#signin-form");
    signin?.addEventListener("submit", async e => { e.preventDefault(); const fd = new FormData(signin); try { const session = await signIn({ email: fd.get("email"), password: fd.get("password") }); onSuccess(session); } catch (err) { showMessage(err.message); } });
    const signup = root.querySelector("#signup-form");
    signup?.addEventListener("submit", async e => { e.preventDefault(); const fd = new FormData(signup); try { const result = await signUp({ email: fd.get("email"), password: fd.get("password"), confirmPassword: fd.get("confirmPassword"), acceptedTerms: fd.get("acceptedTerms") === "on" }); if (result.verificationRequired) showVerification(result.email, result.demo); else onSuccess(result); } catch (err) { showMessage(err.message); } });
    root.querySelector("[data-action='forgot-password']")?.addEventListener("click", async () => {
      const email = root.querySelector('[name="email"]')?.value;
      try { const result = await requestPasswordReset(email); root.querySelector("#auth-content").innerHTML = `<div class="notice notice-info">${result.demo ? "Demo mode: no email is sent." : "If an account exists for this email, a password-reset link has been sent."} Check your inbox and spam folder, then follow the link to choose a new password.</div><button type="button" class="text-btn" data-action="back-signin">Back to sign in</button>`; root.querySelector("[data-action='back-signin']").addEventListener("click", () => { root.querySelector("#auth-content").innerHTML = signInForm(); bindForms(); }); } catch (err) { showMessage(err.message); }
    });
    root.querySelector("[data-action='resend-verification']")?.addEventListener("click", async () => { const email = root.querySelector('[name="email"]')?.value; try { const result = await resendVerification(email); showMessage(result.demo ? "Demo mode: no email is sent." : "If registration is pending, a new verification email has been sent."); } catch (err) { showMessage(err.message); } });
  }
  bindTabs(); bindForms();
  if (supabase) {
    supabase.auth.onAuthStateChange(event => {
      if (event === "PASSWORD_RECOVERY") {
        root.querySelector("#auth-title").textContent = "Choose a new password";
        root.querySelector("#auth-content").innerHTML = recoveryForm();
        root.querySelector("#recovery-form").addEventListener("submit", async e => { e.preventDefault(); const fd = new FormData(e.target); try { await updateRecoveredPassword(fd.get("newPassword"), fd.get("confirmPassword")); showMessage("Your password has been updated. You can now sign in with it."); await supabase.auth.signOut(); } catch (err) { showMessage(err.message); } });
      }
    });
  }
}
function escapeText(value) { return String(value || "").replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch])); }
