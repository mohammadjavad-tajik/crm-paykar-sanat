import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const equipmentCategoriesTable = pgTable("equipment_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  parent_id: integer("parent_id"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertEquipmentCategorySchema = createInsertSchema(equipmentCategoriesTable).omit({ id: true, created_at: true });
export type InsertEquipmentCategory = z.infer<typeof insertEquipmentCategorySchema>;
export type EquipmentCategory = typeof equipmentCategoriesTable.$inferSelect;
