"use client";

import { useMemo, useState } from "react";
import { replayStateFromMoves } from "@/lib/replay-from-moves";
import { ReplayBoardView } from "@/components/replay/ReplayBoardView";

type Props = {
  moves: number[];
};

export function ReplayScrubber({ moves }: Props) {
  const [ply, setPly] = useState(moves.length);
  const max = moves.length;

  const state = useMemo(() => {
    const slice = moves.slice(0, ply);
    return replayStateFromMoves(slice, true);
  }, [moves, ply]);

  if (!state || max === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-pill-outline px-3 py-2 text-xs disabled:opacity-40"
            disabled={ply <= 0}
            onClick={() => setPly((p) => Math.max(0, p - 1))}
          >
            Prev
          </button>
          <button
            type="button"
            className="btn-pill-outline px-3 py-2 text-xs disabled:opacity-40"
            disabled={ply >= max}
            onClick={() => setPly((p) => Math.min(max, p + 1))}
          >
            Next
          </button>
        </div>
        <label className="flex min-w-[min(100%,14rem)] flex-1 items-center gap-3 text-xs text-white/65">
          <span className="shrink-0 tabular-nums text-white/50">
            Step {ply}/{max}
          </span>
          <input
            type="range"
            min={0}
            max={max}
            value={ply}
            onChange={(e) => setPly(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-emerald-400"
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={ply}
          />
        </label>
      </div>
      <ReplayBoardView board={state.board} winningCells={state.winningCells} lastDrop={state.lastDrop} />
    </div>
  );
}
