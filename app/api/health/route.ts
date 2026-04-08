import { type NextRequest, NextResponse } from "next/server";
import { getOrCreateRequestId, withRequestId } from "@/lib/request-id";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const id = getOrCreateRequestId(request);
  return withRequestId(NextResponse.json({ ok: true }), id);
}
