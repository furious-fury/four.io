"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { LAST_SUBMITTED_NAME_KEY, normalizeDisplayName } from "@/lib/displayName";
import {
  fetchLeaderboard,
  leaderboardKeys,
  type LeaderboardFilter,
} from "@/queries/leaderboard";

const LIMIT = 50;

const FILTERS: { id: LeaderboardFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

export function Leaderboard() {
  const [dense, setDense] = useState(false);
  const [filter, setFilter] = useState<LeaderboardFilter>("all");
  const lastSubmittedRaw = useMemo(() => {
    try {
      return sessionStorage.getItem(LAST_SUBMITTED_NAME_KEY);
    } catch {
      return null;
    }
  }, []);
  const lastSubmittedNorm = lastSubmittedRaw ? normalizeDisplayName(lastSubmittedRaw) : null;

  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: leaderboardKeys.list(LIMIT, filter),
    queryFn: () => fetchLeaderboard(LIMIT, filter),
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
              Top 50 by verified score
              {filter !== "all" ? ` · ${filter} only (ranks within this filter)` : ""}.
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
        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={[
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition",
                filter === id
                  ? "bg-white/20 text-white ring-1 ring-white/30"
                  : "bg-black/25 text-white/70 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
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
          <p className="px-4 py-10 text-center text-white/50">No scores in this view yet.</p>
        ) : entries ? (
          <ul className="divide-y divide-white/10">
            {entries.map((e) => {
              const isYou =
                lastSubmittedNorm !== null && normalizeDisplayName(e.name) === lastSubmittedNorm;
              return (
                <li
                  key={`${e.rank}-${e.name}-${e.date}`}
                  className={[
                    "grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto] gap-2 px-4 text-sm items-center text-white/90",
                    dense ? "py-1.5" : "py-3",
                    "hover:bg-white/[0.06]",
                    isYou ? "bg-emerald-500/15 ring-1 ring-inset ring-emerald-400/40" : "",
                  ].join(" ")}
                >
                  <span className="w-8 font-mono text-white/45">{e.rank}</span>
                  <span className="truncate font-medium capitalize">{e.name}</span>
                  <span className="text-right font-semibold tabular-nums text-amber-200/95">{e.score}</span>
                  <span className="hidden text-right text-xs text-white/45 sm:block">
                    {new Date(e.date).toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
