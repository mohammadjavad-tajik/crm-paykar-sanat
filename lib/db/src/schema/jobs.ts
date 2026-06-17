import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";

export const jobStatusEnum = ["pending", "completed"] as const;

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  customer_id: integer("customer_id").notNull().references(() => customersTable.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"),
  scheduled_date: text("scheduled_date"),
  scheduled_time: text("scheduled_time"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  completed_at: timestamp("completed_at"),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, created_at: true, completed_at: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
