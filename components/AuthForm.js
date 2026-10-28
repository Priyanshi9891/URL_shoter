"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "./api";
import Shell from "./Shell";

export default function AuthForm({ mode }) {
  const reg = mode === "register";
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErrors({});
    const r = await api(`/api/auth/${mode}`, "POST", f);
    setBusy(false);
    if (r.ok) router.push("/");
    else setErrors(r.errors || { form: r.error || "Something went wrong" });
  }
  const field = (k, label, type = "text") => (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input className="input" type={type} value={f[k]} onChange={set(k)} />
      {errors[k] && <p className="err">{errors[k]}</p>}
    </div>
  );
  return (
    <Shell>
      <form onSubmit={submit} className="card mx-auto max-w-md space-y-4 border-2 border-blue-300 shadow-[0_0_18px_#60a5fa]">
        <h2 className="text-center text-xl font-bold text-blue-900">{reg ? "Create account" : "Welcome back"}</h2>
        {reg && field("name", "Name")}
        {field("email", "Email", "email")}
        {field("password", "Password", "password")}
        {errors.form && <p className="err">{errors.form}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? "Please wait…" : reg ? "Register" : "Login"}</button>
        <p className="text-center text-sm">
          {reg ? <>Have an account? <Link className="text-blue-700 underline" href="/login">Login</Link></>
               : <>New here? <Link className="text-blue-700 underline" href="/register">Register</Link></>}
        </p>
      </form>
    </Shell>
  );
}
