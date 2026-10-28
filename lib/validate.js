const crypto = require("crypto");
const RESERVED = ["api", "login", "register", "s", "links", "admin"];
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function validateUrl(u) {
  if (typeof u !== "string" || !u.trim()) return "Destination URL is required";
  if (u.length > 2048) return "URL is too long (max 2048 characters)";
  try {
    const p = new URL(u.trim());
    if (!["http:", "https:"].includes(p.protocol)) return "Only http and https URLs are allowed";
  } catch { return "Enter a valid URL like https://example.com"; }
  return null;
}
function validateAlias(a) {
  if (a == null || a === "") return null;
  if (typeof a !== "string" || !/^[A-Za-z0-9_-]{3,30}$/.test(a)) return "Alias must be 3-30 letters, numbers, - or _";
  if (RESERVED.includes(a.toLowerCase())) return "That alias is reserved";
  return null;
}
function parseExpiry(v) {
  if (v == null || v === "") return { value: null };
  const d = new Date(v);
  if (isNaN(d)) return { error: "Invalid expiry date" };
  if (d <= new Date()) return { error: "Expiry must be in the future" };
  return { value: d };
}
function validateLink(b, partial = false) {
  const errors = {}, value = {};
  b = b || {};
  if (!partial || b.url !== undefined) {
    const e = validateUrl(b.url);
    e ? (errors.url = e) : (value.url = b.url.trim());
  }
  if (!partial) {
    const e = validateAlias(b.alias);
    e ? (errors.alias = e) : b.alias && (value.alias = b.alias);
  }
  if (!partial || b.expiresAt !== undefined) {
    const r = parseExpiry(b.expiresAt);
    r.error ? (errors.expiresAt = r.error) : (value.expiresAt = r.value);
  }
  if (b.disabled !== undefined) {
    typeof b.disabled === "boolean" ? (value.disabled = b.disabled) : (errors.disabled = "Must be true or false");
  }
  return { errors, value };
}
function validateRegister({ name, email, password } = {}) {
  const errors = {};
  if (typeof name !== "string" || name.trim().length < 2 || name.length > 60) errors.name = "Name must be 2-60 characters";
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) errors.email = "Enter a valid email";
  if (typeof password !== "string" || password.length < 8 || password.length > 100) errors.password = "Password must be at least 8 characters";
  return errors;
}
function genCode(n = 7) {
  const b = crypto.randomBytes(n);
  let s = "";
  for (let i = 0; i < n; i++) s += CHARS[b[i] % CHARS.length];
  return s;
}
// Sliding-window limiter: `times` = timestamps of recent creations by one user.
function isLimited(times, now, max, windowMs) {
  return times.filter((t) => now - new Date(t).getTime() < windowMs).length >= max;
}
module.exports = { validateUrl, validateAlias, parseExpiry, validateLink, validateRegister, genCode, isLimited };
