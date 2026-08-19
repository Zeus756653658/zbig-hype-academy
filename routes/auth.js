const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getOne, run } = require("../lib/db");

const router = express.Router();

function safeUser(user) {
  return { id: user.id, name: user.name, email: user.email, created_at: user.created_at };
}

router.post("/signup", async (req, res) => {
  const db = req.app.locals.db;
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password are required" });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

  const existing = await getOne(db, "SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = bcrypt.hashSync(password, 10);
  const info = await run(db, "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", [name.trim(), email.toLowerCase(), passwordHash]);
  const user = await getOne(db, "SELECT id, name, email, created_at FROM users WHERE id = ?", [info.lastInsertRowid]);
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: safeUser(user) });
});

router.post("/login", async (req, res) => {
  const db = req.app.locals.db;
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  const user = await getOne(db, "SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: "Invalid email or password" });
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: safeUser(user) });
});

router.get("/me", require("../middleware/auth"), async (req, res) => {
  const db = req.app.locals.db;
  const user = await getOne(db, "SELECT id, name, email, created_at FROM users WHERE id = ?", [req.user.id]);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: safeUser(user) });
});

module.exports = router;
