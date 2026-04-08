import { type NextRequest, NextResponse } from "next/server";
import { getOrCreateRequestId, withRequestId } from "@/lib/request-id";
import { rateLimitGames } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const id = getOrCreateRequestId(request);
  const limited = await rateLimitGames(request);
  if (!limited.ok) {
    return withRequestId(NextResponse.json({ error: "rate_limited" }, { status: 429 }), id);
  }
  const gameId = crypto.randomUUID();
  const seed = Math.floor(Math.random() * 0x7fffffff);
  return withRequestId(NextResponse.json({ gameId, seed }), id);
}
