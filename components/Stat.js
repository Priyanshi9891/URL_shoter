export default function Stat({ label, value, n = 1 }) {
  return (
    <div className={`glow glow-${n}`}>
      <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-1 truncate text-2xl font-bold sm:text-3xl">{value}</div>
    </div>
  );
}
