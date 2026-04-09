import { z } from "zod";
import type { Difficulty } from "@/game-logic";
import { apiUrl } from "@/lib/apiUrl";

export type DailyMeta = {
  date: string;
  seed: number;
  difficulty: Difficulty;
  closesAt: string;
};

export type DailyLeaderboardEntry = {
  rank: number;
  name: string;
  moveCount: number;
  durationMs: number;
  date: string;
};

const root = ["daily"] as const;

export const dailyKeys = {
  all: root,
  meta: [...root, "meta"] as const,
  leaderboard: (date?: string) => [...root, "leaderboard", date ?? "today"] as const,
};

const metaSchema = z.object({
  date: z.string(),
  seed: z.number(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  closesAt: z.string(),
});

const leaderboardResponseSchema = z.object({
  date: z.string(),
  entries: z.array(
    z.object({
      rank: z.number(),
      name: z.string(),
      moveCount: z.number(),
      durationMs: z.number(),
      date: z.string(),
    })
  ),
});

export async function fetchDailyMeta(): Promise<DailyMeta> {
  const r = await fetch(apiUrl("/api/daily"));
  if (!r.ok) throw new Error(`daily_meta_${r.status}`);
  return metaSchema.parse(await r.json());
}

export async function fetchDailyLeaderboard(limit: number, dateKey?: string) {
  const q = new URLSearchParams({ limit: String(limit) });
  if (dateKey) q.set("date", dateKey);
  const r = await fetch(apiUrl(`/api/daily/leaderboard?${q}`));
  if (!r.ok) throw new Error(`daily_lb_${r.status}`);
  return leaderboardResponseSchema.parse(await r.json());
}
