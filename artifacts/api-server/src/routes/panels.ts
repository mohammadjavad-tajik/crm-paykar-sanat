import { Router } from "express";
import { db } from "@workspace/db";
import { panelsTable, panelItemsTable, equipmentTable } from "@workspace/db";
import { eq, like, desc } from "drizzle-orm";

const router = Router();

router.get("/panels", async (req, res) => {
  const search = req.query.search as string | undefined;
  const rows = await db
    .select()
    .from(panelsTable)
    .where(search ? like(panelsTable.name, `%${search}%`) : undefined)
    .orderBy(desc(panelsTable.created_at));
  res.json(rows);
});

router.post("/panels", async (req, res) => {
  const { name, description } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await db.insert(panelsTable).values({ name, description }).returning();
  res.status(201).json(row);
});

router.get("/panels/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [panel] = await db.select().from(panelsTable).where(eq(panelsTable.id, id));
  if (!panel) { res.status(404).json({ error: "Not found" }); return; }

  const items = await db
    .select()
    .from(panelItemsTable)
    .leftJoin(equipmentTable, eq(panelItemsTable.equipment_id, equipmentTable.id))
    .where(eq(panelItemsTable.panel_id, id));

  res.json({
    ...panel,
    items: items.map((r) => ({
      ...r.panel_items,
      quantity: Number(r.panel_items.quantity),
      equipment_name: r.equipment?.name ?? null,
    })),
  });
});

router.patch("/panels/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, description } = req.body;
  const [row] = await db.update(panelsTable).set({ name, description }).where(eq(panelsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/panels/:id", async (req, res) => {
  await db.delete(panelsTable).where(eq(panelsTable.id, Number(req.params.id)));
  res.status(204).send();
});

router.post("/panels/:id/items", async (req, res) => {
  const panel_id = Number(req.params.id);
  const { equipment_id, quantity } = req.body;
  if (!equipment_id) { res.status(400).json({ error: "equipment_id required" }); return; }

  const [item] = await db.insert(panelItemsTable).values({
    panel_id,
    equipment_id,
    quantity: String(quantity ?? 1),
  }).returning();

  const [eq_row] = await db.select().from(equipmentTable).where(eq(equipmentTable.id, equipment_id));
  res.status(201).json({ ...item, quantity: Number(item.quantity), equipment_name: eq_row?.name ?? null });
});

router.patch("/panels/:id/items/:itemId", async (req, res) => {
  const itemId = Number(req.params.itemId);
  const { quantity } = req.body;
  const [item] = await db.update(panelItemsTable).set({ quantity: String(quantity) }).where(eq(panelItemsTable.id, itemId)).returning();
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  const [eq_row] = await db.select().from(equipmentTable).where(eq(equipmentTable.id, item.equipment_id));
  res.json({ ...item, quantity: Number(item.quantity), equipment_name: eq_row?.name ?? null });
});

router.delete("/panels/:id/items/:itemId", async (req, res) => {
  await db.delete(panelItemsTable).where(eq(panelItemsTable.id, Number(req.params.itemId)));
  res.status(204).send();
});

export default router;
