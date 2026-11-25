import { supabase } from "../lib/supabase.js";
import { config } from "../config/env.js";
import { setSession, clearSession } from "../app/state.js";
import { isStrongPassword } from "../lib/validators.js";

const cleanEmail = value => String(value || "").trim().toLowerCase();
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail(value));
const redirectUrl = () => `${window.location.origin}${window.location.pathname}`;

export async function signIn({ email, password }) {
  const clean = cleanEmail(email);
  if (!validEmail(clean)) throw new Error("Enter a valid email address.");
  if (!password) throw new Error("Enter your password.");
  if (config.demoMode || !supabase) {
    const session = { id: "p-1001", email: clean, phone: "+256700000001", name: "PFC Player", role: "player", needsOnboarding: true };
    setSession(session); return session;
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email: clean, password });
  if (error) throw error;
  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    throw new Error("Please verify your email address before signing in. Check your inbox or resend the verification email.");
  }
  const { data: profile, error: profileError } = await supabase.from("profiles").select("id,display_name,full_name,username,phone,status").eq("id", data.user.id).single();
  if (profileError && profileError.code !== "PGRST116") throw profileError;
  if (profile?.status && profile.status !== "active") {
    await supabase.auth.signOut();
    throw new Error("This account is not currently active. Contact PFC support for assistance.");
  }
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
  const isOperator = (roles || []).some(r => ["owner", "operator", "moderator"].includes(r.role));
  const name = profile?.full_name || profile?.display_name || "PFC Player";
  const session = { id: data.user.id, email: data.user.email, phone: profile?.phone || "", name, username: profile?.username || "", role: isOperator ? "operator" : "player", needsOnboarding: !profile?.full_name || !profile?.username || !profile?.phone };
  setSession(session); return session;
}

export async function signUp({ email, password, confirmPassword, acceptedTerms }) {
  const clean = cleanEmail(email);
  if (!validEmail(clean)) throw new Error("Enter a valid email address.");
  if (!isStrongPassword(password)) throw new Error("Use at least 10 characters with letters and numbers.");
  if (password !== confirmPassword) throw new Error("Your passwords do not match.");
  if (!acceptedTerms) throw new Error("Please accept the Terms and Conditions to create an account.");
  if (config.demoMode || !supabase) return { verificationRequired: true, demo: true, email: clean };
  const { data, error } = await supabase.auth.signUp({
    email: clean,
    password,
    options: { emailRedirectTo: redirectUrl(), data: { registration_source: "pfc_web" } }
  });
  if (error) throw error;
  // Supabase email confirmation is enabled: no session is issued until the user verifies.
  if (!data.session) return { verificationRequired: true, email: clean };
  const session = { id: data.user.id, email: clean, phone: "", name: "PFC Player", role: "player", needsOnboarding: true };
  setSession(session); return session;
}

export async function resendVerification(email) {
  const clean = cleanEmail(email);
  if (!validEmail(clean)) throw new Error("Enter the email address you used to register.");
  if (config.demoMode || !supabase) return { demo: true };
  const { error } = await supabase.auth.resend({ type: "signup", email: clean, options: { emailRedirectTo: redirectUrl() } });
  if (error) throw error;
  return { sent: true };
}

export async function completeProfile({ fullName, username, phone }) {
  const name = String(fullName || "").trim();
  const handle = String(username || "").trim().toLowerCase();
  const mobile = String(phone || "").trim().replace(/[\s()-]/g, "");
  if (name.length < 2) throw new Error("Enter your full name.");
  if (!/^[a-z0-9_]{3,20}$/.test(handle)) throw new Error("Username must be 3–20 characters using letters, numbers or underscores.");
  if (!/^\+[1-9]\d{7,14}$/.test(mobile)) throw new Error("Enter your phone number with country code, for example +2567XXXXXXXX.");
  if (config.demoMode || !supabase) {
    const session = { ...JSON.parse(sessionStorage.getItem("pfc-session") || "{}"), name, username: handle, phone: mobile, needsOnboarding: false };
    setSession(session); return session;
  }
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Your session has expired. Please sign in again.");
  const { error } = await supabase.from("profiles").update({ display_name: name, full_name: name, username: handle, phone: mobile }).eq("id", userData.user.id);
  if (error) {
    if (error.code === "23505") throw new Error("That username or phone number is already in use. Please choose another.");
    throw error;
  }
  const session = { ...JSON.parse(sessionStorage.getItem("pfc-session") || "{}"), name, username: handle, phone: mobile, needsOnboarding: false };
  setSession(session); return session;
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
  clearSession();
}

export async function requestPasswordReset(email) {
  const clean = cleanEmail(email);
  if (!validEmail(clean)) throw new Error("Enter the email address linked to your account.");
  if (config.demoMode || !supabase) return { demo: true, email: clean };
  const { error } = await supabase.auth.resetPasswordForEmail(clean, { redirectTo: redirectUrl() });
  if (error) throw error;
  return { sent: true, email: clean };
}

export async function updateRecoveredPassword(newPassword, confirmPassword) {
  if (!isStrongPassword(newPassword)) throw new Error("Use at least 10 characters with letters and numbers.");
  if (newPassword !== confirmPassword) throw new Error("Your passwords do not match.");
  if (config.demoMode || !supabase) return { demo: true };
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return { success: true };
}
