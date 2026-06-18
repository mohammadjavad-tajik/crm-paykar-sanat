import { Router } from "express";
import { db } from "@workspace/db";
import { customersTable, jobsTable, invoicesTable } from "@workspace/db";
import { eq, sql, desc, gte, and } from "drizzle-orm";

const router = Router();

router.get("/dashboard/stats", async (req, res) => {
  const [{ total_customers }] = await db
    .select({ total_customers: sql<number>`count(*)::int` })
    .from(customersTable);

  const [{ total_pending_jobs }] = await db
    .select({ total_pending_jobs: sql<number>`count(*)::int` })
    .from(jobsTable)
    .where(eq(jobsTable.status, "pending"));

  const unpaidInvoices = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.status, "unpaid"));

  const total_unpaid_invoices = unpaidInvoices.length;
  const total_unpaid_amount = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const monthlyInvoices = await db
    .select()
    .from(invoicesTable)
    .where(gte(invoicesTable.created_at, new Date(firstOfMonth)));

  const monthly_invoice_count = monthlyInvoices.length;
  const monthly_sales_amount = monthlyInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  const recentJobsRaw = await db
    .select({ job: jobsTable, customer_name: customersTable.name, customer_phone: customersTable.phone })
    .from(jobsTable)
    .leftJoin(customersTable, eq(jobsTable.customer_id, customersTable.id))
    .where(eq(jobsTable.status, "pending"))
    .orderBy(desc(jobsTable.created_at))
    .limit(5);

  const recent_jobs = recentJobsRaw.map((r) => ({
    ...r.job,
    customer_name: r.customer_name ?? null,
    customer_phone: r.customer_phone ?? null,
  }));

  res.json({
    total_customers,
    total_pending_jobs,
    total_unpaid_invoices,
    total_unpaid_amount,
    recent_jobs,
    monthly_invoice_count,
    monthly_sales_amount,
  });
});

export default router;
