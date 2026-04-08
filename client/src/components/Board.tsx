import { COLS, CPU, EMPTY, HUMAN, ROWS, type Board, getDropRow } from "@four.io/game-logic";
import type { CSSProperties } from "react";

type Props = {
  board: Board;
  onColumnClick: (col: number) => void;
  onColumnHover?: (col: number | null) => void;
  disabled: boolean;
  winningCells: { row: number; col: number }[] | null;
  highlightCol: number | null;
  /** When set, that cell’s disc plays a drop animation (row index top → bottom). */
  lastDrop: { row: number; col: number } | null;
  /** Optional keyboard-driven column focus (0–6). */
  focusedCol?: number | null;
  /** Hint column for easy/medium (visual only). */
  hintCol?: number | null;
};

function cellKey(r: number, c: number) {
  return `${r},${c}`;
}

export function Board({
  board,
  onColumnClick,
  onColumnHover,
  disabled,
  winningCells,
  highlightCol,
  lastDrop,
  focusedCol = null,
  hintCol = null,
}: Props) {
  const winSet = new Set(winningCells?.map((x) => cellKey(x.row, x.col)) ?? []);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 w-full max-w-md">
        {Array.from({ length: COLS }, (_, c) => {
          const full = getDropRow(board, c) < 0;
          const colDisabled = disabled || full;
          let colClass =
            "h-10 rounded-t-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950 sm:h-12 ";
          if (full) {
            colClass += "cursor-not-allowed bg-zinc-900/70 opacity-50";
          } else if (disabled) {
            colClass += "cursor-not-allowed bg-emerald-950/50 opacity-40";
          } else {
            colClass +=
              highlightCol === c
                ? "cursor-pointer bg-emerald-400/45 hover:bg-emerald-500/35"
                : "cursor-pointer bg-emerald-950/50 hover:bg-emerald-500/35";
          }
          if (hintCol === c && !full) {
            colClass += " ring-2 ring-amber-200/80 ring-offset-1 ring-offset-emerald-950";
          }
          if (focusedCol === c && !full) {
            colClass += " z-[1] ring-2 ring-white/80 ring-offset-2 ring-offset-emerald-950";
          }
          return (
            <button
              key={c}
              type="button"
              disabled={colDisabled}
              title={full ? "Column full" : undefined}
              onMouseEnter={() => onColumnHover?.(c)}
              onMouseLeave={() => onColumnHover?.(null)}
              onClick={() => onColumnClick(c)}
              className={colClass}
              aria-label={full ? `Column ${c + 1} full` : `Column ${c + 1}`}
            >
              {full ? "×" : "↓"}
            </button>
          );
        })}
      </div>

      <div className="w-full max-w-md rounded-2xl border-4 border-emerald-900/90 bg-gradient-to-b from-emerald-950 to-teal-950 p-2 shadow-inner shadow-black/40 ring-1 ring-white/10">
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: ROWS }, (_, displayRow) => {
            const r = ROWS - 1 - displayRow;
            return (
              <div key={r} className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: COLS }, (_, c) => {
                  const v = board[r][c];
                  const isWin = winSet.has(cellKey(r, c));
                  const isLastDrop =
                    lastDrop !== null && lastDrop.row === r && lastDrop.col === c && v !== EMPTY;
                  const dropRows = r + 1;
                  const dropDurSec = 0.22 + 0.045 * dropRows;
                  return (
                    <div
                      key={cellKey(r, c)}
                      className={[
                        "relative flex aspect-square max-h-12 items-center justify-center overflow-visible rounded-full",
                        isWin ? "ring-2 ring-amber-200 ring-offset-1 ring-offset-emerald-950" : "",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "size-[85%] max-h-10 rounded-full border-2 border-black/20 shadow-inner",
                          v === EMPTY ? "bg-zinc-900/80" : "",
                          v === HUMAN ? "bg-red-500 shadow-red-900/50" : "",
                          v === CPU ? "bg-amber-300 shadow-amber-900/50" : "",
                          isLastDrop ? "connect-piece-drop will-change-transform" : "",
                        ].join(" ")}
                        style={
                          isLastDrop
                            ? ({
                                ["--drop-rows" as string]: String(dropRows),
                                ["--drop-dur" as string]: `${dropDurSec}s`,
                              } as CSSProperties)
                            : undefined
                        }
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
