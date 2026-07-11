import { Router, type IRouter } from "express";
import { eq, and, count, countDistinct, sql } from "drizzle-orm";
import { db, linksTable, clickEventsTable, botEventsTable } from "@workspace/db";
import {
  CreateLinkBody,
  UpdateLinkBody,
  UpdateLinkParams,
  GetLinkParams,
  DeleteLinkParams,
  GetLinkQrCodeParams,
} from "@workspace/api-zod";
import QRCode from "qrcode";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { generateShortCode, isValidCustomAlias, isValidHttpUrl } from "../lib/shortCode";
import { logger } from "../lib/logger";

const router: IRouter = Router();
router.use(requireAuth);

function publicOrigin(req: { protocol: string; get: (h: string) => string | undefined }): string {
  const forwardedProto = undefined; // trust express's req.protocol (respects x-forwarded-proto when trust proxy is set)
  const host = req.get("host");
  return `${req.protocol}://${host}`;
}

function serializeLink(
  link: typeof linksTable.$inferSelect,
  origin: string,
  stats: { humanClicks: number; uniqueVisitors: number; botRequests: number },
) {
  return {
    id: link.id,
    shortCode: link.shortCode,
    shortUrl: `${origin}/s/${link.shortCode}`,
    legacyUrl: `${origin}/r/${link.shortCode}`,
    originalUrl: link.originalUrl,
    title: link.title,
    isEnabled: link.isEnabled,
    expiresAt: link.expiresAt,
    previewTitle: link.previewTitle,
    previewDescription: link.previewDescription,
    previewImageUrl: link.previewImageUrl,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
    stats: {
      humanClicks: stats.humanClicks,
      uniqueVisitors: stats.uniqueVisitors,
      botRequests: stats.botRequests,
      totalRequests: stats.humanClicks + stats.botRequests,
    },
  };
}

async function getStatsForLinks(linkIds: number[]) {
  const statsMap = new Map<
    number,
    { humanClicks: number; uniqueVisitors: number; botRequests: number }
  >();
  for (const id of linkIds) {
    statsMap.set(id, { humanClicks: 0, uniqueVisitors: 0, botRequests: 0 });
  }
  if (linkIds.length === 0) return statsMap;

  const clickRows = await db
    .select({
      linkId: clickEventsTable.linkId,
      humanClicks: count(),
      uniqueVisitors: countDistinct(clickEventsTable.visitorHash),
    })
    .from(clickEventsTable)
    .where(sql`${clickEventsTable.linkId} in ${linkIds}`)
    .groupBy(clickEventsTable.linkId);

  for (const row of clickRows) {
    const entry = statsMap.get(row.linkId);
    if (entry) {
      entry.humanClicks = row.humanClicks;
      entry.uniqueVisitors = row.uniqueVisitors;
    }
  }

  const botRows = await db
    .select({ linkId: botEventsTable.linkId, botRequests: count() })
    .from(botEventsTable)
    .where(sql`${botEventsTable.linkId} in ${linkIds}`)
    .groupBy(botEventsTable.linkId);

  for (const row of botRows) {
    const entry = statsMap.get(row.linkId);
    if (entry) entry.botRequests = row.botRequests;
  }

  return statsMap;
}

// GET /links — list the current user's links with stats
router.get("/links", async (req, res) => {
  const userId = (req as unknown as AuthedRequest).userId;
  const rows = await db
    .select()
    .from(linksTable)
    .where(eq(linksTable.userId, userId))
    .orderBy(sql`${linksTable.createdAt} desc`);

  const stats = await getStatsForLinks(rows.map((r) => r.id));
  const origin = publicOrigin(req);
  res.json(rows.map((row) => serializeLink(row, origin, stats.get(row.id)!)));
});

// POST /links — create a new short link
router.post("/links", async (req, res) => {
  const userId = (req as unknown as AuthedRequest).userId;
  const parsed = CreateLinkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
    return;
  }
  const body = parsed.data;

  if (!isValidHttpUrl(body.originalUrl)) {
    res.status(400).json({ error: "originalUrl must be a valid http(s) URL" });
    return;
  }

  let shortCode: string;
  if (body.customAlias) {
    if (!isValidCustomAlias(body.customAlias)) {
      res.status(400).json({
        error: "customAlias must be 3-32 characters (letters, numbers, - or _)",
      });
      return;
    }
    const existing = await db
      .select({ id: linksTable.id })
      .from(linksTable)
      .where(eq(linksTable.shortCode, body.customAlias))
      .limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "That custom alias is already taken" });
      return;
    }
    shortCode = body.customAlias;
  } else {
    // Retry a handful of times on the astronomically unlikely collision.
    shortCode = generateShortCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await db
        .select({ id: linksTable.id })
        .from(linksTable)
        .where(eq(linksTable.shortCode, shortCode))
        .limit(1);
      if (existing.length === 0) break;
      shortCode = generateShortCode();
    }
  }

  const [created] = await db
    .insert(linksTable)
    .values({
      userId,
      shortCode,
      originalUrl: body.originalUrl,
      title: body.title ?? null,
      expiresAt: body.expiresAt ?? null,
      previewTitle: body.previewTitle ?? null,
      previewDescription: body.previewDescription ?? null,
      previewImageUrl: body.previewImageUrl ?? null,
    })
    .returning();

  logger.info({ linkId: created!.id, shortCode }, "Link created");
  res.status(201).json(
    serializeLink(created!, publicOrigin(req), {
      humanClicks: 0,
      uniqueVisitors: 0,
      botRequests: 0,
    }),
  );
});

async function findOwnedLink(userId: string, id: number) {
  const [link] = await db
    .select()
    .from(linksTable)
    .where(and(eq(linksTable.id, id), eq(linksTable.userId, userId)))
    .limit(1);
  return link;
}

// GET /links/:id
router.get("/links/:id", async (req, res) => {
  const userId = (req as unknown as AuthedRequest).userId;
  const params = GetLinkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid link id" });
    return;
  }
  const link = await findOwnedLink(userId, params.data.id);
  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }
  const stats = await getStatsForLinks([link.id]);
  res.json(serializeLink(link, publicOrigin(req), stats.get(link.id)!));
});

// PATCH /links/:id
router.patch("/links/:id", async (req, res) => {
  const userId = (req as unknown as AuthedRequest).userId;
  const params = UpdateLinkParams.safeParse(req.params);
  const body = UpdateLinkBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const existing = await findOwnedLink(userId, params.data.id);
  if (!existing) {
    res.status(404).json({ error: "Link not found" });
    return;
  }
  if (body.data.originalUrl !== undefined && !isValidHttpUrl(body.data.originalUrl)) {
    res.status(400).json({ error: "originalUrl must be a valid http(s) URL" });
    return;
  }

  const [updated] = await db
    .update(linksTable)
    .set({
      ...(body.data.originalUrl !== undefined && { originalUrl: body.data.originalUrl }),
      ...(body.data.title !== undefined && { title: body.data.title }),
      ...(body.data.isEnabled !== undefined && { isEnabled: body.data.isEnabled }),
      ...(body.data.expiresAt !== undefined && { expiresAt: body.data.expiresAt }),
      ...(body.data.previewTitle !== undefined && { previewTitle: body.data.previewTitle }),
      ...(body.data.previewDescription !== undefined && {
        previewDescription: body.data.previewDescription,
      }),
      ...(body.data.previewImageUrl !== undefined && {
        previewImageUrl: body.data.previewImageUrl,
      }),
    })
    .where(eq(linksTable.id, existing.id))
    .returning();

  const stats = await getStatsForLinks([updated!.id]);
  res.json(serializeLink(updated!, publicOrigin(req), stats.get(updated!.id)!));
});

// DELETE /links/:id
router.delete("/links/:id", async (req, res) => {
  const userId = (req as unknown as AuthedRequest).userId;
  const params = DeleteLinkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid link id" });
    return;
  }
  const existing = await findOwnedLink(userId, params.data.id);
  if (!existing) {
    res.status(404).json({ error: "Link not found" });
    return;
  }
  await db.delete(linksTable).where(eq(linksTable.id, existing.id));
  res.status(204).send();
});

// GET /links/:id/qrcode
router.get("/links/:id/qrcode", async (req, res) => {
  const userId = (req as unknown as AuthedRequest).userId;
  const params = GetLinkQrCodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid link id" });
    return;
  }
  const link = await findOwnedLink(userId, params.data.id);
  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }
  const shortUrl = `${publicOrigin(req)}/s/${link.shortCode}`;
  const dataUrl = await QRCode.toDataURL(shortUrl, {
    width: 512,
    margin: 2,
  });
  res.json({ dataUrl, shortUrl });
});

export default router;
