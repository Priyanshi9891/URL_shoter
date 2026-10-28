import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "../../../../lib/db";
import { sign, currentUserId } from "../../../../lib/auth";
import { validateRegister } from "../../../../lib/validate";

function withCookie(body, token, status = 200) {
  const res = NextResponse.json(body, { status });
  res.cookies.set("token", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: token ? 604800 : 0 });
  return res;
}

export async function GET(_req, { params }) {
  if ((await params).action !== "me") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ user: null });
  const u = await (await getDb()).collection("users").findOne({ _id: new ObjectId(uid) });
  return NextResponse.json({ user: u ? { name: u.name, email: u.email } : null });
}

export async function POST(req, { params }) {
  const { action } = await params;
  const body = await req.json().catch(() => ({}));
  const users = (await getDb()).collection("users");
  if (action === "logout") return withCookie({ ok: true }, "");
  if (action === "register") {
    const errors = validateRegister(body);
    if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });
    try {
      const r = await users.insertOne({ name: body.name.trim(), email: body.email.toLowerCase(), hash: await bcrypt.hash(body.password, 10), createdAt: new Date() });
      return withCookie({ ok: true }, await sign(r.insertedId.toString()), 201);
    } catch (e) {
      if (e.code === 11000) return NextResponse.json({ errors: { email: "Email already registered" } }, { status: 409 });
      throw e;
    }
  }
  if (action === "login") {
    const u = typeof body.email === "string" ? await users.findOne({ email: body.email.toLowerCase() }) : null;
    if (!u || typeof body.password !== "string" || !(await bcrypt.compare(body.password, u.hash)))
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    return withCookie({ ok: true }, await sign(u._id.toString()));
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
