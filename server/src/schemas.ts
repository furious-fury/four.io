import { z } from "zod";

const difficultyEnum = z.enum(["easy", "medium", "hard"]);

function firstQuery(val: unknown): string | undefined {
  if (val === undefined || val === "") return undefined;
  return Array.isArray(val) ? val[0] : String(val);
}

export const leaderboardQuerySchema = z.object({
  limit: z.preprocess((val) => {
    const s = firstQuery(val);
    if (s === undefined) return 50;
    const n = Number(s);
    if (!Number.isFinite(n)) return 50;
    return Math.min(50, Math.max(1, Math.trunc(n)));
  }, z.number().int().min(1).max(50)),
  difficulty: z.preprocess((val) => {
    const s = firstQuery(val);
    if (s === undefined) return undefined;
    const r = difficultyEnum.safeParse(s);
    return r.success ? r.data : undefined;
  }, difficultyEnum.optional()),
});

export const leaderboardEntrySchema = z.object({
  rank: z.number(),
  name: z.string(),
  score: z.number(),
  date: z.string(),
  difficulty: z.string(),
});

export const parseLeaderboardResponse = z.object({
  entries: z.array(leaderboardEntrySchema),
});

export const scoreSubmitBodySchema = z.object({
  displayName: z.string(),
  difficulty: difficultyEnum,
  moves: z.array(z.number().int().min(0).max(6)),
  seed: z.number(),
  gameId: z.string().optional(),
});
