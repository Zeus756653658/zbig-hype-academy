const express = require("express");
const { getOne, getAll } = require("../lib/db");
const router = express.Router();

function revive(row) {
  return {
    ...row,
    learning_outcomes: row.learning_outcomes ? JSON.parse(row.learning_outcomes) : [],
    requirements: row.requirements ? JSON.parse(row.requirements) : [],
    modules: row.modules ? JSON.parse(row.modules) : []
  };
}

router.get("/", async (req, res) => {
  const db = req.app.locals.db;
  const { q = "", category = "" } = req.query;
  const params = [];
  let sql = "SELECT * FROM courses WHERE 1=1";
  if (q) { sql += " AND (LOWER(title) LIKE ? OR LOWER(short_description) LIKE ?)"; params.push(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`); }
  if (category) { sql += " AND category = ?"; params.push(category); }
  sql += " ORDER BY id DESC";
  res.json({ courses: (await getAll(db, sql, params)).map(revive) });
});

router.get("/:slug", async (req, res) => {
  const db = req.app.locals.db;
  const course = await getOne(db, "SELECT * FROM courses WHERE slug = ?", [req.params.slug]);
  if (!course) return res.status(404).json({ error: "Course not found" });
  res.json(revive(course));
});

module.exports = router;
