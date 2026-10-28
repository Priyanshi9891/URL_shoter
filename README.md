# Snip.Link – URL shortener with click analytics

Next.js 15 (App Router) + MongoDB Atlas + Tailwind CSS. Frontend and API live in one project.

## Setup
```bash
npm install
npm run seed              # demo users, links and ~14 days of clicks
npm run dev               # http://localhost:3000

```
Atlas: allow your IP under Network Access and use a database user's connection string

Seeded links: `/demo-docs`, `/demo-news` (active), `/demo-off` (disabled page), `/demo-old` (expired page).

## Data model
- **users**: `name, email (unique), hash (bcrypt), createdAt`
- **links**: `code (unique index), url, userId, expiresAt|null, disabled, createdAt`
- **clicks**: `linkId, at, referrer (hostname or "Direct"), device, browser, vid` — index `{linkId, at}`

## Design decisions
- **Fast redirect**: `GET /[code]` does one indexed lookup, then saves the click inside Next's `after()`, so the 302 is sent before the analytics write.
- **Rate limit**: per user, sliding window counted from the user's own recent links in MongoDB (works across serverless instances). Defaults 10 links / 60 s, configurable in `.env`. Returns HTTP 429.
- **Validation**: all input validated server-side in `lib/validate.js` (http/https only, alias charset/length/reserved, future expiry, email/password). Errors come back per field and show under each input.
- **Auth**: bcrypt password hashes, JWT in an httpOnly cookie. Every link API checks the owner, so users only see and change their own links.
- **Unique visitors**: sha256 of IP + user agent + secret (no raw IP is stored).
- **Charts**: hand-written SVG, no chart library. Mobile first Tailwind layout.
- Expired/disabled/missing links show a styled page with HTTP 410/404.

## Status
Done: register/login/logout, create (auto or custom alias, expiry), redirect, expired/disabled pages, click tracking, analytics (chart, summary boxes, referrers, devices, browsers, recent table), edit/disable/delete, rate limit, tests, seed, unique visitors.
Not done: QR codes, password reset, email verification, bot filtering, click aggregation by pre-computed counters (analytics reads up to 5000 latest clicks per link), integration tests against a real DB, deployment.
With more time: QR codes, per-day aggregate collection, edit expiry in the UI, IP-based limit on auth endpoints, e2e tests.

## AI tools used
Claude (Anthropic) generated the project scaffold, code and tests; I reviewed and ran the tests.
