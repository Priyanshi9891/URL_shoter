const { SignJWT, jwtVerify } = require("jose");
const { cookies } = require("next/headers");
const key = () => new TextEncoder().encode(process.env.JWT_SECRET);
async function sign(uid) {
  return new SignJWT({ uid }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(key());
}
async function currentUserId() {
  try {
    const t = (await cookies()).get("token")?.value;
    return t ? (await jwtVerify(t, key())).payload.uid : null;
  } catch { return null; }
}
module.exports = { sign, currentUserId };
