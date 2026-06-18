import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { equipmentTable } from "./equipment";

export const panelsTable = pgTable("panels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const panelItemsTable = pgTable("panel_items", {
  id: serial("id").primaryKey(),
  panel_id: integer("panel_id").notNull().references(() => panelsTable.id, { onDelete: "cascade" }),
  equipment_id: integer("equipment_id").notNull().references(() => equipmentTable.id, { onDelete: "cascade" }),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
});

export const insertPanelSchema = createInsertSchema(panelsTable).omit({ id: true, created_at: true });
export const insertPanelItemSchema = createInsertSchema(panelItemsTable).omit({ id: true });
export type InsertPanel = z.infer<typeof insertPanelSchema>;
export type InsertPanelItem = z.infer<typeof insertPanelItemSchema>;
export type Panel = typeof panelsTable.$inferSelect;
export type PanelItem = typeof panelItemsTable.$inferSelect;
