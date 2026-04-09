import { type NextRequest, NextResponse } from "next/server";
import { getOrCreateRequestId, withRequestId } from "@/lib/request-id";
import {
  dailyCpuDifficulty,
  getDailyPuzzleUtcDateKey,
  nextUtcMidnightIso,
  seedForDailyDate,
} from "@/lib/daily-puzzle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const id = getOrCreateRequestId(request);
  const date = getDailyPuzzleUtcDateKey();
  const seed = seedForDailyDate(date);
  const difficulty = dailyCpuDifficulty();
  const closesAt = nextUtcMidnightIso();
  return withRequestId(NextResponse.json({ date, seed, difficulty, closesAt }), id);
}
