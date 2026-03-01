import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Profile submission limiter (stricter)
export const createProfileRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
});

// Report limiter (can be same or different)
export const reportRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
});

// Backward-compatible alias (optional)
// If other routes already use `ratelimit`, keep it:
export const ratelimit = createProfileRatelimit;