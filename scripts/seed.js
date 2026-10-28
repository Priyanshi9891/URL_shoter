// Usage: npm run seed   (needs .env with MONGODB_URI)
const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pick = (a) => a[Math.floor(Math.random() * a.length)];

(async () => {
  const c = await new MongoClient(process.env.MONGODB_URI).connect();
  const db = c.db(process.env.MONGODB_DB || "shortener");
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("links").createIndex({ code: 1 }, { unique: true });
  const users = [["Demo User", "demo@example.com"], ["Second User", "demo2@example.com"]];
  for (const [name, email] of users) {
    const old = await db.collection("users").findOne({ email });
    if (old) { const ls = await db.collection("links").find({ userId: old._id }).toArray(); await db.collection("clicks").deleteMany({ linkId: { $in: ls.map((l) => l._id) } }); await db.collection("links").deleteMany({ userId: old._id }); await db.collection("users").deleteOne({ _id: old._id }); }
    const u = await db.collection("users").insertOne({ name, email, hash: await bcrypt.hash("Demo@1234", 10), createdAt: new Date() });
    const defs = [["demo-docs", "https://nextjs.org/docs", null, false], ["demo-news", "https://news.ycombinator.com", null, false], ["demo-off", "https://example.com/disabled", null, true], ["demo-old", "https://example.com/expired", new Date(Date.now() - 864e5), false]].map(([a, ...r]) => [a + (email === users[0][1] ? "" : "-2"), ...r]);
    for (const [code, url, expiresAt, disabled] of defs) {
      const l = await db.collection("links").insertOne({ code, url, userId: u.insertedId, expiresAt, disabled, createdAt: new Date(Date.now() - 15 * 864e5) });
      const clicks = Array.from({ length: 80 + Math.floor(Math.random() * 120) }, () => ({
        linkId: l.insertedId, at: new Date(Date.now() - Math.random() * 14 * 864e5),
        referrer: pick(["Direct", "Direct", "twitter.com", "google.com", "linkedin.com", "facebook.com", "reddit.com"]),
        device: pick(["Mobile", "Mobile", "Desktop", "Desktop", "Desktop", "Tablet"]),
        browser: pick(["Chrome", "Chrome", "Safari", "Firefox", "Edge"]),
        vid: crypto.randomBytes(4).toString("hex").slice(0, 2 + Math.floor(Math.random() * 3)),
      }));
      await db.collection("clicks").insertMany(clicks);
    }
  }
  console.log("Seeded. Login: demo@example.com / Demo@1234");
  await c.close();
})();
