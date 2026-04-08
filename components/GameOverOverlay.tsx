"use client";

import { Check, Share2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { shareReplayLink } from "@/lib/shareReplayLink";

/** Above game-over (50), submit-score (60), and shell nav (~120). */
const COPY_TOAST_Z = 10000;

const BOARD_SCROLL_ID = "play-game-board";

type Props = {
  title: string;
  subtitle?: string;
  humanWon: boolean;
  /** When true, explains that the winning four are highlighted (CPU loss only). */
  showWinningLineHint?: boolean;
  /** Show “View winning board” when there is a winning line (human or CPU win). */
  canPeekBoard?: boolean;
  /** Move list for `/replay?moves=…` sharing. */
  shareMoves: number[];
  shareSeed: number;
  onPlayAgain: () => void;
  onSubmitScore?: () => void;
};

export function GameOverOverlay({
  title,
  subtitle,
  humanWon,
  showWinningLineHint = false,
  canPeekBoard = false,
  shareMoves,
  shareSeed,
  onPlayAgain,
  onSubmitScore,
}: Props) {
  const [celebrate, setCelebrate] = useState(false);
  const [viewingBoard, setViewingBoard] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  /** Bumps on each successful clipboard copy so CSS animation can replay. */
  const [copySuccessTick, setCopySuccessTick] = useState(0);
  const [toastPortalReady, setToastPortalReady] = useState(false);

  useEffect(() => {
    setToastPortalReady(true);
  }, []);

  const buildReplayUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set("moves", shareMoves.join(","));
    params.set("seed", String(shareSeed));
    if (typeof window === "undefined") return `/replay?${params.toString()}`;
    return `${window.location.origin}/replay?${params.toString()}`;
  }, [shareMoves, shareSeed]);

  const shareReplay = useCallback(async () => {
    try {
      const url = buildReplayUrl();
      const result = await shareReplayLink({
        url,
        title: "four.io — replay",
        text: "Check out this Connect 4 game on four.io",
      });
      if (result === "copied") {
        setCopySuccessTick((n) => n + 1);
        setShareCopied(true);
        window.setTimeout(() => setShareCopied(false), 2800);
      }
      if (result === "shared" && process.env.NODE_ENV === "development") {
        console.log(
          "[four.io GameOverOverlay] share completed but clipboard copy failed — paste may be empty",
        );
      }
    } catch (e) {
      console.error("[four.io GameOverOverlay] shareReplay: unexpected error", e);
    }
  }, [buildReplayUrl]);

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
    setShareCopied(false);
  }, [title]);

  useEffect(() => {
    if (!viewingBoard) return;
    const el = document.getElementById(BOARD_SCROLL_ID);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }, [viewingBoard]);

  const shareBtnClass = (compact: boolean) =>
    [
      "btn-pill-outline inline-flex w-full items-center justify-center gap-2 border py-3.5 normal-case tracking-normal transition-colors duration-200",
      compact ? "py-2.5 text-sm" : "text-white/95",
      shareCopied
        ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-50 shadow-[0_0_24px_-4px_rgba(52,211,153,0.45)] ring-1 ring-emerald-400/35 copy-success-btn"
        : compact
          ? "border-white/25 text-white/90 hover:bg-white/5"
          : "border-white/25 text-white/95 hover:bg-white/5",
    ].join(" ");

  const copyToast =
    toastPortalReady &&
    shareCopied &&
    copySuccessTick > 0 &&
    typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] -translate-x-1/2 isolate"
            style={{ zIndex: COPY_TOAST_Z }}
          >
            <div
              key={copySuccessTick}
              role="status"
              aria-live="polite"
              className="copy-success-toast flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-950/95 px-4 py-2.5 text-sm font-medium text-emerald-50 shadow-lg shadow-emerald-950/50 backdrop-blur-md"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/25">
                <Check className="size-3.5 text-emerald-200" strokeWidth={2.5} aria-hidden />
              </span>
              <span>Link copied — paste to share</span>
            </div>
          </div>,
          document.body,
        )
      : null;

  if (viewingBoard) {
    return (
      <>
        {copyToast}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          <div className="pointer-events-auto flex w-full max-w-sm flex-col items-center gap-2 rounded-2xl border border-white/15 bg-black/80 px-4 py-3 shadow-2xl backdrop-blur-md">
            <p className="text-center text-xs text-white/70">The highlighted discs show the winning four in a row.</p>
            {shareMoves.length > 0 ? (
              <button
                key={`peek-share-${copySuccessTick}`}
                type="button"
                data-testid="share-replay-button"
                onClick={() => void shareReplay()}
                className={shareBtnClass(true)}
              >
                {shareCopied ? (
                  <Check className="size-4 shrink-0 text-emerald-200" strokeWidth={2.5} aria-hidden />
                ) : (
                  <Share2 className="size-4 shrink-0" aria-hidden />
                )}
                {shareCopied ? "Copied!" : "Share replay link"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setViewingBoard(false)}
              className="btn-pill-solid w-full py-3 normal-case tracking-normal"
            >
              Back to results
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {copyToast}
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
              {shareMoves.length > 0 ? (
                <button
                  key={`main-share-${copySuccessTick}`}
                  type="button"
                  data-testid="share-replay-button"
                  onClick={() => void shareReplay()}
                  aria-label={shareCopied ? "Replay link copied to clipboard" : "Share replay link"}
                  className={shareBtnClass(false)}
                >
                  {shareCopied ? (
                    <Check className="size-[1.125rem] shrink-0 text-emerald-200" strokeWidth={2.5} aria-hidden />
                  ) : (
                    <Share2 className="size-[1.125rem] shrink-0" aria-hidden />
                  )}
                  {shareCopied ? "Copied!" : "Share replay"}
                </button>
              ) : null}
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
    </>
  );
}
