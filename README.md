# four.io

Connect 4 against the CPU (Easy / Medium / Hard) with a verified global leaderboard. This repo is a **single Next.js 15** app at the **repository root** (App Router): UI and `/api/*` routes together, **Prisma + PostgreSQL** (e.g. Supabase). Rules, CPU, and verification live in **`game-logic/`** and ship in the client bundle (imported via `@/game-logic`).

## Features

- **Play:** Column controls with full-column feedback, disc drop animation, keyboard **1–7** / numpad to drop, optional **hints** (Easy / Medium), **undo last human+CPU pair** (disabled while the CPU is thinking or after the game ends).
- **Audio:** Drop / win / lose cues (Web Audio); mute in the header; preference in `localStorage`.
- **Home:** Local W–L–D tallies per difficulty (this browser only).
- **Hall of Fame:** Top 50 scores; React Query; filters **All / Easy / Medium / Hard** (ranks within the selected filter); row highlight for the last submitted display name (`sessionStorage`).
- **Replay:** Read-only board from `/replay?moves=0,1,2` (optional `&seed=`). Invalid sequences show an error. Scores still require server verification.
- **API:** Zod on bodies and query params; `X-Request-Id` on responses. Score and game starts use **Upstash Redis** rate limits when `UPSTASH_*` is set (skipped if unset).

## Prerequisites

- [Bun](https://bun.sh/)
- [Docker](https://docs.docker.com/get-docker/) (optional, for local PostgreSQL)

## Setup

Install dependencies (runs `prisma generate` via `postinstall`):

```bash
bun install
```

**Database:** Either point `.env` at an existing Postgres instance, or start the bundled compose stack (matches the defaults in [`.env.example`](.env.example)):

```bash
docker compose up -d
```

Configure Prisma URLs in the repo root:

```bash
cp .env.example .env
# set DATABASE_URL (and DIRECT_URL when using a pooler)
```

Prisma reads [`prisma.config.ts`](prisma.config.ts). On Supabase, use the **pooler** URL as `DATABASE_URL` and a **direct** URL as `DIRECT_URL` for migrations.

```bash
bun run db:generate
bunx prisma migrate deploy
```

(`bun run db:migrate` is for interactive `migrate dev` during schema work; `db:push` is available for quick local iteration.)

## Scripts

| Command | Purpose |
| :--- | :--- |
| `bun run dev` | Next dev server (Turbopack), default **http://localhost:3000** |
| `bun run build` | `prisma generate` + production build |
| `bun run start` | Production server (after `build`) |
| `bun run lint` | ESLint |
| `bun run test:unit` | Bun tests for core rules (`game-logic/win.test.ts`) |
| `bun run test:e2e` | Playwright tests in `tests/e2e` (dev server on port **5174**) |

First time running E2E, install browsers if prompted:

```bash
bunx playwright install
```

## Environment (`.env` at repo root)

Next.js loads env from the project directory (the repo root).

| Variable | Purpose |
| :--- | :--- |
| `DATABASE_URL` | Postgres for Prisma / API (pooler URL when serverless) |
| `DIRECT_URL` | Direct URL for `prisma migrate` when `DATABASE_URL` is pooled |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Redis for distributed rate limits (recommended in production) |
| `NEXT_PUBLIC_API_BASE` | Optional absolute API base if UI and API are on different origins |

## HTTP API (sketch)

| Method | Path | Notes |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Liveness |
| `POST` | `/api/games` | New game id + seed (rate limited when Upstash configured) |
| `POST` | `/api/scores` | Verified human win + display name (rate limited) |
| `GET` | `/api/leaderboard` | `limit` (default 50), optional `difficulty=easy\|medium\|hard` |

## Deploy (sketch)

- **Vercel (or similar):** One Next.js project; set `DATABASE_URL`, `DIRECT_URL` for migrations from CI, and Upstash for rate limits. Run `prisma migrate deploy` against `DIRECT_URL` on release.
- **Database:** Supabase or managed PostgreSQL.

## Project layout

- `app/` — App Router pages and `app/api/*` route handlers.
- `components/`, `lib/`, `queries/`, `sound/` — UI and client utilities.
- `game-logic/` — Board, win/draw, Easy/Medium/Hard CPU, `verifyGame`, scoring, `boardFromMoves` for replay.
- `workers/` — CPU web worker for Hard difficulty.
- `prisma/` — Schema and migrations; generated client under `generated/prisma`.
- `public/` — Static assets.
- `tests/e2e/` — Playwright tests.
