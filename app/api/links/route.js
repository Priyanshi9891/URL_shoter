import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../lib/db";
import { currentUserId } from "../../../lib/auth";
import { validateLink, genCode, isLimited } from "../../../lib/validate";

export async function GET() {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDb();
  const links = await db.collection("links").find({ userId: new ObjectId(uid) }).sort({ createdAt: -1 }).toArray();
  const counts = await db.collection("clicks").aggregate([
    { $match: { linkId: { $in: links.map((l) => l._id) } } },
    { $group: { _id: "$linkId", n: { $sum: 1 } } },
  ]).toArray();
  const map = Object.fromEntries(counts.map((c) => [c._id.toString(), c.n]));
  return NextResponse.json({ links: links.map((l) => ({ id: l._id, code: l.code, url: l.url, disabled: !!l.disabled, expiresAt: l.expiresAt, createdAt: l.createdAt, clicks: map[l._id.toString()] || 0 })) });
}

export async function POST(req) {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { errors, value } = validateLink(await req.json().catch(() => ({})));
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  const col = (await getDb()).collection("links");
  const userId = new ObjectId(uid);
  const max = +process.env.RATE_LIMIT_MAX || 10, win = (+process.env.RATE_LIMIT_WINDOW_SEC || 60) * 1000;
  const recent = await col.find({ userId, createdAt: { $gt: new Date(Date.now() - win) } }).project({ createdAt: 1 }).toArray();
  if (isLimited(recent.map((r) => r.createdAt), Date.now(), max, win))
    return NextResponse.json({ error: `Rate limit reached: max ${max} links per ${win / 1000}s. Try again shortly.` }, { status: 429 });

  for (let i = 0; i < 4; i++) {
    const code = value.alias || genCode();
    try {
      await col.insertOne({ code, url: value.url, userId, expiresAt: value.expiresAt, disabled: false, createdAt: new Date() });
      return NextResponse.json({ ok: true, code }, { status: 201 });
    } catch (e) {
      if (e.code !== 11000) throw e;
      if (value.alias) return NextResponse.json({ errors: { alias: "Alias already taken" } }, { status: 409 });
    }
  }
  return NextResponse.json({ error: "Could not generate a code, try again" }, { status: 500 });
}
