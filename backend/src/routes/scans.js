import express from "express";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import db from "../db.js";
import { callOrchestrator } from "../services/orchestratorClient.js";

const router = express.Router();

const uploadDir = path.resolve("uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) return cb(null, true);
    cb(new Error("Only image files are allowed"));
  },
});

router.post("/", upload.single("image"), async (req, res) => {
  const deviceId = req.device_id;
  const filePath = req.file?.path;
  try {
    if (!filePath) {
      return res.status(400).json({ error: "Missing image" });
    }
    const bytes = fs.readFileSync(filePath);
    const imageHash = crypto.createHash("sha256").update(bytes).digest("hex");
    const imagePath = filePath.replaceAll("\\", "/");

    const cached = await db.query(
      `SELECT s.id, r.results FROM scans s
       JOIN recommendations r ON r.scan_id = s.id
       WHERE s.device_id = $1 AND s.image_hash = $2 AND s.status = 'done'
       LIMIT 1`,
      [deviceId, imageHash]
    );
    if (cached.rows.length > 0) {
      return res.json({
        scan_id: cached.rows[0].id,
        books_found: cached.rows[0].results.books_found ?? [],
        recommendations: cached.rows[0].results.recommendations ?? [],
        cached: true,
      });
    }

    const { rows } = await db.query(
      `INSERT INTO scans (device_id, image_hash, status)
       VALUES ($1, $2, 'processing') RETURNING id`,
      [deviceId, imageHash]
    );
    const scanId = rows[0].id;

    const n8nResult = process.env.N8N_WEBHOOK_URL
      ? await callOrchestrator({ imagePath, deviceId, scanId })
      : { books_found: [], recommendations: [] };

    const booksFound     = n8nResult.books_found     ?? [];
    const recommendations = n8nResult.recommendations ?? n8nResult ?? [];

    await db.query(
      `INSERT INTO recommendations (scan_id, device_id, results)
       VALUES ($1, $2, $3::jsonb)`,
      [scanId, deviceId, JSON.stringify({ books_found: booksFound, recommendations })]
    );
    await db.query(`UPDATE scans SET status = 'done' WHERE id = $1`, [scanId]);

    return res.json({ scan_id: scanId, books_found: booksFound, recommendations });
  } catch (err) {
    console.error("Scan error:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});

router.get("/history", async (req, res) => {
  const { rows } = await db.query(
    `SELECT s.id, s.created_at, r.results FROM scans s
     JOIN recommendations r ON r.scan_id = s.id
     WHERE s.device_id = $1 AND s.status = 'done'
     ORDER BY s.created_at DESC LIMIT 20`,
    [req.device_id]
  );
  return res.json({ scans: rows });
});

router.get("/:id", async (req, res) => {
  const { rows } = await db.query(
    `SELECT s.id, s.image_hash, s.status, s.created_at, r.results FROM scans s
     LEFT JOIN recommendations r ON r.scan_id = s.id
     WHERE s.id = $1 AND s.device_id = $2`,
    [req.params.id, req.device_id]
  );
  if (!rows.length) return res.status(404).json({ error: "Scan not found" });
  return res.json(rows[0]);
});

export default router;
