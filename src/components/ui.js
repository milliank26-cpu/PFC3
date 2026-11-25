import { escapeHtml, initials } from "../lib/format.js";

export const icon = (name) => {
  const paths = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    gamepad: '<path d="M6 12h4m-2-2v4m7-2h.01M18 10h.01"/><path d="M6 8h12a4 4 0 0 1 3.8 5.2l-1 3.2a2 2 0 0 1-3.4.8L15 15H9l-2.4 2.2a2 2 0 0 1-3.4-.8l-1-3.2A4 4 0 0 1 6 8z"/>',
    trophy: '<path d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H3v2a4 4 0 0 0 4 4m10-6h4v2a4 4 0 0 1-4 4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    credit: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20m-15 5h4"/>',
    message: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5a9 9 0 0 1-.9-4A8.5 8.5 0 0 1 12.5 3H13a8.5 8.5 0 0 1 8 8z"/>',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1 0 2z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    logout: '<path d="M10 17l5-5-5-5m5 5H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/>',
    plus: '<path d="M12 5v14m-7-7h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/><path d="m9 12 2 2 4-4"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9m-5 8V5m-5 12v-3"/>',
    close: '<path d="m18 6-12 12M6 6l12 12"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4"/>'
  };
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.activity}</svg>`;
};

export function button(label, { action = "", variant = "primary", iconName = "", type = "button", disabled = false } = {}) {
  return `<button type="${type}" class="btn btn-${variant}" ${action ? `data-action="${escapeHtml(action)}"` : ""} ${disabled ? "disabled" : ""}>${iconName ? icon(iconName) : ""}<span>${escapeHtml(label)}</span></button>`;
}
export function badge(text, tone = "neutral") {
  return `<span class="badge badge-${tone}">${escapeHtml(text)}</span>`;
}
export function avatar(name, size = "md") {
  return `<span class="avatar avatar-${size}">${escapeHtml(initials(name))}</span>`;
}
export function emptyState(title, description) {
  return `<div class="empty-state"><div class="empty-icon">${icon("activity")}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></div>`;
}
export function pageHeader(title, subtitle, action = "") {
  return `<div class="page-header"><div><p class="eyebrow">PFC / ${escapeHtml(title)}</p><h1>${escapeHtml(title)}</h1><p class="page-subtitle">${escapeHtml(subtitle)}</p></div>${action}</div>`;
}
export function statCard(label, value, detail, symbol = "chart") {
  return `<article class="stat-card"><div class="stat-top"><span>${escapeHtml(label)}</span><span class="stat-icon">${icon(symbol)}</span></div><strong>${escapeHtml(String(value))}</strong><small>${escapeHtml(detail)}</small></article>`;
}
export function modal(title, body, submitLabel = "Save") {
  return `<div class="modal-backdrop" id="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><div class="modal-head"><h2>${escapeHtml(title)}</h2><button class="icon-btn" data-action="close-modal" aria-label="Close">${icon("close")}</button></div><form id="modal-form">${body}<div class="modal-actions"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">${escapeHtml(submitLabel)}</button></div></form></section></div>`;
}
export function field(label, name, value = "", type = "text", required = false, placeholder = "") {
  return `<label class="field"><span>${escapeHtml(label)}</span><input name="${escapeHtml(name)}" type="${type}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" ${required ? "required" : ""}></label>`;
}
export function selectField(label, name, options, selected = "") {
  return `<label class="field"><span>${escapeHtml(label)}</span><select name="${escapeHtml(name)}">${options.map(o => `<option value="${escapeHtml(o.value)}" ${o.value === selected ? "selected" : ""}>${escapeHtml(o.label)}</option>`).join("")}</select></label>`;
}