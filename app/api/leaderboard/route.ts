import { type NextRequest, NextResponse } from "next/server";
import { getLeaderboardJson } from "@/lib/leaderboard-data";
import { getOrCreateRequestId, withRequestId } from "@/lib/request-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const id = getOrCreateRequestId(request);
  try {
    const result = await getLeaderboardJson(request.nextUrl.searchParams);
    if (!result.ok) {
      return withRequestId(NextResponse.json({ error: result.error }, { status: result.status }), id);
    }
    return withRequestId(NextResponse.json(result.body), id);
  } catch (e) {
    console.error({ reqId: id, err: e });
    return withRequestId(NextResponse.json({ error: "server_error" }, { status: 500 }), id);
  }
}
