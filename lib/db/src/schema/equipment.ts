import { pgTable, serial, text, integer, jsonb, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { equipmentCategoriesTable } from "./equipment_categories";

export const equipmentTable = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category_id: integer("category_id").references(() => equipmentCategoriesTable.id, { onDelete: "set null" }),
  specs: jsonb("specs").notNull().default([]),
  description: text("description"),
  default_brand: text("default_brand"),
  website_price: numeric("website_price", { precision: 14, scale: 2 }),
  product_link: text("product_link"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertEquipmentSchema = createInsertSchema(equipmentTable).omit({ id: true, created_at: true });
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type Equipment = typeof equipmentTable.$inferSelect;
