import { Router } from "express";
import { db } from "@workspace/db";
import { customersTable, invoicesTable, jobsTable } from "@workspace/db";
import { eq, like, sql, desc } from "drizzle-orm";
import {
  ListCustomersQueryParams,
  CreateCustomerBody,
  GetCustomerParams,
  UpdateCustomerParams,
  UpdateCustomerBody,
  DeleteCustomerParams,
  GetCustomerProfileParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/customers", async (req, res) => {
  const parsed = ListCustomersQueryParams.safeParse(req.query);
  const search = parsed.success ? parsed.data.search : undefined;

  const customers = await db
    .select()
    .from(customersTable)
    .where(search ? like(customersTable.name, `%${search}%`) : undefined)
    .orderBy(desc(customersTable.created_at));

  res.json(customers.map((c) => ({ ...c, initial_balance: Number(c.initial_balance) })));
});

router.post("/customers", async (req, res) => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { initial_balance, ...rest } = parsed.data;

  const [customer] = await db
    .insert(customersTable)
    .values({ ...rest, initial_balance: String(initial_balance ?? 0) })
    .returning();

  if (initial_balance && initial_balance > 0) {
    const today = new Date().toISOString().slice(0, 10);
    await db.insert(invoicesTable).values({
      customer_id: customer.id,
      title: "موجودی اولیه",
      date: today,
      items: [],
      discount: "0",
      total_amount: String(initial_balance),
      status: "unpaid",
    });
  }

  res.status(201).json({ ...customer, initial_balance: Number(customer.initial_balance) });
});

router.get("/customers/:id", async (req, res) => {
  const parsed = GetCustomerParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, parsed.data.id));

  if (!customer) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...customer, initial_balance: Number(customer.initial_balance) });
});

router.patch("/customers/:id", async (req, res) => {
  const paramsParsed = UpdateCustomerParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = UpdateCustomerBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { initial_balance, ...rest } = bodyParsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (initial_balance !== undefined) updateData.initial_balance = String(initial_balance);

  const [customer] = await db
    .update(customersTable)
    .set(updateData)
    .where(eq(customersTable.id, paramsParsed.data.id))
    .returning();

  if (!customer) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...customer, initial_balance: Number(customer.initial_balance) });
});

router.delete("/customers/:id", async (req, res) => {
  const parsed = DeleteCustomerParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(customersTable).where(eq(customersTable.id, parsed.data.id));
  res.status(204).send();
});

router.get("/customers/:id/profile", async (req, res) => {
  const parsed = GetCustomerProfileParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const id = parsed.data.id;

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, id));
  if (!customer) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const jobs = await db.select().from(jobsTable).where(eq(jobsTable.customer_id, id)).orderBy(desc(jobsTable.created_at));
  const invoices = await db.select().from(invoicesTable).where(eq(invoicesTable.customer_id, id)).orderBy(desc(invoicesTable.created_at));

  const total_debt = invoices
    .filter((inv) => inv.status === "unpaid")
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  res.json({
    customer: { ...customer, initial_balance: Number(customer.initial_balance) },
    jobs: jobs.map((j) => ({ ...j, customer_name: customer.name })),
    invoices: invoices.map((inv) => ({
      ...inv,
      customer_name: customer.name,
      discount: Number(inv.discount),
      total_amount: Number(inv.total_amount),
    })),
    total_debt,
  });
});

export default router;
