"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../../components/api";
import Shell from "../../../components/Shell";
import Stat from "../../../components/Stat";
import { BarChart, Split } from "../../../components/Charts";

export default function Analytics({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api(`/api/links/${id}`).then((r) => {
      if (r.status === 401) router.push("/login");
      else if (!r.ok) setErr(r.error || "Failed to load");
      else setD(r);
    });
  }, [id, router]);

  if (err) return <Shell><p className="err text-center">{err}</p><p className="mt-3 text-center"><Link className="underline" href="/">Back</Link></p></Shell>;
  if (!d) return null;
  return (
    <Shell user={{ name: "Account" }}>
      <Link href="/" className="text-sm text-blue-700 underline">← All links</Link>
      <div className="card my-3">
        <a href={`/${d.link.code}`} target="_blank" className="font-semibold text-blue-800 break-all">/{d.link.code}</a>
        <p className="break-all text-sm text-slate-600">→ {d.link.url}</p>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat n={1} label="Total clicks" value={d.total} />
        <Stat n={2} label="Unique visitors" value={d.unique} />
        <Stat n={3} label="Top referrer" value={d.referrers[0]?.name || "—"} />
        <Stat n={4} label="Top device" value={d.devices[0]?.name || "—"} />
      </div>
      <div className="card mb-4"><h3 className="mb-2 font-semibold text-blue-900">Clicks – last 14 days</h3><BarChart data={d.byDay} /></div>
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Split title="Top referrers" items={d.referrers} />
        <Split title="Devices" items={d.devices} />
        <Split title="Browsers" items={d.browsers} />
      </div>
      <div className="card overflow-x-auto">
        <h3 className="mb-2 font-semibold text-blue-900">Recent clicks</h3>
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="text-blue-900"><tr><th className="py-1">Time</th><th>Referrer</th><th>Device</th><th>Browser</th></tr></thead>
          <tbody>
            {d.recent.map((c, i) => (
              <tr key={i} className="border-t border-blue-100"><td className="py-1">{new Date(c.at).toLocaleString()}</td><td>{c.referrer}</td><td>{c.device}</td><td>{c.browser}</td></tr>
            ))}
            {d.recent.length === 0 && <tr><td colSpan="4" className="py-2 text-slate-500">No clicks yet</td></tr>}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
