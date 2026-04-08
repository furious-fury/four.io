import { boardFromMoves, type Board } from "@four.io/game-logic";
import { Link, useSearchParams } from "react-router-dom";
import { Board as GameBoard } from "../components/Board";
import { useMemo } from "react";

function parseMoves(raw: string | null): number[] | null {
  if (raw == null || raw.trim() === "") return [];
  const parts = raw.split(/[,\s]+/).filter(Boolean);
  const out: number[] = [];
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isInteger(n) || n < 0 || n > 6) return null;
    out.push(n);
  }
  return out;
}

export function Replay() {
  const [params] = useSearchParams();
  const { board, error } = useMemo(() => {
    const moves = parseMoves(params.get("moves"));
    if (moves === null) {
      return { board: null as Board | null, error: "Invalid moves (use columns 0–6, comma-separated)." };
    }
    const b = boardFromMoves(moves, true);
    if (!b) {
      return { board: null, error: "Illegal move sequence for standard rules." };
    }
    return { board: b, error: null as string | null };
  }, [params]);

  const seedNote = params.get("seed");

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 md:p-6">
        <h1 className="font-display text-2xl font-semibold text-white md:text-3xl">Replay</h1>
        <p className="mt-1 text-sm text-white/65">
          Read-only reconstruction from the URL. Scores still require server verification.
        </p>
        {seedNote ? <p className="mt-2 text-xs text-white/45">seed (informational): {seedNote}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/play" className="btn-pill-outline">
            Play
          </Link>
          <Link to="/" className="btn-pill-outline">
            Home
          </Link>
        </div>
      </div>

      {error ? (
        <p className="glass-panel border-amber-500/30 px-4 py-3 text-amber-100">{error}</p>
      ) : board ? (
        <div className="glass-panel p-4 sm:p-6">
          <GameBoard
            board={board}
            onColumnClick={() => {}}
            disabled
            winningCells={null}
            highlightCol={null}
            lastDrop={null}
          />
        </div>
      ) : (
        <p className="text-white/55">Empty replay — add <code className="text-amber-200/90">?moves=0,1,2</code> to the URL.</p>
      )}
    </div>
  );
}
