import { rateLimit } from "express-rate-limit";
import type { Request } from "express";
import { classifyUserAgent } from "../lib/botDetection";

// Protects the JSON API (link CRUD, analytics) from abuse. Generous enough
// for normal dashboard usage.
export const apiRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Protects the public redirect endpoints. Legitimate crawlers (Facebook,
// search engines, social preview bots) are never throttled, since blocking
// them would break link previews. Unknown/suspicious traffic gets a tighter
// budget to blunt scraping and click-fraud attempts.
export const redirectRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    const classification = classifyUserAgent(req.headers["user-agent"]);
    return (
      classification === "facebook_meta_crawler" ||
      classification === "social_preview_bot" ||
      classification === "search_engine_bot"
    );
  },
});
