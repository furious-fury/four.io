import { describe, expect, test } from "bun:test";
import { assertPlausibleDuration } from "./score-policy";

describe("assertPlausibleDuration", () => {
  test("accepts generous elapsed", () => {
    const now = 1_700_000_000_000;
    const r = assertPlausibleDuration({
      difficulty: "easy",
      moveCount: 10,
      startedAt: now - 60_000,
      endedAt: now,
      now,
    });
    expect(r.ok).toBe(true);
  });

  test("rejects too-fast win", () => {
    const now = 1_700_000_000_000;
    const r = assertPlausibleDuration({
      difficulty: "hard",
      moveCount: 20,
      startedAt: now - 500,
      endedAt: now,
      now,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("duration_implausible");
  });

  test("rejects ended before started", () => {
    const now = 1_700_000_000_000;
    const r = assertPlausibleDuration({
      difficulty: "medium",
      moveCount: 5,
      startedAt: now,
      endedAt: now - 1,
      now,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("invalid_times");
  });

  test("rejects clock in the future", () => {
    const now = 1_700_000_000_000;
    const r = assertPlausibleDuration({
      difficulty: "easy",
      moveCount: 5,
      startedAt: now + 120_000,
      endedAt: now + 180_000,
      now,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("invalid_times");
  });
});
