import { type NextRequest, NextResponse } from "next/server";

export function getOrCreateRequestId(request: NextRequest): string {
  return request.headers.get("x-request-id")?.trim() || crypto.randomUUID();
}

export function withRequestId(res: NextResponse, requestId: string): NextResponse {
  res.headers.set("X-Request-Id", requestId);
  return res;
}
