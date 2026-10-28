function tally(arr, key) {
  const m = {};
  for (const c of arr) { const k = c[key] || "Unknown"; m[k] = (m[k] || 0) + 1; }
  return Object.entries(m).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}
function summarize(clicks, now = new Date(), days = 14) {
  const byDay = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setUTCDate(d.getUTCDate() - i);
    byDay.push({ label: d.toISOString().slice(5, 10), value: 0 });
  }
  const idx = Object.fromEntries(byDay.map((d, i) => [d.label, i]));
  for (const c of clicks) {
    const k = new Date(c.at).toISOString().slice(5, 10);
    if (k in idx) byDay[idx[k]].value++;
  }
  return {
    total: clicks.length,
    unique: new Set(clicks.map((c) => c.vid)).size,
    byDay,
    referrers: tally(clicks, "referrer").slice(0, 8),
    devices: tally(clicks, "device"),
    browsers: tally(clicks, "browser"),
  };
}
module.exports = { summarize };
