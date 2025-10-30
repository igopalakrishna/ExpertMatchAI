# AI‑Driven Expert Matching 

A production‑quality **full‑stack prototype**: searchable expert directory + **“Get Matched”** flow with transparent match scores and
“Why this match?” explanations. Containerized, seedable, and demo‑ready.

> **Stack:** Next.js 14 + TypeScript + Tailwind + shadcn/ui • FastAPI (Python) • PostgreSQL + Prisma • FAISS + sentence‑transformers (semantic) with BM25 fallback • Docker Compose • Playwright/Vitest/PyTest

---
## 🔨 Tech Stack
- Frontend: Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui primitives, lucide-react
- Auth: NextAuth (Credentials)
- DB/ORM: PostgreSQL + Prisma
- Matching: FastAPI (sentence-transformers/all-MiniLM-L6-v2 + FAISS), TS BM25 fallback (wink-bm25)
- Infra: Docker Compose (db, api, web), Makefile
- Testing: Playwright (E2E), Vitest (unit), PyTest (backend)

## ✨ Features

* **AI Match %**: Combines semantic similarity (embeddings), BM25 keywords, and filter bonuses (geo/specialty/license) into one score.
* **Explainability**: “**Why this match?**” shows top matched terms and weights.
* **Expert Profiles**: Qualifications, current/completed projects, ratings, donut gauge.
* **Admin CSV Ingest**: Upload/ingest experts and rebuild the vector index.
* **Resilient**: BM25‑only mode works without the Python service.
* **Containerized**: `docker compose up` brings up **web**, **api**, and **db**.

---

## 📸 Screenshots

* Marketing hero & carousel: `apps/web/app/(marketing)/page.tsx`
* Search results with **Match %** badge: `apps/web/app/search/page.tsx`
* Expert profile with donut gauge + **Why this match?**: `apps/web/app/experts/[id]/page.tsx`
* Optional images you can view (example paths):

  * `apps/web/public/images/wireframes/search-wireframe.png`
  * `apps/web/public/images/wireframes/profile-wireframe.png`

> Tip: keep filenames **kebab‑case** without spaces. Place assets under `apps/web/public/images/...`.

---

## 🧱 Architecture & Layout

```
apps/
  web/                 # Next.js app (App Router, API routes, UI)
backend/
  app/                 # FastAPI: /embed, /search, /index/build
  scripts/             # build_index.py, ingest helpers
prisma/                # Prisma schema & migrations
scripts/               # seed.ts (CSV import + index build trigger)
data/                  # CSV goes here (not committed)
vectorstore/           # FAISS/TF‑IDF artifacts (generated)
```

**Data flow:** CSV → Prisma seed → Postgres → FastAPI builds FAISS index → `/api/search` blends **semantic + BM25 + filters** → UI renders cards with **Match %** and explanations.

---

## 🧰 Tech Stack

* **Frontend:** Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui, lucide-react
* **Auth:** NextAuth (Credentials)
* **DB/ORM:** PostgreSQL + Prisma
* **Matching:** FastAPI + `sentence-transformers/all-MiniLM-L6-v2` + **FAISS** (cosine), **BM25** fallback (wink-bm25)
* **Infra:** Docker Compose (db/api/web), Makefile, `.env` templates
* **Testing:** Playwright (E2E), Vitest (unit), PyTest (backend)

---

## 🔐 Environment

Create an `.env` at the repo root (commit a safe `.env.example`; **never commit real secrets**). Use **`db`** host in Docker; **`localhost`** when running everything on your machine.

```dotenv
# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-random-secret

# Database
# For Docker:
# DATABASE_URL=postgresql://postgres:postgres@db:5432/daidaex?schema=public
# For local (no Docker):
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/daidaex?schema=public

# Recommender API (FastAPI)
RECO_API_URL=http://localhost:8000

# Match weights (semantic / keywords / filters)
MATCH_W_SEM=0.6
MATCH_W_KW=0.25
MATCH_W_FILT=0.15

# Fallback mode (no Python backend)
BM25_ONLY=false

# Admin seed (optional for demo)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

Create `backend/.env` for the Python service:

```dotenv
MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
VECTOR_INDEX_PATH=./vectorstore/experts.index
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000
```

---

## 🚀 Quick Start — Docker (Recommended)

> **Prereqs:** Docker Desktop (or Engine). `pnpm` is optional (used inside the containers).

1. **Add data**

   ```bash
   mkdir -p data
   # place your CSV at: ./data/construction_companies_enriched_v2.csv
   ```
2. **Start services**

   ```bash
   make up
   # or: docker compose up --build -d
   ```
3. **Migrate & seed**

   ```bash
   make seed
   # (runs prisma migrate + seed + triggers index build)
   ```
4. **Open the app** → [http://localhost:3000](http://localhost:3000)

**Services**: db (Postgres 15), api (FastAPI :8000), web (Next.js :3000). Health checks ensure web waits for db/api.

**Health checks**

```bash
curl http://localhost:3000/api/health
curl http://localhost:8000/health
```

---

## 💻 Quick Start — Local (No Docker)

> **Prereqs:** Node 20+, pnpm, Python 3.11+, Postgres running locally.

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate

# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload

# Web (new terminal)
cd ../apps/web
pnpm dev

# Seed (repo root, new terminal)
pnpm seed
```

Open [http://localhost:3000](http://localhost:3000) and try a query like:

```
Looking for architect that specializes in sandstone in Wilmington, NC
```

---

## 📥 Data Ingestion

* Place CSV at `./data/construction_companies_enriched_v2.csv`
* Supported columns: `company_name, contact_number, categories, description, city, state, lat, lon, rating, years_experience, thumbnail_url, certifications, specialties`
* Multi‑value fields split on `|` or `,`
* Missing `thumbnail_url` → ui‑avatars placeholder

---

## 🔌 API Overview

### `POST /api/search`

**Body**

```json
{
  "query": "architect sandstone in Wilmington, NC",
  "filters": {"state": "NC", "city": "Wilmington", "specialties": ["Sandstone", "Masonry"], "minRating": 4.0},
  "limit": 24,
  "offset": 0
}
```

**Response (excerpt)**

```json
{
  "results": [
    {
      "id": "exp_123",
      "name": "Sarah Carver",
      "city": "Charlotte",
      "state": "NC",
      "specialties": ["Stone Mason", "Restoration"],
      "rating": 4.5,
      "thumbnailUrl": "/images/experts/sarah.jpg",
      "match": { "score": 90.2, "explain": ["sandstone (0.27)", "masonry (0.19)", "Wilmington→NC proximity (0.14)"] }
    }
  ],
  "total": 128,
  "tookMs": 45
}
```

### `GET /api/experts/:id`

Returns full profile. Add `?q=...` to return query‑specific explanation.

---

## 🧪 Tests

* **Web unit (Vitest)**

  ```bash
  pnpm --filter @daidaex/web test
  ```
* **E2E (Playwright)** — app must be running

  ```bash
  pnpm --filter @daidaex/web test:e2e
  # If browsers missing:
  # npx playwright install
  ```
* **Backend (PyTest)**

  ```bash
  cd backend
  pytest
  ```

---

## 🛠️ Troubleshooting

### Apple Silicon (M1/M2)

* **FAISS wheels**: if `faiss-cpu` fails to install, prefer Docker. Otherwise try:

  * `pip install faiss-cpu==1.7.4` (often better aarch64 support), or
  * `conda install -c conda-forge faiss-cpu`.
* **Docker build**: set explicit platform if needed:

  ```yaml
  services:
    api:
      platform: linux/amd64
  ```
* **Slow model download**: pre‑warm by hitting `/embed` once, or run backend locally to cache the model.

### Windows / WSL2

* Use WSL2 (Ubuntu) with Docker Desktop integration.
* Run commands inside WSL; ensure Node 20+ and pnpm are installed there.
* If volume mounts are slow, keep the repo in the WSL filesystem (`~/`), not on a Windows drive.
* Playwright E2E may require `npx playwright install`.

### Common

* **Port conflicts**: change ports in `docker-compose.yml` or env.
* **Seed errors**: verify CSV path and headers; check `DATABASE_URL` connectivity.
* **Backend down**: set `BM25_ONLY=true` to run without FastAPI.

---

## 📝 DO‑Sheet (Copy/Paste)

* Bring up the stack

  ```bash
  make up
  ```
* Seed data & build FAISS

  ```bash
  make seed
  ```
* Open the app

  ```bash
  open http://localhost:3000
  ```
* Search demo

  ```bash
  open "http://localhost:3000/search?q=sandstone%20Wilmington"
  ```
* Run tests (web unit, E2E, backend)

  ```bash
  pnpm --filter @daidaex/web test
  pnpm --filter @daidaex/web test:e2e
  (cd backend && pytest)
  ```
* Drop + reseed

  ```bash
  make down
  make up
  pnpm prisma:migrate
  pnpm seed
  ```
* BM25‑only mode

  ```bash
  export BM25_ONLY=true
  make up
  ```

---

## 🧾 License

MIT. See `LICENSE`.

> **Note:** This repository is a **generic prototype** for AI‑driven expert matching in the construction domain. It does **not** contain any proprietary company code or data.

---
Built with ❤️ for fast demos and credible match quality. PRs and improvements welcome.