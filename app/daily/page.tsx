"use client";

import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/Shell";
import { Play } from "@/components/play/Play";
import { dailyKeys, fetchDailyLeaderboard, fetchDailyMeta } from "@/queries/daily";

const LB_LIMIT = 50;

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s % 60}s`;
}

function DailyLeaderboardTable({ dateKey }: { dateKey: string }) {
  const { data, isLoading } = useQuery({
    queryKey: dailyKeys.leaderboard(dateKey),
    queryFn: () => fetchDailyLeaderboard(LB_LIMIT, dateKey),
  });

  if (isLoading) {
    return <p className="text-sm text-white/50">Loading rankings…</p>;
  }
  if (!data) return null;
  if (data.entries.length === 0) {
    return <p className="text-sm text-white/50">No submissions yet for this UTC day.</p>;
  }

  return (
    <div className="glass-panel overflow-x-auto p-4">
      <table className="w-full min-w-[320px] text-left text-sm text-white/85">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
            <th className="pb-2 pr-3 font-medium">#</th>
            <th className="pb-2 pr-3 font-medium">Name</th>
            <th className="pb-2 pr-3 font-medium">Plies</th>
            <th className="pb-2 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {data.entries.map((e) => (
            <tr key={`${e.rank}-${e.name}`} className="border-b border-white/5">
              <td className="py-2 pr-3 tabular-nums text-white/55">{e.rank}</td>
              <td className="py-2 pr-3 capitalize">{e.name}</td>
              <td className="py-2 pr-3 tabular-nums text-amber-200/90">{e.moveCount}</td>
              <td className="py-2 tabular-nums text-white/70">{formatDuration(e.durationMs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DailyPage() {
  const metaQuery = useQuery({
    queryKey: dailyKeys.meta,
    queryFn: fetchDailyMeta,
  });

  if (metaQuery.isError) {
    return (
      <Shell>
        <div className="glass-panel p-6 text-red-300">Could not load today’s puzzle. Try again later.</div>
      </Shell>
    );
  }

  if (!metaQuery.data) {
    return (
      <Shell>
        <p className="text-white/60">Loading…</p>
      </Shell>
    );
  }

  const meta = metaQuery.data;

  return (
    <Shell>
      <div className="space-y-8">
        <Play mode="daily" dailyMeta={meta} />
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-white">Today’s Daily rankings (UTC)</h2>
          <DailyLeaderboardTable dateKey={meta.date} />
        </section>
      </div>
    </Shell>
  );
}
