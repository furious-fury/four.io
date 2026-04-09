import { COLS, CPU, HUMAN, type Cell } from "@/game-logic/constants";
import { createEmptyBoard, dropPiece, getDropRow, type Board } from "@/game-logic/board";
import { getOutcome, type Winner } from "@/game-logic/win";

export type ReplayState = {
  board: Board;
  lastDrop: { row: number; col: number } | null;
  winner: Winner;
  winningCells: { row: number; col: number }[] | null;
  totalPlies: number;
};

/**
 * Replays a move list (human first by default) and returns the final board,
 * last drop, and terminal outcome from the perspective of the last mover.
 */
export function replayStateFromMoves(moves: number[], humanFirst = true): ReplayState | null {
  let b = createEmptyBoard();
  let lastDrop: { row: number; col: number } | null = null;
  let lastPlayer: Cell = HUMAN;

  for (let i = 0; i < moves.length; i++) {
    const player: Cell = humanFirst ? (i % 2 === 0 ? HUMAN : CPU) : i % 2 === 0 ? CPU : HUMAN;
    const col = moves[i]!;
    if (col < 0 || col >= COLS) return null;
    const row = getDropRow(b, col);
    if (row < 0) return null;
    const next = dropPiece(b, col, player);
    if (!next) return null;
    b = next;
    lastDrop = { row, col };
    lastPlayer = player;
  }

  if (moves.length === 0) {
    return {
      board: b,
      lastDrop: null,
      winner: null,
      winningCells: null,
      totalPlies: 0,
    };
  }

  const o = getOutcome(b, lastDrop!.row, lastDrop!.col, lastPlayer);
  return {
    board: b,
    lastDrop,
    winner: o.winner,
    winningCells: o.winningCells,
    totalPlies: moves.length,
  };
}
