const express = require("express");
const auth = require("../middleware/auth");
const { getOne, getAll, run } = require("../lib/db");
const router = express.Router();

function revive(row) {
  return {
    ...row,
    learning_outcomes: row.learning_outcomes ? JSON.parse(row.learning_outcomes) : [],
    requirements: row.requirements ? JSON.parse(row.requirements) : [],
    modules: row.modules ? JSON.parse(row.modules) : []
  };
}

function getFlattenedLessons(course) {
  return course.modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, module_id: module.id, module_title: module.title })));
}

router.get("/:courseSlug", auth, async (req, res) => {
  const db = req.app.locals.db;
  const course = revive(await getOne(db, "SELECT * FROM courses WHERE slug = ?", [req.params.courseSlug]));
  if (!course) return res.status(404).json({ error: "Course not found" });
  const enrollment = await getOne(db, "SELECT * FROM enrollments WHERE user_id = ? AND course_slug = ?", [req.user.id, req.params.courseSlug]);
  if (!enrollment || enrollment.status !== "active") return res.status(403).json({ error: "Access denied. Enrollment is pending verification." });
  const progress = await getAll(db, "SELECT lesson_id, completed FROM lesson_progress WHERE user_id = ? AND course_slug = ?", [req.user.id, req.params.courseSlug]);
  res.json({ course, modules: course.modules, lessons: getFlattenedLessons(course), progress });
});

router.post("/:courseSlug/:lessonId/complete", auth, async (req, res) => {
  const db = req.app.locals.db;
  const course = revive(await getOne(db, "SELECT * FROM courses WHERE slug = ?", [req.params.courseSlug]));
  if (!course) return res.status(404).json({ error: "Course not found" });
  const enrollment = await getOne(db, "SELECT * FROM enrollments WHERE user_id = ? AND course_slug = ?", [req.user.id, req.params.courseSlug]);
  if (!enrollment || enrollment.status !== "active") return res.status(403).json({ error: "Access denied. Enrollment is pending verification." });
  await run(db, "INSERT INTO lesson_progress (user_id, course_slug, lesson_id, completed, completed_at) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP) ON CONFLICT(user_id, course_slug, lesson_id) DO UPDATE SET completed = 1, completed_at = CURRENT_TIMESTAMP", [req.user.id, req.params.courseSlug, req.params.lessonId]);
  const completed = await getOne(db, "SELECT COUNT(*) AS count FROM lesson_progress WHERE user_id = ? AND course_slug = ? AND completed = 1", [req.user.id, req.params.courseSlug]);
  res.json({ success: true, completed_lessons: Number(completed.count), total_lessons: Number(course.lessons_count), progress_percent: Math.round((Number(completed.count) / Number(course.lessons_count)) * 100) });
});

module.exports = router;
