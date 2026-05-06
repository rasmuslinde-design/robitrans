import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";

import { loadEnv } from "./env.js";
import { openDb } from "./db.js";
import { CreateBookingSchema, isWeekend } from "./validation.js";
import { sendBookingEmail } from "./mailer.js";

dotenv.config();

const env = loadEnv(process.env);
const db = openDb(env.DATABASE_PATH);

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: env.ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

// --- Serve frontend (single-service deploy support) ---
// When deploying as a single Render Web Service, we serve the built Vite app from apps/web/dist.
// In dev, Vite runs separately so this is mostly for production.
const webDistDir = path.resolve(process.cwd(), "../web/dist");
const webIndexHtml = path.join(webDistDir, "index.html");

if (fs.existsSync(webIndexHtml)) {
  app.use(express.static(webDistDir));

  // SPA fallback (supports /admin etc)
  app.get("/", (_req, res) => res.sendFile(webIndexHtml));
  app.get("/admin", (_req, res) => res.sendFile(webIndexHtml));
  app.get("/masinad", (_req, res) => res.sendFile(webIndexHtml));
  app.get("/broneerimine", (_req, res) => res.sendFile(webIndexHtml));
  app.get("/tehtud-tood", (_req, res) => res.sendFile(webIndexHtml));
} else {
  // Helpful default when web isn't built
  app.get("/", (_req, res) => {
    res
      .status(200)
      .send(
        "API is running. Frontend is not built (missing apps/web/dist). Build the web app to serve it from this service.",
      );
  });
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/availability", (req, res) => {
  const month = String(req.query.month ?? ""); // YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res
      .status(400)
      .json({ message: "month peab olema formaadis YYYY-MM" });
  }

  const rows = db
    .prepare("SELECT date FROM bookings WHERE date LIKE ? ORDER BY date ASC")
    .all(`${month}-%`) as Array<{ date: string }>;

  res.json({ bookedDates: rows.map((r) => r.date) });
});

app.get("/api/machines", (_req, res) => {
  const rows = db
    .prepare(
      "SELECT id, name, description, featuresJson, imageUrl, active, createdAt FROM machines WHERE active = 1 ORDER BY createdAt ASC",
    )
    .all() as Array<{
    id: string;
    name: string;
    description: string;
    featuresJson: string;
    imageUrl: string;
    active: 0 | 1;
    createdAt: string;
  }>;

  const machines = rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    features: JSON.parse(r.featuresJson ?? "[]"),
    imageUrl: r.imageUrl,
    createdAt: r.createdAt,
  }));

  res.json({ machines });
});

app.post("/api/bookings", async (req, res) => {
  const parsed = CreateBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Vigane sisend", issues: parsed.error.issues });
  }

  const booking = parsed.data;

  if (isWeekend(booking.date)) {
    return res
      .status(400)
      .json({ message: "Nädalavahetusel broneerida ei saa." });
  }

  // Check if already booked
  const exists = db
    .prepare("SELECT 1 FROM bookings WHERE date = ?")
    .get(booking.date) as { 1: number } | undefined;

  if (exists) {
    return res
      .status(409)
      .json({ message: "See kuupäev on juba broneeritud." });
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(
    "INSERT INTO bookings (id, date, machineType, rentType, name, email, phone, additionalInfo, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    id,
    booking.date,
    booking.machineType,
    booking.rentType,
    booking.name,
    booking.email,
    booking.phone,
    booking.additionalInfo,
    createdAt,
  );

  try {
    const mail = await sendBookingEmail({ env, booking });
    res.status(201).json({ id, createdAt, mail });
  } catch (err) {
    res.status(201).json({
      id,
      createdAt,
      mail: {
        ok: false,
        skipped: false,
        reason: "E-maili saatmine ebaõnnestus.",
      },
    });
  }
});

app.post("/api/admin/login", (req, res) => {
  const user = String(req.body?.username ?? "");
  const pass = String(req.body?.password ?? "");

  if (user === env.ADMIN_USER && pass === env.ADMIN_PASS) {
    return res.json({ token: env.ADMIN_TOKEN });
  }

  return res.status(401).json({ message: "Vale kasutajanimi või parool" });
});

app.get("/api/admin/bookings", (req, res) => {
  const auth = String(req.headers.authorization ?? "");
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";

  if (token !== env.ADMIN_TOKEN) {
    return res.status(401).json({ message: "Pole lubatud" });
  }

  const rows = db
    .prepare(
      "SELECT id, date, machineType, rentType, name, email, phone, additionalInfo, createdAt FROM bookings ORDER BY date DESC",
    )
    .all();

  res.json({ bookings: rows });
});

function requireAdmin(req: express.Request, res: express.Response) {
  const auth = String(req.headers.authorization ?? "");
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  if (token !== env.ADMIN_TOKEN) {
    res.status(401).json({ message: "Pole lubatud" });
    return null;
  }
  return true;
}

app.get("/api/admin/machines", (req, res) => {
  if (!requireAdmin(req, res)) return;

  const rows = db
    .prepare(
      "SELECT id, name, description, featuresJson, imageUrl, active, createdAt FROM machines ORDER BY createdAt DESC",
    )
    .all() as Array<{
    id: string;
    name: string;
    description: string;
    featuresJson: string;
    imageUrl: string;
    active: 0 | 1;
    createdAt: string;
  }>;

  res.json({
    machines: rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      features: JSON.parse(r.featuresJson ?? "[]"),
      imageUrl: r.imageUrl,
      active: r.active,
      createdAt: r.createdAt,
    })),
  });
});

app.post("/api/admin/machines", (req, res) => {
  if (!requireAdmin(req, res)) return;

  const name = String(req.body?.name ?? "").trim();
  const description = String(req.body?.description ?? "").trim();
  const imageUrl = String(req.body?.imageUrl ?? "").trim();
  const features = Array.isArray(req.body?.features)
    ? (req.body.features as unknown[]).map((x) => String(x))
    : [];

  if (!name || !description || !imageUrl || features.length === 0) {
    return res.status(400).json({
      message: "Puuduvad väljad (name, description, imageUrl, features).",
    });
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    "INSERT INTO machines (id, name, description, featuresJson, imageUrl, active, createdAt) VALUES (?, ?, ?, ?, ?, 1, ?)",
  ).run(id, name, description, JSON.stringify(features), imageUrl, createdAt);

  return res.status(201).json({ id, createdAt });
});

app.patch("/api/admin/machines/:id", (req, res) => {
  if (!requireAdmin(req, res)) return;

  const id = String(req.params.id ?? "");
  if (!id) return res.status(400).json({ message: "Puuduv id" });

  const current = db
    .prepare(
      "SELECT id, name, description, featuresJson, imageUrl, active, createdAt FROM machines WHERE id = ?",
    )
    .get(id) as
    | {
        id: string;
        name: string;
        description: string;
        featuresJson: string;
        imageUrl: string;
        active: 0 | 1;
        createdAt: string;
      }
    | undefined;

  if (!current) return res.status(404).json({ message: "Masinat ei leitud" });

  const nextName = String(req.body?.name ?? current.name).trim();
  const nextDescription = String(
    req.body?.description ?? current.description,
  ).trim();
  const nextImageUrl = String(req.body?.imageUrl ?? current.imageUrl).trim();
  const nextActiveRaw =
    typeof req.body?.active === "boolean"
      ? req.body.active
      : typeof req.body?.active === "number"
        ? Boolean(req.body.active)
        : current.active === 1;
  const nextFeatures = Array.isArray(req.body?.features)
    ? (req.body.features as unknown[]).map((x) => String(x))
    : (JSON.parse(current.featuresJson ?? "[]") as string[]);

  if (
    !nextName ||
    !nextDescription ||
    !nextImageUrl ||
    nextFeatures.length === 0
  ) {
    return res.status(400).json({
      message: "Puuduvad väljad (name, description, imageUrl, features).",
    });
  }

  db.prepare(
    "UPDATE machines SET name = ?, description = ?, featuresJson = ?, imageUrl = ?, active = ? WHERE id = ?",
  ).run(
    nextName,
    nextDescription,
    JSON.stringify(nextFeatures),
    nextImageUrl,
    nextActiveRaw ? 1 : 0,
    id,
  );

  return res.json({ ok: true });
});

app.delete("/api/admin/machines/:id", (req, res) => {
  if (!requireAdmin(req, res)) return;

  const id = String(req.params.id ?? "");
  if (!id) return res.status(400).json({ message: "Puuduv id" });

  const info = db.prepare("DELETE FROM machines WHERE id = ?").run(id) as {
    changes: number;
  };
  if (!info.changes)
    return res.status(404).json({ message: "Masinat ei leitud" });
  return res.json({ ok: true });
});

app.delete("/api/admin/bookings/:id", (req, res) => {
  if (!requireAdmin(req, res)) return;

  const id = String(req.params.id ?? "");
  if (!id) return res.status(400).json({ message: "Puuduv id" });

  const info = db.prepare("DELETE FROM bookings WHERE id = ?").run(id) as {
    changes: number;
  };

  if (!info.changes)
    return res.status(404).json({ message: "Broneeringut ei leitud" });
  return res.json({ ok: true });
});

app.patch("/api/admin/bookings/:id", (req, res) => {
  if (!requireAdmin(req, res)) return;

  const id = String(req.params.id ?? "");
  if (!id) return res.status(400).json({ message: "Puuduv id" });

  const current = db
    .prepare(
      "SELECT id, date, machineType, rentType, name, email, phone, additionalInfo, createdAt FROM bookings WHERE id = ?",
    )
    .get(id) as any | undefined;

  if (!current)
    return res.status(404).json({ message: "Broneeringut ei leitud" });

  // Allow changing date/machineType/rentType/contact/details.
  // For simplicity and safety, validate by reusing CreateBookingSchema on a merged object.
  const merged = {
    machineType: req.body?.machineType ?? current.machineType,
    date: req.body?.date ?? current.date,
    rentType: req.body?.rentType ?? current.rentType,
    name: req.body?.name ?? current.name,
    email: req.body?.email ?? current.email,
    phone: req.body?.phone ?? current.phone,
    additionalInfo: req.body?.additionalInfo ?? current.additionalInfo,
  };

  const parsed = CreateBookingSchema.safeParse(merged);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Vigane sisend", issues: parsed.error.issues });
  }

  const next = parsed.data;

  if (isWeekend(next.date)) {
    return res
      .status(400)
      .json({ message: "Nädalavahetusel broneerida ei saa." });
  }

  // If date changes, ensure new date isn't already booked by another booking
  if (next.date !== current.date) {
    const exists = db
      .prepare("SELECT 1 FROM bookings WHERE date = ? AND id <> ?")
      .get(next.date, id) as { 1: number } | undefined;
    if (exists) {
      return res
        .status(409)
        .json({ message: "See kuupäev on juba broneeritud." });
    }
  }

  db.prepare(
    "UPDATE bookings SET date = ?, machineType = ?, rentType = ?, name = ?, email = ?, phone = ?, additionalInfo = ? WHERE id = ?",
  ).run(
    next.date,
    next.machineType,
    next.rentType,
    next.name,
    next.email,
    next.phone,
    next.additionalInfo,
    id,
  );

  return res.json({ ok: true });
});

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});
