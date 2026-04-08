import { type NextRequest, NextResponse } from "next/server";
import { getOrCreateRequestId, withRequestId } from "@/lib/request-id";
import { rateLimitScores } from "@/lib/rate-limit";
import { submitScoreFromParsedBody } from "@/lib/scores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const id = getOrCreateRequestId(request);
  const limited = await rateLimitScores(request);
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
    const result = await submitScoreFromParsedBody(body);
    if (!result.ok) {
      return withRequestId(NextResponse.json({ error: result.error }, { status: result.status }), id);
    }
    return withRequestId(
      NextResponse.json({ ok: true, updated: result.updated, totalScore: result.totalScore }),
      id
    );
  } catch (e) {
    console.error({ reqId: id, err: e });
    return withRequestId(NextResponse.json({ error: "server_error" }, { status: 500 }), id);
  }
}
