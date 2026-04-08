import { z } from "zod";
import { apiUrl } from "../apiUrl";

export type LeaderboardEntry = {
  rank: number;
  name: string;
  score: number;
  date: string;
  difficulty: string;
};

export type LeaderboardFilter = "all" | "easy" | "medium" | "hard";

const leaderboardEntrySchema = z.object({
  rank: z.number(),
  name: z.string(),
  score: z.number(),
  date: z.string(),
  difficulty: z.string(),
});

const leaderboardResponseSchema = z.object({
  entries: z.array(leaderboardEntrySchema),
});

export const leaderboardKeys = {
  all: ["leaderboard"] as const,
  list: (limit: number, filter: LeaderboardFilter = "all") =>
    [...leaderboardKeys.all, "list", limit, filter] as const,
};

export async function fetchLeaderboard(
  limit: number,
  filter: LeaderboardFilter = "all"
): Promise<{ entries: LeaderboardEntry[] }> {
  const q = new URLSearchParams({ limit: String(limit) });
  if (filter !== "all") q.set("difficulty", filter);
  const r = await fetch(apiUrl(`/api/leaderboard?${q}`));
  if (!r.ok) throw new Error(`leaderboard_${r.status}`);
  const json: unknown = await r.json();
  return leaderboardResponseSchema.parse(json);
}
