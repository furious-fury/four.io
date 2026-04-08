"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const BOARD_SCROLL_ID = "play-game-board";

type Props = {
  title: string;
  subtitle?: string;
  humanWon: boolean;
  /** When true, explains that the winning four are highlighted (CPU loss only). */
  showWinningLineHint?: boolean;
  /** Show “View winning board” when there is a winning line (human or CPU win). */
  canPeekBoard?: boolean;
  onPlayAgain: () => void;
  onSubmitScore?: () => void;
};

export function GameOverOverlay({
  title,
  subtitle,
  humanWon,
  showWinningLineHint = false,
  canPeekBoard = false,
  onPlayAgain,
  onSubmitScore,
}: Props) {
  const [celebrate, setCelebrate] = useState(false);
  const [viewingBoard, setViewingBoard] = useState(false);

  useEffect(() => {
    if (!humanWon) {
      setCelebrate(false);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setCelebrate(!reduce);
  }, [humanWon]);

  useEffect(() => {
    setViewingBoard(false);
  }, [title]);

  useEffect(() => {
    if (!viewingBoard) return;
    const el = document.getElementById(BOARD_SCROLL_ID);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }, [viewingBoard]);

  if (viewingBoard) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <div className="pointer-events-auto flex w-full max-w-sm flex-col items-center gap-2 rounded-2xl border border-white/15 bg-black/80 px-4 py-3 shadow-2xl backdrop-blur-md">
          <p className="text-center text-xs text-white/70">The highlighted discs show the winning four in a row.</p>
          <button
            type="button"
            onClick={() => setViewingBoard(false)}
            className="btn-pill-solid w-full py-3 normal-case tracking-normal"
          >
            Back to results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-sm">
        {celebrate ? (
          <div
            className="win-burst-bg absolute left-1/2 top-1/2 size-[min(120vw,48rem)] -translate-x-1/2 -translate-y-1/2"
            aria-hidden
          />
        ) : null}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="game-over-title"
          className="glass-panel relative border-white/15 p-8 shadow-2xl"
        >
          <h2 id="game-over-title" className="font-display text-2xl font-semibold text-white">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-white/65">{subtitle}</p>
          ) : null}
          {showWinningLineHint ? (
            <p className="mt-3 text-xs leading-snug text-amber-100/80">
              The winning four are highlighted on the board.
            </p>
          ) : null}
          <div className="mt-8 flex flex-col gap-3">
            {canPeekBoard ? (
              <button
                type="button"
                onClick={() => setViewingBoard(true)}
                className="btn-pill-outline w-full border-emerald-400/35 py-3.5 normal-case tracking-normal text-white/95 hover:border-emerald-300/50 hover:bg-white/5"
              >
                View winning board
              </button>
            ) : null}
            {humanWon && onSubmitScore ? (
              <button
                type="button"
                onClick={onSubmitScore}
                className="btn-pill-solid w-full py-3.5 normal-case tracking-normal"
              >
                Submit score
              </button>
            ) : null}
            <button
              type="button"
              onClick={onPlayAgain}
              className="btn-pill-ghost w-full border-white/40 py-3.5 normal-case tracking-normal"
            >
              Play again
            </button>
            <Link
              href="/"
              className="block w-full py-3 text-center text-sm text-white/50 transition hover:text-white"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
