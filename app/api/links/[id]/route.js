import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../../lib/db";
import { currentUserId } from "../../../../lib/auth";
import { validateLink } from "../../../../lib/validate";
import { summarize } from "../../../../lib/analytics";

async function owned(params) {
  const uid = await currentUserId();
  if (!uid) return { res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { id } = await params;
  if (!ObjectId.isValid(id)) return { res: NextResponse.json({ error: "Link not found" }, { status: 404 }) };
  const db = await getDb();
  const link = await db.collection("links").findOne({ _id: new ObjectId(id), userId: new ObjectId(uid) });
  if (!link) return { res: NextResponse.json({ error: "Link not found" }, { status: 404 }) };
  return { db, link };
}

export async function GET(_req, { params }) {
  const { res, db, link } = await owned(params);
  if (res) return res;
  const clicks = await db.collection("clicks").find({ linkId: link._id }).sort({ at: -1 }).limit(5000).toArray();
  return NextResponse.json({
    link: { id: link._id, code: link.code, url: link.url, disabled: !!link.disabled, expiresAt: link.expiresAt, createdAt: link.createdAt },
    ...summarize(clicks),
    recent: clicks.slice(0, 15).map((c) => ({ at: c.at, referrer: c.referrer, device: c.device, browser: c.browser })),
  });
}

export async function PATCH(req, { params }) {
  const { res, db, link } = await owned(params);
  if (res) return res;
  const { errors, value } = validateLink(await req.json().catch(() => ({})), true);
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });
  if (!Object.keys(value).length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  await db.collection("links").updateOne({ _id: link._id }, { $set: value });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  const { res, db, link } = await owned(params);
  if (res) return res;
  await db.collection("links").deleteOne({ _id: link._id });
  await db.collection("clicks").deleteMany({ linkId: link._id });
  return NextResponse.json({ ok: true });
}
