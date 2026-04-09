import { computeScore, HUMAN, type Difficulty, verifyGame } from "@/game-logic";
import { getPrisma } from "@/lib/db";
import { assertPlausibleDuration } from "@/lib/score-policy";
import { scoreSubmitBodySchema } from "@/lib/schemas";

const NAME_RE = /^[\p{L}\p{N}_\- ]{2,24}$/u;

function normalizeName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export type SubmitScoreResult =
  | { ok: true; updated: boolean; totalScore: number }
  | { ok: false; status: number; error: string };

export async function submitScoreFromParsedBody(
  body: unknown,
  opts?: { reqId?: string }
): Promise<SubmitScoreResult> {
  const parsed = scoreSubmitBodySchema.safeParse(body);
  if (!parsed.success) {
    const custom = parsed.error.issues.find((i) => i.code === "custom");
    const msg = custom?.message;
    if (msg === "moves_moveHistory_mismatch") {
      return { ok: false, status: 400, error: "moves_moveHistory_mismatch" };
    }
    if (msg === "startedAt_and_endedAt_together") {
      return { ok: false, status: 400, error: "invalid_times" };
    }
    return { ok: false, status: 400, error: "invalid_body" };
  }
  const data = parsed.data;
  const moves = data.moveHistory ?? data.moves!;
  const { displayName, difficulty, seed, startedAt, endedAt } = data;

  if (!NAME_RE.test(displayName.trim())) {
    return { ok: false, status: 400, error: "invalid_name" };
  }

  const d = difficulty as Difficulty;
  const normalized = normalizeName(displayName);
  if (normalized.length < 2) {
    return { ok: false, status: 400, error: "invalid_name" };
  }

  const result = verifyGame({ moves, seed, difficulty: d });
  if (!result.valid || result.winner !== HUMAN) {
    console.warn("[scores] verify_failed", {
      reqId: opts?.reqId,
      reason: result.reason,
      difficulty: d,
      moveCount: moves.length,
    });
    return { ok: false, status: 400, error: result.reason ?? "verification_failed" };
  }

  const totalPlies = result.totalPlies ?? moves.length;
  if (startedAt !== undefined && endedAt !== undefined) {
    const dur = assertPlausibleDuration({
      difficulty: d,
      moveCount: totalPlies,
      startedAt,
      endedAt,
    });
    if (!dur.ok) {
      console.warn("[scores] duration_rejected", {
        reqId: opts?.reqId,
        difficulty: d,
        moveCount: totalPlies,
        error: dur.error,
      });
      return { ok: false, status: 400, error: dur.error };
    }
  }
  const { basePoints, bonusPoints, totalScore } = computeScore(d, totalPlies);

  const existing = await getPrisma().leaderboardEntry.findFirst({
    where: { displayName: normalized },
  });
  if (existing) {
    if (totalScore <= existing.totalScore) {
      return { ok: false, status: 409, error: "name_taken_not_better" };
    }
    await getPrisma().leaderboardEntry.update({
      where: { id: existing.id },
      data: {
        difficulty: d,
        basePoints,
        bonusPoints,
        totalScore,
        moveCount: totalPlies,
      },
    });
    return { ok: true, updated: true, totalScore };
  }

  await getPrisma().leaderboardEntry.create({
    data: {
      displayName: normalized,
      difficulty: d,
      basePoints,
      bonusPoints,
      totalScore,
      moveCount: totalPlies,
    },
  });
  return { ok: true, updated: false, totalScore };
}
