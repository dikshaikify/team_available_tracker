const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const seedPath = path.join(__dirname, "seed-data.json");
  const raw = fs.readFileSync(seedPath, "utf-8");
  const team = JSON.parse(raw);

  for (const m of team) {
    await prisma.teamMember.upsert({
      where:  { email: m.email },       // ? use email, not id
      update: {
        name:       m.name,
        role:       m.role,
        status:     m.status,
        timezone:   m.timezone,
        statusNote: m.statusNote ?? null,
      },
      create: {
        name:       m.name,
        email:      m.email,
        role:       m.role,
        status:     m.status,
        timezone:   m.timezone,
        statusNote: m.statusNote ?? null,
      },
    });
  }
  console.log(`Seeded ${team.length} team members`);

  // Default users for login
  const users = [
    { email: "admin@team.io",  password: "admin123",  role: "admin"  },
    { email: "member@team.io", password: "member123", role: "member" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: {
        email:        u.email,
        passwordHash: await bcrypt.hash(u.password, 10),
        role:         u.role,
      },
    });
  }
  console.log("Seeded default users");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
