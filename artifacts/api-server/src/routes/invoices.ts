import { Router } from "express";
import { db } from "@workspace/db";
import { invoicesTable, customersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  ListInvoicesQueryParams,
  CreateInvoiceBody,
  GetInvoiceParams,
  UpdateInvoiceParams,
  UpdateInvoiceBody,
  DeleteInvoiceParams,
  PayInvoiceParams,
} from "@workspace/api-zod";

const router = Router();

const formatInvoice = (inv: typeof invoicesTable.$inferSelect, customerName?: string | null) => ({
  ...inv,
  customer_name: customerName ?? null,
  discount: Number(inv.discount),
  total_amount: Number(inv.total_amount),
});

const calcTotal = (items: Array<{ quantity: number; unit_price: number }>, discount: number) => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  return Math.max(0, subtotal - discount);
};

router.get("/invoices", async (req, res) => {
  const parsed = ListInvoicesQueryParams.safeParse({
    status: req.query.status,
    customer_id: req.query.customer_id ? Number(req.query.customer_id) : undefined,
  });

  const conditions = [];
  if (parsed.success && parsed.data.status) {
    conditions.push(eq(invoicesTable.status, parsed.data.status));
  }
  if (parsed.success && parsed.data.customer_id) {
    conditions.push(eq(invoicesTable.customer_id, parsed.data.customer_id));
  }

  const query = db
    .select({ invoice: invoicesTable, customer_name: customersTable.name })
    .from(invoicesTable)
    .leftJoin(customersTable, eq(invoicesTable.customer_id, customersTable.id));

  const rows = await (conditions.length > 0
    ? query.where(and(...conditions)).orderBy(desc(invoicesTable.created_at))
    : query.orderBy(desc(invoicesTable.created_at)));

  res.json(rows.map((r) => formatInvoice(r.invoice, r.customer_name)));
});

router.post("/invoices", async (req, res) => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { items, discount, ...rest } = parsed.data;
  const disc = discount ?? 0;
  const total = calcTotal(items as Array<{ quantity: number; unit_price: number }>, disc);

  const [inv] = await db
    .insert(invoicesTable)
    .values({
      ...rest,
      job_id: rest.job_id ?? null,
      items,
      discount: String(disc),
      total_amount: String(total),
      status: rest.status ?? "unpaid",
    })
    .returning();

  const [customer] = await db.select({ name: customersTable.name }).from(customersTable).where(eq(customersTable.id, inv.customer_id));
  res.status(201).json(formatInvoice(inv, customer?.name));
});

router.get("/invoices/:id", async (req, res) => {
  const parsed = GetInvoiceParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select({ invoice: invoicesTable, customer_name: customersTable.name })
    .from(invoicesTable)
    .leftJoin(customersTable, eq(invoicesTable.customer_id, customersTable.id))
    .where(eq(invoicesTable.id, parsed.data.id));

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatInvoice(row.invoice, row.customer_name));
});

router.patch("/invoices/:id", async (req, res) => {
  const paramsParsed = UpdateInvoiceParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = UpdateInvoiceBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { items, discount, ...rest } = bodyParsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (items !== undefined && discount !== undefined) {
    const disc = discount ?? 0;
    updateData.items = items;
    updateData.discount = String(disc);
    updateData.total_amount = String(calcTotal(items as Array<{ quantity: number; unit_price: number }>, disc));
  } else if (items !== undefined) {
    updateData.items = items;
  } else if (discount !== undefined) {
    updateData.discount = String(discount);
  }

  const [inv] = await db
    .update(invoicesTable)
    .set(updateData)
    .where(eq(invoicesTable.id, paramsParsed.data.id))
    .returning();

  if (!inv) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [customer] = await db.select({ name: customersTable.name }).from(customersTable).where(eq(customersTable.id, inv.customer_id));
  res.json(formatInvoice(inv, customer?.name));
});

router.delete("/invoices/:id", async (req, res) => {
  const parsed = DeleteInvoiceParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(invoicesTable).where(eq(invoicesTable.id, parsed.data.id));
  res.status(204).send();
});

router.patch("/invoices/:id/pay", async (req, res) => {
  const parsed = PayInvoiceParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [inv] = await db
    .update(invoicesTable)
    .set({ status: "paid" })
    .where(eq(invoicesTable.id, parsed.data.id))
    .returning();

  if (!inv) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [customer] = await db.select({ name: customersTable.name }).from(customersTable).where(eq(customersTable.id, inv.customer_id));
  res.json(formatInvoice(inv, customer?.name));
});

router.post("/invoices/:id/copy", async (req, res) => {
  const id = Number(req.params.id);
  const [source] = await db
    .select({ invoice: invoicesTable, customer_name: customersTable.name })
    .from(invoicesTable)
    .leftJoin(customersTable, eq(invoicesTable.customer_id, customersTable.id))
    .where(eq(invoicesTable.id, id));

  if (!source) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const [newInv] = await db.insert(invoicesTable).values({
    customer_id: source.invoice.customer_id,
    job_id: source.invoice.job_id,
    title: source.invoice.title,
    date: today,
    items: source.invoice.items,
    notes: source.invoice.notes,
    discount: source.invoice.discount,
    total_amount: source.invoice.total_amount,
    status: "unpaid",
  }).returning();

  res.status(201).json(formatInvoice(newInv, source.customer_name));
});

export default router;
