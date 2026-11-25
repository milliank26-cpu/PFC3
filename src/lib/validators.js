export function normalisePhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "");
}
export function isValidPhone(phone) {
  return /^\+[1-9]\d{7,14}$/.test(normalisePhone(phone));
}
export function isStrongPassword(password) {
  return typeof password === "string" && password.length >= 10 &&
    /[A-Za-z]/.test(password) && /\d/.test(password);
}
export function required(value, label = "This field") {
  if (!String(value ?? "").trim()) throw new Error(`${label} is required.`);
  return String(value).trim();
}