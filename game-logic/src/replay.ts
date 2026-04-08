import { CPU, HUMAN, type Difficulty } from "./constants.js";
import { createEmptyBoard, dropPiece, getDropRow, type Board } from "./board.js";
import { getCpuMove, type CpuMoveContext } from "./cpu.js";
import { getOutcome } from "./win.js";

export interface VerifyResult {
  valid: boolean;
  reason?: string;
  winner?: typeof HUMAN | typeof CPU | "draw";
  totalPlies?: number;
}

export function verifyGame(params: {
  moves: number[];
  seed: number;
  difficulty: Difficulty;
}): VerifyResult {
  const { moves, seed, difficulty } = params;
  let board: Board = createEmptyBoard();
  let lastHuman: { r: number; c: number } | null = null;

  for (let i = 0; i < moves.length; i++) {
    const col = moves[i]!;
    if (col < 0 || col > 6) {
      return { valid: false, reason: "invalid_column" };
    }

    if (i % 2 === 0) {
      const row = getDropRow(board, col);
      if (row < 0) return { valid: false, reason: "illegal_human" };
      const next = dropPiece(board, col, HUMAN);
      if (!next) return { valid: false, reason: "illegal_human" };
      board = next;
      lastHuman = { r: row, c: col };
      const o = getOutcome(board, row, col, HUMAN);
      if (o.winner === HUMAN) {
        if (i !== moves.length - 1) return { valid: false, reason: "continued_after_terminal" };
        return { valid: true, winner: HUMAN, totalPlies: moves.length };
      }
      if (o.winner === "draw") {
        if (i !== moves.length - 1) return { valid: false, reason: "continued_after_terminal" };
        return { valid: false, reason: "draw_no_score", winner: "draw", totalPlies: moves.length };
      }
    } else {
      const ctx: CpuMoveContext = { lastHuman };
      const expected = getCpuMove(board, difficulty, seed, ctx);
      if (col !== expected) {
        return { valid: false, reason: "cpu_mismatch" };
      }
      const row = getDropRow(board, col);
      if (row < 0) return { valid: false, reason: "illegal_cpu" };
      const next = dropPiece(board, col, CPU);
      if (!next) return { valid: false, reason: "illegal_cpu" };
      board = next;
      const o = getOutcome(board, row, col, CPU);
      if (o.winner === CPU) {
        return { valid: false, reason: "human_lost" };
      }
      if (o.winner === "draw") {
        if (i !== moves.length - 1) return { valid: false, reason: "continued_after_terminal" };
        return { valid: false, reason: "draw_no_score", winner: "draw", totalPlies: moves.length };
      }
    }
  }

  return { valid: false, reason: "incomplete_no_winner" };
}
