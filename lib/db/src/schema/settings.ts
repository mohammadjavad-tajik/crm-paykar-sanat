import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  business_name: text("business_name"),
  owner_name: text("owner_name"),
  phone: text("phone"),
  logo_url: text("logo_url"),
  pin_hash: text("pin_hash"),
  auto_lock_minutes: integer("auto_lock_minutes").notNull().default(15),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
