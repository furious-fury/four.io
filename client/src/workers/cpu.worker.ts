import {
  getCpuMove,
  type Board,
  type Difficulty,
} from "@four.io/game-logic";

export type CpuRequest = {
  board: number[][];
  difficulty: Difficulty;
  seed: number;
  lastHuman: { r: number; c: number } | null;
};

self.onmessage = (e: MessageEvent<CpuRequest>) => {
  const { board, difficulty, seed, lastHuman } = e.data;
  const col = getCpuMove(board as Board, difficulty, seed, { lastHuman });
  self.postMessage({ col });
};
