export function BarChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 560, H = 200, p = 28, bw = (W - p) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full">
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line x1={p} x2={W} y1={H - t * (H - 10)} y2={H - t * (H - 10)} stroke="#bfdbfe" strokeDasharray="3" />
          <text x={0} y={H - t * (H - 10) + 4} fontSize="10" fill="#475569">{Math.round(max * t)}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const h = (d.value / max) * (H - 10);
        return (
          <g key={d.label}>
            <rect x={p + i * bw + 3} y={H - h} width={bw - 6} height={h} rx="3" fill="#2563eb"><title>{d.label}: {d.value}</title></rect>
            {(i % 2 === 0 || data.length < 8) && <text x={p + i * bw + bw / 2} y={H + 16} fontSize="9" textAnchor="middle" fill="#475569">{d.label}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export function Split({ title, items }) {
  const total = items.reduce((s, i) => s + i.count, 0) || 1;
  return (
    <div className="card">
      <h3 className="mb-3 font-semibold text-blue-900">{title}</h3>
      {items.length === 0 && <p className="text-sm text-slate-500">No data yet</p>}
      {items.map((i) => (
        <div key={i.name} className="mb-2">
          <div className="flex justify-between text-sm"><span className="truncate">{i.name}</span><span>{i.count} · {Math.round((i.count / total) * 100)}%</span></div>
          <div className="h-2 rounded bg-blue-100"><div className="h-2 rounded bg-blue-600" style={{ width: `${(i.count / total) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
