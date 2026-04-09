import Link from "next/link";
import { HUMAN, CPU, type Difficulty } from "@/game-logic";
import { ReplayMoveList } from "@/components/replay/ReplayMoveList";
import { ReplayScrubber } from "@/components/replay/ReplayScrubber";
import { ReplayToolbar } from "@/components/replay/ReplayToolbar";
import { Shell } from "@/components/Shell";
import { pageMetadata } from "@/lib/pageMeta";
import { replayStateFromMoves } from "@/lib/replay-from-moves";
import { parseMovesFromReplayParam } from "@/lib/replay-url-codec";

export const metadata = pageMetadata({
  title: "Replay",
  description:
    "Reconstruct a Connect 4 game from a compact move string or comma list in the URL. Read-only board; scores still require server verification.",
  pathname: "/replay",
});

function parseSeed(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = Number(raw);
  if (!Number.isInteger(n)) return null;
  return n;
}

const DIFFICULTIES = new Set<string>(["easy", "medium", "hard"]);

function parseDifficulty(raw: string | undefined): Difficulty | null {
  if (raw == null || raw.trim() === "") return null;
  const d = raw.trim().toLowerCase();
  if (DIFFICULTIES.has(d)) return d as Difficulty;
  return null;
}

function outcomeLabel(winner: typeof HUMAN | typeof CPU | "draw" | null): string {
  if (winner === HUMAN) return "Red wins";
  if (winner === CPU) return "Yellow wins";
  if (winner === "draw") return "Draw";
  return "No winner yet";
}

export default async function ReplayPage({
  searchParams,
}: {
  searchParams: Promise<{ moves?: string; m?: string; seed?: string; difficulty?: string }>;
}) {
  const q = await searchParams;
  const moves = parseMovesFromReplayParam(q.m ?? q.moves);
  let error: string | null = null;
  let replay = null as ReturnType<typeof replayStateFromMoves> | null;

  if (moves === null) {
    error =
      "Invalid moves: use one digit 0–6 per ply (e.g. ?m=3332214), or comma-separated ?moves=3,3,3.";
  } else {
    replay = replayStateFromMoves(moves, true);
    if (!replay) {
      error = "Illegal move sequence for standard rules.";
    }
  }

  const seedNum = parseSeed(q.seed);
  const difficulty = parseDifficulty(q.difficulty);
  const invalidDifficulty = q.difficulty != null && q.difficulty.trim() !== "" && difficulty == null;

  return (
    <Shell>
      <div className="space-y-6">
        <div className="glass-panel p-5 md:p-6">
          <h1 className="font-display text-2xl font-semibold text-white md:text-3xl">Replay</h1>
          <p className="mt-1 text-sm text-white/65">
            Step through the move list with the scrubber, or jump to the end for the full snapshot. Shared links use a{" "}
            <strong className="text-white/90">short form</strong>:{" "}
            <code className="text-amber-200/90">?m=3332214…</code> (one digit <code className="text-amber-200/90">0–6</code>{" "}
            per ply; no commas). <code className="text-amber-200/90">?moves=…</code> with commas still works. The move list
            below labels columns <code className="text-amber-200/90">1–7</code> for humans. This page does not award or
            verify leaderboard scores by itself.
          </p>
          {q.seed != null && q.seed.trim() !== "" ? (
            <p className="mt-2 text-xs text-white/45">
              seed (informational): {q.seed}
              {seedNum == null ? " — could not parse as integer" : ""}
            </p>
          ) : null}
          {q.difficulty != null && q.difficulty.trim() !== "" ? (
            <p className="mt-1 text-xs text-white/45">
              difficulty:{" "}
              {difficulty ? <span className="text-white/70">{difficulty}</span> : invalidDifficulty ? "invalid" : null}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/play" className="btn-pill-outline">
              Play
            </Link>
            <Link href="/" className="btn-pill-outline">
              Home
            </Link>
          </div>
        </div>

        {error ? (
          <p className="glass-panel border-amber-500/30 px-4 py-3 text-amber-100">{error}</p>
        ) : replay && moves != null && moves.length > 0 ? (
          <>
            <div className="glass-panel space-y-4 p-4 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-4">
                <div>
                  <p className="font-display text-lg font-semibold text-white">{outcomeLabel(replay.winner)}</p>
                  <p className="mt-1 text-sm text-white/65">
                    {replay.totalPlies} {replay.totalPlies === 1 ? "move" : "moves"}
                    {replay.lastDrop
                      ? ` · Last: ${replay.totalPlies % 2 === 1 ? "Red" : "Yellow"} · column ${replay.lastDrop.col + 1} (${replay.lastDrop.col})`
                      : null}
                  </p>
                </div>
                <ReplayToolbar moves={moves} seed={seedNum} difficulty={difficulty} />
              </div>
              <ReplayMoveList moves={moves} />
              <ReplayScrubber moves={moves} />
            </div>
          </>
        ) : replay && moves != null && moves.length === 0 ? (
          <p className="text-white/55">
            Empty replay — add <code className="text-amber-200/90">?m=012</code> or{" "}
            <code className="text-amber-200/90">?moves=0,1,2</code> to the URL.
          </p>
        ) : null}
      </div>
    </Shell>
  );
}
