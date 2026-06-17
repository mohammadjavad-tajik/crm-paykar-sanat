import { pgTable, serial, integer, text, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";
import { jobsTable } from "./jobs";

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  customer_id: integer("customer_id").notNull().references(() => customersTable.id, { onDelete: "cascade" }),
  job_id: integer("job_id").references(() => jobsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  date: text("date").notNull(),
  items: jsonb("items").notNull().default([]),
  notes: text("notes"),
  discount: numeric("discount", { precision: 14, scale: 2 }).notNull().default("0"),
  total_amount: numeric("total_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("unpaid"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true, created_at: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
