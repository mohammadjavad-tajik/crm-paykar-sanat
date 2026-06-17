import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateSettingsBody, VerifyPinBody } from "@workspace/api-zod";
import crypto from "crypto";

const router = Router();

const getOrCreateSettings = async () => {
  const [existing] = await db.select().from(settingsTable).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(settingsTable).values({ auto_lock_minutes: 15 }).returning();
  return created;
};

router.get("/settings", async (req, res) => {
  const settings = await getOrCreateSettings();
  res.json({ ...settings, pin_hash: settings.pin_hash ? "***" : null });
});

router.patch("/settings", async (req, res) => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const settings = await getOrCreateSettings();
  const { pin_hash, ...rest } = parsed.data;

  const updateData: Record<string, unknown> = { ...rest };
  if (pin_hash !== undefined && pin_hash !== null && pin_hash !== "***") {
    updateData.pin_hash = crypto.createHash("sha256").update(pin_hash).digest("hex");
  } else if (pin_hash === null) {
    updateData.pin_hash = null;
  }

  const [updated] = await db
    .update(settingsTable)
    .set(updateData)
    .where(eq(settingsTable.id, settings.id))
    .returning();

  res.json({ ...updated, pin_hash: updated.pin_hash ? "***" : null });
});

router.post("/settings/verify-pin", async (req, res) => {
  const parsed = VerifyPinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const settings = await getOrCreateSettings();
  if (!settings.pin_hash) {
    res.json({ valid: true });
    return;
  }
  const hash = crypto.createHash("sha256").update(parsed.data.pin).digest("hex");
  res.json({ valid: hash === settings.pin_hash });
});

export default router;
