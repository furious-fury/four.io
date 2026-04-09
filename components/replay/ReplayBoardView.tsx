"use client";

import { Board as GameBoard } from "@/components/Board";
import type { Board } from "@/game-logic";

type Props = {
  board: Board;
  winningCells?: { row: number; col: number }[] | null;
  lastDrop?: { row: number; col: number } | null;
};

export function ReplayBoardView({ board, winningCells = null, lastDrop = null }: Props) {
  return (
    <GameBoard
      board={board}
      onColumnClick={() => {}}
      disabled
      winningCells={winningCells}
      highlightCol={null}
      lastDrop={lastDrop}
      hideColumnSelectors
    />
  );
}
