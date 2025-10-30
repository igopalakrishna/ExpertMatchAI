# DaidaEx – AI-driven Expert Matching (Construction)

A production-quality prototype: searchable expert directory + “Get Matched” flow with transparent match scores.

## Screenshots
- Hero and carousel (marketing): `apps/web/app/(marketing)/page.tsx`
- Search results with Match % badge: `apps/web/app/search/page.tsx`
- Expert profile with donut gauge + “Why this match?”: `apps/web/app/experts/[id]/page.tsx`
- Optional images you can view:
  - `apps/web/public/images/Seach wireframe.png`
  - `DaidaEx.png`

## Tech Stack
- Frontend: Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui primitives, lucide-react
- Auth: NextAuth (Credentials)
- DB/ORM: PostgreSQL + Prisma
- Matching: FastAPI (sentence-transformers/all-MiniLM-L6-v2 + FAISS), TS BM25 fallback (wink-bm25)
- Infra: Docker Compose (db, api, web), Makefile
- Testing: Playwright (E2E), Vitest (unit), PyTest (backend)

## Monorepo Layout
- `apps/web/` – Next.js app (API routes + UI)
- `backend/` – FastAPI service (embeddings, FAISS, TF‑IDF)
- `prisma/` – schema.prisma
- `scripts/seed.ts` – CSV import and index build trigger
- `data/` – put your CSV here: `construction_companies_enriched_v2.csv`
- `vectorstore/` – FAISS and TF‑IDF artifacts (generated)

## Environment
Copy to `.env` at repo root (or use `env.example.txt`).

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-random-secret
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/daidaex?schema=public

# Matching weights
MATCH_W_SEM=0.6
MATCH_W_KW=0.25
MATCH_W_FILT=0.15

# FastAPI backend URL
FASTAPI_URL=http://localhost:8000

# Fallback without Python backend
BM25_ONLY=true

# Admin (seeded)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

## Quick Start – Docker
1) Prereqs: Docker Desktop (or Docker Engine), pnpm (for seed convenience)
2) Start services
```
make up
```
3) Seed data (expects CSV at `./data/construction_companies_enriched_v2.csv`)
```
make seed
```
4) Open the app: http://localhost:3000

Notes
- Compose services: db (Postgres 15), api (FastAPI :8000), web (Next.js :3000)
- Health checks ensure web waits for db/api

## Quick Start – Local (no Docker)
1) Prereqs
- Node 20+, pnpm, Python 3.11+, Postgres running locally
2) Install and generate Prisma client
```
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
```
3) Start backend
```
cd backend
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```
4) Start web
```
cd ../apps/web
pnpm dev
```
5) Seed database (from repo root in another terminal)
```
pnpm seed
```

## Data Ingestion
- Place CSV at `./data/construction_companies_enriched_v2.csv`
- Supported columns: `company_name, contact_number, categories, description, city, state, lat, lon, rating, years_experience, thumbnail_url, certifications, specialties`
- Multi-value fields split on `|` or `,`
- Missing `thumbnail_url` → ui-avatars placeholder

## Features
- Marketing homepage: hero + mini carousel
- Search: search bar, filters (state, city, specialties, rating), sorting (best, rating, experience)
- Cards: image, name, city/state, specialties, star rating, Match % badge
- Profile: hero, donut gauge, qualifications, projects, ratings, “Why this match?”
- Matching API: combined scoring (semantic + BM25 + filters) with env-tunable weights
- Admin: CSV upload, rebuild index, stats (counts)

## Tests
- Web unit (Vitest)
```
pnpm --filter @daidaex/web test
```
- E2E (Playwright) – app must be running
```
pnpm --filter @daidaex/web test:e2e
# If browsers missing:
# npx playwright install
```
- Backend (PyTest)
```
cd backend
pytest
```

## Troubleshooting
### Apple Silicon (M1/M2)
- FAISS wheels: if pip install fails on `faiss-cpu`, prefer Docker path. Alternatively try:
  - `pip install faiss-cpu==1.7.4` (known to have better aarch64 support), or
  - Use conda-forge: `conda install -c conda-forge faiss-cpu`.
- Docker build issues: set an explicit platform in `docker-compose.yml` for the backend if needed:
```
services:
  api:
    platform: linux/amd64
```
- Slow model download: pre-warm by running `/embed` once, or start backend locally to download and cache the model.

### Windows / WSL2
- Use WSL2 (Ubuntu) with Docker Desktop integration enabled.
- Run commands inside WSL; ensure Node 20+, pnpm installed in WSL.
- If volume mounts are slow, place repo inside WSL filesystem (`~/`), not the Windows drive.
- Playwright E2E may require: `npx playwright install`.

### Common
- Port conflicts: change ports in `docker-compose.yml` or env.
- Seed errors: verify CSV path and headers; check DATABASE_URL connectivity.
- Backend down: set `BM25_ONLY=true` to run without FastAPI.

## DO-sheet (copy/paste)
- Bring up stack
```
make up
```
- Seed data and build FAISS
```
make seed
```
- Open app
```
open http://localhost:3000
```
- Search demo
```
open "http://localhost:3000/search?q=sandstone%20Wilmington"
```
- Run tests (web unit, E2E, backend)
```
pnpm --filter @daidaex/web test
pnpm --filter @daidaex/web test:e2e
(cd backend && pytest)
```
- Drop + reseed
```
make down
make up
pnpm prisma:migrate
pnpm seed
```
- BM25-only mode
```
export BM25_ONLY=true
make up
```

---
Built with ❤️ for fast demos and credible match quality. PRs and improvements welcome.
