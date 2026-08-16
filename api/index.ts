import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { pgTable, text, timestamp, real, integer, jsonb } from 'drizzle-orm/pg-core';
import { eq, desc } from 'drizzle-orm';

dotenv.config();

// ---------------------------------------------------------------------------
// Drizzle PostgreSQL Schemas
// ---------------------------------------------------------------------------
export const runs = pgTable('runs', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  source: text('source').notNull().default('Huawei Health'),
  distance_km: real('distance_km').notNull(),
  duration_seconds: integer('duration_seconds').notNull(),
  pace_seconds_per_km: integer('pace_seconds_per_km'),
  avg_speed_kmh: real('avg_speed_kmh'),
  avg_heart_rate: integer('avg_heart_rate'),
  max_heart_rate: integer('max_heart_rate'),
  cadence: integer('cadence'),
  elevation_gain_m: integer('elevation_gain_m'),
  elevation_loss_m: integer('elevation_loss_m'),
  calories: integer('calories'),
  total_steps: integer('total_steps'),
  stride_length_cm: real('stride_length_cm'),
  ground_contact_time_ms: integer('ground_contact_time_ms'),
  vertical_oscillation_cm: real('vertical_oscillation_cm'),
  ground_contact_balance: text('ground_contact_balance'),
  aerobic_te: real('aerobic_te'),
  anaerobic_te: real('anaerobic_te'),
  vo2max: real('vo2max'),
  training_load: real('training_load'),
  recovery_hours: integer('recovery_hours'),
  active_calories: integer('active_calories'),
  best_pace_seconds_per_km: integer('best_pace_seconds_per_km'),
  max_cadence: integer('max_cadence'),
  splits: jsonb('splits'),
  elevation_points: jsonb('elevation_points'),
  heart_rate_zones: jsonb('heart_rate_zones'),
  screenshot_url: text('screenshot_url'),
  route_data: jsonb('route_data'),
  extra_metrics: jsonb('extra_metrics'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const trainingPlans = pgTable('training_plans', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  goal: text('goal').notNull(),
  schedule_summary: text('schedule_summary').notNull(),
  selected_days: jsonb('selected_days').notNull(),
  weekly_target_km: real('weekly_target_km').notNull(),
  total_weeks: integer('total_weeks').notNull().default(4),
  current_week: integer('current_week').notNull().default(1),
  fitness_level: text('fitness_level').notNull().default('intermediate'),
  status: text('status').notNull().default('active'),
  workouts: jsonb('workouts').notNull(),
  ai_advice: text('ai_advice'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const coachMessagesTable = pgTable('coach_messages', {
  id: text('id').primaryKey(),
  messages: jsonb('messages').notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Database Connection & Auto-Migration
// ---------------------------------------------------------------------------
let dbInstance: any = null;

export async function initDbSchema(pool: any) {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'Huawei Health',
        distance_km REAL NOT NULL,
        duration_seconds INTEGER NOT NULL,
        pace_seconds_per_km INTEGER,
        avg_speed_kmh REAL,
        avg_heart_rate INTEGER,
        max_heart_rate INTEGER,
        cadence INTEGER,
        elevation_gain_m INTEGER,
        elevation_loss_m INTEGER,
        calories INTEGER,
        total_steps INTEGER,
        stride_length_cm REAL,
        ground_contact_time_ms INTEGER,
        vertical_oscillation_cm REAL,
        ground_contact_balance TEXT,
        aerobic_te REAL,
        anaerobic_te REAL,
        vo2max REAL,
        training_load REAL,
        recovery_hours INTEGER,
        active_calories INTEGER,
        best_pace_seconds_per_km INTEGER,
        max_cadence INTEGER,
        splits JSONB,
        elevation_points JSONB,
        heart_rate_zones JSONB,
        screenshot_url TEXT,
        route_data JSONB,
        extra_metrics JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      ALTER TABLE runs ADD COLUMN IF NOT EXISTS splits JSONB;
      ALTER TABLE runs ADD COLUMN IF NOT EXISTS elevation_points JSONB;
      ALTER TABLE runs ADD COLUMN IF NOT EXISTS heart_rate_zones JSONB;

      CREATE TABLE IF NOT EXISTS training_plans (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        goal TEXT NOT NULL,
        schedule_summary TEXT NOT NULL,
        selected_days JSONB NOT NULL,
        weekly_target_km REAL NOT NULL,
        total_weeks INTEGER NOT NULL DEFAULT 4,
        current_week INTEGER NOT NULL DEFAULT 1,
        fitness_level TEXT NOT NULL DEFAULT 'intermediate',
        status TEXT NOT NULL DEFAULT 'active',
        workouts JSONB NOT NULL,
        ai_advice TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS coach_messages (
        id TEXT PRIMARY KEY,
        messages JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;
    await pool.query(createTableQuery);
    console.log('[Runno DB] PostgreSQL tables verified successfully.');
  } catch (err: any) {
    console.error('[Runno DB] Schema init notice:', err.message);
  }
}

export function getDatabase() {
  dotenv.config();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !connectionString.trim()) {
    return null;
  }

  if (dbInstance) return dbInstance;

  try {
    const pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    dbInstance = drizzle(pool, { schema: { runs, trainingPlans, coachMessagesTable } });
    initDbSchema(pool);
    return dbInstance;
  } catch (err: any) {
    console.error('[Runno DB] Failed to initialize PostgreSQL connection:', err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Express Application & Router
// ---------------------------------------------------------------------------
const app = express();
const router = express.Router();
const PORT = process.env.PORT || 3001;

app.use(cors());

// URL Resolver for Vercel Serverless Function rewrites
app.use((req, _res, next) => {
  const matchedPath =
    (req.headers['x-matched-path'] as string) ||
    (req.headers['x-vercel-matched-path'] as string) ||
    (req.headers['x-rewrite-url'] as string) ||
    '';
  if (matchedPath && matchedPath.startsWith('/api')) {
    req.url = matchedPath;
  }
  next();
});

// Safe Body Parsing (handles pre-parsed Vercel serverless bodies, JSON strings, and raw streams)
app.use((req, _res, next) => {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch (_) {}
    }
    return next();
  }
  express.json({ limit: '30mb' })(req, _res, next);
});

// ---------------------------------------------------------------------------
// Health check endpoint
// ---------------------------------------------------------------------------
router.get('/health', (_req, res) => {
  dotenv.config();
  const db = getDatabase();
  const rawKey = (process.env.OPENROUTER_API_KEY || '').trim();
  res.json({
    status: 'ok',
    environment: process.env.VERCEL ? 'vercel_serverless' : 'local_node',
    hasOpenRouterKey: rawKey.length > 0,
    openRouterKeyLength: rawKey.length,
    openRouterKeyPrefix: rawKey.length > 8 ? `${rawKey.substring(0, 8)}...` : (rawKey.length > 0 ? 'set' : 'none'),
    hasDatabase: !!db,
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// AI Screenshot OCR Analysis Endpoint
// ---------------------------------------------------------------------------
router.post('/analyze-screenshot', async (req, res) => {
  try {
    dotenv.config();
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (_) {}
    }
    body = body || {};

    const { imageBase64, customApiKey } = body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in request body' });
    }

    const apiKey = (customApiKey || process.env.OPENROUTER_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(400).json({
        error: 'OpenRouter API key is missing. Please set OPENROUTER_API_KEY in Vercel Environment Variables or in More > Preferences in the app.',
        code: 'MISSING_API_KEY',
      });
    }

    let formattedImageUrl = imageBase64;
    if (!imageBase64.startsWith('data:image/')) {
      formattedImageUrl = `data:image/jpeg;base64,${imageBase64}`;
    }

    const systemPrompt = `You are an expert sports data extraction AI specializing in running result screenshots from Huawei Health, Amazfit, Zepp, Apple Fitness, Garmin Connect, Strava, Coros, Nike Run Club, and Samsung Health.

Read the entire image (including long/scrolling screenshots from top to bottom) and extract all clearly visible workout metrics, including Splits tables and Chart series if present.

CRITICAL PARSING RULES:
1. Decimal Separators: In European/Huawei locales, comma ',' represents a decimal point. Convert '6,50' to 6.50, '6,32' to 6.32, '57,4' to 57.4, '9,7' to 9.7, '89,3' to 89.3.
2. Workout Time / Duration:
   - Look at the main workout duration counter.
   - If formatted as "01:01:40" (HH:MM:SS), calculate total seconds: 1h + 1m + 40s = 3700s.
   - If formatted as "51:02" (MM:SS), calculate total seconds: 51m + 2s = 3062s.
3. Pace:
   - Average pace (e.g. 9'29" or 9:29/km) -> pace_seconds_per_km: 569.
   - Best pace (e.g. 7'29" or 7:35/km) -> best_pace_seconds_per_km: 449.
4. Cadence & Steps:
   - Avg Cadence (e.g. 147 spm) -> cadence: 147.
   - Max Cadence (e.g. 160 spm) -> max_cadence: 160.
   - Total Steps (e.g. 9074) -> total_steps: 9074.
   - Stride Length (e.g. 121 cm) -> stride_length_cm: 121.
5. Heart Rate & Zones:
   - Avg Heart Rate (e.g. 153 bpm) -> avg_heart_rate: 153.
   - Max Heart Rate (e.g. 179 bpm) -> max_heart_rate: 179.
   - Heart Rate Zones: extract into "heart_rate_zones" array.
6. Splits Table:
   - Extract kilometer splits into "splits": [ { "km": 1, "pace_seconds": 569, "elevation_diff_m": 0 }, ... ]
7. Chart Samples:
   - Sample 8 to 20 representative data points into "elevation_points".
8. Performance & Training Metrics:
   - Aerobic TE -> aerobic_te. VO2Max -> vo2max. Training Load -> training_load. Recovery -> recovery_hours.
9. Advanced Running Form:
   - GCT -> ground_contact_time_ms. Vertical Oscillation -> vertical_oscillation_cm. Balance -> ground_contact_balance.
10. Elevation:
   - Elevation Gain -> elevation_gain_m. Elevation Loss -> elevation_loss_m.
11. Source:
   - "Huawei Health", "Amazfit", "Zepp", "Apple Fitness", "Garmin", "Strava", "Coros", "Nike Run Club", or "Other".

Never invent numbers. If a metric or table is not in the screenshot, return null.

Return ONLY a valid JSON object matching this schema (no markdown, no backticks):
{
  "date": string | null,
  "source": string | null,
  "distance_km": number | null,
  "duration_seconds": number | null,
  "pace_seconds_per_km": number | null,
  "best_pace_seconds_per_km": number | null,
  "avg_speed_kmh": number | null,
  "avg_heart_rate": number | null,
  "max_heart_rate": number | null,
  "cadence": number | null,
  "max_cadence": number | null,
  "total_steps": number | null,
  "stride_length_cm": number | null,
  "ground_contact_time_ms": number | null,
  "vertical_oscillation_cm": number | null,
  "ground_contact_balance": string | null,
  "elevation_gain_m": number | null,
  "elevation_loss_m": number | null,
  "calories": number | null,
  "active_calories": number | null,
  "aerobic_te": number | null,
  "anaerobic_te": number | null,
  "vo2max": number | null,
  "training_load": number | null,
  "recovery_hours": number | null,
  "splits": [ { "km": number, "pace_seconds": number, "elevation_diff_m": number } ] | null,
  "heart_rate_zones": [ { "zone": number, "name": string, "percentage": number, "duration_seconds": number | null, "bpm_range": string | null } ] | null,
  "elevation_points": [ { "distance_km": number, "elevation_m": number, "heart_rate": number | null, "pace_seconds": number | null, "cadence": number | null } ] | null,
  "raw_notes": string | null
}`;

    const model = 'google/gemini-2.5-flash-lite';
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://runno.app',
        'X-Title': 'Runno Running Tracker',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: systemPrompt },
              { type: 'image_url', image_url: { url: formattedImageUrl } },
            ],
          },
        ],
        max_tokens: 3000,
        temperature: 0.1,
      }),
    });

    if (!openRouterResponse.ok) {
      const errText = await openRouterResponse.text();
      return res.status(openRouterResponse.status).json({
        error: `OpenRouter API error: ${openRouterResponse.status} ${errText}`,
      });
    }

    const data = await openRouterResponse.json();
    const rawContent = data.choices?.[0]?.message?.content || '';
    const cleanedJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsedData = JSON.parse(cleanedJson);
      res.json({ success: true, data: parsedData });
    } catch (parseError) {
      res.json({ success: true, data: { raw_notes: rawContent } });
    }
  } catch (error: any) {
    console.error('[Runno] Screenshot Analysis Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// ---------------------------------------------------------------------------
// Runs CRUD Endpoints
// ---------------------------------------------------------------------------
router.get('/runs', async (_req, res) => {
  const db = getDatabase();
  if (!db) {
    return res.status(200).json({ runs: [], storage: 'local-fallback' });
  }

  try {
    const allRuns = await db.select().from(runs).orderBy(desc(runs.date));
    res.json({ runs: allRuns, storage: 'postgres' });
  } catch (err: any) {
    console.error('DB fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch runs from database' });
  }
});

router.post('/runs', async (req, res) => {
  let runPayload = req.body;
  if (typeof runPayload === 'string') {
    try {
      runPayload = JSON.parse(runPayload);
    } catch (_) {}
  }
  runPayload = runPayload || {};
  const db = getDatabase();

  if (!db) {
    return res.json({ success: true, savedLocally: true, run: runPayload });
  }

  try {
    const newRecord = {
      id: runPayload.id || `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: runPayload.date || new Date().toISOString(),
      source: runPayload.source || 'Huawei Health',
      distance_km: Number(runPayload.distance_km) || 0,
      duration_seconds: Number(runPayload.duration_seconds) || 0,
      pace_seconds_per_km: runPayload.pace_seconds_per_km ? Number(runPayload.pace_seconds_per_km) : null,
      avg_speed_kmh: runPayload.avg_speed_kmh ? Number(runPayload.avg_speed_kmh) : null,
      avg_heart_rate: runPayload.avg_heart_rate ? Number(runPayload.avg_heart_rate) : null,
      max_heart_rate: runPayload.max_heart_rate ? Number(runPayload.max_heart_rate) : null,
      cadence: runPayload.cadence ? Number(runPayload.cadence) : null,
      elevation_gain_m: runPayload.elevation_gain_m ? Number(runPayload.elevation_gain_m) : null,
      elevation_loss_m: runPayload.elevation_loss_m ? Number(runPayload.elevation_loss_m) : null,
      calories: runPayload.calories ? Number(runPayload.calories) : null,
      total_steps: runPayload.total_steps ? Number(runPayload.total_steps) : null,
      stride_length_cm: runPayload.stride_length_cm ? Number(runPayload.stride_length_cm) : null,
      ground_contact_time_ms: runPayload.ground_contact_time_ms ? Number(runPayload.ground_contact_time_ms) : null,
      vertical_oscillation_cm: runPayload.vertical_oscillation_cm ? Number(runPayload.vertical_oscillation_cm) : null,
      ground_contact_balance: runPayload.ground_contact_balance || null,
      aerobic_te: runPayload.aerobic_te ? Number(runPayload.aerobic_te) : null,
      anaerobic_te: runPayload.anaerobic_te ? Number(runPayload.anaerobic_te) : null,
      vo2max: runPayload.vo2max ? Number(runPayload.vo2max) : null,
      training_load: runPayload.training_load ? Number(runPayload.training_load) : null,
      recovery_hours: runPayload.recovery_hours ? Number(runPayload.recovery_hours) : null,
      active_calories: runPayload.active_calories ? Number(runPayload.active_calories) : null,
      best_pace_seconds_per_km: runPayload.best_pace_seconds_per_km ? Number(runPayload.best_pace_seconds_per_km) : null,
      max_cadence: runPayload.max_cadence ? Number(runPayload.max_cadence) : null,
      splits: runPayload.splits || null,
      elevation_points: runPayload.elevation_points || runPayload.elevationPoints || null,
      heart_rate_zones: runPayload.heart_rate_zones || null,
      screenshot_url: runPayload.screenshot_url || null,
      route_data: runPayload.route_data || null,
      extra_metrics: runPayload.extra_metrics || null,
      updated_at: new Date(),
    };

    await db.insert(runs).values(newRecord).onConflictDoUpdate({
      target: runs.id,
      set: newRecord,
    });

    res.json({ success: true, run: newRecord });
  } catch (err: any) {
    console.error('DB insert error:', err);
    res.status(500).json({ error: 'Failed to save run to database' });
  }
});

router.delete('/runs/:id', async (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  if (!db) {
    return res.json({ success: true, localOnly: true });
  }

  try {
    await db.delete(runs).where(eq(runs.id, id));
    res.json({ success: true });
  } catch (err: any) {
    console.error('DB delete error:', err);
    res.status(500).json({ error: 'Failed to delete run from database' });
  }
});

// ---------------------------------------------------------------------------
// AI Coach & Running Plan Generator API
// ---------------------------------------------------------------------------
router.post('/ai-coach', async (req, res) => {
  try {
    dotenv.config();
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (_) {}
    }
    body = body || {};

    const {
      message,
      history = [],
      currentPlan = null,
      runnerContext = {},
      customApiKey,
    } = body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const serverEnvKey = (process.env.OPENROUTER_API_KEY || '').trim();
    const apiKey = (customApiKey || serverEnvKey).trim();
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        reply: `⚠️ **OpenRouter API Key Belum Terdeteksi**\n\nAI Coach memerlukan API key OpenRouter untuk berkomunikasi. Silakan tempelkan OpenRouter API Key Anda di tab **More > Preferences > Custom OpenRouter API Key**, atau tambahkan \`OPENROUTER_API_KEY\` di Vercel Settings lalu Redeploy.`,
        debugInfo: {
          endpoint: '/api/ai-coach',
          status: 'MISSING_API_KEY',
          environment: process.env.VERCEL ? 'vercel_serverless' : 'local_node',
          openRouterKeyLength: 0,
          openRouterKeyPrefix: 'none',
          hasApiKey: false,
          errorName: 'MissingApiKeyError',
          rawError: 'No OPENROUTER_API_KEY found in process.env or customApiKey in request payload.',
          clientTimestamp: new Date().toISOString(),
        },
      });
    }

    // Runner Profile Context
    const recentRuns = runnerContext.recentRuns || [];
    const unitSystem = runnerContext.unitSystem || 'metric';
    
    let runnerProfileSummary = `Runner Unit Preference: ${unitSystem.toUpperCase()}\n`;
    if (recentRuns.length > 0) {
      const totalKm = recentRuns.reduce((acc: number, r: any) => acc + (r.distance_km || 0), 0);
      const avgPace = Math.round(
        recentRuns.reduce((acc: number, r: any) => acc + (r.duration_seconds || 0), 0) / (totalKm || 1)
      );
      const avgPaceMin = Math.floor(avgPace / 60);
      const avgPaceSec = String(avgPace % 60).padStart(2, '0');
      
      runnerProfileSummary += `Logged Runs Count: ${recentRuns.length}\n`;
      runnerProfileSummary += `Recent Total Volume: ${totalKm.toFixed(1)} km\n`;
      runnerProfileSummary += `Average Pace: ${avgPaceMin}:${avgPaceSec} /km\n`;
      
      const last5 = recentRuns.slice(0, 5).map((r: any) => {
        const paceStr = r.pace_seconds_per_km
          ? `${Math.floor(r.pace_seconds_per_km / 60)}:${String(r.pace_seconds_per_km % 60).padStart(2, '0')}/km`
          : 'N/A';
        return `- ${r.date}: ${r.distance_km?.toFixed(1)}km, Pace: ${paceStr}, HR: ${r.avg_heart_rate || 'N/A'} bpm, Cadence: ${r.cadence || 'N/A'} spm`;
      }).join('\n');
      runnerProfileSummary += `Recent Workouts:\n${last5}\n`;
    } else {
      runnerProfileSummary += `No previous runs logged yet.\n`;
    }

    let planContext = 'Currently No Active Plan.';
    if (currentPlan) {
      planContext = `Current Active Plan: "${currentPlan.title}" (Goal: ${currentPlan.goal}, ${currentPlan.scheduleSummary}, Target: ${currentPlan.weeklyTargetKm}km/week, Week ${currentPlan.currentWeek || 1} of ${currentPlan.totalWeeks || 4}).`;
    }

    const systemPrompt = `You are Coach Runno, a warm, motivating, and highly knowledgeable elite running coach.
You help runners build progressive training schedules, improve their pace, prevent injuries, and prepare for race distances (5K, 10K, Half Marathon, Full Marathon).

${runnerProfileSummary}
${planContext}

COACHING GUIDELINES:
- Communicate in a natural, friendly, conversational tone (Indonesian or English depending on user input).
- When giving running advice, be encouraging, scientifically grounded (80/20 polarized training, easy runs in Zone 2, progressive overload).
- If the user explicitly asks to generate, create, or update a training plan, output your friendly explanation AND append the complete structured plan inside a \`\`\`json_plan ... \`\`\` code block.

JSON_PLAN STRUCTURE:
\`\`\`json_plan
{
  "title": "Sub-30 Min 5K Plan - Week 1",
  "goal": "Break 30 minutes in 5K",
  "scheduleSummary": "Tuesday, Thursday, Saturday",
  "selectedDays": ["Tuesday", "Thursday", "Saturday"],
  "weeklyTargetKm": 14.5,
  "totalWeeks": 6,
  "currentWeek": 1,
  "fitnessLevel": "beginner",
  "aiAdvice": "Keep easy runs conversational so you recover well for threshold days.",
  "workouts": [
    {
      "dayOfWeek": 1,
      "dayName": "Monday",
      "title": "Rest & Recovery",
      "type": "rest",
      "distanceKm": 0,
      "targetPaceSecPerKm": null,
      "targetHrZone": "Rest",
      "description": "Full rest day to recover muscles and replenish glycogen stores."
    },
    {
      "dayOfWeek": 2,
      "dayName": "Tuesday",
      "title": "Easy Aerobic Run",
      "type": "easy",
      "distanceKm": 4.0,
      "targetPaceSecPerKm": 390,
      "targetHrZone": "Zone 2 (Aerobic)",
      "description": "Smooth conversational pace to build aerobic base."
    }
  ]
}
\`\`\``;

    const lowerMsg = message.toLowerCase();
    const isExplicitPlan =
      lowerMsg.includes('buatkan jadwal') ||
      lowerMsg.includes('jadwal latihan') ||
      lowerMsg.includes('bikin plan') ||
      lowerMsg.includes('buat plan') ||
      lowerMsg.includes('generate plan') ||
      lowerMsg.includes('create plan') ||
      lowerMsg.includes('buatkan plan') ||
      lowerMsg.includes('training plan') ||
      lowerMsg.includes('buatkan jadwal lari');

    let modeDirective = '';
    if (isExplicitPlan) {
      modeDirective = '\n\nIMPORTANT: The user wants an active training plan. You MUST provide the full ```json_plan ... ``` code block with all 7 days alongside your coaching notes.';
    }

    const chatMessages: any[] = [
      { role: 'system', content: systemPrompt + modeDirective },
    ];

    for (const h of history.slice(-30)) {
      if ((h.role === 'user' || h.role === 'assistant') && h.content) {
        if (
          h.content.includes('Sorry, I encountered an issue') ||
          h.content.includes('⚠️ **Gagal Terhubung') ||
          h.content.includes('⚠️ **OpenRouter Status') ||
          h.content.includes('⚠️ **Serverless Exception') ||
          h.content.includes('API error (500)')
        ) {
          continue;
        }
        chatMessages.push({ role: h.role, content: h.content });
      }
    }


    chatMessages.push({ role: 'user', content: message });

    const model = 'google/gemini-2.5-flash';
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://runno.app',
        'X-Title': 'Runno AI Running Coach',
      },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        max_tokens: 2500,
        temperature: 0.6,
      }),
    });

    if (!openRouterResponse.ok) {
      const errText = await openRouterResponse.text();
      console.error('[Runno AI Coach] OpenRouter returned error:', openRouterResponse.status, errText);
      const fallbackPlan = generateAlgorithmicPlan(message, runnerContext);
      return res.json({
        success: true,
        reply: `⚠️ **OpenRouter Status (${openRouterResponse.status})**\n\nPanggilan ke model AI mengembalikan error ${openRouterResponse.status}. Saya telah menyiapkan jadwal latihan alternatif di bawah menggunakan offline coaching engine.`,
        suggestedPlan: fallbackPlan,
        debugInfo: {
          endpoint: 'https://openrouter.ai/api/v1/chat/completions',
          status: openRouterResponse.status,
          environment: process.env.VERCEL ? 'vercel_serverless' : 'local_node',
          openRouterKeyLength: apiKey.length,
          openRouterKeyPrefix: apiKey.substring(0, 10) + '...',
          hasApiKey: true,
          errorName: `OpenRouter_HTTP_${openRouterResponse.status}`,
          rawError: errText,
          clientTimestamp: new Date().toISOString(),
        },
      });
    }

    const data = await openRouterResponse.json();
    const rawReply = data.choices?.[0]?.message?.content || '';

    let suggestedPlan: any = null;
    let cleanReply = rawReply;

    const planMatch = rawReply.match(/```json_plan\s*([\s\S]*?)\s*```/);
    if (planMatch && planMatch[1]) {
      try {
        const parsed = JSON.parse(planMatch[1]);
        suggestedPlan = sanitizePlan(parsed);
        cleanReply = rawReply.replace(/```json_plan\s*[\s\S]*?\s*```/, '').trim();
      } catch (err: any) {
        console.warn('[Runno AI Coach] Failed to parse json_plan block:', err.message);
      }
    }

    res.json({
      success: true,
      reply: cleanReply || 'Here is your training plan:',
      suggestedPlan,
      debugInfo: {
        endpoint: '/api/ai-coach',
        status: 200,
        environment: process.env.VERCEL ? 'vercel_serverless' : 'local_node',
        openRouterKeyLength: apiKey.length,
        openRouterKeyPrefix: apiKey.substring(0, 10) + '...',
        hasApiKey: true,
        modelUsed: model,
        clientTimestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('[Runno AI Coach] Exception:', err);
    res.status(200).json({
      success: false,
      reply: `⚠️ **Serverless Exception**\n\nTerjadi kesalahan di backend serverless: \`${err.message || 'Unknown error'}\``,
      debugInfo: {
        endpoint: '/api/ai-coach',
        status: 500,
        environment: process.env.VERCEL ? 'vercel_serverless' : 'local_node',
        errorName: err.name || 'InternalError',
        rawError: err.stack || err.message,
        clientTimestamp: new Date().toISOString(),
      },
    });
  }

});

function sanitizePlan(parsed: any) {
  const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const days = parsed.selectedDays || ['Tuesday', 'Thursday', 'Saturday'];
  const summary = parsed.scheduleSummary || days.join(', ');

  const workouts = (parsed.workouts || []).map((w: any, idx: number) => ({
    id: `workout_${planId}_${w.dayOfWeek ?? idx}`,
    dayOfWeek: typeof w.dayOfWeek === 'number' ? w.dayOfWeek : idx,
    dayName: w.dayName || 'Day',
    title: w.title || 'Run Session',
    type: w.type || 'easy',
    distanceKm: Number(w.distanceKm) || 0,
    targetPaceSecPerKm: w.targetPaceSecPerKm ? Number(w.targetPaceSecPerKm) : null,
    targetHrZone: w.targetHrZone || null,
    description: w.description || '',
    completed: false,
    completedRunId: null,
  }));

  const totalKm = workouts.reduce((acc: number, w: any) => acc + (w.distanceKm || 0), 0);

  return {
    id: planId,
    title: parsed.title || 'Personal Running Plan',
    goal: parsed.goal || 'Build running endurance',
    scheduleSummary: summary,
    selectedDays: days,
    weeklyTargetKm: parsed.weeklyTargetKm || Number(totalKm.toFixed(1)),
    totalWeeks: Number(parsed.totalWeeks) || 4,
    currentWeek: Number(parsed.currentWeek) || 1,
    fitnessLevel: parsed.fitnessLevel || 'intermediate',
    status: 'active',
    workouts,
    aiAdvice: parsed.aiAdvice || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function generateAlgorithmicPlan(prompt: string, runnerContext?: any) {
  const lower = prompt.toLowerCase();
  let days = ['Tuesday', 'Thursday', 'Saturday'];

  const possibleDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const foundDays = possibleDays.filter(d => lower.includes(d.toLowerCase()));
  if (foundDays.length >= 2) days = foundDays;

  const is10K = lower.includes('10k') || lower.includes('10 k') || lower.includes('10km');
  const isHalf = lower.includes('half') || lower.includes('21k');

  let targetTitle = '5K Progression Plan';
  let targetGoal = '5K Completion & Speed';
  let weekday1Dist = 4.0;
  let weekday2Dist = 3.5;
  let weekendDist = 6.0;

  let basePaceSec = 360;
  if (runnerContext?.recentRuns && runnerContext.recentRuns.length > 0) {
    const totalDuration = runnerContext.recentRuns.reduce((acc: number, r: any) => acc + (r.duration_seconds || 0), 0);
    const totalKm = runnerContext.recentRuns.reduce((acc: number, r: any) => acc + (r.distance_km || 0), 0);
    if (totalKm > 0) basePaceSec = Math.round(totalDuration / totalKm);
  }

  if (is10K) {
    targetTitle = '10K Endurance Builder';
    targetGoal = 'Sub-50 min 10K Target';
    weekday1Dist = 6.0;
    weekday2Dist = 5.0;
    weekendDist = 10.0;
  } else if (isHalf) {
    targetTitle = 'Half Marathon Foundation';
    targetGoal = '21.1K Half Marathon Finish';
    weekday1Dist = 8.0;
    weekday2Dist = 6.0;
    weekendDist = 14.0;
  }

  const dayMap: { [key: string]: number } = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
  };

  const allWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const workouts = allWeekdays.map((dName) => {
    const dNum = dayMap[dName];
    const isRunningDay = days.includes(dName);

    if (!isRunningDay) {
      return {
        id: `workout_${Date.now()}_${dNum}`,
        dayOfWeek: dNum,
        dayName: dName,
        title: 'Rest & Recovery',
        type: 'rest',
        distanceKm: 0,
        targetPaceSecPerKm: null,
        targetHrZone: 'Rest',
        description: 'Complete recovery or light mobility stretching.',
        completed: false,
      };
    }

    const runDayIndex = days.indexOf(dName);
    if (runDayIndex === 0) {
      const tempoPace = Math.max(240, basePaceSec - 30);
      return {
        id: `workout_${Date.now()}_${dNum}`,
        dayOfWeek: dNum,
        dayName: dName,
        title: 'Tempo & Pace Intervals',
        type: 'tempo',
        distanceKm: weekday1Dist,
        targetPaceSecPerKm: tempoPace,
        targetHrZone: 'Zone 3/4 (Threshold)',
        description: `1km warmup, ${weekday1Dist - 2}km threshold pace, 1km cooldown.`,
        completed: false,
      };
    } else if (runDayIndex === 1) {
      return {
        id: `workout_${Date.now()}_${dNum}`,
        dayOfWeek: dNum,
        dayName: dName,
        title: 'Easy Aerobic Base Run',
        type: 'easy',
        distanceKm: weekday2Dist,
        targetPaceSecPerKm: basePaceSec,
        targetHrZone: 'Zone 2 (Aerobic)',
        description: `${weekday2Dist}km smooth conversational pace. Keep heart rate low.`,
        completed: false,
      };
    } else {
      const longPace = basePaceSec + 15;
      return {
        id: `workout_${Date.now()}_${dNum}`,
        dayOfWeek: dNum,
        dayName: dName,
        title: 'Endurance Long Run',
        type: 'long_run',
        distanceKm: weekendDist,
        targetPaceSecPerKm: longPace,
        targetHrZone: 'Zone 2 (Endurance)',
        description: `${weekendDist}km steady continuous aerobic run to build stamina.`,
        completed: false,
      };
    }
  });

  const totalKm = workouts.reduce((a, b) => a + b.distanceKm, 0);

  return sanitizePlan({
    title: `${targetTitle} (${days.length} Days/Week)`,
    goal: targetGoal,
    scheduleSummary: days.join(', '),
    selectedDays: days,
    weeklyTargetKm: totalKm,
    totalWeeks: 4,
    currentWeek: 1,
    fitnessLevel: 'intermediate',
    workouts,
    aiAdvice: 'Focus on keeping your easy runs truly easy so you are primed for quality tempo sessions and weekend long runs!',
  });
}

// ---------------------------------------------------------------------------
// Training Plans Persistence Endpoints
// ---------------------------------------------------------------------------
router.get('/plans/active', async (_req, res) => {
  const db = getDatabase();
  if (!db) {
    return res.status(200).json({ plan: null, storage: 'local-fallback' });
  }

  try {
    const active = await db
      .select()
      .from(trainingPlans)
      .where(eq(trainingPlans.status, 'active'))
      .orderBy(desc(trainingPlans.updated_at))
      .limit(1);

    if (active.length > 0) {
      const rec = active[0];
      const plan = {
        id: rec.id,
        title: rec.title,
        goal: rec.goal,
        scheduleSummary: rec.schedule_summary,
        selectedDays: rec.selected_days,
        weeklyTargetKm: rec.weekly_target_km,
        totalWeeks: rec.total_weeks,
        currentWeek: rec.current_week,
        fitnessLevel: rec.fitness_level,
        status: rec.status,
        workouts: rec.workouts,
        aiAdvice: rec.ai_advice,
        createdAt: rec.created_at?.toISOString?.() || new Date().toISOString(),
        updatedAt: rec.updated_at?.toISOString?.() || new Date().toISOString(),
      };
      return res.json({ success: true, plan });
    }

    res.json({ success: true, plan: null });
  } catch (err: any) {
    console.error('[Runno DB] Failed to fetch active plan:', err);
    res.status(500).json({ error: 'Failed to fetch active plan from DB' });
  }
});

router.post('/plans', async (req, res) => {
  let planPayload = req.body;
  if (typeof planPayload === 'string') {
    try {
      planPayload = JSON.parse(planPayload);
    } catch (_) {}
  }
  planPayload = planPayload || {};
  const db = getDatabase();

  if (!db) {
    return res.json({ success: true, savedLocally: true, plan: planPayload });
  }

  try {
    const newRecord = {
      id: planPayload.id || `plan_${Date.now()}`,
      title: planPayload.title || 'Training Plan',
      goal: planPayload.goal || 'Running target',
      schedule_summary: planPayload.scheduleSummary || 'Custom',
      selected_days: planPayload.selectedDays || [],
      weekly_target_km: Number(planPayload.weeklyTargetKm) || 0,
      total_weeks: Number(planPayload.totalWeeks) || 4,
      current_week: Number(planPayload.currentWeek) || 1,
      fitness_level: planPayload.fitnessLevel || 'intermediate',
      status: planPayload.status || 'active',
      workouts: planPayload.workouts || [],
      ai_advice: planPayload.aiAdvice || null,
      updated_at: new Date(),
    };

    await db.insert(trainingPlans).values(newRecord).onConflictDoUpdate({
      target: trainingPlans.id,
      set: newRecord,
    });

    res.json({ success: true, plan: planPayload });
  } catch (err: any) {
    console.error('[Runno DB] Failed to save training plan:', err);
    res.status(500).json({ error: 'Failed to save training plan to database' });
  }
});

// Coach messages sync endpoints
router.get('/coach/messages', async (_req, res) => {
  const db = getDatabase();
  if (!db) return res.json({ success: true, messages: [] });
  try {
    const result = await db
      .select()
      .from(coachMessagesTable)
      .where(eq(coachMessagesTable.id, 'default_coach_session'))
      .limit(1);
    if (result.length > 0) {
      return res.json({ success: true, messages: result[0].messages });
    }
    res.json({ success: true, messages: [] });
  } catch (err: any) {
    console.error('[Runno DB] Error fetching coach messages:', err.message);
    res.json({ success: false, messages: [] });
  }
});

router.post('/coach/messages', async (req, res) => {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_) {}
  }
  body = body || {};
  const { messages } = body;
  const db = getDatabase();
  if (!db || !messages) return res.json({ success: true });

  try {
    await db.insert(coachMessagesTable).values({
      id: 'default_coach_session',
      messages,
      updated_at: new Date(),
    }).onConflictDoUpdate({
      target: coachMessagesTable.id,
      set: {
        messages,
        updated_at: new Date(),
      },
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Runno DB] Error saving coach messages:', err.message);
    res.json({ success: false, error: err.message });
  }
});

// Mount router on both /api and root /
app.use('/api', router);
app.use('/', router);

// Fallback 404 handler
app.use((req, res) => {
  console.warn(`[Runno API 404] Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: `Not Found: ${req.method} ${req.url}` });
});

// Error handling middleware
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[Runno API Internal Error]:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Runno Backend] Server listening on http://localhost:${PORT}`);
  });
}

// Vercel Serverless Function Entrypoint
export default function handler(req: any, res: any) {
  return app(req, res);
}

export { app };


