# Runno — Personal Running Tracker (V1)

**Runno** is a mobile-first personal running tracker Progressive Web Application (PWA) built with **React**, **TypeScript**, **Tailwind CSS**, **Leaflet**, **Recharts**, **Drizzle ORM / PostgreSQL**, and **Gemini 2.5 Flash Lite** (via OpenRouter).

---

## Key Features

1. **Screenshot AI Extraction**:
   - Upload any running result screenshot (JPG/PNG).
   - Structured data extraction powered by **Gemini 2.5 Flash Lite** through OpenRouter.
   - **Source of truth rule**: Screenshot statistics are never overwritten by GPS estimates.
   - If a metric is not visible, it returns `null` (no hallucination or guessing).
   - Full editing capability before saving.

2. **Route & Map Visualization**:
   - Optional GPX file upload.
   - GPX is **strictly used for route and map visualization**.
   - Beautiful, minimal pale basemap style (CartoDB Positron / OpenStreetMap).
   - Crisp orange polyline route, start green marker, and finish checkered/red marker.
   - Interactive elevation gain/loss profile chart directly below the map.

3. **KM Splits & Charts**:
   - Dynamic KM-by-KM split table with pace progress bars and elevation delta (+/- m).
   - High-performance responsive charts for **Pace**, **Heart Rate (with gradient)**, **Cadence**, and **Elevation Profile**.

4. **Dashboard & History**:
   - Month selector with 4 KPI summary cards (Distance, Total Runs, Avg Pace, Total Time) and month-over-month comparison indicators.
   - Fast SVG miniature route previews on all run cards.
   - Search by source, date, distance, and quick device filter pills.

5. **JSON Export (Claude-ready)**:
   - Export single run or all runs as clean JSON formatted for AI analysis or backup.

6. **Dual Persistence & PWA**:
   - Drizzle ORM + Neon PostgreSQL support (via `DATABASE_URL`).
   - Built-in LocalStorage / IndexedDB fallback engine for instant offline usage.
   - Installable PWA with service worker precaching and mobile safe area support.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Leaflet
- **Backend API**: Express, CORS, Drizzle ORM, `pg` / `@neondatabase/serverless`
- **AI**: Gemini 2.5 Flash Lite via OpenRouter API
- **PWA**: `vite-plugin-pwa`

---

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your API key:

```env
# OpenRouter API Key for Gemini 2.5 Flash Lite
OPENROUTER_API_KEY=sk-or-v1-...

# Neon PostgreSQL Connection URL (Optional - local storage used by default if omitted)
# DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

PORT=3001
```

*(Note: You can also set your OpenRouter API key directly in the app UI via **More > Custom OpenRouter API Key**)*.

### 3. Run Locally

To launch both the backend API server and frontend with hot reload:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

### 4. Build for Production

```bash
npm run build
```
