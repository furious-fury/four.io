import { COLS, CPU, EMPTY, HUMAN, type Cell, ROWS } from "./constants";
import type { Board } from "./board";

const WIN = 100_000;
const THREE_OPEN = 100;
const TWO_OPEN = 10;
const CENTER_BONUS_PER_DISC = 3;
const CENTER_COL = 3; // middle of 7 columns

function scoreWindow(a: Cell, b: Cell, c: Cell, d: Cell, forPlayer: Cell): number {
  const opp: Cell = forPlayer === CPU ? HUMAN : CPU;
  const cells = [a, b, c, d];
  const mine = cells.filter((x) => x === forPlayer).length;
  const op = cells.filter((x) => x === opp).length;
  const empty = cells.filter((x) => x === EMPTY).length;
  if (op > 0 && mine > 0) return 0;
  if (mine === 4) return WIN;
  if (op === 4) return -WIN;
  if (mine === 3 && empty === 1) return THREE_OPEN;
  if (mine === 2 && empty === 2) return TWO_OPEN;
  if (op === 3 && empty === 1) return -THREE_OPEN;
  if (op === 2 && empty === 2) return -TWO_OPEN;
  return 0;
}

/** Higher = better for `forPlayer`. */
export function evaluateBoard(board: Board, forPlayer: Cell): number {
  let score = 0;

  for (let r = 0; r < ROWS; r++) {
    const cell = board[r][CENTER_COL];
    if (cell === forPlayer) score += CENTER_BONUS_PER_DISC;
    else if (cell !== EMPTY && cell !== forPlayer) score -= CENTER_BONUS_PER_DISC;
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      score += scoreWindow(board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3], forPlayer);
    }
  }

  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 3; r++) {
      score += scoreWindow(board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c], forPlayer);
    }
  }

  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      score += scoreWindow(board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3], forPlayer);
    }
  }

  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 3; c < COLS; c++) {
      score += scoreWindow(board[r][c], board[r + 1][c - 1], board[r + 2][c - 2], board[r + 3][c - 3], forPlayer);
    }
  }

  return score;
}

/** Static score from Red’s (human) perspective; higher favors Red. Same basis as CPU leaf eval when `forPlayer` is Yellow. */
export function evaluatePositionForRed(board: Board): number {
  return evaluateBoard(board, HUMAN);
}
