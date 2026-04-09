"use client";

import { Check, Share2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Difficulty } from "@/game-logic";
import { shareReplayLink } from "@/lib/shareReplayLink";

const TOAST_Z = 10000;

function buildReplayUrl(
  moves: number[],
  seed: number | null,
  difficulty: Difficulty | null,
): string {
  const params = new URLSearchParams();
  params.set("moves", moves.join(","));
  if (seed != null) params.set("seed", String(seed));
  if (difficulty != null) params.set("difficulty", difficulty);
  if (typeof window === "undefined") return `/replay?${params.toString()}`;
  return `${window.location.origin}/replay?${params.toString()}`;
}

type Props = {
  moves: number[];
  seed: number | null;
  difficulty: Difficulty | null;
};

export function ReplayToolbar({ moves, seed, difficulty }: Props) {
  const [copied, setCopied] = useState(false);
  const [copyTick, setCopyTick] = useState(0);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const share = useCallback(async () => {
    const url = buildReplayUrl(moves, seed, difficulty);
    try {
      const result = await shareReplayLink({
        url,
        title: "four.io — replay",
        text: "Check out this Connect 4 replay on four.io",
      });
      if (result === "copied") {
        setCopyTick((n) => n + 1);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2800);
      }
    } catch (e) {
      console.error("[four.io ReplayToolbar] shareReplay", e);
    }
  }, [moves, seed, difficulty]);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void share()} className="btn-pill-outline inline-flex gap-2">
          <Share2 className="size-4 opacity-80" aria-hidden />
          Copy / share link
        </button>
      </div>
      {portalReady && copied
        ? createPortal(
            <div
              className="pointer-events-none fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/95 px-4 py-2.5 text-sm text-emerald-100 shadow-lg shadow-black/40 backdrop-blur-md"
              style={{ zIndex: TOAST_Z }}
              key={copyTick}
              role="status"
            >
              <Check className="size-4 shrink-0 text-emerald-300" aria-hidden />
              Link copied
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
