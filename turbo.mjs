/**
 * migrate-postgres-to-turso.mjs
 *
 * Migrates all data from a Neon DB (PostgreSQL) to a Turso (libSQL/SQLite) database.
 * Handles schema differences: PostgreSQL arrays (weekNumbers) are stored as JSON strings in SQLite.
 *
 * Usage:
 *   1. npm install pg @libsql/client dotenv
 *   2. Set env vars (see .env.example section below or use a .env file)
 *   3. node migrate-postgres-to-turso.mjs
 *
 * Required env vars:
 *   NEON_DATABASE_URL   — e.g. postgresql://user:pass@host.neon.tech/dbname?sslmode=require
 *   TURSO_DATABASE_URL  — e.g. libsql://your-db.turso.io
 *   TURSO_AUTH_TOKEN    — Turso auth token
 */

import pg from "pg";
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config();

// ─── Config ────────────────────────────────────────────────────────────────

const NEON_DATABASE_URL = process.env.DATABASE_URL;
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!NEON_DATABASE_URL || !TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
 console.info(NEON_DATABASE_URL, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN);
 console.error(
    "❌  Missing env vars. Set NEON_DATABASE_URL, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN."
  );
  process.exit(1);
}

// ─── Clients ───────────────────────────────────────────────────────────────

const pgClient = new pg.Client({ connectionString: NEON_DATABASE_URL });

const turso = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Format a JS Date (or date string) as an ISO string Turso can store. */
function toISO(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

/** Convert a PostgreSQL int[] / JSON array to a JSON string for SQLite. */
function arrayToJson(value) {
  if (!value) return "[]";
  if (Array.isArray(value)) return JSON.stringify(value);
  // Already a string (e.g. "{1,2,3}" from pg driver)
  if (typeof value === "string") {
    const cleaned = value.replace(/^\{|\}$/g, "").split(",").map(Number);
    return JSON.stringify(cleaned);
  }
  return "[]";
}

/** Run a batch of Turso statements inside a single transaction. */
async function batchInsert(statements) {
  if (statements.length === 0) return;
  await turso.batch(statements, "write");
}

/** Log progress. */
function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// ─── Schema creation (SQLite / libSQL DDL) ─────────────────────────────────

const DDL = `
CREATE TABLE IF NOT EXISTS "User" (
  "id"        TEXT PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "email"     TEXT NOT NULL UNIQUE,
  "password"  TEXT NOT NULL,
  "role"      TEXT NOT NULL DEFAULT 'reseller',
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "PackageType" (
  "id"        TEXT PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "icon"      TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Package" (
  "id"              TEXT PRIMARY KEY,
  "name"            TEXT NOT NULL,
  "description"     TEXT,
  "pricePerWeek"    REAL NOT NULL,
  "tenor"           INTEGER NOT NULL,
  "photo"           TEXT,
  "isEligibleBonus" INTEGER NOT NULL DEFAULT 0,
  "packageTypeId"   TEXT NOT NULL,
  "createdAt"       TEXT NOT NULL,
  "updatedAt"       TEXT NOT NULL,
  FOREIGN KEY ("packageTypeId") REFERENCES "PackageType"("id")
);

CREATE TABLE IF NOT EXISTS "Transaction" (
  "id"                 TEXT PRIMARY KEY,
  "packageName"        TEXT NOT NULL,
  "packageDescription" TEXT,
  "pricePerWeek"       REAL NOT NULL,
  "tenor"              INTEGER NOT NULL,
  "isEligibleBonus"    INTEGER NOT NULL DEFAULT 1,
  "customerName"       TEXT NOT NULL,
  "resellerId"         TEXT NOT NULL,
  "resellerName"       TEXT NOT NULL,
  "resellerEmail"      TEXT NOT NULL,
  "createdAt"          TEXT NOT NULL,
  "updatedAt"          TEXT NOT NULL,
  FOREIGN KEY ("resellerId") REFERENCES "User"("id")
);

CREATE TABLE IF NOT EXISTS "Payment" (
  "id"            TEXT PRIMARY KEY,
  "transactionId" TEXT NOT NULL,
  "amount"        REAL NOT NULL,
  "weekNumbers"   TEXT NOT NULL DEFAULT '[]',
  "paymentMethod" TEXT NOT NULL,
  "bankName"      TEXT,
  "proofImage"    TEXT,
  "note"          TEXT,
  "status"        TEXT NOT NULL DEFAULT 'process',
  "resellerId"    TEXT NOT NULL,
  "resellerName"  TEXT NOT NULL,
  "resellerEmail" TEXT NOT NULL,
  "createdAt"     TEXT NOT NULL,
  "updatedAt"     TEXT NOT NULL,
  FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id"),
  FOREIGN KEY ("resellerId")    REFERENCES "User"("id")
);

CREATE TABLE IF NOT EXISTS "PaymentMethod" (
  "id"            TEXT PRIMARY KEY,
  "name"          TEXT NOT NULL,
  "accountNumber" TEXT,
  "accountHolder" TEXT,
  "logo"          TEXT,
  "type"          TEXT NOT NULL DEFAULT 'bank',
  "createdAt"     TEXT NOT NULL,
  "updatedAt"     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "DeletionRequest" (
  "id"            TEXT PRIMARY KEY,
  "transactionId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "reason"        TEXT NOT NULL,
  "status"        TEXT NOT NULL DEFAULT 'pending',
  "adminNote"     TEXT,
  "createdAt"     TEXT NOT NULL,
  "updatedAt"     TEXT NOT NULL,
  FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id"),
  FOREIGN KEY ("requestedById") REFERENCES "User"("id")
);
`;

// ─── Migration functions ────────────────────────────────────────────────────

async function applySchema() {
  log("Applying SQLite schema to Turso…");
  // Split DDL into individual statements and execute them one by one
  const statements = DDL.split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await turso.execute(stmt + ";");
  }
  log("Schema applied.");
}

async function migrateUsers() {
  log("Migrating User…");
  const { rows } = await pgClient.query(`SELECT * FROM "User" ORDER BY "createdAt"`);
  const stmts = rows.map((r) => ({
    sql: `INSERT OR IGNORE INTO "User" ("id","name","email","password","role","createdAt","updatedAt")
          VALUES (?,?,?,?,?,?,?)`,
    args: [r.id, r.name, r.email, r.password, r.role, toISO(r.createdAt), toISO(r.updatedAt)],
  }));
  await batchInsert(stmts);
  log(`  → ${rows.length} rows`);
}

async function migratePackageTypes() {
  log("Migrating PackageType…");
  const { rows } = await pgClient.query(`SELECT * FROM "PackageType" ORDER BY "createdAt"`);
  const stmts = rows.map((r) => ({
    sql: `INSERT OR IGNORE INTO "PackageType" ("id","name","icon","createdAt","updatedAt")
          VALUES (?,?,?,?,?)`,
    args: [r.id, r.name, r.icon ?? null, toISO(r.createdAt), toISO(r.updatedAt)],
  }));
  await batchInsert(stmts);
  log(`  → ${rows.length} rows`);
}

async function migratePackages() {
  log("Migrating Package…");
  const { rows } = await pgClient.query(`SELECT * FROM "Package" ORDER BY "createdAt"`);
  const stmts = rows.map((r) => ({
    sql: `INSERT OR IGNORE INTO "Package"
            ("id","name","description","pricePerWeek","tenor","photo","isEligibleBonus","packageTypeId","createdAt","updatedAt")
          VALUES (?,?,?,?,?,?,?,?,?,?)`,
    args: [
      r.id,
      r.name,
      r.description ?? null,
      r.pricePerWeek,
      r.tenor,
      r.photo ?? null,
      r.isEligibleBonus ? 1 : 0,
      r.packageTypeId,
      toISO(r.createdAt),
      toISO(r.updatedAt),
    ],
  }));
  await batchInsert(stmts);
  log(`  → ${rows.length} rows`);
}

async function migrateTransactions() {
  log("Migrating Transaction…");
  const { rows } = await pgClient.query(`SELECT * FROM "Transaction" ORDER BY "createdAt"`);
  const stmts = rows.map((r) => ({
    sql: `INSERT OR IGNORE INTO "Transaction"
            ("id","packageName","packageDescription","pricePerWeek","tenor","isEligibleBonus",
             "customerName","resellerId","resellerName","resellerEmail","createdAt","updatedAt")
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      r.id,
      r.packageName,
      r.packageDescription ?? null,
      r.pricePerWeek,
      r.tenor,
      r.isEligibleBonus ? 1 : 0,
      r.customerName,
      r.resellerId,
      r.resellerName,
      r.resellerEmail,
      toISO(r.createdAt),
      toISO(r.updatedAt),
    ],
  }));
  await batchInsert(stmts);
  log(`  → ${rows.length} rows`);
}

async function migratePayments() {
  log("Migrating Payment…");
  const { rows } = await pgClient.query(`SELECT * FROM "Payment" ORDER BY "createdAt"`);
  const stmts = rows.map((r) => ({
    sql: `INSERT OR IGNORE INTO "Payment"
            ("id","transactionId","amount","weekNumbers","paymentMethod","bankName",
             "proofImage","note","status","resellerId","resellerName","resellerEmail","createdAt","updatedAt")
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      r.id,
      r.transactionId,
      r.amount,
      arrayToJson(r.weekNumbers),   // int[] → JSON string
      r.paymentMethod,
      r.bankName ?? null,
      r.proofImage ?? null,
      r.note ?? null,
      r.status,
      r.resellerId,
      r.resellerName,
      r.resellerEmail,
      toISO(r.createdAt),
      toISO(r.updatedAt),
    ],
  }));
  await batchInsert(stmts);
  log(`  → ${rows.length} rows`);
}

async function migratePaymentMethods() {
  log("Migrating PaymentMethod…");
  const { rows } = await pgClient.query(`SELECT * FROM "PaymentMethod" ORDER BY "createdAt"`);
  const stmts = rows.map((r) => ({
    sql: `INSERT OR IGNORE INTO "PaymentMethod"
            ("id","name","accountNumber","accountHolder","logo","type","createdAt","updatedAt")
          VALUES (?,?,?,?,?,?,?,?)`,
    args: [
      r.id,
      r.name,
      r.accountNumber ?? null,
      r.accountHolder ?? null,
      r.logo ?? null,
      r.type,
      toISO(r.createdAt),
      toISO(r.updatedAt),
    ],
  }));
  await batchInsert(stmts);
  log(`  → ${rows.length} rows`);
}

async function migrateDeletionRequests() {
  log("Migrating DeletionRequest…");
  const { rows } = await pgClient.query(`SELECT * FROM "DeletionRequest" ORDER BY "createdAt"`);
  const stmts = rows.map((r) => ({
    sql: `INSERT OR IGNORE INTO "DeletionRequest"
            ("id","transactionId","requestedById","reason","status","adminNote","createdAt","updatedAt")
          VALUES (?,?,?,?,?,?,?,?)`,
    args: [
      r.id,
      r.transactionId,
      r.requestedById,
      r.reason,
      r.status,
      r.adminNote ?? null,
      toISO(r.createdAt),
      toISO(r.updatedAt),
    ],
  }));
  await batchInsert(stmts);
  log(`  → ${rows.length} rows`);
}

// ─── Entry point ───────────────────────────────────────────────────────────

async function main() {
  log("Connecting to Neon DB…");
  await pgClient.connect();
  log("Connected.");

  try {
    await applySchema();

    // Migrate in FK-dependency order
    await migrateUsers();
    await migratePackageTypes();
    await migratePackages();
    await migrateTransactions();
    await migratePayments();
    await migratePaymentMethods();
    await migrateDeletionRequests();

    log("✅  Migration complete!");
  } finally {
    await pgClient.end();
    log("PostgreSQL connection closed.");
  }
}

main().catch((err) => {
  console.error("❌  Migration failed:", err);
  process.exit(1);
});
