import { Router } from "express";
import { db } from "@workspace/db";
import { jobsTable, customersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  ListJobsQueryParams,
  CreateJobBody,
  GetJobParams,
  UpdateJobParams,
  UpdateJobBody,
  DeleteJobParams,
  CompleteJobParams,
} from "@workspace/api-zod";

const router = Router();

const formatJob = (job: typeof jobsTable.$inferSelect, customerName?: string | null) => ({
  ...job,
  customer_name: customerName ?? null,
});

router.get("/jobs", async (req, res) => {
  const parsed = ListJobsQueryParams.safeParse({
    status: req.query.status,
    customer_id: req.query.customer_id ? Number(req.query.customer_id) : undefined,
  });

  let query = db
    .select({ job: jobsTable, customer_name: customersTable.name })
    .from(jobsTable)
    .leftJoin(customersTable, eq(jobsTable.customer_id, customersTable.id));

  const conditions = [];
  if (parsed.success && parsed.data.status) {
    conditions.push(eq(jobsTable.status, parsed.data.status));
  }
  if (parsed.success && parsed.data.customer_id) {
    conditions.push(eq(jobsTable.customer_id, parsed.data.customer_id));
  }

  const rows = await (conditions.length > 0
    ? query.where(and(...conditions)).orderBy(desc(jobsTable.created_at))
    : query.orderBy(desc(jobsTable.created_at)));

  res.json(rows.map((r) => formatJob(r.job, r.customer_name)));
});

router.post("/jobs", async (req, res) => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [job] = await db.insert(jobsTable).values(parsed.data).returning();
  const [customer] = await db.select({ name: customersTable.name }).from(customersTable).where(eq(customersTable.id, job.customer_id));
  res.status(201).json(formatJob(job, customer?.name));
});

router.get("/jobs/:id", async (req, res) => {
  const parsed = GetJobParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select({ job: jobsTable, customer_name: customersTable.name })
    .from(jobsTable)
    .leftJoin(customersTable, eq(jobsTable.customer_id, customersTable.id))
    .where(eq(jobsTable.id, parsed.data.id));

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatJob(row.job, row.customer_name));
});

router.patch("/jobs/:id", async (req, res) => {
  const paramsParsed = UpdateJobParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = UpdateJobBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [job] = await db
    .update(jobsTable)
    .set(bodyParsed.data)
    .where(eq(jobsTable.id, paramsParsed.data.id))
    .returning();

  if (!job) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [customer] = await db.select({ name: customersTable.name }).from(customersTable).where(eq(customersTable.id, job.customer_id));
  res.json(formatJob(job, customer?.name));
});

router.delete("/jobs/:id", async (req, res) => {
  const parsed = DeleteJobParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(jobsTable).where(eq(jobsTable.id, parsed.data.id));
  res.status(204).send();
});

router.patch("/jobs/:id/complete", async (req, res) => {
  const parsed = CompleteJobParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [job] = await db
    .update(jobsTable)
    .set({ status: "completed", completed_at: new Date() })
    .where(eq(jobsTable.id, parsed.data.id))
    .returning();

  if (!job) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [customer] = await db.select({ name: customersTable.name }).from(customersTable).where(eq(customersTable.id, job.customer_id));
  res.json(formatJob(job, customer?.name));
});

export default router;
