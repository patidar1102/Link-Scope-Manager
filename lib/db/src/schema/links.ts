import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const linksTable = pgTable(
  "links",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    shortCode: text("short_code").notNull().unique(),
    originalUrl: text("original_url").notNull(),
    title: text("title"),
    isEnabled: boolean("is_enabled").notNull().default(true),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    previewTitle: text("preview_title"),
    previewDescription: text("preview_description"),
    previewImageUrl: text("preview_image_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("links_user_id_idx").on(table.userId)],
);

export const insertLinkSchema = createInsertSchema(linksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLink = z.infer<typeof insertLinkSchema>;
export type Link = typeof linksTable.$inferSelect;
