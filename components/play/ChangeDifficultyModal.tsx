"use client";

import type { Difficulty } from "@/game-logic";
import { useEffect } from "react";

type Props = {
  targetDifficulty: Difficulty;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ChangeDifficultyModal({ targetDifficulty, onCancel, onConfirm }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const label = targetDifficulty.charAt(0).toUpperCase() + targetDifficulty.slice(1);

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-difficulty-title"
        className="glass-panel w-full max-w-sm border-white/15 p-8 shadow-2xl"
      >
        <h2 id="change-difficulty-title" className="font-display text-xl font-semibold text-white">
          Change difficulty?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          Changing level <strong className="text-white/90">resets the board</strong> and starts a new match
          on <span className="text-amber-200/90">{label}</span>.
        </p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-pill-outline order-2 justify-center py-3 sm:order-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-pill-solid order-1 justify-center py-3.5 normal-case tracking-normal sm:order-2"
          >
            Switch to {label}
          </button>
        </div>
      </div>
    </div>
  );
}
