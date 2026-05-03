# FeedHero — Google Shopping Title Optimizer

AI-powered product title optimization. Upload your Merchant Center CSV → Claude rewrites
every title using keyword-order formulas → download a supplemental feed CSV.

---

## Project Structure

```
feedhero-app/
├── backend/                   ← Node.js + Express API
│   ├── server.js              ← Entry point (port 4000)
│   ├── .env.example           ← Copy to .env and add your API key
│   ├── routes/
│   │   ├── upload.js          ← POST /api/upload   (parse CSV)
│   │   ├── optimize.js        ← POST /api/optimize/start
│   │   │                         GET  /api/optimize/download/:id
│   │   └── jobs.js            ← GET  /api/jobs/:id (polling)
│   ├── services/
│   │   ├── aiOptimizer.js     ← Claude API integration
│   │   └── jobStore.js        ← In-memory job tracking
│   └── utils/
│       ├── csvParser.js       ← Parse + map CSV rows (no invented data)
│       ├── csvWriter.js       ← Generate supplemental feed output
│       └── batcher.js         ← Process products in batches of 5
│
└── frontend/                  ← React + Vite + Tailwind
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx            ← Step machine (Upload→Preview→Optimizing→Results)
        ├── main.jsx
        ├── components/
        │   ├── StepIndicator.jsx
        │   ├── UploadStep.jsx    ← Drag & drop CSV upload
        │   ├── PreviewStep.jsx   ← Show detected products, start job
        │   ├── OptimizingStep.jsx← Progress bar + live Claude results
        │   └── ResultsStep.jsx   ← Download + inline title editing
        ├── hooks/
        │   └── useJob.js      ← Polls /api/jobs/:id every 1.5s
        └── utils/
            └── api.js         ← All fetch() calls in one place
```

---

## Quick Start (5 minutes)

### Step 1 — Get your Anthropic API key
Go to https://console.anthropic.com and copy your key.

### Step 2 — Set up backend

```bash
cd feedhero-app/backend
cp .env.example .env
# Open .env and paste: ANTHROPIC_API_KEY=sk-ant-your-key-here
npm install
npm run dev
# → Backend running on http://localhost:4000
```

### Step 3 — Set up frontend (new terminal)

```bash
cd feedhero-app/frontend
npm install
npm run dev
# → Frontend running on http://localhost:5173
```

### Step 4 — Open the app
Visit **http://localhost:5173**

Click **"Load sample CSV"** to test immediately — no real feed needed.

---

## How It Works

### 1. Upload
User uploads their Merchant Center CSV. Backend parses every column using `csv-parser`.
Headers are normalised to lowercase (product_type, colour, etc).
**Missing fields stay blank — nothing is ever invented.**

### 2. Preview
Frontend shows the first 5 detected products with all extracted attributes.
User reviews, then clicks "Optimize all".

### 3. Optimize (batched async)
Backend creates a job and starts processing in the background:
- Products are processed in **batches of 5** concurrently
- Each product sends only its **real data** to Claude
- Claude applies keyword ordering: `Specific Type → Size → Colour → Feature → Brand`
- Client **polls every 1.5s** for progress — live results appear as they complete
- Failed items are logged and skipped, never crashing the whole job

### 4. Results
User downloads `feedhero_supplemental_feed.csv`.
Fields: `id`, `structured_title`, `title_type`
Titles can be **edited inline** before downloading.

Upload to Merchant Center → Products → Feeds → + New supplemental feed.
Your Shopping ad titles update. Your website stays unchanged.

---

## Key Design Decisions

### No invented data
```js
// csvParser.js - mapRowToProduct()
category: (row.product_type || row.google_product_category || '').trim()
// If both are empty → category stays ''. Claude gets '(none)'. No guessing.
```

### Proper async batching (fixed)
```js
// batcher.js
// Promise.allSettled — one failure never kills the whole batch
const settled = await Promise.allSettled(batch.map(fn))
// 300ms delay between batches — respects Claude rate limits
await new Promise(r => setTimeout(r, 300))
```

### Polling architecture
```
Client → POST /api/optimize/start → receives { jobId }
Client → polls GET /api/jobs/:id every 1500ms
Client → status === 'done' → GET /api/optimize/download/:jobId → CSV
```

### Claude prompt — strict rules enforced
The prompt explicitly tells Claude:
1. Specific product type FIRST (Ottoman Bed, not Bed)
2. Size → Colour → Feature → Material → Brand
3. Use ONLY provided data — do NOT invent attributes
4. Max 150 characters, UK English
5. No promotional words

---

## Deploying to Production

### Backend → Railway (recommended, free tier)
1. Push the `backend/` folder to a GitHub repo
2. Connect to Railway.app
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy — Railway auto-detects Node.js

### Frontend → Vercel (recommended, free tier)
1. Push the `frontend/` folder to a GitHub repo
2. Connect to Vercel.com
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add env variable: `VITE_API_URL=https://your-backend.railway.app`
6. Update `src/utils/api.js` line 1: `const BASE = import.meta.env.VITE_API_URL + '/api'`

---

## Adding Auth + Database (Next Step)

When you're ready to turn this into a multi-user SaaS:

| Layer    | Tool            | What it adds                          |
|----------|-----------------|---------------------------------------|
| Auth     | Supabase Auth   | Login/signup, sessions, JWT           |
| Database | Supabase Postgres | Save jobs, products, formulas per user |
| Payments | Stripe          | Pro plan subscriptions                |
| Job queue | Redis + BullMQ | Persistent jobs (survive restarts)   |

---

## CSV Format Expected

Your Merchant Center feed should have these columns (any extras are ignored):

| Column             | Used for                        |
|--------------------|---------------------------------|
| `id`               | Product ID in supplemental feed |
| `title`            | Current title to rewrite        |
| `description`      | Extra context for Claude        |
| `product_type`     | Category detection              |
| `brand`            | Brand in optimized title        |
| `colour` / `color` | Colour attribute                |
| `size`             | Size attribute                  |
| `material`         | Material attribute              |
| `gender`           | Gender (apparel)                |

