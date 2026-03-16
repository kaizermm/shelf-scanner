import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import preferencesRouter    from "./routes/preferences.js";
import readingHistoryRouter from "./routes/readingHistory.js";
import scansRouter          from "./routes/scans.js";
import ordersRouter         from "./routes/orders.js";

const app = express();

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  let deviceId = req.cookies?.device_id;
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    res.cookie("device_id", deviceId, {
      httpOnly: true, sameSite: "lax", secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
  }
  req.device_id = deviceId;
  next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/api/me",     (req,  res) => res.json({ device_id: req.device_id }));

app.use("/api/preferences",     preferencesRouter);
app.use("/api/reading-history", readingHistoryRouter);
app.use("/api/scans",           scansRouter);
app.use("/api/orders",          ordersRouter);

export default app;
