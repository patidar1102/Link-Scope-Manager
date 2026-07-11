# LinkScope

A production-grade URL shortener with privacy-friendly, human-vs-bot-aware analytics — short links with custom aliases/expiration, QR codes, and a full analytics dashboard that never counts crawlers as clicks.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/linkscope run dev` — run the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, `@clerk/express` for auth
- DB: PostgreSQL + Drizzle ORM (`links`, `click_events`, `bot_events` tables)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Auth: Replit-managed Clerk (email/password + SSO), web client via `@clerk/react`
- QR codes: `qrcode` (server-side, base64 PNG data URL)
- Geo lookup: `geoip-lite` (offline, no API key; IP used only transiently)
- Frontend: React + Vite, Tailwind v4, `next-themes` for light/dark toggle

## Where things live

- `lib/api-spec/openapi.yaml` — source-of-truth API contract (links + analytics)
- `lib/db/src/schema/links.ts`, `lib/db/src/schema/analytics.ts` — DB schema
- `artifacts/api-server/src/routes/links.ts`, `routes/analytics.ts` — authenticated JSON API (link CRUD, QR codes, analytics aggregation)
- `artifacts/api-server/src/routes/redirect.ts` — public, unauthenticated `/s/:code` and `/r/:code` redirect + bot-detection routes
- `artifacts/api-server/src/lib/botDetection.ts` — User-Agent bot classification
- `artifacts/api-server/src/lib/requestParsers.ts` — device/browser/OS/traffic-source heuristics
- `artifacts/api-server/src/lib/visitorHash.ts` — salted visitor hashing (no raw IP storage)
- `artifacts/api-server/src/lib/geo.ts` — offline IP → country/city lookup
- `artifacts/linkscope/` — dashboard frontend

## Architecture decisions

- **Short link routing compromise:** true root-domain links (`https://<domain>/CODE`) aren't achievable in this dev/proxy model, since the API server's artifact only owns specific path prefixes, not the bare root. Short links are served at the clean path `/s/:code` (added as a service path on the api-server artifact), with `/r/:code` kept as a legacy alias. If literal root-level custom-domain short links are required, that needs a dedicated domain + routing setup beyond this workspace.
- **Bot handling avoids cloaking:** every request to `/s/:code` / `/r/:code` is classified by User-Agent. Bots/crawlers (Facebook/Meta, social preview bots, search engines, suspicious/unknown bots) always get an HTTP 200 page with full OG/Twitter meta tags — never redirected, never counted as human. Only requests classified as human are validated (not disabled/expired) and 302-redirected, with the click logged.
- **No raw IP storage:** IP addresses are used transiently for geo lookup and to compute a salted HMAC visitor hash (IP + UA + `SESSION_SECRET`), then discarded. Only the hash and resolved country/city are persisted.
- **`geoip-lite` must stay external in esbuild** (`artifacts/api-server/build.mjs`) — it resolves its `.dat` files via `path.join(__dirname, ...)` relative to its own package directory; bundling breaks that path resolution at runtime.

## Product

- Dashboard (Overview, Links, Analytics, Bot Analytics, QR Codes, Settings) for creating/managing short links and viewing human vs. bot traffic separately.
- Human analytics: country/city/device/browser/OS/referrer/traffic-source breakdowns, trend charts, recent activity.
- Bot analytics: separate dashboard for crawler/scraper traffic, kept out of human metrics.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/db/src/schema/*`, run `pnpm --filter @workspace/db run push` to sync the database, and `pnpm -w run typecheck:libs` before typechecking `api-server` — otherwise `@workspace/db`'s type exports can look stale to TS project references.
- `express-rate-limit` on `/s/:code` and `/r/:code` deliberately skips legitimate Facebook/social/search crawlers so link previews are never throttled.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
