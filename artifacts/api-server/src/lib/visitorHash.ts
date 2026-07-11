import { createHmac } from "node:crypto";

// Computes a stable but non-reversible visitor identifier for a given
// request, used only to count unique visitors. Raw IP addresses are never
// persisted — this hash is derived from the IP + User-Agent + a server
// secret, and only the hash is stored in the database.
export function computeVisitorHash(ip: string, userAgent: string): string {
  const secret = process.env.SESSION_SECRET ?? "dev-fallback-secret";
  return createHmac("sha256", secret)
    .update(`${ip}::${userAgent}`)
    .digest("hex");
}

// Best-effort extraction of the client IP, respecting the standard proxy
// header used by Replit's infrastructure. Only used transiently (for geo
// lookup and hashing) — never persisted.
export function getClientIp(req: {
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0]!.trim();
  }
  return req.socket?.remoteAddress ?? "0.0.0.0";
}
