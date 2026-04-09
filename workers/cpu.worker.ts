import {
  CPU,
  dropPiece,
  evaluatePositionForRed,
  getCpuMove,
  getDropRow,
  type Board,
  type Difficulty,
} from "@/game-logic";

export type CpuRequest = {
  board: number[][];
  difficulty: Difficulty;
  seed: number;
  lastHuman: { r: number; c: number } | null;
};

self.onmessage = (e: MessageEvent<CpuRequest>) => {
  const { board, difficulty, seed, lastHuman } = e.data;
  const b = board as Board;
  const col = getCpuMove(b, difficulty, seed, { lastHuman });
  const row = getDropRow(b, col);
  let evalForRed: number | null = null;
  if (row >= 0) {
    const after = dropPiece(b, col, CPU);
    if (after) evalForRed = evaluatePositionForRed(after);
  }
  self.postMessage({ col, evalForRed });
};
