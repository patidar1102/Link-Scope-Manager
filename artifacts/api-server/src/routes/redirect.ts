import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, linksTable, clickEventsTable, botEventsTable } from "@workspace/db";
import { classifyUserAgent, isBot } from "../lib/botDetection";
import {
  detectDevice,
  detectBrowser,
  detectOS,
  detectTrafficSource,
} from "../lib/requestParsers";
import { computeVisitorHash, getClientIp } from "../lib/visitorHash";
import { lookupGeo } from "../lib/geo";
import {
  disabledPage,
  expiredPage,
  notFoundPage,
  socialPreviewPage,
} from "../lib/errorPages";
import { redirectRateLimiter } from "../middlewares/rateLimit";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function handleShortLink(req: any, res: any) {
  const shortCode: string = req.params.shortCode;
  const [link] = await db
    .select()
    .from(linksTable)
    .where(eq(linksTable.shortCode, shortCode))
    .limit(1);

  if (!link) {
    res.status(404).set("Content-Type", "text/html").send(notFoundPage());
    return;
  }

  const userAgent = req.headers["user-agent"] as string | undefined;
  const classification = classifyUserAgent(userAgent);
  const shortUrl = `${req.protocol}://${req.get("host")}/s/${link.shortCode}`;

  if (isBot(classification)) {
    // Bots/crawlers always get a legitimate 200 response with full OG/Twitter
    // meta tags — never cloaked, never redirected, never counted as human.
    const ip = getClientIp(req);
    const { country } = lookupGeo(ip);
    await db.insert(botEventsTable).values({
      linkId: link.id,
      botType: classification,
      userAgent: userAgent ?? null,
      country,
    });

    res
      .status(200)
      .set("Content-Type", "text/html")
      .send(
        socialPreviewPage({
          title: link.previewTitle || link.title || link.originalUrl,
          description: link.previewDescription || `Shared via LinkScope`,
          imageUrl: link.previewImageUrl,
          destinationUrl: link.originalUrl,
          shortUrl,
        }),
      );
    return;
  }

  // Human traffic: validate the link before redirecting.
  if (!link.isEnabled) {
    res.status(410).set("Content-Type", "text/html").send(disabledPage());
    return;
  }
  if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) {
    res.status(410).set("Content-Type", "text/html").send(expiredPage());
    return;
  }

  const ip = getClientIp(req);
  const { country, city } = lookupGeo(ip);
  const referrer = (req.headers["referer"] as string | undefined) ?? null;

  try {
    await db.insert(clickEventsTable).values({
      linkId: link.id,
      visitorHash: computeVisitorHash(ip, userAgent ?? "unknown"),
      country,
      city,
      device: detectDevice(userAgent ?? ""),
      browser: detectBrowser(userAgent ?? ""),
      os: detectOS(userAgent ?? ""),
      referrer,
      trafficSource: detectTrafficSource(referrer),
      userAgent: userAgent ?? null,
    });
  } catch (err) {
    // Never block the redirect on analytics-write failure.
    logger.error({ err, linkId: link.id }, "Failed to record click event");
  }

  res.redirect(302, link.originalUrl);
}

router.get("/s/:shortCode", redirectRateLimiter, handleShortLink);
// Legacy path, kept for backward compatibility with previously shared links.
router.get("/r/:shortCode", redirectRateLimiter, handleShortLink);

export default router;
