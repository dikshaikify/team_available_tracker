# Team Availability Tracker

Node + Express + Socket.IO + Prisma backend, React + Tailwind (Vite) frontend.
JWT login, live status updates over WebSockets, seed script for synthetic team data.

```
team-availability-tracker/
  server/   Express API, Socket.IO, Prisma schema, seed script
  client/   React dashboard (Vite + Tailwind)
```

## Quick start (local, SQLite)

Requires Node 18+.

```bash
# 1. Backend
cd server
cp .env.example .env          # then edit JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev                   # http://localhost:4000

# 2. Frontend (new terminal)
cd client
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

Sign in with the seeded user: `admin@example.com` / `password123`
(change via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` before seeding).
Open the app in two browser windows and change a status in one to see the other update live.

## Your own seed data

Replace `server/prisma/seed-data.json` with your file. Each record:

```json
{ "name": "...", "email": "...", "role": "...", "timezone": "Europe/Rome",
  "status": "available | busy | away | offline", "statusNote": "optional" }
```

Then run `npm run seed` again. It upserts by email, so it is safe to re-run.
If your JSON uses different field names, adjust `prisma/seed.js` and `schema.prisma`.

## API

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/auth/login` | `{ email, password }` returns `{ token, user }` |
| GET | `/api/auth/me` | Validates the token |
| GET | `/api/members` | List team members |
| POST | `/api/members` | Create (`name`, `email`, `role`, `timezone`, `status?`) |
| PATCH | `/api/members/:id` | Edit any field |
| PATCH | `/api/members/:id/status` | `{ status, statusNote? }` |
| DELETE | `/api/members/:id` | Remove |
| GET | `/health` | Uptime check |

All `/api/members` routes need `Authorization: Bearer <token>`.

## Real-time layer

Clients connect with `io(API_URL, { auth: { token } })`. The server verifies the JWT
in the handshake and rejects bad tokens. Events broadcast to all clients:
`member:created`, `member:updated`, `member:deleted`.

## Deployment

### Database (PostgreSQL)

1. Create a Postgres database (Railway, Neon, Supabase, etc.).
2. In `server/prisma/schema.prisma` change `provider = "sqlite"` to `provider = "postgresql"`.
3. Delete `server/prisma/migrations` (SQLite migrations don't apply to Postgres).
4. Locally, point `DATABASE_URL` at the Postgres database and run
   `npx prisma migrate dev --name init`, then commit the new `prisma/migrations` folder.

### Backend on Railway

1. Push the repo to GitHub. In Railway create a project from the repo and set the **root directory** to `server`.
2. Add a PostgreSQL plugin; Railway provides `DATABASE_URL`.
3. Set variables: `JWT_SECRET` (long random string), `CLIENT_ORIGIN` (your Vercel URL, no trailing slash), `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.
4. Build command: `npm install && npx prisma migrate deploy`. Start command: `npm start`.
5. Run the seed once from the Railway shell: `npm run seed`.

Railway terminates TLS and supports WebSockets, so Socket.IO works without extra setup.

### Frontend on Vercel

1. Import the repo and set the **root directory** to `client`. Framework preset: Vite.
2. Add the environment variable `VITE_API_URL` = your Railway backend URL (for example `https://tat-server.up.railway.app`).
3. Add a `client/vercel.json` rewrite so deep links work:
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
   ```
   (Included in this project.)
4. Deploy, then add the Vercel URL to `CLIENT_ORIGIN` on Railway and redeploy the backend.

## Notes

- The JWT is stored in `localStorage` for simplicity. For stricter security, move it to an httpOnly cookie.
- There is no sign-up flow; add login users by running the seed script or inserting into the `users` table with a bcrypt hash.
- Status values are validated by the API and stored as strings so the same schema works on SQLite and PostgreSQL.
