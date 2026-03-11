import express from "express";
import db from "../db.js";

const router = express.Router();

/**
 * GET /api/reading-history
 * Returns reading history JSON list for current device_id cookie.
 */
router.get("/", async (req, res) => {
  const deviceId = req.device_id;

  const { rows } = await db.query(
    "SELECT items FROM reading_history WHERE device_id = $1",
    [deviceId]
  );

  return res.json(rows[0]?.items ?? []);
});

/**
 * POST /api/reading-history
 * Saves reading history JSON list for current device_id cookie (UPSERT).
 * Expected body: JSON array of items like:
 * [{ "title": "...", "author": "...", "rating": 5, "status": "read" }]
 */
router.post("/", async (req, res) => {
  const deviceId = req.device_id;
  const items = req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "Reading history must be a JSON array" });
  }

  const itemsJson = JSON.stringify(items); // convert to JSON text

  await db.query(
    `
    INSERT INTO reading_history (device_id, items, updated_at)
    VALUES ($1, $2::jsonb, NOW())
    ON CONFLICT (device_id)
    DO UPDATE SET items = EXCLUDED.items, updated_at = NOW()
    `,
    [deviceId, itemsJson]
  );

  return res.json({ ok: true, count: items.length });
});

export default router;
