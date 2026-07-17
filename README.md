# PRMS — Project Review Management System

A production-oriented MERN (MongoDB, Express, React, Node) application for managing
capstone project reviews at College of Engineering Guindy, Anna University — built from
the full specification covering six scoped roles, a staged review cycle (Review 0 → 3 → Viva),
guide/panel allocation, attendance, marks, and real-time notifications.

## Quick start (Docker — recommended)

```bash
cp .env.example .env
# Edit .env and set JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ADMIN_SEED_PASSWORD
# Generate secrets with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

docker compose up --build
docker compose exec backend npm run seed   # creates programs + the admin account
```

Visit **http://localhost**. Log in with the admin username/password from your `.env`.

## Quick start (local dev, no Docker)

Requires Node 18+ and a running MongoDB instance (local or Atlas). Redis is optional in dev.

```bash
# Backend
cd backend
cp .env.example .env        # set MONGO_URI, JWT secrets
npm install
npm run seed                # creates programs + admin account
npm run dev                 # http://localhost:4000

# Frontend (separate terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                  # http://localhost:5173
```

## Architecture

```
prms/
├── backend/          Express + TypeScript API (MongoDB via Mongoose, Socket.IO, Redis-optional)
├── frontend/         React 19 + TypeScript + Vite + Tailwind v4
├── nginx/            Reverse-proxy config used by docker-compose (single public origin)
└── docker-compose.yml
```

**Backend stack:** Express, TypeScript, Mongoose 8, JWT (access + rotating refresh tokens),
bcryptjs, Socket.IO (with optional Redis adapter for multi-instance scaling), BullMQ-ready,
ExcelJS for import/export, Zod validation, Winston logging.

**Frontend stack:** React 19, TypeScript, Vite 8, Tailwind CSS v4, TanStack Query, Zustand,
Framer Motion, React Router, Socket.IO client, Lucide icons.

## Design system — "The Review Rail"

A bespoke palette and typographic system (Fraunces display serif + Inter body + IBM Plex Mono
for data) rather than a generic admin-dashboard look. The signature component is the **Review
Rail** — an animated horizontal stepper (`src/components/reviewrail/ReviewRail.tsx`) that shows
a team's progress through Review 0 → 1 → 2 → 3 → Viva, with live status, dates, and per-stage
average scores. It appears on student, guide, panel, and coordinator dashboards.

## Roles implemented

| Role | Capabilities |
|---|---|
| **Admin** | Faculty & student management (manual + Excel import/export), allocation dashboard (batch guide/coordinator/panel assignment + auto-assign), read-only attendance/marks mirror |
| **Coordinator** | Review scheduling (date/time/duration per stage), attendance entry, viva panel (locked internal members + editable external examiners), marks split-view |
| **Guide** | Team dashboard with Review Rail, guide-request accept/reject with UG/PG capacity enforcement, marks entry (draft → confirm/publish) |
| **Panel Member** | Assigned-teams dashboard, marks entry |
| **Assistant** | View-only faculty/attendance/marks, Excel export hub |
| **Student** | Team creation/invite/lock flow, guide discovery with live availability, review/marks viewing, real-time notifications |

Role selection is dynamic: a faculty member who is both a Guide and a Coordinator for a given
program sees both options after login and picks a context each session (`/select-role`).

## Security measures

- **Passwords:** bcrypt, cost factor 12, server-side minimum-strength policy.
- **Tokens:** short-lived (15 min) JWT access tokens; opaque, hashed (SHA-256), rotating refresh
  tokens stored in an httpOnly/SameSite=strict cookie with reuse-detection (a replayed, already-
  rotated refresh token revokes the entire token family).
- **Session invalidation:** a per-account `tokenVersion` lets a password change or admin action
  instantly invalidate all outstanding access tokens without a blocklist.
- **Transport hardening:** Helmet (CSP in production), strict CORS allow-list, `hpp` against
  parameter pollution, `express-mongo-sanitize` against NoSQL operator injection, Mongoose
  `sanitizeFilter`.
- **Rate limiting:** tiered limiters — tight on `/auth/*`, moderate on mutating routes, general
  ceiling across the API.
- **File uploads:** in-memory only, MIME allow-list, 5MB cap, strict header-template validation
  before any row is written to the database (reject-the-whole-file rather than best-effort parse).
- **Authorization:** every route re-validates role and program scope server-side from the JWT —
  the client's claimed role is never trusted (e.g. selecting "Coordinator" for a program you don't
  actually coordinate is rejected even if the request is hand-crafted).
- **Audit trail:** every marks/attendance/panel/assignment write is logged with actor, action,
  entity, and diff.
- **Dependency hygiene:** `npm audit` returns **0 vulnerabilities** on both backend and frontend
  as of this build. Two notable deliberate choices:
  - `xlsx`/SheetJS was **not used** — the npm-published build carries an unpatched prototype-
    pollution/ReDoS advisory (SheetJS moved fixes to their own CDN, not npm). ExcelJS is used for
    both import and export instead.
  - `multer` is pinned to the 2.x line (1.x has known advisories); `uuid` is pinned via an
    `overrides` entry to close a transitive advisory pulled in by ExcelJS.

## Performance measures

- Route-level code-splitting (`React.lazy` per page) — initial JS payload only includes the
  shell + the current route's page.
- TanStack Query caching (30s stale time) avoids redundant refetches across navigation.
- Redis-backed cache-aside layer for hot read paths (allocation table, program list) — degrades
  gracefully to direct DB reads if `REDIS_URL` isn't configured.
- MongoDB indexes on every frequently-filtered field (program, status, role×program compound
  indexes on panels, unique compound indexes preventing duplicate attendance/marks rows).
- Gzip + immutable long-lived caching for hashed static assets; `no-cache` on `index.html` so
  deployments are picked up immediately.
- `express.compression()` on the API; pagination enforced (max 100/page) on every list endpoint.

## What's fully built vs. what's a documented stretch

Everything in the role table above is functionally wired end-to-end: real API calls, real
MongoDB persistence, real JWT-gated authorization, real Socket.IO notifications. In the
interest of being direct about scope, the following bonus/stretch items from the original
spec are **not** included in this pass, to avoid overstating what's here:

- PDF report generation, QR-code attendance check-in, and scheduled email digests are not
  implemented (Excel export covers the equivalent data today).
- Dark mode and full offline/PWA caching are not implemented (a web app manifest is included
  so the app is installable, but there's no service-worker offline cache).
- BullMQ is wired as an optional dependency and the codebase is structured so review-marks/
  Excel-generation jobs can be moved onto a queue, but jobs currently run synchronously in-
  request — fine at hackathon/department scale, worth revisiting under heavier load.
- No automated test suite (unit/integration) is included; verification here was done via
  TypeScript strict-mode compilation, a full production build, and manual smoke tests of the
  Express app construction and the JWT/password crypto round-trips.

## Default admin credentials (change immediately)

Set via `.env` (`ADMIN_SEED_USERNAME` / `ADMIN_SEED_PASSWORD`), created by `npm run seed`.
There is no way to log in before this seed step runs — the database starts empty.

## Project stats

~2,970 lines of backend TypeScript across 65 files; ~60 frontend TypeScript/TSX files.
Both `npm run build` (backend `tsc`, frontend `tsc -b && vite build`) complete with zero errors
and zero `npm audit` findings at time of writing.
