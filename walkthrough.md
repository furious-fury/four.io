# Implementation walkthrough — Daily puzzle (Phase 1)

This document describes what was added for the **UTC daily puzzle**: shared **Hard** seed per calendar day, a **separate leaderboard** from the Hall of Fame, server-side verification, and UI at `/daily`.

---

## Product behavior

- **One puzzle per UTC day** (`YYYY-MM-DD`). The date and seed are not secret; fairness comes from **`verifyGame`** replay on the server, like a public chess puzzle ID.
- **Everyone gets the same** CPU randomness for that day: a deterministic **31-bit seed** derived from the date string (see `lib/daily-puzzle.ts`).
- **CPU difficulty** for the daily is always **Hard** (`dailyCpuDifficulty()`).
- **Win required** to submit. Losses / draws do not post to the Daily board.
- **Ranking**
  - Primary: **fewest plies** (`moveCount`).
  - Tie-break: **lower elapsed time** in milliseconds (`endedAt - startedAt`).
- **Display names** are normalized the same way as the main leaderboard. For a given `(puzzleDate, displayName)`, a row is **only replaced** if the new result is **strictly better** on (plies, time). Otherwise the API returns **`daily_not_improved`** (409).
- **Hall of Fame** (`leaderboard_entries`) is unchanged; Daily uses **`daily_puzzle_entries`** only.

---

## Database

- **Model:** `DailyPuzzleEntry` in `prisma/schema.prisma`, table `daily_puzzle_entries`.
- **Fields:** `puzzle_date` (date), `display_name`, `move_count`, `duration_ms`, `created_at`.
- **Constraints:** unique on `(puzzle_date, display_name)`; index on `(puzzle_date, move_count, duration_ms)` for leaderboard queries.
- **Migration:** `prisma/migrations/20260210120000_daily_puzzle/migration.sql`.

**Apply migrations** (from repo root, with `DATABASE_URL` set):

```bash
bunx prisma migrate deploy
```

For interactive local iteration on schema:

```bash
bun run db:migrate
```

---

## Server logic

### Shared helpers (`lib/daily-puzzle.ts`)

- `getDailyPuzzleUtcDateKey()` — today’s puzzle id in UTC.
- `seedForDailyDate(utcDateKey)` — stable seed for that id.
- `nextUtcMidnightIso()` — used in `GET /api/daily` for `closesAt` (UI copy).
- `parseUtcDateKeyToDate()` — maps `YYYY-MM-DD` to a `Date` for Prisma `@db.Date` filters.

### Score pipeline (`lib/daily-scores.ts`)

1. Parse body with `dailyScoreSubmitBodySchema` (`lib/schemas.ts`): `displayName`, `moves` and/or `moveHistory`, `seed`, `puzzleDate`, **`startedAt` and `endedAt` required**.
2. **`puzzleDate` must equal** server “today” UTC → else `daily_wrong_date`.
3. **`seed` must equal** `seedForDailyDate(puzzleDate)` → else `daily_wrong_seed`.
4. Run **`verifyGame`** with **Hard** and the submitted moves → same anti-cheat as arcade (`game-logic/replay.ts`).
5. Run **`assertPlausibleDuration`** (`lib/score-policy.ts`) using Hard + ply count — same env knobs as arcade (`SCORE_MIN_DURATION_MS`, etc.).
6. **Upsert** by `(puzzleDate, normalizedName)` only if strictly better; compute **rank** = 1 + count of rows strictly ahead on (plies, time).
7. Warn-log failures with `reqId` when provided (mirrors `lib/scores.ts` style).

### Rate limits (`lib/rate-limit.ts`)

- **`rateLimitDailyScores`** — separate Upstash prefix `four:daily_scores` from arcade scores so both can be used without sharing one bucket.

---

## HTTP API

| Method | Path | Purpose |
|--------|------|--------|
| `GET` | `/api/daily` | Returns `{ date, seed, difficulty, closesAt }` for current UTC day. |
| `POST` | `/api/daily/scores` | Verified win + daily metadata; JSON errors include `daily_not_improved`, `daily_wrong_date`, `daily_wrong_seed`, verification/duration codes. |
| `GET` | `/api/daily/leaderboard` | Query: `limit` (default 50), optional `date` (`YYYY-MM-DD`). Ordered by plies asc, time asc, `createdAt` asc. If the table does not exist yet (**Prisma `P2021`**), responds with **`entries: []`** so dev does not hard-fail before migrate. |

All responses include **`X-Request-Id`** where the route uses `withRequestId` (see individual route files).

---

## Client

### Data fetching (`queries/daily.ts`)

- `fetchDailyMeta()` → `GET /api/daily`
- `fetchDailyLeaderboard(limit, dateKey?)` → `GET /api/daily/leaderboard`
- React Query keys: `dailyKeys.meta`, `dailyKeys.leaderboard(dateKey)`

### Page (`app/daily/`)

- **`layout.tsx`** — metadata (title, description, canonical `/daily`).
- **`page.tsx`** — loads meta with React Query; renders **`Play`** in **`mode="daily"`** with `dailyMeta`; below the board, **today’s rankings** table (plies + formatted duration).

### Play integration (`components/play/Play.tsx`)

- **`mode`**: `"arcade"` (default) vs `"daily"`.
- **Daily** requires **`dailyMeta`** from the parent (throws if missing).
- Skips difficulty **pick**; starts in **playing** with seed/difficulty from meta; `gameId` is `daily:{date}`.
- **Match timer:** `matchStartedAtMs` initialized on load; **reset** uses **`restartDailyRound`** (same seed, new clock) instead of `fetchNewGame`.
- **Submit:** `POST /api/daily/scores` with `puzzleDate`, times, moves, seed; invalidates **`dailyKeys`** on success.
- **Pro sidebar:** `difficultyLocked` on **`ProSidebar`** so users cannot change level mid-run on the daily.

### Navigation & docs

- **`Shell`** — “Daily” link (desktop + mobile).
- **`Help`** — section “Daily puzzle (UTC)” with rules and link to `/daily`.
- **`sitemap.ts`** — includes `/daily`.
- **`README.md`** — feature summary, API table, short Phase 2+ roadmap pointer.

---

## Tests

- **Unit:** `lib/daily-puzzle.test.ts` (seed stability, UTC helpers). Wired into `bun run test:unit` in `package.json`.
- **E2E:** `tests/e2e/daily.spec.ts` — `/daily` loads headings and UTC copy.

---

## Operating notes

- **UTC vs local:** UI copy should make clear the puzzle **rolls at midnight UTC**; players in other zones may see the “date” differ from their local calendar near boundaries.
- **After deploy:** run **`prisma migrate deploy`** (or your CI equivalent) so `daily_puzzle_entries` exists; otherwise submissions will error until the table is there (leaderboard GET degrades to empty list only for missing table).
- **Phase 2+** (not in this walkthrough): campaign, streaks, gallery, achievements, teaching overlays, PWA/offline, share OG — see `README.md` roadmap blurb and your product plan.

---

*Last aligned with the Daily puzzle Phase 1 implementation in this repo.*
