import { describe, expect, test } from "bun:test";
import { HUMAN } from "@/game-logic/constants";
import { replayStateFromMoves } from "./replay-from-moves";

describe("replayStateFromMoves", () => {
  test("empty moves", () => {
    const s = replayStateFromMoves([]);
    expect(s).not.toBeNull();
    expect(s!.totalPlies).toBe(0);
    expect(s!.winner).toBeNull();
    expect(s!.lastDrop).toBeNull();
  });

  test("illegal column", () => {
    expect(replayStateFromMoves([8])).toBeNull();
  });

  /** Human completes bottom row 0–3; CPU stacks in column 4. */
  test("human win and winning cells", () => {
    const moves = [0, 4, 1, 4, 2, 4, 3];
    const s = replayStateFromMoves(moves);
    expect(s).not.toBeNull();
    expect(s!.winner).toBe(HUMAN);
    expect(s!.winningCells).not.toBeNull();
    expect(s!.winningCells!.length).toBe(4);
    expect(s!.lastDrop).toEqual({ row: 0, col: 3 });
    expect(s!.totalPlies).toBe(7);
  });
});
