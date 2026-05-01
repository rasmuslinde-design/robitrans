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
  `);

  // Lightweight migration for existing DBs
  try {
    db.exec(
      "ALTER TABLE bookings ADD COLUMN machineType TEXT NOT NULL DEFAULT 'TOSTUK';",
    );
  } catch {
    // ignore (already exists)
  }

  return db;
}
