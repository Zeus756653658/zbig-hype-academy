const express = require("express");
const auth = require("../middleware/auth");
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

router.get("/", auth, async (req, res) => {
  const db = req.app.locals.db;
  const user = await getOne(db, "SELECT id, name, email, created_at FROM users WHERE id = ?", [req.user.id]);
  const enrollments = await getAll(db, "SELECT * FROM enrollments WHERE user_id = ? ORDER BY enrolled_at DESC", [req.user.id]);
  const progress = await getAll(db, "SELECT course_slug, COUNT(*) AS completed_lessons FROM lesson_progress WHERE user_id = ? AND completed = 1 GROUP BY course_slug", [req.user.id]);
  const progressMap = new Map(progress.map((p) => [p.course_slug, p.completed_lessons]));
  const courses = [];
  for (const enrollment of enrollments) {
    const course = revive(await getOne(db, "SELECT * FROM courses WHERE slug = ?", [enrollment.course_slug]));
    if (!course) continue;
    const totalLessons = course ? course.lessons_count : 0;
    const completed = progressMap.get(enrollment.course_slug) || 0;
    courses.push({ ...course, enrollment_status: enrollment.status, completed_lessons: completed, total_lessons: totalLessons, progress_percent: totalLessons ? Math.round((completed / totalLessons) * 100) : 0 });
  }
  res.json({ user, enrolled_courses: courses, progress, completed_lessons: progress.reduce((a, b) => a + Number(b.completed_lessons), 0), total_lessons: courses.reduce((a, c) => a + c.total_lessons, 0), continue_learning: courses.find((c) => c.enrollment_status === "active") || courses[0] || null });
});

module.exports = router;
