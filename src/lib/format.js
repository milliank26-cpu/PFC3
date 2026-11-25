export const money = (amount, currency = "UGX") =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(amount || 0));

export const dateTime = value => value
  ? new Intl.DateTimeFormat("en-UG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "Not scheduled";

export const shortDate = value => value
  ? new Intl.DateTimeFormat("en-UG", { dateStyle: "medium" }).format(new Date(value))
  : "Date not set";

export const initials = name => (name || "PFC").trim().split(/\s+/).slice(0, 2).map(x => x[0]).join("").toUpperCase();

export const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));