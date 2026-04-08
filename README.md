# four.io

Connect 4 against the CPU (Easy / Medium / Hard) with a verified global leaderboard. Monorepo: **Bun** workspaces, **Vite + React** frontend, **Express + Prisma + PostgreSQL** API, shared **`@four.io/game-logic`** for board rules, opponent logic, and server-side replay validation.

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

This runs the API on port **3001** and Vite on **5173** (Vite proxies `/api` to the API). Visiting `http://localhost:3001/` should return JSON with `"service":"four.io"` — if you see `Cannot GET` instead, another process may be using port 3001, or the API failed to start (check `DATABASE_URL` in `server/.env`).

Alternatively, use two terminals: `bun run dev:server` then `bun run dev:client`.

## Build

```bash
bun run build
```

Produces `client/dist` and `game-logic/dist`.

## Deploy (sketch)

- **Web:** static hosting (e.g. Vercel/Netlify) with `VITE_*` or hosting env; set API URL if not same-origin (add `VITE_API_URL` and fetch absolute URLs — current dev setup uses Vite proxy).
- **API + DB:** Railway/Render/Fly with managed PostgreSQL; set `DATABASE_URL`, `CORS_ORIGIN`, `PORT`, run `prisma migrate deploy` on release.

## Project layout

- `game-logic` — board, win/draw, Easy/Medium/Hard CPU opponent, `verifyGame`, scoring helpers.
- `client` — React Router (`/`, `/play`, `/leaderboard`), Web Worker for minimax / heavier search.
- `server` — `POST /api/games`, `POST /api/scores`, `GET /api/leaderboard`, rate limits.
