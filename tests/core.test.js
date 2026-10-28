const test = require("node:test");
const assert = require("node:assert");
const v = require("../lib/validate");
const { parseUA } = require("../lib/ua");
const { summarize } = require("../lib/analytics");

test("only http/https destinations are allowed", () => {
  assert.strictEqual(v.validateUrl("https://example.com/a?b=1"), null);
  assert.strictEqual(v.validateUrl("http://example.com"), null);
  for (const bad of ["javascript:alert(1)", "ftp://x.com", "data:text/html,hi", "not a url", "", null])
    assert.ok(v.validateUrl(bad), `should reject ${bad}`);
});
test("alias rules: charset, length, reserved", () => {
  assert.strictEqual(v.validateAlias("my-link_1"), null);
  assert.strictEqual(v.validateAlias(""), null);
  assert.ok(v.validateAlias("a b"));
  assert.ok(v.validateAlias("ab"));
  assert.ok(v.validateAlias("api"));
});
test("expiry must be a valid future date", () => {
  assert.ok(v.parseExpiry("garbage").error);
  assert.ok(v.parseExpiry(new Date(Date.now() - 1000).toISOString()).error);
  assert.ok(v.parseExpiry(new Date(Date.now() + 1e6).toISOString()).value instanceof Date);
  assert.strictEqual(v.parseExpiry("").value, null);
});
test("rate limiter blocks after max inside the window only", () => {
  const now = Date.now();
  const recent = Array.from({ length: 10 }, () => new Date(now - 5000));
  assert.ok(v.isLimited(recent, now, 10, 60000));
  assert.ok(!v.isLimited(recent.slice(1), now, 10, 60000));
  assert.ok(!v.isLimited(recent, now + 120000, 10, 60000));
});
test("generated codes are unique-looking and URL safe", () => {
  const s = new Set(Array.from({ length: 500 }, () => v.genCode()));
  assert.strictEqual(s.size, 500);
  assert.ok([...s].every((c) => /^[A-Za-z0-9]{7}$/.test(c)));
});
test("user agent parsing: device and browser", () => {
  const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1";
  const edge = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36 Edg/120.0";
  assert.deepStrictEqual(parseUA(iphone), { device: "Mobile", browser: "Safari" });
  assert.deepStrictEqual(parseUA(edge), { device: "Desktop", browser: "Edge" });
  assert.strictEqual(parseUA("Googlebot/2.1").device, "Bot");
});
test("analytics summary counts totals, uniques, referrers and days", () => {
  const now = new Date();
  const clicks = [
    { at: now, referrer: "google.com", device: "Mobile", browser: "Chrome", vid: "a" },
    { at: now, referrer: "google.com", device: "Desktop", browser: "Chrome", vid: "a" },
    { at: now, referrer: "Direct", device: "Desktop", browser: "Safari", vid: "b" },
  ];
  const s = summarize(clicks, now);
  assert.strictEqual(s.total, 3);
  assert.strictEqual(s.unique, 2);
  assert.strictEqual(s.referrers[0].name, "google.com");
  assert.strictEqual(s.byDay.length, 14);
  assert.strictEqual(s.byDay[13].value, 3);
});
