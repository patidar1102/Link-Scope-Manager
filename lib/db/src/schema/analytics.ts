import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { linksTable } from "./links";

// A single confirmed-human click, used to power the human analytics dashboard.
// No raw IP is ever stored here — only a salted hash for uniqueness counting.
export const clickEventsTable = pgTable(
  "click_events",
  {
    id: serial("id").primaryKey(),
    linkId: integer("link_id")
      .notNull()
      .references(() => linksTable.id, { onDelete: "cascade" }),
    visitorHash: text("visitor_hash").notNull(),
    country: text("country"),
    city: text("city"),
    device: text("device").notNull(),
    browser: text("browser").notNull(),
    os: text("os").notNull(),
    referrer: text("referrer"),
    trafficSource: text("traffic_source").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("click_events_link_id_idx").on(table.linkId),
    index("click_events_created_at_idx").on(table.createdAt),
    // Overview/trend queries always filter by linkId IN (...) AND createdAt
    // BETWEEN ... — a composite index lets Postgres satisfy both without a
    // full scan + filter.
    index("click_events_link_id_created_at_idx").on(table.linkId, table.createdAt),
    // countDistinct(visitorHash) is used for "unique visitors" on every
    // overview/top-links request.
    index("click_events_visitor_hash_idx").on(table.visitorHash),
  ],
);

// Every request classified as a bot/crawler, kept separate from human analytics
// so bot traffic never pollutes human metrics.
export const botEventsTable = pgTable(
  "bot_events",
  {
    id: serial("id").primaryKey(),
    linkId: integer("link_id")
      .notNull()
      .references(() => linksTable.id, { onDelete: "cascade" }),
    botType: text("bot_type").notNull(),
    userAgent: text("user_agent"),
    country: text("country"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("bot_events_link_id_idx").on(table.linkId),
    index("bot_events_created_at_idx").on(table.createdAt),
    index("bot_events_link_id_created_at_idx").on(table.linkId, table.createdAt),
  ],
);

export type ClickEvent = typeof clickEventsTable.$inferSelect;
export type BotEvent = typeof botEventsTable.$inferSelect;
