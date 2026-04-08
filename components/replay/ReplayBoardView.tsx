"use client";

import { Board as GameBoard } from "@/components/Board";
import type { Board } from "@/game-logic";

export function ReplayBoardView({ board }: { board: Board }) {
  return (
    <GameBoard
      board={board}
      onColumnClick={() => {}}
      disabled
      winningCells={null}
      highlightCol={null}
      lastDrop={null}
      hideColumnSelectors
    />
  );
}
