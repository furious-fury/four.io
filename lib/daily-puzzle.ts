import type { Difficulty } from "@/game-logic";

/** Public deterministic seed from UTC calendar day (`YYYY-MM-DD`). Same for all players; fairness is server replay. */
export function getDailyPuzzleUtcDateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** FNV-1a 32-bit → non-negative 31-bit int (matches worker / minimax seed range). */
export function seedForDailyDate(utcDateKey: string): number {
  const str = `four.io:daily:v1:${utcDateKey}`;
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 1; // 31-bit positive
}

/** Daily puzzle uses one difficulty for everyone (server + client must agree). */
export function dailyCpuDifficulty(): Difficulty {
  return "hard";
}

export function nextUtcMidnightIso(from = new Date()): string {
  const key = getDailyPuzzleUtcDateKey(from);
  const [y, m, d] = key.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0, 0));
  return next.toISOString();
}

export function parseUtcDateKeyToDate(utcDateKey: string): Date {
  const [y, m, d] = utcDateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
}
