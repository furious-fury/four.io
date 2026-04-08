import { getPrisma } from "@/lib/db";
import { leaderboardQuerySchema, parseLeaderboardResponse } from "@/lib/schemas";

export async function getLeaderboardJson(searchParams: URLSearchParams) {
  const qParsed = leaderboardQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!qParsed.success) {
    return { ok: false as const, status: 400, error: "invalid_query" as const };
  }
  const { limit, difficulty: diffFilter } = qParsed.data;
  const rows = await getPrisma().leaderboardEntry.findMany({
    where: diffFilter ? { difficulty: diffFilter } : undefined,
    orderBy: { totalScore: "desc" },
    take: limit,
    select: {
      displayName: true,
      totalScore: true,
      createdAt: true,
      difficulty: true,
    },
  });
  const ranked = rows.map((r, i) => ({
    rank: i + 1,
    name: r.displayName,
    score: r.totalScore,
    date: r.createdAt.toISOString(),
    difficulty: r.difficulty,
  }));
  const body = { entries: ranked };
  parseLeaderboardResponse.parse(body);
  return { ok: true as const, body };
}
