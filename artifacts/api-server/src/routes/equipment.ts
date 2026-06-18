import { Router } from "express";
import { db } from "@workspace/db";
import {
  equipmentTable,
  equipmentCategoriesTable,
  equipmentSuppliersTable,
  suppliersTable,
} from "@workspace/db";
import { eq, like, and, min, desc, or, sql } from "drizzle-orm";

const router = Router();

const enrichEquipment = async (equipment: typeof equipmentTable.$inferSelect & { category_name?: string | null }) => {
  const links = await db
    .select()
    .from(equipmentSuppliersTable)
    .leftJoin(suppliersTable, eq(equipmentSuppliersTable.supplier_id, suppliersTable.id))
    .where(eq(equipmentSuppliersTable.equipment_id, equipment.id));

  const prices = links.map((l) => ({
    purchase: Number(l.equipment_suppliers.purchase_price),
    sell: Number(l.equipment_suppliers.sell_price),
    is_default: l.equipment_suppliers.is_default,
    supplier_name: l.suppliers?.name ?? null,
    brand: l.equipment_suppliers.brand ?? null,
  }));

  const defaultLink = links.find((l) => l.equipment_suppliers.is_default) ?? links[0];

  return {
    ...equipment,
    specs: (equipment.specs as Array<{ key: string; value: string }>) ?? [],
    min_purchase_price: prices.length > 0 ? Math.min(...prices.map((p) => p.purchase)) : null,
    min_sell_price: prices.length > 0 ? Math.min(...prices.map((p) => p.sell)) : null,
    default_supplier_name: defaultLink?.suppliers?.name ?? null,
    default_brand: defaultLink?.equipment_suppliers.brand ?? null,
  };
};

router.get("/equipment-categories", async (req, res) => {
  const rows = await db.select().from(equipmentCategoriesTable).orderBy(equipmentCategoriesTable.name);
  res.json(rows);
});

router.post("/equipment-categories", async (req, res) => {
  const { name, parent_id } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await db.insert(equipmentCategoriesTable).values({ name, parent_id: parent_id ?? null }).returning();
  res.status(201).json(row);
});

router.patch("/equipment-categories/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, parent_id } = req.body;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (parent_id !== undefined) updateData.parent_id = parent_id ?? null;
  const [row] = await db.update(equipmentCategoriesTable).set(updateData).where(eq(equipmentCategoriesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/equipment-categories/:id", async (req, res) => {
  await db.delete(equipmentCategoriesTable).where(eq(equipmentCategoriesTable.id, Number(req.params.id)));
  res.status(204).send();
});

router.get("/equipment", async (req, res) => {
  const search = (req.query.search as string | undefined)?.trim();
  const category_id = req.query.category_id ? Number(req.query.category_id) : undefined;

  const conditions: ReturnType<typeof eq>[] = [];
  if (category_id) conditions.push(eq(equipmentTable.category_id, category_id));

  let rows = await db
    .select({
      id: equipmentTable.id,
      name: equipmentTable.name,
      category_id: equipmentTable.category_id,
      category_name: equipmentCategoriesTable.name,
      specs: equipmentTable.specs,
      description: equipmentTable.description,
      default_brand: equipmentTable.default_brand,
      website_price: equipmentTable.website_price,
      product_link: equipmentTable.product_link,
      created_at: equipmentTable.created_at,
    })
    .from(equipmentTable)
    .leftJoin(equipmentCategoriesTable, eq(equipmentTable.category_id, equipmentCategoriesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(equipmentTable.created_at));

  const enriched = await Promise.all(rows.map((r) => enrichEquipment(r as any)));

  if (search) {
    const lower = search.toLowerCase();
    const filtered = enriched.filter((r) => {
      if (r.name.toLowerCase().includes(lower)) return true;
      if (r.category_name?.toLowerCase().includes(lower)) return true;
      const specs = (r.specs as Array<{ key: string; value: string }>) ?? [];
      if (specs.some((s) => s.key.toLowerCase().includes(lower) || s.value.toLowerCase().includes(lower))) return true;
      if (r.default_brand?.toLowerCase().includes(lower)) return true;
      if (r.default_supplier_name?.toLowerCase().includes(lower)) return true;
      return false;
    });
    res.json(filtered);
    return;
  }
  res.json(enriched);
});

router.post("/equipment", async (req, res) => {
  const { name, category_id, specs, description, default_brand, website_price, product_link } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [row] = await db.insert(equipmentTable).values({
    name,
    category_id: category_id ?? null,
    specs: specs ?? [],
    description,
    default_brand: default_brand ?? null,
    website_price: website_price != null ? String(website_price) : null,
    product_link: product_link ?? null,
  }).returning();

  const [cat] = category_id
    ? await db.select().from(equipmentCategoriesTable).where(eq(equipmentCategoriesTable.id, category_id))
    : [];

  const enriched = await enrichEquipment({ ...row, category_name: cat?.name ?? null });
  res.status(201).json(enriched);
});

router.get("/equipment/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select({
      id: equipmentTable.id,
      name: equipmentTable.name,
      category_id: equipmentTable.category_id,
      category_name: equipmentCategoriesTable.name,
      specs: equipmentTable.specs,
      description: equipmentTable.description,
      default_brand: equipmentTable.default_brand,
      website_price: equipmentTable.website_price,
      product_link: equipmentTable.product_link,
      created_at: equipmentTable.created_at,
    })
    .from(equipmentTable)
    .leftJoin(equipmentCategoriesTable, eq(equipmentTable.category_id, equipmentCategoriesTable.id))
    .where(eq(equipmentTable.id, id));

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  const enriched = await enrichEquipment(row as any);
  res.json(enriched);
});

router.patch("/equipment/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, category_id, specs, description, default_brand, website_price, product_link } = req.body;
  const [row] = await db.update(equipmentTable).set({
    ...(name !== undefined && { name }),
    ...(category_id !== undefined && { category_id: category_id ?? null }),
    ...(specs !== undefined && { specs }),
    ...(description !== undefined && { description }),
    ...(default_brand !== undefined && { default_brand: default_brand ?? null }),
    ...(website_price !== undefined && { website_price: website_price != null ? String(website_price) : null }),
    ...(product_link !== undefined && { product_link: product_link ?? null }),
  }).where(eq(equipmentTable.id, id)).returning();

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  const [cat] = row.category_id
    ? await db.select().from(equipmentCategoriesTable).where(eq(equipmentCategoriesTable.id, row.category_id))
    : [];
  const enriched = await enrichEquipment({ ...row, category_name: cat?.name ?? null });
  res.json(enriched);
});

router.delete("/equipment/:id", async (req, res) => {
  await db.delete(equipmentTable).where(eq(equipmentTable.id, Number(req.params.id)));
  res.status(204).send();
});

router.get("/equipment/:id/suppliers", async (req, res) => {
  const id = Number(req.params.id);
  const links = await db
    .select()
    .from(equipmentSuppliersTable)
    .leftJoin(suppliersTable, eq(equipmentSuppliersTable.supplier_id, suppliersTable.id))
    .where(eq(equipmentSuppliersTable.equipment_id, id));

  res.json(links.map((l) => ({
    ...l.equipment_suppliers,
    purchase_price: Number(l.equipment_suppliers.purchase_price),
    sell_price: Number(l.equipment_suppliers.sell_price),
    supplier_name: l.suppliers?.name ?? null,
    supplier_phone: l.suppliers?.phone ?? null,
  })));
});

router.post("/equipment/:id/suppliers", async (req, res) => {
  const equipment_id = Number(req.params.id);
  const { supplier_id, brand, purchase_price, sell_price, supplier_code, is_default, notes } = req.body;
  if (!supplier_id) { res.status(400).json({ error: "supplier_id required" }); return; }

  if (is_default) {
    await db.update(equipmentSuppliersTable).set({ is_default: false }).where(eq(equipmentSuppliersTable.equipment_id, equipment_id));
  }

  const [link] = await db.insert(equipmentSuppliersTable).values({
    equipment_id,
    supplier_id,
    brand,
    purchase_price: String(purchase_price ?? 0),
    sell_price: String(sell_price ?? 0),
    supplier_code,
    is_default: is_default ?? false,
    notes,
  }).returning();

  const [sup] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, supplier_id));
  res.status(201).json({ ...link, purchase_price: Number(link.purchase_price), sell_price: Number(link.sell_price), supplier_name: sup?.name ?? null });
});

router.patch("/equipment/:id/suppliers/:linkId", async (req, res) => {
  const equipment_id = Number(req.params.id);
  const linkId = Number(req.params.linkId);
  const { brand, purchase_price, sell_price, supplier_code, is_default, notes } = req.body;

  if (is_default) {
    await db.update(equipmentSuppliersTable).set({ is_default: false }).where(eq(equipmentSuppliersTable.equipment_id, equipment_id));
  }

  const updateData: Record<string, unknown> = {};
  if (brand !== undefined) updateData.brand = brand;
  if (purchase_price !== undefined) updateData.purchase_price = String(purchase_price);
  if (sell_price !== undefined) updateData.sell_price = String(sell_price);
  if (supplier_code !== undefined) updateData.supplier_code = supplier_code;
  if (is_default !== undefined) updateData.is_default = is_default;
  if (notes !== undefined) updateData.notes = notes;

  const [link] = await db.update(equipmentSuppliersTable).set(updateData).where(eq(equipmentSuppliersTable.id, linkId)).returning();
  if (!link) { res.status(404).json({ error: "Not found" }); return; }

  const [sup] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, link.supplier_id));
  res.json({ ...link, purchase_price: Number(link.purchase_price), sell_price: Number(link.sell_price), supplier_name: sup?.name ?? null });
});

router.delete("/equipment/:id/suppliers/:linkId", async (req, res) => {
  await db.delete(equipmentSuppliersTable).where(eq(equipmentSuppliersTable.id, Number(req.params.linkId)));
  res.status(204).send();
});

export default router;
