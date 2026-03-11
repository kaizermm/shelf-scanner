import express from "express";
import db from "../db.js";

const router = express.Router();

// GET /api/preferences
router.get("/", async (req, res) => {
  const deviceId = req.device_id;

  const { rows } = await db.query(
    "SELECT data FROM preferences WHERE device_id = $1",
    [deviceId]
  );

  res.json(rows[0]?.data ?? {});
});

// POST /api/preferences  (UPSERT)
router.post("/", async (req, res) => {
  const deviceId = req.device_id;
  const data = req.body ?? {};

  // basic shape checking (super light)
  if (typeof data !== "object" || Array.isArray(data) || data === null) {
    return res.status(400).json({ error: "Preferences must be a JSON object" });
  }

  await db.query(
    `
    INSERT INTO preferences (device_id, data, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (device_id)
    DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    `,
    [deviceId, data]
  );

  res.json({ ok: true });
});

export default router;