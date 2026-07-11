import { Router, type IRouter } from "express";
import { and, count, countDistinct, eq, gte, lte, sql, desc } from "drizzle-orm";
import { db, linksTable, clickEventsTable, botEventsTable } from "@workspace/db";
import {
  GetAnalyticsOverviewQueryParams,
  GetAnalyticsTrendQueryParams,
  GetAnalyticsBreakdownsQueryParams,
  GetTopLinksQueryParams,
  GetRecentHumanActivityQueryParams,
  GetRecentBotActivityQueryParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { BOT_LABELS, type BotClassification } from "../lib/botDetection";

const router: IRouter = Router();
router.use(requireAuth);

interface Filters {
  from?: Date;
  to?: Date;
  linkId?: number;
  country?: string;
}

function parseFilters(query: Record<string, unknown>): Filters {
  const filters: Filters = {};
  if (typeof query.from === "string") filters.from = new Date(query.from);
  if (typeof query.to === "string") filters.to = new Date(query.to);
  if (query.linkId !== undefined) filters.linkId = Number(query.linkId);
  if (typeof query.country === "string") filters.country = query.country;
  return filters;
}

async function userLinkIds(userId: string, linkId?: number): Promise<number[]> {
  const rows = await db
    .select({ id: linksTable.id })
    .from(linksTable)
    .where(
      linkId !== undefined
        ? and(eq(linksTable.userId, userId), eq(linksTable.id, linkId))
        : eq(linksTable.userId, userId),
    );
  return rows.map((r) => r.id);
}

function clickWhere(linkIds: number[], filters: Filters) {
  const conditions = [sql`${clickEventsTable.linkId} in ${linkIds}`];
  if (filters.from) conditions.push(gte(clickEventsTable.createdAt, filters.from));
  if (filters.to) conditions.push(lte(clickEventsTable.createdAt, filters.to));
  if (filters.country) conditions.push(eq(clickEventsTable.country, filters.country));
  return and(...conditions);
}

function botWhere(linkIds: number[], filters: Filters) {
  const conditions = [sql`${botEventsTable.linkId} in ${linkIds}`];
  if (filters.from) conditions.push(gte(botEventsTable.createdAt, filters.from));
  if (filters.to) conditions.push(lte(botEventsTable.createdAt, filters.to));
  if (filters.country) conditions.push(eq(botEventsTable.country, filters.country));
  return and(...conditions);
}

// GET /analytics/overview
router.get("/analytics/overview", async (req, res) => {
  const userId = (req as unknown as AuthedRequest).userId;
  const parsed = GetAnalyticsOverviewQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const filters = parseFilters(req.query as Record<string, unknown>);
  const linkIds = await userLinkIds(userId, filters.linkId);

  if (linkIds.length === 0) {
    res.json({
      totalLinks: 0,
      humanClicks: 0,
      uniqueVisitors: 0,
      botRequests: 0,
      facebookRequests: 0,
      totalRequests: 0,
    });
    return;
  }

  const [clickAgg] = await db
    .select({
      humanClicks: count(),
      uniqueVisitors: countDistinct(clickEventsTable.visitorHash),
    })
    .from(clickEventsTable)
    .where(clickWhere(linkIds, filters));

  const [botAgg] = await db
    .select({ botRequests: count() })
    .from(botEventsTable)
    .where(botWhere(linkIds, filters));

  const [fbAgg] = await db
    .select({ facebookRequests: count() })
    .from(botEventsTable)
    .where(
      and(botWhere(linkIds, filters), eq(botEventsTable.botType, "facebook_meta_crawler")),
    );

  const totalLinksRows = filters.linkId !== undefined ? linkIds.length : linkIds.length;

  res.json({
    totalLinks: totalLinksRows,
    humanClicks: clickAgg?.humanClicks ?? 0,
    uniqueVisitors: clickAgg?.uniqueVisitors ?? 0,
    botRequests: botAgg?.botRequests ?? 0,
    facebookRequests: fbAgg?.facebookRequests ?? 0,
    totalRequests: (clickAgg?.humanClicks ?? 0) + (botAgg?.botRequests ?? 0),
  });
});

function bucketExpr(column: any, granularity: string) {
  const trunc =
    granularity === "hourly"
      ? "hour"
      : granularity === "weekly"
        ? "week"
        : granularity === "monthly"
          ? "month"
          : "day";
  return sql<string>`date_trunc(${trunc}, ${column})`;
}

// GET /analytics/trend
router.get("/analytics/trend", async (req, res) => {
  const userId = (req as unknown as AuthedRequest).userId;
  const parsed = GetAnalyticsTrendQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const filters = parseFilters(req.query as Record<string, unknown>);
  const granularity = parsed.data.granularity ?? "daily";
  const linkIds = await userLinkIds(userId, filters.linkId);

  if (linkIds.length === 0) {
    res.json([]);
    return;
  }

  const clickRows = await db
    .select({
      bucket: bucketExpr(clickEventsTable.createdAt, granularity),
      humanClicks: count(),
    })
    .from(clickEventsTable)
    .where(clickWhere(linkIds, filters))
    .groupBy(bucketExpr(clickEventsTable.createdAt, granularity));

  const botRows = await db
    .select({
      bucket: bucketExpr(botEventsTable.createdAt, granularity),
      botRequests: count(),
    })
    .from(botEventsTable)
    .where(botWhere(linkIds, filters))
    .groupBy(bucketExpr(botEventsTable.createdAt, granularity));

  const merged = new Map<string, { humanClicks: number; botRequests: number }>();
  for (const row of clickRows) {
    merged.set(new Date(row.bucket).toISOString(), {
      humanClicks: row.humanClicks,
      botRequests: 0,
    });
  }
  for (const row of botRows) {
    const key = new Date(row.bucket).toISOString();
    const existing = merged.get(key);
    if (existing) existing.botRequests = row.botRequests;
    else merged.set(key, { humanClicks: 0, botRequests: row.botRequests });
  }

  const result = Array.from(merged.entries())
    .map(([bucket, v]) => ({ bucket, ...v }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket));

  res.json(result);
});

function toBreakdown(rows: { label: string | null; value: number }[]) {
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  return rows
    .filter((r) => r.label !== null)
    .map((r) => ({
      label: r.label as string,
      count: r.value,
      percentage: total > 0 ? Math.round((r.value / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

// GET /analytics/breakdowns
router.get("/analytics/breakdowns", async (req, res) => {
  const userId = (req as unknown as AuthedRequest).userId;
  const parsed = GetAnalyticsBreakdownsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const filters = parseFilters(req.query as Record<string, unknown>);
  const linkIds = await userLinkIds(userId, filters.linkId);

  const empty = {
    country: [],
    city: [],
    device: [],
    browser: [],
    os: [],
    referrer: [],
    trafficSource: [],
    botClassification: [],
  };
  if (linkIds.length === 0) {
    res.json(empty);
    return;
  }

  async function groupClicks(column: any) {
    const rows = await db
      .select({ label: column, value: count() })
      .from(clickEventsTable)
      .where(clickWhere(linkIds, filters))
      .groupBy(column);
    return toBreakdown(rows);
  }

  const [country, city, device, browser, os, referrer, trafficSource, botRows] =
    await Promise.all([
      groupClicks(clickEventsTable.country),
      groupClicks(clickEventsTable.city),
      groupClicks(clickEventsTable.device),
      groupClicks(clickEventsTable.browser),
      groupClicks(clickEventsTable.os),
      groupClicks(clickEventsTable.referrer),
      groupClicks(clickEventsTable.trafficSource),
      db
        .select({ label: botEventsTable.botType, value: count() })
        .from(botEventsTable)
        .where(botWhere(linkIds, filters))
        .groupBy(botEventsTable.botType),
    ]);

  const botClassification = toBreakdown(
    botRows.map((r) => ({
      label: BOT_LABELS[r.label as BotClassification] ?? r.label,
      value: r.value,
    })),
  );

  res.json({ country, city, device, browser, os, referrer, trafficSource, botClassification });
});

// GET /analytics/top-links
router.get("/analytics/top-links", async (req, res) => {
  const userId = (req as unknown as AuthedRequest).userId;
  const parsed = GetTopLinksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const filters = parseFilters(req.query as Record<string, unknown>);
  const linkIds = await userLinkIds(userId);
  if (linkIds.length === 0) {
    res.json([]);
    return;
  }

  const conditions = [sql`${clickEventsTable.linkId} in ${linkIds}`];
  if (filters.from) conditions.push(gte(clickEventsTable.createdAt, filters.from));
  if (filters.to) conditions.push(lte(clickEventsTable.createdAt, filters.to));

  const rows = await db
    .select({
      id: linksTable.id,
      shortCode: linksTable.shortCode,
      title: linksTable.title,
      originalUrl: linksTable.originalUrl,
      humanClicks: count(clickEventsTable.id),
      uniqueVisitors: countDistinct(clickEventsTable.visitorHash),
    })
    .from(linksTable)
    .innerJoin(clickEventsTable, eq(clickEventsTable.linkId, linksTable.id))
    .where(and(eq(linksTable.userId, userId), ...conditions))
    .groupBy(linksTable.id)
    .orderBy(desc(count(clickEventsTable.id)))
    .limit(10);

  res.json(
    rows.map((r) => ({
      id: r.id,
      shortCode: r.shortCode,
      shortUrl: `${req.protocol}://${req.get("host")}/s/${r.shortCode}`,
      title: r.title,
      originalUrl: r.originalUrl,
      humanClicks: r.humanClicks,
      uniqueVisitors: r.uniqueVisitors,
    })),
  );
});

// GET /analytics/recent-activity (human)
router.get("/analytics/recent-activity", async (req, res) => {
  const userId = (req as unknown as AuthedRequest).userId;
  const parsed = GetRecentHumanActivityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const linkIds = await userLinkIds(userId, parsed.data.linkId);
  if (linkIds.length === 0) {
    res.json([]);
    return;
  }

  const rows = await db
    .select({
      id: clickEventsTable.id,
      linkId: clickEventsTable.linkId,
      shortCode: linksTable.shortCode,
      linkTitle: linksTable.title,
      country: clickEventsTable.country,
      city: clickEventsTable.city,
      deviceType: clickEventsTable.device,
      browser: clickEventsTable.browser,
      os: clickEventsTable.os,
      referrer: clickEventsTable.referrer,
      trafficSource: clickEventsTable.trafficSource,
      clickedAt: clickEventsTable.createdAt,
    })
    .from(clickEventsTable)
    .innerJoin(linksTable, eq(linksTable.id, clickEventsTable.linkId))
    .where(sql`${clickEventsTable.linkId} in ${linkIds}`)
    .orderBy(desc(clickEventsTable.createdAt))
    .limit(50);

  res.json(rows);
});

// GET /analytics/recent-bot-activity
router.get("/analytics/recent-bot-activity", async (req, res) => {
  const userId = (req as unknown as AuthedRequest).userId;
  const parsed = GetRecentBotActivityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const linkIds = await userLinkIds(userId, parsed.data.linkId);
  if (linkIds.length === 0) {
    res.json([]);
    return;
  }

  const rows = await db
    .select({
      id: botEventsTable.id,
      linkId: botEventsTable.linkId,
      shortCode: linksTable.shortCode,
      linkTitle: linksTable.title,
      classification: botEventsTable.botType,
      userAgent: botEventsTable.userAgent,
      requestedAt: botEventsTable.createdAt,
    })
    .from(botEventsTable)
    .innerJoin(linksTable, eq(linksTable.id, botEventsTable.linkId))
    .where(sql`${botEventsTable.linkId} in ${linkIds}`)
    .orderBy(desc(botEventsTable.createdAt))
    .limit(50);

  res.json(
    rows.map((r) => ({
      ...r,
      classification: BOT_LABELS[r.classification as BotClassification] ?? r.classification,
    })),
  );
});

export default router;
