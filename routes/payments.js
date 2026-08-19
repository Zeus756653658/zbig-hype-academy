const express = require("express");
const { getOne, run } = require("../lib/db");
const router = express.Router();

router.post("/confirm", async (req, res) => {
  const db = req.app.locals.db;
  const { user_name, email, phone, transaction_id, course_slug } = req.body || {};
  if (!user_name || !email || !phone || !transaction_id || !course_slug) return res.status(400).json({ error: "All fields are required" });
  const course = await getOne(db, "SELECT slug, title, category, price FROM courses WHERE slug = ?", [course_slug]);
  if (!course) return res.status(404).json({ error: "Course not found" });
  const result = await run(db, "INSERT INTO payment_confirmations (user_name, email, phone, transaction_id, course_slug, amount) VALUES (?, ?, ?, ?, ?, ?)", [user_name.trim(), email.toLowerCase(), phone.trim(), transaction_id.trim(), course_slug, course.price]);
  const user = await getOne(db, "SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
  if (user) {
    await run(db, "INSERT INTO enrollments (user_id, course_slug, status) VALUES (?, ?, 'pending') ON CONFLICT(user_id, course_slug) DO UPDATE SET status = 'pending'", [user.id, course_slug]);
  }
  res.json({ success: true, payment_id: Number(result.lastInsertRowid), status: "Pending Verification", course, amount: Number(course.price) });
});

router.get("/:id", async (req, res) => {
  const db = req.app.locals.db;
  const payment = await getOne(db, "SELECT id, user_name, email, phone, transaction_id, course_slug, amount, status, created_at FROM payment_confirmations WHERE id = ?", [req.params.id]);
  if (!payment) return res.status(404).json({ error: "Payment confirmation not found" });
  const course = await getOne(db, "SELECT slug, title, category FROM courses WHERE slug = ?", [payment.course_slug]);
  res.json({ payment: { ...payment, id: Number(payment.id), amount: Number(payment.amount) }, course });
});

module.exports = router;
