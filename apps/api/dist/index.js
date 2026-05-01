import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import crypto from "node:crypto";
import { loadEnv } from "./env";
import { openDb } from "./db";
import { CreateBookingSchema, isWeekend } from "./validation";
import { sendBookingEmail } from "./mailer";
const env = loadEnv(process.env);
const db = openDb(env.DATABASE_PATH);
const app = express();
app.use(helmet());
app.use(cors({
    origin: env.ORIGIN,
    credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.get("/health", (_req, res) => {
    res.json({ ok: true });
});
app.get("/api/availability", (req, res) => {
    const month = String(req.query.month ?? ""); // YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ message: "month peab olema formaadis YYYY-MM" });
    }
    const rows = db
        .prepare("SELECT date FROM bookings WHERE date LIKE ? ORDER BY date ASC")
        .all(`${month}-%`);
    res.json({ bookedDates: rows.map((r) => r.date) });
});
app.post("/api/bookings", async (req, res) => {
    const parsed = CreateBookingSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Vigane sisend", issues: parsed.error.issues });
    }
    const booking = parsed.data;
    if (isWeekend(booking.date)) {
        return res.status(400).json({ message: "Nädalavahetusel broneerida ei saa." });
    }
    // Check if already booked
    const exists = db
        .prepare("SELECT 1 FROM bookings WHERE date = ?")
        .get(booking.date);
    if (exists) {
        return res.status(409).json({ message: "See kuupäev on juba broneeritud." });
    }
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare("INSERT INTO bookings (id, date, rentType, name, email, phone, additionalInfo, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(id, booking.date, booking.rentType, booking.name, booking.email, booking.phone, booking.additionalInfo, createdAt);
    try {
        const mail = await sendBookingEmail({ env, booking });
        res.status(201).json({ id, createdAt, mail });
    }
    catch (err) {
        res.status(201).json({
            id,
            createdAt,
            mail: { ok: false, skipped: false, reason: "E-maili saatmine ebaõnnestus." },
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
        .prepare("SELECT id, date, rentType, name, email, phone, additionalInfo, createdAt FROM bookings ORDER BY date DESC")
        .all();
    res.json({ bookings: rows });
});
app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env.PORT}`);
});
