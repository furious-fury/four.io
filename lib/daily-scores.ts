import { HUMAN, type Difficulty, verifyGame } from "@/game-logic";
import {
  dailyCpuDifficulty,
  getDailyPuzzleUtcDateKey,
  parseUtcDateKeyToDate,
  seedForDailyDate,
} from "@/lib/daily-puzzle";
import { getPrisma } from "@/lib/db";
import { assertPlausibleDuration } from "@/lib/score-policy";
import { dailyScoreSubmitBodySchema } from "@/lib/schemas";

const NAME_RE = /^[\p{L}\p{N}_\- ]{2,24}$/u;

function normalizeName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function isStrictlyBetter(
  a: { moveCount: number; durationMs: number },
  b: { moveCount: number; durationMs: number }
): boolean {
  return a.moveCount < b.moveCount || (a.moveCount === b.moveCount && a.durationMs < b.durationMs);
}

export type SubmitDailyScoreResult =
  | { ok: true; rank: number; updated: boolean }
  | { ok: false; status: number; error: string };

export async function submitDailyScoreFromParsedBody(
  body: unknown,
  opts?: { reqId?: string }
): Promise<SubmitDailyScoreResult> {
  const parsed = dailyScoreSubmitBodySchema.safeParse(body);
  if (!parsed.success) {
    const custom = parsed.error.issues.find((i) => i.code === "custom");
    const msg = custom?.message;
    if (msg === "moves_moveHistory_mismatch") {
      return { ok: false, status: 400, error: "moves_moveHistory_mismatch" };
    }
    return { ok: false, status: 400, error: "invalid_body" };
  }

  const data = parsed.data;
  const moves = data.moveHistory ?? data.moves!;
  const { displayName, seed, puzzleDate, startedAt, endedAt } = data;

  if (!NAME_RE.test(displayName.trim())) {
    return { ok: false, status: 400, error: "invalid_name" };
  }

  const normalized = normalizeName(displayName);
  if (normalized.length < 2) {
    return { ok: false, status: 400, error: "invalid_name" };
  }

  const todayKey = getDailyPuzzleUtcDateKey();
  if (puzzleDate !== todayKey) {
    return { ok: false, status: 400, error: "daily_wrong_date" };
  }

  const expectedSeed = seedForDailyDate(puzzleDate);
  if (seed !== expectedSeed) {
    return { ok: false, status: 400, error: "daily_wrong_seed" };
  }

  const d: Difficulty = dailyCpuDifficulty();
  const result = verifyGame({ moves, seed, difficulty: d });
  if (!result.valid || result.winner !== HUMAN) {
    console.warn("[daily_scores] verify_failed", {
      reqId: opts?.reqId,
      reason: result.reason,
      moveCount: moves.length,
    });
    return { ok: false, status: 400, error: result.reason ?? "verification_failed" };
  }

  const moveCount = result.totalPlies ?? moves.length;
  const durationMs = endedAt - startedAt;

  const dur = assertPlausibleDuration({
    difficulty: d,
    moveCount,
    startedAt,
    endedAt,
  });
  if (!dur.ok) {
    console.warn("[daily_scores] duration_rejected", {
      reqId: opts?.reqId,
      moveCount,
      error: dur.error,
    });
    return { ok: false, status: 400, error: dur.error };
  }

  const puzzleDateObj = parseUtcDateKeyToDate(puzzleDate);
  const prisma = getPrisma();

  const existing = await prisma.dailyPuzzleEntry.findFirst({
    where: { puzzleDate: puzzleDateObj, displayName: normalized },
  });

  if (existing) {
    if (!isStrictlyBetter({ moveCount, durationMs }, existing)) {
      return { ok: false, status: 409, error: "daily_not_improved" };
    }
    await prisma.dailyPuzzleEntry.update({
      where: { id: existing.id },
      data: { moveCount, durationMs },
    });
  } else {
    await prisma.dailyPuzzleEntry.create({
      data: {
        puzzleDate: puzzleDateObj,
        displayName: normalized,
        moveCount,
        durationMs,
      },
    });
  }

  const rank =
    1 +
    (await prisma.dailyPuzzleEntry.count({
      where: {
        puzzleDate: puzzleDateObj,
        OR: [
          { moveCount: { lt: moveCount } },
          { AND: [{ moveCount }, { durationMs: { lt: durationMs } }] },
        ],
      },
    }));

  return { ok: true, rank, updated: !!existing };
}
