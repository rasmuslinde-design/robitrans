import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type BookingRow = {
  id: string;
  date: string; // yyyy-mm-dd
  machineType: "KRAANAUTO" | "TOSTUK";
  rentType: "JUHIGA" | "JUHITA";
  name: string;
  email: string;
  phone: string;
  additionalInfo: string;
  createdAt: string;
};

export type MachineRow = {
  id: string;
  name: string;
  description: string;
  featuresJson: string; // JSON stringified string[]
  imageUrl: string;
  active: 0 | 1;
  createdAt: string;
};

export function openDb(dbPath: string) {
  const dir = path.dirname(dbPath);
  fs.mkdirSync(dir, { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      machineType TEXT NOT NULL DEFAULT 'TOSTUK',
      rentType TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      additionalInfo TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    -- If the table existed before, add the column (SQLite will ignore if it already exists via try/catch below)

    CREATE UNIQUE INDEX IF NOT EXISTS bookings_date_unique
    ON bookings(date);

    CREATE TABLE IF NOT EXISTS machines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      featuresJson TEXT NOT NULL,
      imageUrl TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL
    );
  `);

  // Lightweight migration for existing DBs
  try {
    db.exec(
      "ALTER TABLE bookings ADD COLUMN machineType TEXT NOT NULL DEFAULT 'TOSTUK';",
    );
  } catch {
    // ignore (already exists)
  }

  // Seed initial machines (only if table is empty)
  const machineCount = db
    .prepare("SELECT COUNT(1) as c FROM machines")
    .get() as { c: number };
  if ((machineCount?.c ?? 0) === 0) {
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO machines (id, name, description, featuresJson, imageUrl, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(
      "machine-kraanaauto",
      "Kraanaauto rent",
      "Tõstetööd, elementide paigaldus ja materjalide liigutamine. Sobib ehituseks ja hooldustöödeks.",
      JSON.stringify([
        "Kogenud juht (valikuline)",
        "Täpne positsioneerimine",
        "Kiire kohaletoomine",
      ]),
      "/kraana.webp",
      1,
      now,
    );
    db.prepare(
      "INSERT INTO machines (id, name, description, featuresJson, imageUrl, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(
      "machine-tostuk",
      "Tõstuk (forklift) rent",
      "Lao- ja ehitustöödeks, kauba liigutamiseks ning laadimiseks. Hea manööverdusvõimega.",
      JSON.stringify([
        "Paindlik rendiaeg",
        "Hooldatud tehnika",
        "Kõrge töökindlus",
      ]),
      "/forklift.avif",
      1,
      now,
    );
  }

  return db;
}
