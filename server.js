require("dotenv").config();
const path = require("path");
const express = require("express");
const courseSeed = require("./data/courses");
const { createDb, getOne, run } = require("./lib/db");

const app = express();
const PORT = process.env.PORT || 3000;
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const hasDatabaseAuthToken = Boolean(process.env.DATABASE_AUTH_TOKEN);
const db = hasDatabaseUrl && hasDatabaseAuthToken ? createDb() : null;

console.info("[zbig] booting Express app");
console.info(`[DB] DATABASE_URL configured: ${hasDatabaseUrl}`);
console.info(`[DB] DATABASE_AUTH_TOKEN configured: ${hasDatabaseAuthToken}`);
console.info(`[zbig] db provider: ${hasDatabaseUrl ? "cloud" : "unconfigured"}`);

if (db) {
  db.execute({ sql: "SELECT 1" })
    .then(() => console.info("[DB] connection test: success"))
    .catch((error) => {
      console.info("[DB] connection test: failure");
      logSafeDatabaseError("startup connection test failed", error);
    });
}

function getMissingDatabaseConfig() {
  const missing = [];
  if (!hasDatabaseUrl) missing.push("DATABASE_URL");
  if (!hasDatabaseAuthToken) missing.push("DATABASE_AUTH_TOKEN");
  return missing;
}

function logSafeDatabaseError(scope, error) {
  console.error(`[DB] ${scope}:`, error);
}

function reviveCourse(row) {
  if (!row) return null;
  return {
    ...row,
    learning_outcomes: row.learning_outcomes ? JSON.parse(row.learning_outcomes) : [],
    requirements: row.requirements ? JSON.parse(row.requirements) : [],
    modules: row.modules ? JSON.parse(row.modules) : []
  };
}

async function initDb(client = db) {
  if (!client) {
    throw new Error("Database client is not configured.");
  }

  console.info("[zbig][db] initializing schema");
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      short_description TEXT,
      full_description TEXT,
      instructor TEXT,
      duration TEXT,
      lessons_count INTEGER,
      level TEXT,
      price REAL,
      category TEXT,
      image TEXT,
      learning_outcomes TEXT,
      requirements TEXT,
      modules TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS payment_confirmations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      transaction_id TEXT NOT NULL,
      course_slug TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending Verification',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_slug TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, course_slug)
    )`,
    `CREATE TABLE IF NOT EXISTS lesson_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_slug TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      completed_at TEXT,
      UNIQUE(user_id, course_slug, lesson_id)
    )`
  ];

  for (const sql of statements) {
    await run(client, sql);
  }

  console.info("[zbig][db] seeding courses idempotently");
  for (const course of courseSeed) {
    await run(
      client,
      `INSERT INTO courses (
        slug, title, short_description, full_description, instructor,
        duration, lessons_count, level, price, category, image,
        learning_outcomes, requirements, modules
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        short_description = excluded.short_description,
        full_description = excluded.full_description,
        instructor = excluded.instructor,
        duration = excluded.duration,
        lessons_count = excluded.lessons_count,
        level = excluded.level,
        price = excluded.price,
        category = excluded.category,
        image = excluded.image,
        learning_outcomes = excluded.learning_outcomes,
        requirements = excluded.requirements,
        modules = excluded.modules`,
      [
        course.slug,
        course.title,
        course.short_description,
        course.full_description,
        course.instructor,
        course.duration,
        course.lessons_count,
        course.level,
        course.price,
        course.category,
        course.image,
        JSON.stringify(course.learning_outcomes),
        JSON.stringify(course.requirements),
        JSON.stringify(course.modules)
      ]
    );
  }
  const seededCount = await getOne(client, "SELECT COUNT(*) AS count FROM courses");
  console.info(`[zbig][db] course count after seed sync: ${Number(seededCount.count)}`);
}

async function diagnoseDatabase() {
  const missing = getMissingDatabaseConfig();
  if (missing.length > 0) {
    return { status: 503, body: { ok: false, database: "configuration_error", missing } };
  }

  const client = createDb();

  try {
    await client.execute({ sql: "SELECT 1" });
    console.info("[DB] connection test: success");
  } catch (error) {
    console.info("[DB] connection test: failure");
    logSafeDatabaseError("connection test failed", error);
    return { status: 503, body: { ok: false, database: "connection_error" } };
  }

  try {
    await initDb(client);
    const row = await getOne(client, "SELECT COUNT(*) AS count FROM courses");
    return { status: 200, body: { ok: true, database: "connected", courses: Number(row.count) } };
  } catch (error) {
    logSafeDatabaseError("bootstrap/query failed", error);
    return { status: 503, body: { ok: false, database: "query_error" } };
  }
}

app.use(express.json());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));
app.use(express.static(path.join(__dirname, "public")));

const ready = db ? initDb() : Promise.resolve();

app.use(async (req, res, next) => {
  if (req.path === "/api/health") {
    return next();
  }
  try {
    await ready;
    next();
  } catch (error) {
    console.error("[zbig] bootstrap error:", error.message);
    next(error);
  }
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/learn", require("./routes/learning"));
app.use("/api/payment", require("./routes/payments"));

app.get("/api/health", async (req, res) => {
  const result = await diagnoseDatabase();
  res.status(result.status).json(result.body);
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API route not found" });
  next();
});

app.get("/api/debug/course/:slug", async (req, res) => {
  const row = await getOne(db, "SELECT * FROM courses WHERE slug = ?", [req.params.slug]);
  res.json({ course: reviveCourse(row) });
});

app.use((error, req, res, next) => {
  console.error("[zbig] request error:", error);
  if (req.path && req.path.startsWith("/api/")) {
    return res.status(500).json({ error: "Internal server error" });
  }
  next(error);
});

if (require.main === module) {
  ready
    .then(() => app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`)))
    .catch((error) => {
      console.error("[zbig] startup error:", error);
      process.exit(1);
    });
}

module.exports = app;
