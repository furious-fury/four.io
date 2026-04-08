import { describe, expect, test } from "bun:test";
import { createEmptyBoard, dropPiece, getDropRow } from "./board";
import { HUMAN } from "./constants";
import { checkWinFrom } from "./win";

describe("win detection", () => {
  test("horizontal four", () => {
    let b = createEmptyBoard();
    for (const col of [0, 1, 2, 3]) {
      const r = getDropRow(b, col)!;
      b = dropPiece(b, col, HUMAN)!;
      if (col === 3) {
        const w = checkWinFrom(b, r, col, HUMAN);
        expect(w?.winner).toBe(HUMAN);
        expect(w?.cells.length).toBe(4);
      }
    }
  });
});
