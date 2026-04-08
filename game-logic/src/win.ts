import { COLS, CPU, EMPTY, HUMAN, type Cell, ROWS } from "./constants.js";
import type { Board } from "./board.js";

export type Winner = typeof HUMAN | typeof CPU | "draw" | null;

export interface WinResult {
  winner: typeof HUMAN | typeof CPU;
  cells: { row: number; col: number }[];
}

const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

/** Collect maximal straight line of `player` through (r,c) in direction (dr,dc). */
function collectRun(
  board: Board,
  r: number,
  c: number,
  dr: number,
  dc: number,
  player: Cell
): { row: number; col: number }[] {
  let sr = r;
  let sc = c;
  while (inBounds(sr - dr, sc - dc) && board[sr - dr][sc - dc] === player) {
    sr -= dr;
    sc -= dc;
  }
  const run: { row: number; col: number }[] = [];
  while (inBounds(sr, sc) && board[sr][sc] === player) {
    run.push({ row: sr, col: sc });
    sr += dr;
    sc += dc;
  }
  return run;
}

function pickHighlightFour(
  run: { row: number; col: number }[],
  r: number,
  c: number
): { row: number; col: number }[] {
  const idx = run.findIndex((cell) => cell.row === r && cell.col === c);
  if (idx < 0 || run.length < 4) return run.slice(0, 4);
  const start = Math.min(Math.max(0, idx - 3), run.length - 4);
  return run.slice(start, start + 4);
}

export function checkWinFrom(board: Board, r: number, c: number, player: Cell): WinResult | null {
  if (player === EMPTY) return null;

  for (const [dr, dc] of DIRS) {
    const run = collectRun(board, r, c, dr, dc, player);
    if (run.length >= 4) {
      return { winner: player, cells: pickHighlightFour(run, r, c) };
    }
  }
  return null;
}

export function isBoardFull(board: Board): boolean {
  for (let c = 0; c < COLS; c++) {
    if (board[ROWS - 1][c] === EMPTY) return false;
  }
  return true;
}

export function getOutcome(board: Board, lastRow: number, lastCol: number, lastPlayer: Cell): {
  winner: Winner;
  winningCells: { row: number; col: number }[] | null;
} {
  if (lastPlayer === EMPTY) {
    return { winner: null, winningCells: null };
  }
  const win = checkWinFrom(board, lastRow, lastCol, lastPlayer);
  if (win) {
    return { winner: win.winner, winningCells: win.cells };
  }
  if (isBoardFull(board)) {
    return { winner: "draw", winningCells: null };
  }
  return { winner: null, winningCells: null };
}
