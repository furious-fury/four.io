import type { Difficulty } from "@/game-logic";

const CLOCK_SKEW_MS = 60_000;

function envInt(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : fallback;
}

export type DurationCheckError = "invalid_times" | "duration_implausible";

export function assertPlausibleDuration(params: {
  difficulty: Difficulty;
  moveCount: number;
  startedAt: number;
  endedAt: number;
  now?: number;
}): { ok: true } | { ok: false; error: DurationCheckError } {
  const now = params.now ?? Date.now();
  const { startedAt, endedAt, difficulty, moveCount } = params;
  if (!Number.isFinite(startedAt) || !Number.isFinite(endedAt)) {
    return { ok: false, error: "invalid_times" };
  }
  if (endedAt < startedAt) {
    return { ok: false, error: "invalid_times" };
  }
  if (endedAt > now + CLOCK_SKEW_MS || startedAt > now + CLOCK_SKEW_MS) {
    return { ok: false, error: "invalid_times" };
  }

  const elapsed = endedAt - startedAt;
  const minBase = envInt("SCORE_MIN_DURATION_MS", 2500);
  const perPly = envInt("SCORE_MIN_MS_PER_PLY", 350);
  const floorMult =
    difficulty === "hard" ? 1.15 : difficulty === "medium" ? 1.05 : 1;
  const minRequired = Math.max(minBase, Math.ceil(moveCount * perPly * floorMult));
  const maxMs = envInt("SCORE_MAX_DURATION_MS", 36 * 60 * 60 * 1000);

  if (elapsed < minRequired) {
    return { ok: false, error: "duration_implausible" };
  }
  if (elapsed > maxMs) {
    return { ok: false, error: "duration_implausible" };
  }
  return { ok: true };
}
