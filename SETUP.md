# MillStream ERP — Complete Setup & Run Guide

> **Compiled from all agent outputs (Agent 0 → Agent 4).**
> Follow every step in order. Skipping a step will break the app.

---

## Prerequisites

| Tool | Minimum Version | Check command |
|------|----------------|---------------|
| Node.js | 18.x+ | `node -v` |
| npm | 9.x+ | `npm -v` |
| Python | 3.11+ | `python --version` |
| pip | latest | `pip --version` |
| Git | any | `git --version` |

---

---

## PHASE 1 — External Services Setup (Manual Steps)

> These are the services you must create/configure **before** touching any code.

---

### 1.1 Supabase PostgreSQL Database

> **This is the single database shared by both the `backend` and `ai-service`.**

1. Go to [https://supabase.com](https://supabase.com) and create a free account.
2. Click **New Project**, choose your organization, set a **strong database password** (save it!), and pick a region close to you.
3. Wait ~2 minutes for the project to provision.
4. In the Supabase dashboard, go to **Project Settings → Database**.
5. Under **Connection string → URI**, switch the tab to **Transaction Pooler (port 6543)** — copy that URL. It looks like:

   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

6. You will paste this URL into the `DATABASE_URL` fields in the `.env` files below.

> **Optional (for AI RAG service):** Create a **read-only database role** in Supabase SQL Editor:
> ```sql
> CREATE ROLE readonly_user WITH LOGIN PASSWORD 'your_readonly_pass';
> GRANT CONNECT ON DATABASE postgres TO readonly_user;
> GRANT USAGE ON SCHEMA public TO readonly_user;
> GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
> ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;
> ```
> Then build a connection string for this user to use as `DATABASE_URL_READONLY`.

---

### 1.2 Upstash Redis (for BullMQ Async Workers)

> **Required for background jobs, email reports, and cron tasks.**

1. Go to [https://upstash.com](https://upstash.com) and sign in with GitHub/Google.
2. Click **Create Database**, choose **Redis**, name it `millstream-redis`, and pick the same region as Supabase.
3. After creation, open the database and scroll to **REST API** or **Connect** tab.
4. Copy the **Redis URL (TLS)** — it looks like:

   ```
   rediss://default:[PASSWORD]@[host].upstash.io:6379
   ```

5. This goes into `REDIS_URL` in `backend/.env`.

> **Note:** If `REDIS_URL` is not set, the backend will still start but background jobs (BullMQ, cron, email reports) will be **silently disabled**. The API itself will work.

---

### 1.3 Gmail App Password (for Email Reports)

> The backend uses Nodemailer to send monthly financial report emails.

1. Go to your Google Account → **Security**.
2. Enable **2-Step Verification** if not already on.
3. Search for **"App Passwords"** and generate one for **Mail / Windows Computer** (or any device).
4. Copy the 16-character password — this is your `SMTP_PASS`.

---

### 1.4 OpenAI API Key (for RAG Chat Assistant)

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys).
2. Click **Create new secret key**, copy it immediately (shown only once).
3. This goes into `OPENAI_API_KEY` in `ai-service/.env`.

---

### 1.5 Alpha Vantage API Key (for Smart Procurement)

1. Go to [https://www.alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key).
2. Fill in the free form to get a key instantly.
3. This goes into `ALPHA_VANTAGE_API_KEY` in `ai-service/.env`.

---

---

## PHASE 2 — Environment Files Setup (Manual File Edits)

> Create a `.env` file in each service folder by copying the `.env.example` and filling in real values.

---

### 2.1 Backend `.env`

**File to create:** `c:\Users\lenovo\Desktop\Projects\ERP Project\backend\.env`

Copy `backend/.env.example` to `backend/.env` and fill in:

```env
# ─── Database ───────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# ─── JWT ─────────────────────────────────────────────────────────────────────
JWT_SECRET="replace_with_a_very_long_random_string_at_least_256_bits"
JWT_EXPIRES_IN="7d"

# ─── Server ──────────────────────────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ─── Redis / Upstash ─────────────────────────────────────────────────────────
REDIS_URL="rediss://default:[YOUR-UPSTASH-PASSWORD]@[YOUR-HOST].upstash.io:6379"

# ─── Email / SMTP (Nodemailer) ────────────────────────────────────────────────
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-gmail@gmail.com"
SMTP_PASS="your-16-char-gmail-app-password"
ADMIN_EMAIL="admin@millstream.com"

# ─── Processing Fee Rates (PKR per kg) ───────────────────────────────────────
FEE_RATE_FLOUR=2.5
FEE_RATE_BRAN=1.0
FEE_RATE_SEMOLINA=3.0

# ─── Admin Bootstrap Credentials (used by seed script) ───────────────────────
ADMIN_PHONE="03000000000"
ADMIN_PASSWORD="AdminPassword@123"
ADMIN_NAME="Mill Admin"
```

> **Where to edit:** `backend/.env` (create new file, do not edit `.env.example`)

---

### 2.2 AI Service `.env`

**File to create:** `c:\Users\lenovo\Desktop\Projects\ERP Project\ai-service\.env`

Copy `ai-service/.env.example` to `ai-service/.env` and fill in:

```env
# ─── Database ───────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Optional: If you created a read-only role (see 1.1 above), put it here.
# If left empty, it defaults to DATABASE_URL.
DATABASE_URL_READONLY=postgresql://readonly_user:[READONLY-PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# ─── LLM API ─────────────────────────────────────────────────────────────────
OPENAI_API_KEY=sk-proj-...your-openai-key...
LLM_MODEL=gpt-4o-mini

# ─── Commodity API ───────────────────────────────────────────────────────────
ALPHA_VANTAGE_API_KEY=your-alphavantage-key

# ─── CORS ────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5000

# ─── Service Config ──────────────────────────────────────────────────────────
APP_ENV=development
LOG_LEVEL=info
PORT=8000
```

> **Where to edit:** `ai-service/.env` (create new file)

---

### 2.3 Frontend `.env`

**File to create:** `c:\Users\lenovo\Desktop\Projects\ERP Project\frontend\.env`

Copy `frontend/.env.example` to `frontend/.env` and fill in:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_AI_SERVICE_URL=http://localhost:8000
```

> These are already correct for local development — only change if you deploy backend/ai-service to a remote URL.

> **Where to edit:** `frontend/.env` (create new file)

---

---

## PHASE 3 — Install All Dependencies

> Run these commands from the **ERP Project root folder** in separate terminals.

### 3.1 Backend Node.js Dependencies

```powershell
cd "c:\Users\lenovo\Desktop\Projects\ERP Project\backend"
npm install
```

### 3.2 Frontend Dependencies

```powershell
cd "c:\Users\lenovo\Desktop\Projects\ERP Project\frontend"
npm install
```

### 3.3 AI Service Python Dependencies

```powershell
cd "c:\Users\lenovo\Desktop\Projects\ERP Project\ai-service"
pip install -r requirements.txt
```

> **Note:** `prophet` and `pystan` take a long time to compile. Be patient (~5-10 min).
> If `prophet` fails on Windows, try:
> ```powershell
> pip install pystan==3.7.0
> pip install prophet==1.1.4
> ```

---

---

## PHASE 4 — Database Migration & Seeding (Manual DB Steps)

> These commands push the Prisma schema to your Supabase PostgreSQL database and seed initial data.

### 4.1 Generate Prisma Client

```powershell
cd "c:\Users\lenovo\Desktop\Projects\ERP Project\backend"
npx prisma generate
```

### 4.2 Run Database Migration

> This creates all tables in your Supabase database.

```powershell
cd "c:\Users\lenovo\Desktop\Projects\ERP Project\backend"
npx prisma migrate dev --name init
```

> **If you get a prompt**, type the migration name as `init` and press Enter.
> **If migration fails** with "shadow database" error on Supabase, use:
> ```powershell
> npx prisma db push
> ```

### 4.3 Seed the Database

> This creates the admin user account and default inventory items.

```powershell
cd "c:\Users\lenovo\Desktop\Projects\ERP Project\backend"
npm run db:seed
```

**Expected output:**
```
🌾 Seeding MillStream ERP database...

✅ Admin user ready — phone: 03000000000 | millId: ADM-0000
✅ Inventory entry: WHEAT (RAW_MATERIAL)
✅ Inventory entry: FLOUR (PROCESSED_GOOD)
✅ Inventory entry: BRAN (PROCESSED_GOOD)
✅ Inventory entry: SEMOLINA (PROCESSED_GOOD)

🎉 Seed complete. MillStream ERP is ready!
```

> The admin credentials seeded are from your `backend/.env`:
> - **Phone:** whatever you set as `ADMIN_PHONE` (default: `03000000000`)
> - **Password:** whatever you set as `ADMIN_PASSWORD` (default: `AdminPassword@123`)

---

### 4.4 Verify Tables in Supabase (Optional)

Open Prisma Studio to visually inspect your database:

```powershell
cd "c:\Users\lenovo\Desktop\Projects\ERP Project\backend"
npx prisma studio
```

This opens a browser UI at `http://localhost:5555`. Confirm tables `User`, `CustomerProfile`, `VaultAccount`, `Inventory`, `TransactionLedger`, `AI_Forecasts`, `CommodityPrices` all exist.

---

---

## PHASE 5 — Running the Application

> Open **3 separate terminal windows/tabs** simultaneously.

---

### Terminal 1 — Backend API Server (Port 5000)

```powershell
cd "c:\Users\lenovo\Desktop\Projects\ERP Project\backend"
npm run dev
```

**Expected startup output:**
```
🌾 MillStream ERP API running on http://localhost:5000
   Environment: development
   Health check: http://localhost:5000/api/health
[Redis] Connected.
[Jobs] Cron scheduler and report worker initialized.
```

> If Redis is not configured, you'll see `[Jobs] REDIS_URL not set — background jobs (BullMQ) are disabled.` — This is OK for testing.

**Verify:** Open browser → `http://localhost:5000/api/health`

---

### Terminal 2 — AI Microservice (Port 8000)

```powershell
cd "c:\Users\lenovo\Desktop\Projects\ERP Project\ai-service"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Expected startup output:**
```
🤖  MillStream AI Service starting up…
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Verify:** Open browser → `http://localhost:8000/health`
**API Docs:** Open browser → `http://localhost:8000/docs` (FastAPI Swagger UI)

---

### Terminal 3 — Frontend Dev Server (Port 5173)

```powershell
cd "c:\Users\lenovo\Desktop\Projects\ERP Project\frontend"
npm run dev
```

**Expected startup output:**
```
  VITE v5.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

**Open the app:** [http://localhost:5173](http://localhost:5173)

---

### Terminal 4 (Optional) — BullMQ Background Worker

> Only needed if Redis is configured and you want async email report processing.

```powershell
cd "c:\Users\lenovo\Desktop\Projects\ERP Project\backend"
npm run dev:worker
```

---

---

## PHASE 6 — First Login

Once all 3 services are running, open [http://localhost:5173](http://localhost:5173):

| Role | Phone | Password | Portal |
|------|-------|----------|--------|
| **Admin** | `03000000000` | `AdminPassword@123` | All admin pages |
| **Customer** | (register via `/register`) | (self-set) | Customer portal |

> Admin credentials come from `backend/.env` → `ADMIN_PHONE` and `ADMIN_PASSWORD`.

---

---

## Quick Reference — All Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend App | `http://localhost:5173` | Main React UI |
| Backend API | `http://localhost:5000/api` | REST API |
| Backend Health | `http://localhost:5000/api/health` | Health check |
| AI Service | `http://localhost:8000` | FastAPI AI |
| AI Health | `http://localhost:8000/health` | Health check |
| AI Docs | `http://localhost:8000/docs` | Swagger UI |
| Prisma Studio | `http://localhost:5555` | DB viewer (run separately) |

---

---

## Troubleshooting

### `prisma migrate dev` fails with "shadow database" error
Use `npx prisma db push` instead — Supabase free tier doesn't support shadow databases.

### `REDIS_URL not set` warning
The app still works. BullMQ jobs (monthly email reports) are disabled. Add a real Upstash Redis URL to enable them.

### Prophet/pystan installation fails on Windows
Install via conda: `conda install -c conda-forge prophet`
Or try: `pip install prophet --no-build-isolation`

### Frontend shows blank page / network errors
Confirm `frontend/.env` has `VITE_API_BASE_URL=http://localhost:5000/api` and the backend is running.

### AI service returns 500 on `/chat`
Ensure `OPENAI_API_KEY` is valid and `DATABASE_URL` is set correctly in `ai-service/.env`.

---

## Summary of All `.env` Files to Create

| File Path | Variables to Fill |
|-----------|------------------|
| `backend/.env` | `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, `SMTP_USER`, `SMTP_PASS`, `ADMIN_PHONE`, `ADMIN_PASSWORD` |
| `ai-service/.env` | `DATABASE_URL`, `OPENAI_API_KEY`, `ALPHA_VANTAGE_API_KEY` |
| `frontend/.env` | `VITE_API_BASE_URL`, `VITE_AI_SERVICE_URL` *(already correct for local dev)* |
