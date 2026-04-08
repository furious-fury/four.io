import { COLS, CPU, EMPTY, HUMAN, type Cell, ROWS } from "./constants.js";

export type Board = Cell[][];

export function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(EMPTY));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/** Row 0 = bottom, row ROWS-1 = top */
export function getDropRow(board: Board, col: number): number {
  if (col < 0 || col >= COLS) return -1;
  for (let r = 0; r < ROWS; r++) {
    if (board[r][col] === EMPTY) return r;
  }
  return -1;
}

export function getLegalColumns(board: Board): number[] {
  const cols: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (getDropRow(board, c) >= 0) cols.push(c);
  }
  return cols;
}

export function dropPiece(board: Board, col: number, player: Cell): Board | null {
  const row = getDropRow(board, col);
  if (row < 0) return null;
  const next = cloneBoard(board);
  next[row][col] = player;
  return next;
}

export function boardFromMoves(moves: number[], humanFirst = true): Board | null {
  let b = createEmptyBoard();
  for (let i = 0; i < moves.length; i++) {
    const player: Cell = humanFirst ? (i % 2 === 0 ? HUMAN : CPU) : i % 2 === 0 ? CPU : HUMAN;
    const col = moves[i];
    if (col < 0 || col >= COLS) return null;
    const next = dropPiece(b, col, player);
    if (!next) return null;
    b = next;
  }
  return b;
}
