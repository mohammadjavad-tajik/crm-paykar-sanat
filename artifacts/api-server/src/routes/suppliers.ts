import { Router } from "express";
import { db } from "@workspace/db";
import { suppliersTable } from "@workspace/db";
import { eq, like, desc } from "drizzle-orm";

const router = Router();

router.get("/suppliers", async (req, res) => {
  const search = req.query.search as string | undefined;
  const rows = await db
    .select()
    .from(suppliersTable)
    .where(search ? like(suppliersTable.name, `%${search}%`) : undefined)
    .orderBy(desc(suppliersTable.created_at));
  res.json(rows);
});

router.post("/suppliers", async (req, res) => {
  const { name, contact_person, phone, address, description } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await db.insert(suppliersTable).values({ name, contact_person, phone, address, description }).returning();
  res.status(201).json(row);
});

router.get("/suppliers/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.patch("/suppliers/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, contact_person, phone, address, description } = req.body;
  const [row] = await db.update(suppliersTable).set({ name, contact_person, phone, address, description }).where(eq(suppliersTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/suppliers/:id", async (req, res) => {
  await db.delete(suppliersTable).where(eq(suppliersTable.id, Number(req.params.id)));
  res.status(204).send();
});

export default router;
