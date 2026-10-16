const express = require("express");
const prisma = require("./db");
const { requireAuth } = require("./auth");

const STATUSES = ["available", "busy", "away", "offline"];

function validTimezone(tz) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

module.exports = function membersRouter(io) {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", async (req, res) => {
    const members = await prisma.teamMember.findMany({ orderBy: { name: "asc" } });
    res.json(members);
  });

  router.post("/", async (req, res) => {
    const { name, email, role, timezone = "UTC", status = "available", statusNote } = req.body || {};
    if (!name || !email || !role) {
      return res.status(400).json({ error: "name, email and role are required" });
    }
    if (!STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status" });
    if (!validTimezone(timezone)) return res.status(400).json({ error: "Invalid timezone" });
    try {
      const member = await prisma.teamMember.create({
        data: { name, email, role, timezone, status, statusNote: statusNote || null },
      });
      io.emit("member:created", member);
      res.status(201).json(member);
    } catch (e) {
      if (e.code === "P2002") return res.status(409).json({ error: "Email already exists" });
      throw e;
    }
  });

  router.patch("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { name, email, role, timezone, status, statusNote } = req.body || {};
    if (status !== undefined && !STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    if (timezone !== undefined && !validTimezone(timezone)) {
      return res.status(400).json({ error: "Invalid timezone" });
    }
    const data = {};
    for (const [k, v] of Object.entries({ name, email, role, timezone, status, statusNote })) {
      if (v !== undefined) data[k] = v === "" && k === "statusNote" ? null : v;
    }
    try {
      const member = await prisma.teamMember.update({ where: { id }, data });
      io.emit("member:updated", member);
      res.json(member);
    } catch (e) {
      if (e.code === "P2025") return res.status(404).json({ error: "Member not found" });
      if (e.code === "P2002") return res.status(409).json({ error: "Email already exists" });
      throw e;
    }
  });

  router.patch("/:id/status", async (req, res) => {
    const id = Number(req.params.id);
    const { status, statusNote } = req.body || {};
    if (!STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status" });
    try {
      const member = await prisma.teamMember.update({
        where: { id },
        data: { status, statusNote: statusNote || null },
      });
      io.emit("member:updated", member);
      res.json(member);
    } catch (e) {
      if (e.code === "P2025") return res.status(404).json({ error: "Member not found" });
      throw e;
    }
  });

  router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    try {
      await prisma.teamMember.delete({ where: { id } });
      io.emit("member:deleted", { id });
      res.status(204).end();
    } catch (e) {
      if (e.code === "P2025") return res.status(404).json({ error: "Member not found" });
      throw e;
    }
  });

  return router;
};
