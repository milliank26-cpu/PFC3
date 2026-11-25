export function miniBars(values, labels = []) {
  const max = Math.max(1, ...values);
  return `<div class="mini-bars">${values.map((v, i) => `<div class="bar-col"><div class="bar-track"><span style="height:${Math.max(5, v / max * 100)}%"></span></div><small>${labels[i] || ""}</small></div>`).join("")}</div>`;
}
export function donut(value, total, label) {
  const pct = total ? Math.min(100, Math.round(value / total * 100)) : 0;
  return `<div class="donut-wrap"><div class="donut" style="--pct:${pct}"><div><strong>${pct}%</strong><small>${label}</small></div></div></div>`;
}