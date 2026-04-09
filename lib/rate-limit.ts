import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { type NextRequest } from "next/server";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

/** Score submit: 30 / hour per IP (matches previous Express limit). */
const submitLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 h"),
      prefix: "four:scores",
    })
  : null;

/** Daily puzzle submit: separate bucket so arcade + daily both usable. */
const dailySubmitLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 h"),
      prefix: "four:daily_scores",
    })
  : null;

/** Start games: 60 / minute per IP (matches previous Express limit). */
const gamesLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      prefix: "four:games",
    })
  : null;

export function clientKey(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    return fwd.split(",")[0]!.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** When Upstash env is unset, allows all traffic (local dev). Production should set Redis. */
export async function rateLimitScores(request: NextRequest): Promise<{ ok: true } | { ok: false }> {
  if (!submitLimit) return { ok: true };
  const { success } = await submitLimit.limit(clientKey(request));
  return success ? { ok: true } : { ok: false };
}

export async function rateLimitGames(request: NextRequest): Promise<{ ok: true } | { ok: false }> {
  if (!gamesLimit) return { ok: true };
  const { success } = await gamesLimit.limit(clientKey(request));
  return success ? { ok: true } : { ok: false };
}

export async function rateLimitDailyScores(request: NextRequest): Promise<{ ok: true } | { ok: false }> {
  if (!dailySubmitLimit) return { ok: true };
  const { success } = await dailySubmitLimit.limit(clientKey(request));
  return success ? { ok: true } : { ok: false };
}
