import { NextResponse, after } from "next/server";
import crypto from "crypto";
import { getDb } from "../../lib/db";
import { parseUA } from "../../lib/ua";

const page = (t, m, s) => new Response(
  `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><title>${t}</title><body style="font-family:system-ui;background:#fdf6e3;display:grid;place-items:center;min-height:100vh;margin:0"><div style="text-align:center;padding:2rem;border:2px solid #3b82f6;border-radius:1rem;box-shadow:0 0 20px #3b82f6;background:#fff;max-width:90%"><h1 style="color:#1e3a8a">${t}</h1><p>${m}</p><a href="/">Go to home</a></div>`,
  { status: s, headers: { "content-type": "text/html; charset=utf-8" } });

export async function GET(req, { params }) {
  const { code } = await params;
  const db = await getDb();
  const link = await db.collection("links").findOne({ code });
  if (!link) return page("Link not found", "This short link does not exist.", 404);
  if (link.disabled) return page("Link disabled", "The owner has disabled this link.", 410);
  if (link.expiresAt && link.expiresAt < new Date()) return page("Link expired", "This short link has expired.", 410);

  // Record analytics AFTER the response is sent: the redirect never waits for the DB write.
  const ua = req.headers.get("user-agent") || "";
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  let referrer = "Direct";
  try { const r = req.headers.get("referer"); if (r) referrer = new URL(r).hostname; } catch {}
  after(async () => {
    try {
      await db.collection("clicks").insertOne({
        linkId: link._id, at: new Date(), referrer, ...parseUA(ua),
        vid: crypto.createHash("sha256").update(ip + ua + process.env.JWT_SECRET).digest("hex").slice(0, 16),
      });
    } catch (e) { console.error("click not saved", e); }
  });
  return NextResponse.redirect(link.url, 302);
}
