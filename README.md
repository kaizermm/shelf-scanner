# Shelf Scanner

> **AI-powered book discovery and ordering platform** — photograph any bookshelf, identify every title, receive personalised recommendations, and order books directly. Built on a multi-agent AI pipeline with tool-using agents.

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org)
[![n8n](https://img.shields.io/badge/n8n-self--hosted-EA4B71?logo=n8n)](https://n8n.io)
[![Claude](https://img.shields.io/badge/Claude-Anthropic-D4A843)](https://www.anthropic.com)

---

## Problem Statement

Walking into a bookstore or a friend's home, you encounter shelves filled with books you have never heard of. You want to know which ones are worth reading — but manually looking up every title is tedious, and generic recommendation engines do not account for what you have already read or what you actually enjoy.

**Shelf Scanner solves this in three steps:**

1. **See** — Take a photo of any bookshelf. A Vision AI agent reads every spine and identifies the titles.
2. **Understand** — An Enrichment agent analyses the genre, themes, and style of each detected book.
3. **Recommend & Act** — A Recommendation agent, armed with your personal preferences and reading history, suggests what to read next. An Order Management agent with real tools then checks price, availability, and places the order — without ever leaving the app.

---

## Key Features

- **Multi-agent AI pipeline** — Three specialised Claude agents in sequence: Vision → Enrichment → Recommendation
- **Tool-using Order Agent** — Demonstrates AI agents calling real tools: `checkAvailability`, `placeOrder`, `cancelOrder`, `listOrders`
- **Personalised recommendations** — Preferences (genres, pace, length) and reading history are injected into every AI prompt
- **Device-based sessions** — No login required; persistent cookie ties data to the user's device
- **Image deduplication** — SHA-256 hash prevents re-processing the same shelf photo
- **Reading list management** — Save scanned books and recommendations with status tracking (Read / Reading / Want to Read)
- **Order tracking** — Full order lifecycle: check → confirm → cancel

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      REACT FRONTEND                         │
│              TypeScript + Vite  (port 5173)                 │
│                                                             │
│  Home  │  Scan  │  Results  │  Orders  │  Preferences       │
│                       │                                     │
│              POST /api/scans  (multipart image)             │
│              GET/POST /api/preferences                      │
│              GET/POST /api/reading-history                  │
│              GET/POST/DELETE /api/orders                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXPRESS BACKEND                           │
│                   Node.js  (port 3001)                      │
│                                                             │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │   multer    │   │ cookie-parser│   │  CORS middleware │  │
│  │ (upload)    │   │ (device_id)  │   │  (5173 – 5175)  │  │
│  └─────────────┘   └──────────────┘   └─────────────────┘  │
│                                                             │
│  /api/scans  /api/preferences  /api/reading-history         │
│  /api/orders  /api/health  /api/me                          │
│                                                             │
│          ┌──────────────────────────┐                       │
│          │    orchestratorClient    │                       │
│          │  (sends image + prefs    │                       │
│          │   + reading history)     │                       │
│          └─────────────┬────────────┘                       │
└────────────────────────┼────────────────────────────────────┘
                         │  multipart/form-data
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    n8n WORKFLOW ENGINE                       │
│               Self-hosted Docker  (port 5678)               │
│                                                             │
│  Webhook ──▶ Vision Agent ──▶ Parse Vision                  │
│                    │                                        │
│                    ▼                                        │
│             Build Enrichment ──▶ Enrichment Agent           │
│                                       │                     │
│                                       ▼                     │
│                              Build Recommendation           │
│                                       │                     │
│                                       ▼                     │
│                          Recommendation Agent ──▶ Parse     │
│                                       │                     │
│                                       ▼                     │
│                              Respond to Webhook             │
│                          { books_found, recommendations }   │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   POSTGRESQL  (port 5433)                   │
│                                                             │
│  preferences   reading_history   scans   recommendations    │
│  orders                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## AI Agents & Tools

### Agent 1 — Vision Agent
**Role:** Computer vision specialist  
**Input:** Raw shelf photograph  
**Output:** `[{ title, author, confidence }]`  
**Prompt focus:** Identify every readable book spine, normalise titles, assign confidence scores

### Agent 2 — Enrichment Agent
**Role:** Literary analyst  
**Input:** List of detected books  
**Output:** Books with genre, themes, mood, reading level  
**Prompt focus:** Enrich each book with metadata to power better downstream recommendations

### Agent 3 — Recommendation Agent
**Role:** Personal librarian  
**Input:** Enriched books + user preferences + reading history  
**Output:** `[{ title, author, reason, score }]`  
**Prompt focus:** Recommend books NOT already in the user's history that match their genre, pace, and length preferences

### Agent 4 — Order Management Agent *(Tool-using)*
**Role:** Procurement specialist  
**Tools exposed as REST endpoints:**

| Tool | Endpoint | Description |
|------|----------|-------------|
| `checkAvailability` | `GET /api/orders/check` | Returns price, provider, delivery estimate |
| `placeOrder` | `POST /api/orders` | Confirms and persists the order |
| `listOrders` | `GET /api/orders` | Returns all orders for this device |
| `cancelOrder` | `DELETE /api/orders/:id` | Cancels a confirmed order |

> **Why this matters:** Most AI demos stop at text generation. The Order Agent demonstrates the production pattern for tool-using agents — each tool is a discrete, versioned API endpoint that the agent (or the UI acting on its behalf) can call to take real-world action.

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend | React | 18 | UI framework |
| Frontend | TypeScript | 5 | Type safety |
| Frontend | Vite | 5 | Dev server + bundler |
| Frontend | React Router | 6 | Client-side routing |
| Backend | Node.js | 22 | Runtime |
| Backend | Express | 4 | REST API framework |
| Backend | Multer | 1 | Multipart image uploads |
| Backend | node-fetch | 3 | n8n webhook calls |
| Backend | cookie-parser | 1 | Device session management |
| Backend | pg | 8 | PostgreSQL client |
| AI Orchestration | n8n | 2.x | Visual multi-agent workflow engine |
| AI Model | Claude (Anthropic) | claude-sonnet | Vision, enrichment, recommendations |
| Database | PostgreSQL | 16 | Persistent storage |
| Infrastructure | Docker + Compose | — | Containerised local services |

---

## Project Structure

```
shelf-scanner/
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── migrations/
│   │   ├── 004_preferences.sql
│   │   ├── 005_reading_history.sql
│   │   ├── 006_scans.sql
│   │   └── 007_orders.sql
│   └── src/
│       ├── server.js               # Entry point — dotenv first
│       ├── app.js                  # Express app, CORS, cookie middleware
│       ├── db.js                   # pg Pool singleton
│       ├── routes/
│       │   ├── scans.js            # Upload, hash, cache, call n8n
│       │   ├── preferences.js      # Device preferences UPSERT
│       │   ├── readingHistory.js   # Reading list UPSERT
│       │   └── orders.js           # Order management tools
│       └── services/
│           └── orchestratorClient.js  # Calls n8n with image + context
├── frontend/
│   ├── .env
│   └── src/
│       ├── main.tsx                # BrowserRouter + all routes
│       ├── api/
│       │   └── client.ts           # apiGet, apiPostJson, apiPostForm
│       └── pages/
│           ├── Home.tsx            # Landing page + nav
│           ├── Scan.tsx            # Image upload
│           ├── Results.tsx         # Books found + recommendations + order buttons
│           ├── Orders.tsx          # Order history + cancel
│           ├── History.tsx         # Past scans
│           ├── Preferences.tsx     # Genre chips + pace + length + notes
│           └── ReadingHistory.tsx  # Reading list with status management
├── scripts/
│   └── ping-db.js
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Database Schema

```sql
-- Device preferences (genres, pace, length, notes)
CREATE TABLE preferences (
  device_id  TEXT PRIMARY KEY,
  data       JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Personal reading list
CREATE TABLE reading_history (
  device_id  TEXT PRIMARY KEY,
  items      JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shelf scan records
CREATE TABLE scans (
  id         BIGSERIAL PRIMARY KEY,
  device_id  TEXT NOT NULL,
  image_hash TEXT NOT NULL,          -- SHA-256 for dedup cache
  status     TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI pipeline results per scan
CREATE TABLE recommendations (
  id         BIGSERIAL PRIMARY KEY,
  scan_id    BIGINT REFERENCES scans(id) ON DELETE CASCADE,
  device_id  TEXT NOT NULL,
  results    JSONB NOT NULL DEFAULT '{}',  -- { books_found, recommendations }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders placed through the Order Management Agent
CREATE TABLE orders (
  id         BIGSERIAL PRIMARY KEY,
  device_id  TEXT NOT NULL,
  scan_id    BIGINT REFERENCES scans(id) ON DELETE SET NULL,
  title      TEXT NOT NULL,
  author     TEXT,
  price      NUMERIC(10,2),
  provider   TEXT NOT NULL DEFAULT 'mock',
  status     TEXT NOT NULL DEFAULT 'pending',  -- pending | confirmed | cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Quick Start

### Prerequisites
- Docker Desktop
- Node.js 18+
- An Anthropic API key

### 1. Clone and configure

```powershell
git clone https://github.com/YOUR_USERNAME/shelf-scanner.git
cd shelf-scanner
copy .env.example .env
```

### 2. Start infrastructure

```powershell
docker compose up -d
```

### 3. Run database migrations

```powershell
# Run once on a fresh database
Get-Content backend\migrations\004_preferences.sql | docker exec -i shelf_scanner_postgres psql -U postgres -d shelf_scanner
Get-Content backend\migrations\005_reading_history.sql | docker exec -i shelf_scanner_postgres psql -U postgres -d shelf_scanner
Get-Content backend\migrations\006_scans.sql | docker exec -i shelf_scanner_postgres psql -U postgres -d shelf_scanner
```

### 4. Start backend

```powershell
cd backend
copy .env.example .env    # Edit: set DATABASE_URL and N8N_WEBHOOK_URL
npm install
npm run dev
```

### 5. Start frontend

```powershell
cd frontend
npm install
npm run dev
```

### 6. Configure n8n

1. Open [http://localhost:5678](http://localhost:5678)
2. Import the workflow JSON from the repo root
3. In each HTTP Request node (Vision Agent, Enrichment Agent, Recommendation Agent), add header:
   - **Key:** `x-api-key`
   - **Value:** `sk-ant-your-key-here`
4. Click **Publish**
5. Copy the **Production** webhook URL into `backend/.env` as `N8N_WEBHOOK_URL`
6. Restart backend: type `rs` in the nodemon terminal

### 7. Verify

```powershell
curl.exe http://localhost:3001/api/health
# Expected: {"ok":true}
```

Open [http://localhost:5173](http://localhost:5173)

---

## Environment Variables

```bash
# backend/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/shelf_scanner
N8N_WEBHOOK_URL=http://localhost:5678/webhook/scan-books
PORT=3001

# frontend/.env
# IMPORTANT: use localhost, not 127.0.0.1 (SameSite cookie requirement)
VITE_API_BASE=http://localhost:3001
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service health check |
| `GET` | `/api/me` | Current device ID |
| `POST` | `/api/scans` | Upload shelf image, trigger AI pipeline |
| `GET` | `/api/scans/history` | Past scans for this device |
| `GET` | `/api/scans/:id` | Single scan result |
| `GET` | `/api/preferences` | Load device preferences |
| `POST` | `/api/preferences` | Save device preferences |
| `GET` | `/api/reading-history` | Load reading list |
| `POST` | `/api/reading-history` | Save reading list |
| `GET` | `/api/orders/check` | Check book price & availability |
| `POST` | `/api/orders` | Place an order |
| `GET` | `/api/orders` | List all orders |
| `DELETE` | `/api/orders/:id` | Cancel an order |

---

## Design Decisions

**Why n8n for orchestration?**
n8n provides a visual, inspectable pipeline for the multi-agent workflow. Each node can be individually debugged, the execution history is preserved, and the workflow can be modified without redeploying backend code. It acts as the "brain" while Express remains a thin, stateless API gateway.

**Why cookie-based device sessions instead of auth?**
The app is designed for frictionless personal use — a single user per device. A `HttpOnly` cookie tied to a UUID provides persistent state without requiring account creation or password management.

**Why SHA-256 image hashing?**
Re-scanning the same shelf is a common user pattern. Hashing prevents unnecessary API calls to Anthropic (reducing cost and latency) while returning instant cached results.

**Why separate Order Agent tools as REST endpoints?**
Following the Model Context Protocol pattern, each tool is a self-contained, independently testable endpoint. This makes the system easier to swap in real providers (Amazon, Shopify, etc.) and demonstrates the canonical pattern for production tool-using agents.

---

## Roadmap

- [ ] Real book pricing via Google Books / Open Library API
- [ ] Stripe integration for actual order processing
- [ ] Mobile PWA with native camera capture
- [ ] Social features — share shelf scans
- [ ] Barcode / ISBN scanning fallback
- [ ] Export reading list to Goodreads

---

## License

MIT
