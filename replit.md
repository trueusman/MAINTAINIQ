# MaintainIQ

An AI-assisted equipment maintenance platform: facilities teams put QR codes on physical assets, anyone who scans one can report a problem with no login, and admins/technicians manage the resulting issues, repairs, and history behind authenticated dashboards.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/maintainiq run dev` — run the web frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db run seed` — seed example admin/technician/asset/issue data (no-ops if users already exist)
- Required env: `DATABASE_URL` (Postgres), `SESSION_SECRET` (JWT signing secret), `GEMINI_API_KEY` (AI triage), object storage vars (`DEFAULT_OBJECT_STORAGE_BUCKET_ID`, `PRIVATE_OBJECT_DIR`, `PUBLIC_OBJECT_SEARCH_PATHS`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, custom JWT auth (`jsonwebtoken` + `bcryptjs`) — no session cookies, bearer tokens only
- DB: PostgreSQL + Drizzle ORM
- AI: Google Gemini (`@google/genai`), called directly with the user's own `GEMINI_API_KEY` — not the Replit AI Integrations proxy
- Object storage: Replit App Storage (GCS-backed) for issue/maintenance photos
- Validation: Zod (`zod/v4` in `lib/db`, `zod` v3 in generated client code), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec) — generates React Query hooks (`@workspace/api-client-react`) and Zod schemas (`@workspace/api-zod`)
- Frontend: React + Vite, wouter router, Zustand (auth state), `qrcode.react` (client-side QR generation), Tailwind v4
- Build: esbuild (CJS bundle) for the API server

## Where things live

- `lib/db/src/schema/` — DB tables: `users`, `assets`, `issues`, `maintenance`, `history` (append-only audit trail), `notifications`
- `lib/api-spec/openapi.yaml` — source of truth for the API contract; run codegen after editing
- `artifacts/api-server/src/routes/` — one file per domain (auth, technicians, assets, public, ai, issues, maintenance, history, dashboard, notifications, storage)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT bearer auth (`authRequired`, `requireAdmin`)
- `artifacts/api-server/src/lib/ai.ts` — Gemini triage call with a safe fallback if the API is unavailable
- `artifacts/maintainiq/` — the web frontend

## Architecture decisions

- **Custom JWT auth instead of Clerk/Replit Auth**: the product needs a public, unauthenticated issue-reporting flow plus two fixed roles (admin/technician) with server-enforced permissions — a deliberate exception to the platform default.
- **Postgres + Drizzle instead of MongoDB**: adapted from an original MERN hackathon spec to fit this project's stack; schema is fully relational (assets ↔ issues ↔ maintenance ↔ history).
- **Object storage upload URLs are unauthenticated** (`/api/storage/uploads/request-url`): the public QR issue-reporting flow lets anonymous reporters attach photos before any account exists, so this route intentionally deviates from the object-storage skill's "protect uploads" default. Object paths are unguessable UUIDs; exposure is limited to "mint one write URL for one object."
- **Issue status is a fixed state machine** (reported → assigned → inspection_started → {maintenance_in_progress, waiting_for_parts} → resolved → {closed, reopened}; reopened → assigned), enforced server-side in `routes/issues.ts`.
- **AI triage degrades gracefully**: if Gemini is unavailable or the key is invalid, `lib/ai.ts` returns a safe fallback triage result instead of failing the request.
- Dropped from the original spec as out of scope for this environment: Docker, CI/CD, Redis, Socket.IO, AWS/Vercel/Render deployment, real outbound email (notifications are in-app only).

## Product

- **Public, no login**: scan an asset's QR code → see its info and recent activity → report a problem (with optional photos) → get instant AI-assisted triage (suggested category/priority/possible causes/diagnostic checks/safety notes) before submitting.
- **Admin**: full asset CRUD, technician management, global history/audit trail, dashboard analytics (issue/asset breakdowns, technician performance, monthly repairs), assign issues to technicians.
- **Technician**: see assigned issues, transition issue status, log maintenance work (notes, cost, parts, time spent, photos).
- Every asset has a generated QR code (client-side) pointing at its public scan page — viewable/printable from the asset list.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Orval v8.20's codegen emits zod-v4-style calls (`zod.email()`, `zod.url()`) for `format: email`/`format: uri` fields, but this workspace's `zod` catalog is pinned to v3, which lacks those top-level methods. Avoid `format: email`/`format: uri` in `openapi.yaml` — use plain `type: string` instead.
- Date fields in the OpenAPI spec (`format: date`) come through generated Zod schemas as JS `Date` objects, but the corresponding Drizzle columns use `date` mode `"string"` (e.g. `purchaseDate`, `lastServiceDate`). Route handlers must convert `Date → "YYYY-MM-DD"` string before insert/update (see `normalizeDates` in `routes/assets.ts`).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `object-storage` skill for the upload-URL / public-object / private-object serving pattern
