import "./load-env.js";
import {
  computeScore,
  HUMAN,
  type Difficulty,
  verifyGame,
} from "@four.io/game-logic";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "./db.js";
import { requestIdMiddleware } from "./requestId.js";
import {
  leaderboardQuerySchema,
  parseLeaderboardResponse,
  scoreSubmitBodySchema,
} from "./schemas.js";

const app = express();
const PORT = Number(process.env.PORT) || 5005;
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

app.use(requestIdMiddleware);
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "64kb" }));

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const gamesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
});

function normalizeName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

const NAME_RE = /^[\p{L}\p{N}_\- ]{2,24}$/u;

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "four.io" });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/games", gamesLimiter, (_req, res) => {
  const gameId = crypto.randomUUID();
  const seed = Math.floor(Math.random() * 0x7fffffff);
  res.json({ gameId, seed });
});

app.post("/api/scores", submitLimiter, async (req, res) => {
  try {
    const parsed = scoreSubmitBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_body" });
    }
    const { displayName, difficulty, moves, seed } = parsed.data;

    if (!NAME_RE.test(displayName.trim())) {
      return res.status(400).json({ error: "invalid_name" });
    }

    const d = difficulty as Difficulty;

    const normalized = normalizeName(displayName);
    if (normalized.length < 2) {
      return res.status(400).json({ error: "invalid_name" });
    }

    const result = verifyGame({ moves, seed, difficulty: d });
    if (!result.valid || result.winner !== HUMAN) {
      return res.status(400).json({ error: result.reason ?? "verification_failed" });
    }

    const totalPlies = result.totalPlies ?? moves.length;
    const { basePoints, bonusPoints, totalScore } = computeScore(d, totalPlies);

    const existing = await prisma.leaderboardEntry.findFirst({
      where: { displayName: normalized },
    });
    if (existing) {
      if (totalScore <= existing.totalScore) {
        return res.status(409).json({ error: "name_taken_not_better" });
      }
      await prisma.leaderboardEntry.update({
        where: { id: existing.id },
        data: {
          difficulty: d,
          basePoints,
          bonusPoints,
          totalScore,
          moveCount: totalPlies,
        },
      });
      return res.json({ ok: true, updated: true, totalScore });
    }

    await prisma.leaderboardEntry.create({
      data: {
        displayName: normalized,
        difficulty: d,
        basePoints,
        bonusPoints,
        totalScore,
        moveCount: totalPlies,
      },
    });
    res.json({ ok: true, updated: false, totalScore });
  } catch (e) {
    console.error({ reqId: req.requestId, err: e });
    res.status(500).json({ error: "server_error" });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  const qParsed = leaderboardQuerySchema.safeParse(req.query);
  if (!qParsed.success) {
    return res.status(400).json({ error: "invalid_query" });
  }
  const { limit, difficulty: diffFilter } = qParsed.data;
  try {
    const rows = await prisma.leaderboardEntry.findMany({
      where: diffFilter ? { difficulty: diffFilter } : undefined,
      orderBy: { totalScore: "desc" },
      take: limit,
      select: {
        displayName: true,
        totalScore: true,
        createdAt: true,
        difficulty: true,
      },
    });
    const ranked = rows.map((r: (typeof rows)[number], i: number) => ({
      rank: i + 1,
      name: r.displayName,
      score: r.totalScore,
      date: r.createdAt.toISOString(),
      difficulty: r.difficulty,
    }));
    const body = { entries: ranked };
    parseLeaderboardResponse.parse(body);
    res.json(body);
  } catch (e) {
    console.error({ reqId: req.requestId, err: e });
    res.status(500).json({ error: "server_error" });
  }
});

app.listen(PORT, () => {
  console.log(`four.io api listening on ${PORT}`);
});
