import { apiUrl } from "../apiUrl";

export type LeaderboardEntry = {
  rank: number;
  name: string;
  score: number;
  date: string;
  difficulty: string;
};

export const leaderboardKeys = {
  all: ["leaderboard"] as const,
  list: (limit: number) => [...leaderboardKeys.all, "list", limit] as const,
};

export async function fetchLeaderboard(limit: number): Promise<{ entries: LeaderboardEntry[] }> {
  const r = await fetch(apiUrl(`/api/leaderboard?limit=${limit}`));
  if (!r.ok) throw new Error(`leaderboard_${r.status}`);
  return r.json() as Promise<{ entries: LeaderboardEntry[] }>;
}
