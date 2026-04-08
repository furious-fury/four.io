import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchLeaderboard, leaderboardKeys } from "../queries/leaderboard";

const LIMIT = 50;

export function Leaderboard() {
  const [dense, setDense] = useState(false);
  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: leaderboardKeys.list(LIMIT),
    queryFn: () => fetchLeaderboard(LIMIT),
  });

  const entries = data?.entries ?? null;
  const errMsg = isError ? "Could not load leaderboard." : null;

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white md:text-3xl">Hall of Fame</h1>
            <p className="mt-1 text-sm text-white/65">
              Top 50 players worldwide by verified score.
              {isFetching && !isPending ? (
                <span className="ml-2 text-xs text-emerald-300/80">Updating…</span>
              ) : null}
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/55">
            <input
              type="checkbox"
              checked={dense}
              onChange={(e) => setDense(e.target.checked)}
              className="rounded border-white/30 bg-black/40 text-emerald-500 focus:ring-emerald-400/50"
            />
            Compact rows
          </label>
        </div>
      </div>

      {errMsg ? (
        <p className="glass-panel border-red-500/30 bg-red-950/30 px-4 py-3 text-red-200">{errMsg}</p>
      ) : null}

      <div className="glass-panel overflow-hidden">
        {isPending ? (
          <ul className="divide-y divide-white/10">
            {Array.from({ length: 8 }).map((_, i) => (
              <li
                key={i}
                className="flex animate-pulse gap-4 bg-white/[0.03] px-4 py-3"
              >
                <div className="h-4 w-8 rounded bg-white/10" />
                <div className="h-4 flex-1 rounded bg-white/10" />
                <div className="h-4 w-16 rounded bg-white/10" />
                <div className="hidden h-4 w-28 rounded bg-white/10 sm:block" />
              </li>
            ))}
          </ul>
        ) : entries && entries.length === 0 ? (
          <p className="px-4 py-10 text-center text-white/50">No scores yet. Be the first to win on Hard.</p>
        ) : entries ? (
          <ul className="divide-y divide-white/10">
            {entries.map((e) => (
              <li
                key={`${e.rank}-${e.name}-${e.date}`}
                className={[
                  "grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto] gap-2 px-4 text-sm items-center text-white/90",
                  dense ? "py-1.5" : "py-3",
                  "hover:bg-white/[0.06]",
                ].join(" ")}
              >
                <span className="w-8 font-mono text-white/45">{e.rank}</span>
                <span className="truncate font-medium capitalize">{e.name}</span>
                <span className="text-right font-semibold tabular-nums text-amber-200/95">{e.score}</span>
                <span className="hidden text-right text-xs text-white/45 sm:block">
                  {new Date(e.date).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
