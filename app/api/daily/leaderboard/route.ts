import { type NextRequest, NextResponse } from "next/server";
import { getDailyPuzzleUtcDateKey, parseUtcDateKeyToDate } from "@/lib/daily-puzzle";
import { getPrisma } from "@/lib/db";
import { getOrCreateRequestId, withRequestId } from "@/lib/request-id";
import { dailyLeaderboardQuerySchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const id = getOrCreateRequestId(request);
  const parsed = dailyLeaderboardQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return withRequestId(NextResponse.json({ error: "invalid_query" }, { status: 400 }), id);
  }

  const dateKey = parsed.data.date ?? getDailyPuzzleUtcDateKey();
  const limit = parsed.data.limit;
  const puzzleDate = parseUtcDateKeyToDate(dateKey);

  let rows: {
    displayName: string;
    moveCount: number;
    durationMs: number;
    createdAt: Date;
  }[];
  try {
    rows = await getPrisma().dailyPuzzleEntry.findMany({
      where: { puzzleDate },
      orderBy: [{ moveCount: "asc" }, { durationMs: "asc" }, { createdAt: "asc" }],
      take: limit,
      select: {
        displayName: true,
        moveCount: true,
        durationMs: true,
        createdAt: true,
      },
    });
  } catch (e) {
    const code = typeof e === "object" && e && "code" in e ? String((e as { code: string }).code) : "";
    if (code === "P2021") {
      return withRequestId(NextResponse.json({ date: dateKey, entries: [] }), id);
    }
    throw e;
  }

  const entries = rows.map((r, i) => ({
    rank: i + 1,
    name: r.displayName,
    moveCount: r.moveCount,
    durationMs: r.durationMs,
    date: r.createdAt.toISOString(),
  }));

  return withRequestId(NextResponse.json({ date: dateKey, entries }), id);
}
