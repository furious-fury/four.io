import { type NextRequest, NextResponse } from "next/server";
import { submitDailyScoreFromParsedBody } from "@/lib/daily-scores";
import { getOrCreateRequestId, withRequestId } from "@/lib/request-id";
import { rateLimitDailyScores } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const id = getOrCreateRequestId(request);
  const limited = await rateLimitDailyScores(request);
  if (!limited.ok) {
    return withRequestId(NextResponse.json({ error: "rate_limited" }, { status: 429 }), id);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withRequestId(NextResponse.json({ error: "invalid_body" }, { status: 400 }), id);
  }

  try {
    const result = await submitDailyScoreFromParsedBody(body, { reqId: id });
    if (!result.ok) {
      return withRequestId(NextResponse.json({ error: result.error }, { status: result.status }), id);
    }
    return withRequestId(
      NextResponse.json({ ok: true, rank: result.rank, updated: result.updated }),
      id
    );
  } catch (e) {
    console.error({ reqId: id, err: e });
    return withRequestId(NextResponse.json({ error: "server_error" }, { status: 500 }), id);
  }
}
