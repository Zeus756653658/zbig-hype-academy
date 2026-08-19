const { createClient } = require("@libsql/client");
const path = require("path");

function createDb() {
  const localFallback = `file:${path.join(__dirname, "..", "database", "academy.db")}`;
  const url = process.env.DATABASE_URL || localFallback;
  const authToken = process.env.DATABASE_AUTH_TOKEN;
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
