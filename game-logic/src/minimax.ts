import { CPU, HUMAN, type Cell } from "./constants.js";
import { dropPiece, getDropRow, getLegalColumns, type Board } from "./board.js";
import { evaluateBoard } from "./heuristic.js";
import { getOutcome } from "./win.js";

const WIN_SCORE = 10_000_000;
const LOSS_SCORE = -10_000_000;
export const DEFAULT_MAX_DEPTH = 7;

/** Prefer center columns first for move ordering (alpha-beta). */
function orderColumns(cols: number[]): number[] {
  const center = 3;
  return [...cols].sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  toMove: Cell,
  lastMove: { r: number; c: number; p: Cell } | null
): number {
  if (lastMove) {
    const o = getOutcome(board, lastMove.r, lastMove.c, lastMove.p);
    if (o.winner === CPU) return WIN_SCORE;
    if (o.winner === HUMAN) return LOSS_SCORE;
    if (o.winner === "draw") return 0;
  }

  const cols = orderColumns(getLegalColumns(board));
  if (cols.length === 0) return 0;

  if (depth === 0) return evaluateBoard(board, CPU);

  if (toMove === CPU) {
    let value = -Infinity;
    for (const col of cols) {
      const row = getDropRow(board, col)!;
      const next = dropPiece(board, col, CPU)!;
      const child = minimax(next, depth - 1, alpha, beta, HUMAN, { r: row, c: col, p: CPU });
      value = Math.max(value, child);
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return value;
  }

  let value = Infinity;
  for (const col of cols) {
    const row = getDropRow(board, col)!;
    const next = dropPiece(board, col, HUMAN)!;
    const child = minimax(next, depth - 1, alpha, beta, CPU, { r: row, c: col, p: HUMAN });
    value = Math.min(value, child);
    beta = Math.min(beta, value);
    if (beta <= alpha) break;
  }
  return value;
}

export function getBestMoveHard(
  board: Board,
  lastHuman: { r: number; c: number } | null,
  maxDepth = DEFAULT_MAX_DEPTH
): number {
  if (lastHuman) {
    const o = getOutcome(board, lastHuman.r, lastHuman.c, HUMAN);
    if (o.winner === HUMAN) return getLegalColumns(board)[0] ?? 0;
  }

  const cols = orderColumns(getLegalColumns(board));
  if (cols.length === 0) return 0;

  let bestCol = cols[0]!;
  let best = -Infinity;
  for (const col of cols) {
    const row = getDropRow(board, col)!;
    const next = dropPiece(board, col, CPU)!;
    const immediate = getOutcome(next, row, col, CPU);
    if (immediate.winner === CPU) return col;
    const score = minimax(
      next,
      maxDepth - 1,
      -Infinity,
      Infinity,
      HUMAN,
      { r: row, c: col, p: CPU }
    );
    if (score > best || (score === best && col < bestCol)) {
      best = score;
      bestCol = col;
    }
  }
  return bestCol;
}
