import { CPU, HUMAN, type Difficulty } from "./constants";
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
      return getBestMoveMedium(board);
    case "hard":
      return getBestMoveHard(board, ctx.lastHuman);
    default:
      return legal[0]!;
  }
}

function getBestMoveMedium(board: Board): number {
  const legal = [...getLegalColumns(board)].sort((a, b) => a - b);
  let best = legal[0]!;
  let bestScore = -Infinity;
  for (const col of legal) {
    const row = getDropRow(board, col)!;
    const nb = dropPiece(board, col, CPU)!;
    const o = getOutcome(nb, row, col, CPU);
    if (o.winner === CPU) return col;
    const ev = evaluateBoard(nb, CPU);
    if (ev > bestScore) {
      bestScore = ev;
      best = col;
    }
  }
  return best;
}
