# 📚 Shelf Scanner

> AI-powered book discovery — photograph a bookshelf and get personalised reading recommendations instantly.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                               │
│                                                                     │
│   ┌─────────┐   ┌──────────────┐   ┌───────────┐   ┌───────────┐  │
│   │  Home   │   │ Scan Shelf   │   │  Results  │   │Preferences│  │
│   │  Page   │   │   (Upload)   │   │   Page    │   │   Page    │  │
│   └─────────┘   └──────┬───────┘   └─────▲─────┘   └───────────┘  │
│                         │                 │                         │
│              React + TypeScript + Vite (port 5173)                  │
└─────────────────────────┬───────────────────────────────────────────┘
                          │  POST /api/scans (multipart image)
                          │  GET  /api/preferences
                          │  POST /api/reading-history
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       EXPRESS BACKEND                               │
│                      Node.js  (port 3001)                           │
│                                                                     │
│   ┌────────────┐  ┌─────────────────┐  ┌────────────────────────┐  │
│   │   multer   │  │  cookie-parser  │  │    CORS middleware      │  │
│   │ (upload)   │  │  (device_id)    │  │  (localhost:5173-5175)  │  │
│   └────────────┘  └─────────────────┘  └────────────────────────┘  │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                         ROUTES                              │   │
│   │  /api/scans   /api/preferences   /api/reading-history       │   │
│   └──────────────────────┬──────────────────────────────────────┘   │
│                          │                                          │
│              ┌───────────▼───────────┐                             │
│              │  orchestratorClient   │                             │
│              │  (node-fetch +        │                             │
│              │   form-data)          │                             │
│              └───────────┬───────────┘                             │
└──────────────────────────┼──────────────────────────────────────────┘
                           │  multipart/form-data
                           │  (image + preferences + reading history)
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        n8n WORKFLOW                                 │
│                   (Self-hosted, port 5678)                          │
│                                                                     │
│  ┌───────────┐                                                      │
│  │  Webhook  │  POST /webhook/scan-books                           │
│  └─────┬─────┘                                                      │
│        ▼                                                            │
│  ┌─────────────┐     ┌──────────────┐                              │
│  │ Vision      │────▶│ Parse Vision │                              │
│  │ Agent       │     │ (Code node)  │                              │
│  │ Claude API  │     └──────┬───────┘                              │
│  └─────────────┘            │ { books: [{title, author}] }         │
│                             ▼                                       │
│  ┌─────────────────────────────────┐                               │
│  │   Build Enrichment Request      │                               │
│  │   (Code node — injects books)   │                               │
│  └──────────────┬──────────────────┘                               │
│                 ▼                                                   │
│  ┌─────────────┐     ┌────────────────┐                            │
│  │ Enrichment  │────▶│ Parse          │                            │
│  │ Agent       │     │ Enrichment     │                            │
│  │ Claude API  │     │ (Code node)    │                            │
│  └─────────────┘     └──────┬─────────┘                            │
│                             ▼                                       │
│  ┌─────────────────────────────────┐                               │
│  │   Build Recommendation Request  │                               │
│  │   (injects preferences +        │                               │
│  │    reading history + books)     │                               │
│  └──────────────┬──────────────────┘                               │
│                 ▼                                                   │
│  ┌──────────────────┐   ┌──────────────────────────────────────┐   │
│  │ Recommendation   │──▶│ Parse Recommendation                 │   │
│  │ Agent            │   │ (merges books_found + recs)          │   │
│  │ Claude API       │   └──────────────┬───────────────────────┘   │
│  └──────────────────┘                  ▼                           │
│                              ┌──────────────────┐                  │
│                              │ Respond to       │                  │
│                              │ Webhook          │                  │
│                              │ { books_found,   │                  │
│                              │   recommendations}│                 │
│                              └──────────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           │  JSON response saved to DB
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       POSTGRESQL DATABASE                           │
│                    (Docker container, port 5433)                    │
│                                                                     │
│  ┌───────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │
│  │  preferences  │  │ reading_history  │  │       scans         │  │
│  │  device_id PK │  │  device_id PK    │  │  id  BIGSERIAL PK   │  │
│  │  data JSONB   │  │  items JSONB     │  │  device_id TEXT     │  │
│  └───────────────┘  └──────────────────┘  │  image_hash TEXT    │  │
│                                           │  status TEXT        │  │
│                                           └──────────┬──────────┘  │
│                                                      │ 1:1         │
│                                           ┌──────────▼──────────┐  │
│                                           │   recommendations   │  │
│                                           │   scan_id FK        │  │
│                                           │   results JSONB     │  │
│                                           └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Diagram

```
Browser              Express Backend        n8n Pipeline         Claude API
   │                       │                     │                    │
   │  📷 Upload photo      │                     │                    │
   │──────────────────────▶│                     │                    │
   │                       │                     │                    │
   │                       │ Load preferences     │                    │
   │                       │ Load reading history │                    │
   │                       │ Check image hash     │                    │
   │                       │ (dedup cache check)  │                    │
   │                       │                     │                    │
   │                       │ POST image +         │                    │
   │                       │ preferences +        │                    │
   │                       │ reading history      │                    │
   │                       │────────────────────▶│                    │
   │                       │                     │                    │
   │                       │                     │ Vision Agent       │
   │                       │                     │ "What books are    │
   │                       │                     │  on this shelf?"   │
   │                       │                     │───────────────────▶│
   │                       │                     │◀───────────────────│
   │                       │                     │ [{title, author}]  │
   │                       │                     │                    │
   │                       │                     │ Enrichment Agent   │
   │                       │                     │ "Add genre, themes,│
   │                       │                     │  description"      │
   │                       │                     │───────────────────▶│
   │                       │                     │◀───────────────────│
   │                       │                     │                    │
   │                       │                     │ Recommendation     │
   │                       │                     │ Agent              │
   │                       │                     │ "Based on prefs +  │
   │                       │                     │  history, suggest" │
   │                       │                     │───────────────────▶│
   │                       │                     │◀───────────────────│
   │                       │                     │                    │
   │                       │◀────────────────────│                    │
   │                       │ { books_found,       │                    │
   │                       │   recommendations }  │                    │
   │                       │                     │                    │
   │                       │ Save to Postgres     │                    │
   │                       │ (scans + results)    │                    │
   │                       │                     │                    │
   │◀──────────────────────│                     │                    │
   │ Show books found +    │                     │                    │
   │ recommendations       │                     │                    │
```

---

## 🧰 Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + TypeScript | UI framework |
| **Frontend** | Vite | Dev server + bundler |
| **Frontend** | React Router v6 | Client-side routing |
| **Backend** | Node.js + Express | REST API server |
| **Backend** | Multer | Image upload handling |
| **Backend** | node-fetch + form-data | n8n webhook calls |
| **Backend** | cookie-parser | Device session via cookie |
| **Backend** | pg (node-postgres) | PostgreSQL client |
| **AI Orchestration** | n8n (self-hosted) | Multi-agent workflow engine |
| **AI Model** | Claude API (Anthropic) | Vision + enrichment + recommendations |
| **Database** | PostgreSQL 16 | Persistent storage |
| **Infrastructure** | Docker + Docker Compose | Containerised local services |

---

## 📁 Project Structure

```
shelf-scanner/
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── migrations/
│   │   └── 006_scans.sql
│   └── src/
│       ├── server.js
│       ├── app.js
│       ├── db.js
│       ├── routes/
│       │   ├── scans.js
│       │   ├── preferences.js
│       │   └── readingHistory.js
│       └── services/
│           └── orchestratorClient.js
├── frontend/
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
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### 1. Start infrastructure
```powershell
docker compose up -d
```

### 2. Run migrations
```powershell
Get-Content backend\migrations\006_scans.sql | docker exec -i shelf_scanner_postgres psql -U postgres -d shelf_scanner
```

### 3. Configure and start backend
```powershell
cd backend
copy .env.example .env   # fill in DATABASE_URL and N8N_WEBHOOK_URL
npm install
npm run dev
```

### 4. Start frontend
```powershell
cd frontend
npm install
npm run dev
```

### 5. Configure n8n
1. Open http://localhost:5678
2. Import the workflow JSON
3. Add your Anthropic API key to each HTTP Request node
4. Click **Publish**
5. Copy the Production webhook URL to `backend/.env` as `N8N_WEBHOOK_URL`
6. Restart backend: type `rs` in the nodemon terminal
