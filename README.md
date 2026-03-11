# Shelf Scanner

AI-powered book discovery. Take a photo of a bookshelf → AI identifies the books → personalized recommendations.

## Architecture

```
Browser (React)
  └─ POST /api/scans (image)
       └─ Express backend
            └─ multipart POST ──► n8n Webhook
                                    Webhook
                                    → Vision Agent      (Claude)
                                    → Parse Vision
                                    → Build Enrichment
                                    → Enrichment Agent  (Claude)
                                    → Parse Enrichment
                                    → Build Recommendation
                                    → Recommendation Agent (Claude)
                                    → Parse Recommendation
                                    → Respond to Webhook
            ◄── { recommendations: [...] } ──────────────
       └─ Save to Postgres → return to React
```

## Repo structure

```
shelf-scanner/
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── migrations/
│   │   ├── all_tables.sql       ← run once on a fresh DB
│   │   └── 007_scans.sql        ← run if Days 1-6 are already done
│   └── src/
│       ├── server.js
│       ├── app.js
│       ├── db.js
│       ├── routes/
│       │   ├── preferences.js
│       │   ├── readingHistory.js
│       │   └── scans.js
│       └── services/
│           └── orchestratorClient.js
├── frontend/
│   ├── .env
│   └── src/
│       ├── main.tsx
│       ├── api/client.ts
│       └── pages/
│           ├── Home.tsx
│           ├── Scan.tsx
│           ├── Results.tsx
│           ├── History.tsx
│           ├── Preferences.tsx
│           └── ReadingHistory.tsx
├── scripts/
│   └── ping-db.js
└── docker-compose.yml
```

## Quick start

### 1. Start Docker (Postgres + n8n)

```powershell
docker compose up -d
```

### 2. Run the Day 7 migration (only once)

If you already ran Days 1–6 migrations:
```powershell
Get-Content .\backend\migrations\007_scans.sql | docker exec -i shelf_scanner_postgres psql -U postgres -d shelf_scanner
```

Fresh DB (no previous migrations):
```powershell
Get-Content .\backend\migrations\all_tables.sql | docker exec -i shelf_scanner_postgres psql -U postgres -d shelf_scanner
```

### 3. Backend

```powershell
cd backend
copy .env.example .env    # then edit .env with your values
npm install
npm run dev
```

### 4. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (usually http://localhost:5173 or 5174).

### 5. n8n workflow

1. Open http://localhost:5678
2. Import your workflow JSON (or use the one already set up)
3. In every HTTP Request node, add your Anthropic API key in the `Authorization` header: `Bearer sk-ant-...`
4. Click **Publish** (not just Save — must be the Production URL)
5. Copy the Production webhook URL into `backend/.env` as `N8N_WEBHOOK_URL`
6. Restart the backend: type `rs` in the nodemon terminal

## Test commands (PowerShell)

```powershell
# Health
curl.exe http://localhost:3001/api/health

# Device cookie
curl.exe -c cookies.txt http://localhost:3001/api/me

# Preferences
curl.exe -b cookies.txt http://localhost:3001/api/preferences

# Upload a shelf image
curl.exe -b cookies.txt -X POST "http://localhost:3001/api/scans" -F "image=@C:\path\to\shelf.jpg"

# Scan history
curl.exe -b cookies.txt http://localhost:3001/api/scans/history
```
