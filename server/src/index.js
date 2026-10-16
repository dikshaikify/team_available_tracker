const express = require("express");
const http = require("http");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

console.log("🔥 INDEX.JS LOADED AT", new Date().toISOString());

app.use(cors());
app.use(express.json());

// ---- DEMO LOGIN — accepts ANY email + password ----
app.post("/api/auth/login", async (req, res) => {
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

  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.json({ token, user: { id: user.id, email: user.email } });
});

// ---- Auth middleware ----
const auth = (req, res, next) => {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!t) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(t, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ---- Members ----
app.get("/api/members", auth, async (_req, res) => {
  res.json(await prisma.teamMember.findMany({ orderBy: { id: "asc" } }));
});

app.patch("/api/members/:id/status", auth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["available", "busy", "away", "offline"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const updated = await prisma.teamMember.update({
      where: { id: Number(id) },
      data: { status },
    });
    io.emit("member:updated", updated);
    res.json(updated);
  } catch {
    res.status(404).json({ error: "Member not found" });
  }
});

// ---- Socket.IO ----
io.use((socket, next) => {
  try {
    socket.user = jwt.verify(socket.handshake.auth?.token, JWT_SECRET);
    next();
  } catch {
    next(new Error("Unauthorized socket"));
  }
});

io.on("connection", (s) => console.log("WS:", s.user.email));

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`API + WS on :${PORT}`));
