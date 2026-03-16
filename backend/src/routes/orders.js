import express from "express";
import db from "../db.js";

const router = express.Router();

// Tool 1: Check price + availability (mock — replace with real API later)
function checkBookAvailability(title, author) {
  const seed  = (title + author).length;
  const price = ((seed % 20) + 8 + Math.random() * 5).toFixed(2);
  const available = seed % 5 !== 0;
  const providers = ["Amazon", "Chapters Indigo", "Book Depository"];
  const provider  = providers[seed % providers.length];
  return { price: parseFloat(price), available, provider, delivery_days: (seed % 5) + 2 };
}

// GET /api/orders/check?title=...&author=...
// Tool: Check price and availability
router.get("/check", async (req, res) => {
  const { title, author = "" } = req.query;
  if (!title) return res.status(400).json({ error: "title is required" });
  const result = checkBookAvailability(title, author);
  return res.json({ title, author, ...result });
});

// POST /api/orders
// Tool: Place order
router.post("/", async (req, res) => {
  const { title, author, scan_id } = req.body;
  const deviceId = req.device_id;

  if (!title) return res.status(400).json({ error: "title is required" });

  // Check availability first
  const availability = checkBookAvailability(title, author ?? "");

  if (!availability.available) {
    return res.status(400).json({ error: "Book is currently unavailable" });
  }

  // Save order to DB
  const { rows } = await db.query(
    `INSERT INTO orders (device_id, scan_id, title, author, price, status, provider)
     VALUES ($1, $2, $3, $4, $5, 'confirmed', $6) RETURNING *`,
    [deviceId, scan_id ?? null, title, author ?? "", availability.price, availability.provider]
  );

  return res.json({
    order_id:      rows[0].id,
    title,
    author,
    price:         availability.price,
    provider:      availability.provider,
    delivery_days: availability.delivery_days,
    status:        "confirmed",
    message:       `Order confirmed! Your copy of "${title}" will arrive in ${availability.delivery_days} days.`,
  });
});

// GET /api/orders
// Tool: List all orders for this device
router.get("/", async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM orders WHERE device_id = $1 ORDER BY created_at DESC`,
    [req.device_id]
  );
  return res.json({ orders: rows });
});

// DELETE /api/orders/:id
// Tool: Cancel order
router.delete("/:id", async (req, res) => {
  const { rows } = await db.query(
    `UPDATE orders SET status = 'cancelled'
     WHERE id = $1 AND device_id = $2 RETURNING *`,
    [req.params.id, req.device_id]
  );
  if (!rows.length) return res.status(404).json({ error: "Order not found" });
  return res.json({ ok: true, order_id: rows[0].id, status: "cancelled" });
});

export default router;
