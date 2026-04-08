# four.io

Connect 4 against the CPU (Easy / Medium / Hard) with a verified global leaderboard. Monorepo: **Bun** workspaces, **Vite + React** frontend, **Express + Prisma + PostgreSQL** API, shared **`@four.io/game-logic`** for board rules, CPU logic, and server-side replay validation.

## Features

- **Play:** Column controls with full-column feedback, disc drop animation, keyboard **1–7** / numpad to drop, optional **hints** (Easy / Medium), **undo last human+CPU pair** (disabled while the CPU is thinking or after the game ends).
- **Audio:** Drop / win / lose cues (Web Audio); mute control in the header; preference stored in `localStorage`.
- **Home:** Local W–L–D tallies per difficulty (this browser only).
- **Hall of Fame:** Top 50 scores; React Query caching; filters **All / Easy / Medium / Hard** (ranks are within the selected filter); row highlight for the last submitted display name (`sessionStorage`).
- **Replay:** Read-only board from the URL — `/replay?moves=0,1,2` (optional `&seed=` for display). Invalid sequences show an error. Scores still require server verification.
- **API hardening:** Zod validation for score bodies and leaderboard query params; `X-Request-Id` on responses; structured error logging with request id.

## Prerequisites

- [Bun](https://bun.sh/)
- Docker (optional, for local PostgreSQL)

## Setup

```bash
bun install
cd game-logic && bun run build
```

Start PostgreSQL:

```bash
docker compose up -d
```

Create `server/.env` from `.env.example` and run migrations.

Prisma ORM 7 reads connection URLs from [`server/prisma.config.ts`](server/prisma.config.ts) (not from `schema.prisma`). For hosts like Supabase with a **pooler** URL plus a **direct** URL, set `DATABASE_URL` for the app and `DIRECT_URL` for migrations; otherwise a single `DATABASE_URL` is enough.

```bash
cd server
cp ../.env.example .env
# edit DATABASE_URL / DIRECT_URL as needed
bun run db:generate
bunx prisma migrate deploy
```

## Development

From the repo root, start **API + web** together (recommended):

```bash
bun run dev
```

This runs the API on port **5005** (override with `PORT` in `server/.env`) and Vite on **5173** (Vite proxies `/api` to the API). Visiting `http://localhost:5005/` should return JSON with `"service":"four.io"` — if you see `Cannot GET` instead, another process may be using that port, or the API failed to start (check `DATABASE_URL` in `server/.env`).

Alternatively, use two terminals: `bun run dev:server` then `bun run dev:client`.

### Environment

| Location | Purpose |
| :--- | :--- |
| `server/.env` (copy from repo root [`.env.example`](.env.example)) | `DATABASE_URL`, `DIRECT_URL`, `PORT`, `CORS_ORIGIN` |
| [`client/.env`](client/.env.example) | Optional `VITE_API_URL` when the SPA and API are not same-origin (production or custom dev URLs) |

### E2E tests

Playwright smoke tests start Vite on port **5174** so they do not clash with a dev server on **5173**:

```bash
bun run test:e2e
```

## Build

```bash
bun run build
```

Produces `client/dist` and `game-logic/dist`.

## HTTP API (sketch)

| Method | Path | Notes |
| :--- | :--- | :--- |
| `GET` | `/` | Service probe: `{ "ok", "service": "four.io" }` |
| `GET` | `/api/health` | Liveness |
| `POST` | `/api/games` | New game id + seed (rate limited) |
| `POST` | `/api/scores` | Verified human win + display name (rate limited) |
| `GET` | `/api/leaderboard` | `limit` (default 50), optional `difficulty=easy\|medium\|hard` |

## Deploy (sketch)

- **Web:** Static hosting (e.g. Vercel/Netlify) with `VITE_API_URL` if the API is on another origin; CORS on the API must allow the site origin.
- **API + DB:** Railway/Render/Fly with managed PostgreSQL; set `DATABASE_URL`, `CORS_ORIGIN`, `PORT`, run `prisma migrate deploy` on release.

## Project layout

- `game-logic` — Board, win/draw, Easy/Medium/Hard CPU, `verifyGame`, scoring helpers, `boardFromMoves` for replay.
- `client` — React Router (`/`, `/play`, `/leaderboard`, `/replay`), TanStack Query, Web Worker for heavier search, glass UI shell.
- `server` — Express routes above, Prisma 7 + `pg` adapter, Zod parsing, request-id middleware.
- `e2e` — Playwright smoke tests.

See [`PRD.md`](PRD.md) for product scope and roadmap notes.
