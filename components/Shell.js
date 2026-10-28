"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "./api";

export default function Shell({ user, children }) {
  const router = useRouter();
  const out = async () => { await api("/api/auth/logout", "POST"); router.push("/login"); };
  return (
    <div className="flex min-h-screen w-full flex-col">
      <nav className="sticky top-0 z-10 w-full border-b-2 border-blue-200 bg-white/90 backdrop-blur">
        <div className="flex w-full items-center justify-between px-4 py-3 sm:px-8">
          <Link href="/" className="text-xl font-extrabold text-blue-800">Snip<span className="text-sky-500">.</span>Link</Link>
          <div className="flex items-center gap-2 text-sm sm:gap-4">
            {user ? (<>
              <Link href="/" className="hidden text-blue-800 hover:underline sm:inline">Dashboard</Link>
              <span className="hidden text-slate-600 sm:inline">{user.name}</span>
              <button className="btn-ghost" onClick={out}>Logout</button>
            </>) : (<>
              <Link className="btn-ghost" href="/login">Login</Link>
              <Link className="btn !py-1 text-sm" href="/register">Register</Link>
            </>)}
          </div>
        </div>
      </nav>
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-blue-800 sm:text-5xl">Shorten links. Track every click.</h1>
          <p className="mt-2 text-sm text-blue-700 sm:text-base">Short links with detailed click analytics</p>
        </header>
        {children}
      </main>
      <footer className="w-full border-t-2 border-blue-200 bg-white/90 px-4 py-4 text-center text-sm text-slate-600 sm:px-8">
        © {new Date().getFullYear()} Snip.Link · Built with Next.js, MongoDB &amp; Tailwind
      </footer>
    </div>
  );
}
