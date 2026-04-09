"use client";

import type { Board, Difficulty } from "@/game-logic";
import { evaluatePositionForRed } from "@/game-logic";
import { X } from "lucide-react";
import { useMemo } from "react";

const GAUGE_CLAMP = 900;

type Props = {
  board: Board;
  moves: number[];
  gameOver: boolean;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onClose?: () => void;
  /** Mobile sheet: show close affordance */
  showClose?: boolean;
  /** Hide difficulty control (e.g. daily puzzle). */
  difficultyLocked?: boolean;
};

export function ProSidebar({
  board,
  moves,
  gameOver,
  difficulty,
  onDifficultyChange,
  onClose,
  showClose,
  difficultyLocked,
}: Props) {
  const evalRaw = useMemo(() => {
    if (gameOver) return null;
    return evaluatePositionForRed(board);
  }, [board, gameOver]);

  const gaugePct = useMemo(() => {
    if (evalRaw === null) return 50;
    const c = Math.max(-GAUGE_CLAMP, Math.min(GAUGE_CLAMP, evalRaw));
    return 50 + (c / (GAUGE_CLAMP * 2)) * 100;
  }, [evalRaw]);

  return (
    <div className="glass-panel flex flex-col gap-4 p-4 text-sm text-white/85">
      <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <h2 className="font-display text-base font-semibold text-white">Pro</h2>
          <p className="mt-0.5 text-xs text-white/50">
            Live eval favors red (you). Tooltip: raw heuristic score.
          </p>
        </div>
        {showClose && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Close Pro panel"
          >
            <X className="size-5" />
          </button>
        ) : null}
      </div>

      <section aria-label="Position evaluation">
        <p className="text-xs font-medium uppercase tracking-wide text-white/45">Live evaluation</p>
        {evalRaw === null ? (
          <p className="mt-2 text-center text-xs text-white/45">—</p>
        ) : (
          <>
            <p className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-wider text-white/40">
              <span className="text-amber-200/80">CPU</span>
              <span className="text-red-300/80">You</span>
            </p>
            <div
              className="group relative mt-1 h-3 w-full overflow-hidden rounded-full bg-black/50 ring-1 ring-white/10"
              title={`Heuristic (You / red positive): ${evalRaw > 0 ? "+" : ""}${evalRaw}`}
            >
              <div
                className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white/55"
                style={{ left: "50%", transform: "translateX(-0.5px)" }}
              />
              {gaugePct > 50 ? (
                <div
                  className="absolute inset-y-0 rounded-l-none rounded-r-full bg-gradient-to-r from-rose-500/85 to-red-500/90 transition-[width] duration-200 ease-out"
                  style={{ left: "50%", width: `${gaugePct - 50}%` }}
                />
              ) : gaugePct < 50 ? (
                <div
                  className="absolute inset-y-0 rounded-l-full rounded-r-none bg-gradient-to-r from-amber-500/75 to-yellow-400/70 transition-[width] duration-200 ease-out"
                  style={{ left: `${gaugePct}%`, width: `${50 - gaugePct}%` }}
                />
              ) : null}
            </div>
            <p className="mt-1.5 text-center text-xs text-white/55 tabular-nums">
              {evalRaw > 0 ? "+" : ""}
              {evalRaw}
            </p>
          </>
        )}
      </section>

      <section aria-label="Difficulty">
        <p className="text-xs font-medium uppercase tracking-wide text-white/45">Difficulty</p>
        {difficultyLocked ? (
          <p className="mt-2 text-xs text-white/70">
            Fixed for this mode:{" "}
            <span className="font-semibold capitalize text-amber-200/90">{difficulty}</span>
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs text-amber-200/70">Changing level resets the board.</p>
            <div className="mt-2 flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-black/30 p-1">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDifficultyChange(d)}
                  className={
                    difficulty === d
                      ? "flex-1 rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold capitalize text-white"
                      : "flex-1 rounded-xl px-3 py-2 text-xs font-medium capitalize text-white/65 transition hover:bg-white/10"
                  }
                >
                  {d}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <section aria-label="Move history" className="min-h-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-white/45">Move history</p>
        {moves.length === 0 ? (
          <p className="mt-2 text-xs text-white/45">No moves yet.</p>
        ) : (
          <ol className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-black/25 px-2 py-2 text-xs">
            {moves.map((col, i) => (
              <li
                key={`${i}-${col}`}
                className="flex justify-between gap-2 border-b border-white/5 py-1 last:border-0"
              >
                <span className="text-white/45">#{i + 1}</span>
                <span className="text-white/75">{i % 2 === 0 ? "You" : "CPU"}</span>
                <span className="tabular-nums text-amber-200/90">col {col}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
