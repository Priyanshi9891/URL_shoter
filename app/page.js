"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../components/api";
import Shell from "../components/Shell";
import Stat from "../components/Stat";

const status = (l) => l.disabled ? "Disabled" : l.expiresAt && new Date(l.expiresAt) < new Date() ? "Expired" : "Active";
const badge = { Active: "bg-green-100 text-green-800", Disabled: "bg-slate-200 text-slate-700", Expired: "bg-amber-100 text-amber-800" };

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);
  const [f, setF] = useState({ url: "", alias: "", expiresAt: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const r = await api("/api/links");
    if (r.status === 401) return router.push("/login");
    setLinks(r.links || []);
  }, [router]);
  useEffect(() => {
    api("/api/auth/me").then((r) => { if (!r.user) router.push("/login"); else { setUser(r.user); load(); } });
  }, [load, router]);

  async function create(e) {
    e.preventDefault(); setBusy(true); setErrors({}); setMsg("");
    const r = await api("/api/links", "POST", { ...f, expiresAt: f.expiresAt ? new Date(f.expiresAt).toISOString() : "" });
    setBusy(false);
    if (r.ok) { setF({ url: "", alias: "", expiresAt: "" }); load(); }
    else setErrors(r.errors || { form: r.error });
  }
  async function patch(id, body) {
    const r = await api(`/api/links/${id}`, "PATCH", body);
    if (!r.ok) setMsg(Object.values(r.errors || {})[0] || r.error); else { setMsg(""); setEdit(null); load(); }
  }
  async function del(id) {
    if (confirm("Delete this link and all its analytics?")) { await api(`/api/links/${id}`, "DELETE"); load(); }
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const copy = (code) => navigator.clipboard?.writeText(`${origin}/${code}`);
  if (!user) return null;

  return (
    <Shell user={user}>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat n={1} label="Total links" value={links.length} />
        <Stat n={2} label="Total clicks" value={links.reduce((s, l) => s + l.clicks, 0)} />
        <Stat n={3} label="Active" value={links.filter((l) => status(l) === "Active").length} />
        <Stat n={4} label="Disabled / expired" value={links.filter((l) => status(l) !== "Active").length} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
      <form onSubmit={create} className="card grid gap-3 lg:sticky lg:top-24">
        <div>
          <label className="text-sm font-medium">Destination URL</label>
          <input className="input" placeholder="https://example.com/long/page" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
          {errors.url && <p className="err">{errors.url}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Custom alias (optional)</label>
          <input className="input" placeholder="my-link" value={f.alias} onChange={(e) => setF({ ...f, alias: e.target.value })} />
          {errors.alias && <p className="err">{errors.alias}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Expires (optional)</label>
          <input className="input" type="datetime-local" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} />
          {errors.expiresAt && <p className="err">{errors.expiresAt}</p>}
        </div>
        <div className="flex items-end"><button className="btn w-full" disabled={busy}>{busy ? "Creating…" : "Shorten"}</button></div>
        {errors.form && <p className="err">{errors.form}</p>}
      </form>
      <div className="grid gap-4 md:grid-cols-2 lg:col-span-2">
        {msg && <p className="err col-span-full text-center">{msg}</p>}
        {links.length === 0 && <p className="text-center text-slate-500">No links yet — create your first one above.</p>}
        {links.map((l) => (
          <div key={l.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <a className="font-semibold text-blue-700 break-all" href={`/${l.code}`} target="_blank">/{l.code}</a>
              <span className={`rounded-full px-2 py-0.5 text-xs ${badge[status(l)]}`}>{status(l)}</span>
            </div>
            {edit?.id === l.id ? (
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input className="input" value={edit.url} onChange={(e) => setEdit({ ...edit, url: e.target.value })} />
                <button className="btn" onClick={() => patch(l.id, { url: edit.url })}>Save</button>
                <button className="btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
              </div>
            ) : <p className="mt-1 break-all text-sm text-slate-600">→ {l.url}</p>}
            <p className="mt-1 text-xs text-slate-500">{l.clicks} clicks{l.expiresAt && ` · expires ${new Date(l.expiresAt).toLocaleString()}`}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link className="btn-ghost" href={`/links/${l.id}`}>Analytics</Link>
              <button className="btn-ghost" onClick={() => copy(l.code)}>Copy</button>
              <button className="btn-ghost" onClick={() => setEdit({ id: l.id, url: l.url })}>Edit</button>
              <button className="btn-ghost" onClick={() => patch(l.id, { disabled: !l.disabled })}>{l.disabled ? "Enable" : "Disable"}</button>
              <button className="btn-ghost !border-red-300 !text-red-700" onClick={() => del(l.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      </div>
    </Shell>
  );
}
