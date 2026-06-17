import { Router } from "express";
import { db } from "@workspace/db";
import { customersTable, jobsTable, invoicesTable, settingsTable } from "@workspace/db";

const router = Router();

router.get("/backup/export", async (req, res) => {
  const customers = await db.select().from(customersTable);
  const jobs = await db.select().from(jobsTable);
  const invoices = await db.select().from(invoicesTable);
  const [settings] = await db.select().from(settingsTable).limit(1);

  res.json({
    customers: customers.map((c) => ({ ...c, initial_balance: Number(c.initial_balance) })),
    jobs,
    invoices: invoices.map((i) => ({ ...i, discount: Number(i.discount), total_amount: Number(i.total_amount) })),
    settings: settings ?? {},
  });
});

type BackupCustomer = {
  name: string;
  phone: string;
  address?: string | null;
  description?: string | null;
  initial_balance?: number | null;
};

type BackupInvoice = {
  customer_id: number;
  job_id?: number | null;
  title: string;
  date: string;
  items: unknown;
  notes?: string | null;
  discount?: number | null;
  total_amount?: number | null;
  status?: string | null;
};

type BackupJob = {
  customer_id: number;
  description: string;
  status?: string | null;
  completed_at?: Date | string | null;
};

router.post("/backup/import", async (req, res) => {
  const body = req.body as {
    customers?: unknown[];
    jobs?: unknown[];
    invoices?: unknown[];
    settings?: Record<string, unknown>;
  };

  if (!body || typeof body !== "object") {
    res.status(400).json({ error: "Invalid backup format" });
    return;
  }

  try {
    await db.delete(invoicesTable);
    await db.delete(jobsTable);
    await db.delete(customersTable);
    await db.delete(settingsTable);

    const customers = (body.customers ?? []) as BackupCustomer[];
    const jobs = (body.jobs ?? []) as BackupJob[];
    const invoices = (body.invoices ?? []) as BackupInvoice[];
    const settings = body.settings ?? {};

    if (customers.length > 0) {
      await db.insert(customersTable).values(
        customers.map(({ initial_balance, ...rest }) => ({
          ...rest,
          initial_balance: String(initial_balance ?? 0),
        }))
      );
    }

    if (jobs.length > 0) {
      await db.insert(jobsTable).values(
        jobs.map(({ customer_id, description, status, completed_at }) => ({
          customer_id,
          description,
          status: status ?? "pending",
          completed_at: completed_at ? new Date(completed_at as string) : null,
        }))
      );
    }

    if (invoices.length > 0) {
      await db.insert(invoicesTable).values(
        invoices.map(({ discount, total_amount, ...rest }) => ({
          ...rest,
          job_id: rest.job_id ?? null,
          items: rest.items ?? [],
          discount: String(discount ?? 0),
          total_amount: String(total_amount ?? 0),
          status: rest.status ?? "unpaid",
        }))
      );
    }

    const { id: _id, ...settingsRest } = settings;
    if (Object.keys(settingsRest).length > 0) {
      await db.insert(settingsTable).values({
        business_name: settingsRest.business_name as string | null,
        owner_name: settingsRest.owner_name as string | null,
        phone: settingsRest.phone as string | null,
        logo_url: settingsRest.logo_url as string | null,
        pin_hash: settingsRest.pin_hash as string | null,
        auto_lock_minutes: Number(settingsRest.auto_lock_minutes ?? 15),
      });
    }

    res.json({ success: true, message: "بکاپ با موفقیت بازگردانی شد" });
  } catch (e) {
    req.log.error(e, "Backup import failed");
    res.status(500).json({ success: false, message: "خطا در بازگردانی بکاپ" });
  }
});

export default router;
