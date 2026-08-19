const { createClient } = require("@libsql/client");

function createDb() {
  return createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN
  });
}

function logDbError(scope, error) {
  console.error(`[zbig][db] ${scope}:`, error);
}

async function getOne(db, sql, params = []) {
  try {
    const result = await db.execute({ sql, args: params });
    return result.rows[0] || null;
  } catch (error) {
    logDbError("getOne", error);
    throw error;
  }
}

async function getAll(db, sql, params = []) {
  try {
    const result = await db.execute({ sql, args: params });
    return result.rows || [];
  } catch (error) {
    logDbError("getAll", error);
    throw error;
  }
}

async function run(db, sql, params = []) {
  try {
    return await db.execute({ sql, args: params });
  } catch (error) {
    logDbError("run", error);
    throw error;
  }
}

module.exports = { createDb, getOne, getAll, run };
