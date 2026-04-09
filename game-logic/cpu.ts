import { COLS, CPU, HUMAN, ROWS, type Difficulty } from "./constants";
import { dropPiece, getDropRow, getLegalColumns, type Board } from "./board";
import { evaluateBoard } from "./heuristic";
import { getBestMoveHard } from "./minimax";
import { mulberry32 } from "./rng";
import { getOutcome } from "./win";

export interface CpuMoveContext {
  lastHuman: { r: number; c: number } | null;
}

export function getCpuMove(
  board: Board,
  difficulty: Difficulty,
  seed: number,
  ctx: CpuMoveContext
): number {
  const legal = getLegalColumns(board);
  if (legal.length === 0) return 0;

  switch (difficulty) {
    case "easy": {
      const rand = mulberry32(seed ^ 0x9e3779b9);
      const idx = Math.floor(rand() * legal.length);
      return legal[idx]!;
    }
    case "medium":
      return getBestMoveMedium(board, seed);
    case "hard":
      return getBestMoveHard(board, ctx.lastHuman);
    default:
      return legal[0]!;
  }
}

/** Deterministic per (board, seed) so server verification matches the client. ~0.4 ≈ “beatable but not trivial”. */
const MEDIUM_SUBOPTIMAL_CHANCE = 0.4;

function mediumRngKey(board: Board, seed: number): number {
  let h = seed >>> 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      h ^= board[r][c]! + 0x9e3779b9 + (h << 6) + (h >>> 2);
    }
  }
  return h | 0;
}

function findHumanImmediateWinColumn(board: Board): number | null {
  for (const col of getLegalColumns(board)) {
    const row = getDropRow(board, col)!;
    const nb = dropPiece(board, col, HUMAN)!;
    const o = getOutcome(nb, row, col, HUMAN);
    if (o.winner === HUMAN) return col;
  }
  return null;
}

function getBestMoveMedium(board: Board, seed: number): number {
  const legal = [...getLegalColumns(board)].sort((a, b) => a - b);
  if (legal.length === 0) return 0;

  for (const col of legal) {
    const row = getDropRow(board, col)!;
    const nb = dropPiece(board, col, CPU)!;
    const o = getOutcome(nb, row, col, CPU);
    if (o.winner === CPU) return col;
  }

  const block = findHumanImmediateWinColumn(board);
  if (block !== null) return block;

  const rng = mulberry32(mediumRngKey(board, seed) ^ 0x6a09e667);
  if (rng() < MEDIUM_SUBOPTIMAL_CHANCE) {
    const idx = Math.floor(rng() * legal.length);
    return legal[idx]!;
  }

  let best = legal[0]!;
  let bestScore = -Infinity;
  for (const col of legal) {
    const nb = dropPiece(board, col, CPU)!;
    const ev = evaluateBoard(nb, CPU);
    if (ev > bestScore) {
      bestScore = ev;
      best = col;
    }
  }
  return best;
}
