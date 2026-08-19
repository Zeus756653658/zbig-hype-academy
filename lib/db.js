const { createClient } = require("@libsql/client");
const path = require("path");

function createDb() {
  const isVercel = process.env.VERCEL === "1";
  const localFallback = `file:${path.join(__dirname, "..", "database", "academy.db")}`;
  const url = process.env.DATABASE_URL || (!isVercel ? localFallback : null);
  const authToken = process.env.DATABASE_AUTH_TOKEN || null;

  if (isVercel && !process.env.DATABASE_URL) {
    throw new Error("Missing required Vercel environment variable: DATABASE_URL");
  }

  if (isVercel && !process.env.DATABASE_AUTH_TOKEN) {
    throw new Error("Missing required Vercel environment variable: DATABASE_AUTH_TOKEN");
  }

  if (!url) {
    throw new Error("Database configuration is missing. Set DATABASE_URL for Vercel or run locally with the fallback SQLite file.");
  }

  return createClient({ url, authToken });
}

async function getOne(db, sql, params = []) {
  const result = await db.execute({ sql, args: params });
  return result.rows[0] || null;
}

async function getAll(db, sql, params = []) {
  const result = await db.execute({ sql, args: params });
  return result.rows || [];
}

async function run(db, sql, params = []) {
  return db.execute({ sql, args: params });
}

module.exports = { createDb, getOne, getAll, run };
