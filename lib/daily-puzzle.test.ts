import { describe, expect, test } from "bun:test";
import {
  dailyCpuDifficulty,
  getDailyPuzzleUtcDateKey,
  nextUtcMidnightIso,
  parseUtcDateKeyToDate,
  seedForDailyDate,
} from "./daily-puzzle";

describe("daily-puzzle", () => {
  test("seedForDailyDate is stable", () => {
    expect(seedForDailyDate("2026-02-10")).toBe(seedForDailyDate("2026-02-10"));
    expect(seedForDailyDate("2026-02-10")).not.toBe(seedForDailyDate("2026-02-11"));
  });

  test("seed is non-negative 31-bit", () => {
    const s = seedForDailyDate("2000-01-01");
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(0x7fffffff);
  });

  test("getDailyPuzzleUtcDateKey matches ISO date", () => {
    const d = new Date("2026-06-15T12:00:00.000Z");
    expect(getDailyPuzzleUtcDateKey(d)).toBe("2026-06-15");
  });

  test("dailyCpuDifficulty is hard", () => {
    expect(dailyCpuDifficulty()).toBe("hard");
  });

  test("parseUtcDateKeyToDate round-trips via Prisma date intent", () => {
    const x = parseUtcDateKeyToDate("2026-03-01");
    expect(x.toISOString().startsWith("2026-03-01")).toBe(true);
  });

  test("nextUtcMidnightIso is after reference", () => {
    const from = new Date("2026-01-05T15:00:00.000Z");
    const next = new Date(nextUtcMidnightIso(from));
    expect(next.getTime()).toBeGreaterThan(from.getTime());
    expect(next.getUTCHours()).toBe(0);
    expect(next.getUTCMinutes()).toBe(0);
  });
});
