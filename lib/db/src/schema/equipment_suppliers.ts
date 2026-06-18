import { pgTable, serial, integer, text, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { equipmentTable } from "./equipment";
import { suppliersTable } from "./suppliers";

export const equipmentSuppliersTable = pgTable("equipment_suppliers", {
  id: serial("id").primaryKey(),
  equipment_id: integer("equipment_id").notNull().references(() => equipmentTable.id, { onDelete: "cascade" }),
  supplier_id: integer("supplier_id").notNull().references(() => suppliersTable.id, { onDelete: "cascade" }),
  brand: text("brand"),
  purchase_price: numeric("purchase_price", { precision: 14, scale: 2 }).notNull().default("0"),
  sell_price: numeric("sell_price", { precision: 14, scale: 2 }).notNull().default("0"),
  supplier_code: text("supplier_code"),
  is_default: boolean("is_default").notNull().default(false),
  notes: text("notes"),
});

export const insertEquipmentSupplierSchema = createInsertSchema(equipmentSuppliersTable).omit({ id: true });
export type InsertEquipmentSupplier = z.infer<typeof insertEquipmentSupplierSchema>;
export type EquipmentSupplier = typeof equipmentSuppliersTable.$inferSelect;
