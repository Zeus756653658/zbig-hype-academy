require("dotenv").config();
const path = require("path");
const express = require("express");
const courseSeed = require("./data/courses");
const { createDb, getOne, run } = require("./lib/db");

const app = express();
const db = createDb();
const PORT = process.env.PORT || 3000;

app.locals.db = db;
console.info("[zbig] booting Express app");
console.info(`[zbig] db provider: ${process.env.DATABASE_URL ? "cloud" : "local-fallback-dev"}`);

function reviveCourse(row) {
  if (!row) return null;
  return {
    ...row,
    learning_outcomes: row.learning_outcomes ? JSON.parse(row.learning_outcomes) : [],
    requirements: row.requirements ? JSON.parse(row.requirements) : [],
    modules: row.modules ? JSON.parse(row.modules) : []
  };
}

async function initDb() {
  await run(db, `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS courses (
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
    );
    CREATE TABLE IF NOT EXISTS payment_confirmations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      transaction_id TEXT NOT NULL,
      course_slug TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending Verification',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_slug TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, course_slug)
    );
    CREATE TABLE IF NOT EXISTS lesson_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_slug TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      completed_at TEXT,
      UNIQUE(user_id, course_slug, lesson_id)
    );
  `);

  const count = await getOne(db, "SELECT COUNT(*) AS count FROM courses");
  if (!count || Number(count.count) === 0) {
    for (const course of courseSeed) {
      await run(
        db,
        "INSERT INTO courses (slug, title, short_description, full_description, instructor, duration, lessons_count, level, price, category, image, learning_outcomes, requirements, modules) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
  }
}

app.use(express.json());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));
app.use(express.static(path.join(__dirname, "public")));

const ready = initDb();

app.use(async (req, res, next) => {
  try {
    await ready;
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/learn", require("./routes/learning"));
app.use("/api/payment", require("./routes/payments"));

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API route not found" });
  next();
});

app.get("/api/debug/course/:slug", async (req, res) => {
  const row = await getOne(db, "SELECT * FROM courses WHERE slug = ?", [req.params.slug]);
  res.json({ course: reviveCourse(row) });
});

app.use((error, req, res, next) => {
  console.error("[zbig] request error:", error.message);
  if (req.path && req.path.startsWith("/api/")) {
    return res.status(500).json({ error: "Internal server error" });
  }
  next(error);
});

if (require.main === module) {
  ready
    .then(() => app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`)))
    .catch((error) => {
      console.error("[zbig] startup error:", error.message);
      process.exit(1);
    });
}

module.exports = app;
