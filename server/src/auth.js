const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const express = require("express");
const prisma = require("./db");

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  console.error("JWT_SECRET is not set. Copy .env.example to .env first.");
  process.exit(1);
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "12h",
  });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

// Express middleware
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

const router = express.Router();

// ---------------------------------------------------------------
// DEMO MODE LOGIN
// Accepts ANY email + password. If the email doesn't exist in the
// database, a new user record is created on the fly. Returns a
// signed JWT so the dashboard can be reached.
//
// For production, revert to bcrypt.compare-only validation.
// ---------------------------------------------------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: "member",
      },
    });
  }

  res.json({
    token: signToken(user),
    user: { id: user.id, email: user.email },
  });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: { id: req.user.sub, email: req.user.email } });
});

module.exports = { router, requireAuth, verifyToken };