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
  start_date: text('start_date'),
  weekly_target_km: real('weekly_target_km').notNull(),
  total_weeks: integer('total_weeks').notNull().default(4),
  current_week: integer('current_week').notNull().default(1),
  fitness_level: text('fitness_level').notNull().default('intermediate'),
  status: text('status').notNull().default('active'),
  workouts: jsonb('workouts').notNull(),
  weekly_schedules: jsonb('weekly_schedules'),
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
        start_date TEXT,
        workouts JSONB NOT NULL,
        weekly_schedules JSONB,
        ai_advice TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      ALTER TABLE training_plans ADD COLUMN IF NOT EXISTS weekly_schedules JSONB;
      ALTER TABLE training_plans ADD COLUMN IF NOT EXISTS start_date TEXT;

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
  const rawConn = process.env.DATABASE_URL;
  if (!rawConn || !rawConn.trim()) {
    return null;
  }

  if (dbInstance) return dbInstance;

  try {
    let cleanConnectionString = rawConn.trim();
    // Normalize sslmode to verify-full to eliminate pg-connection-string warning in Vercel logs
    if (
      cleanConnectionString.includes('sslmode=require') ||
      cleanConnectionString.includes('sslmode=prefer') ||
      cleanConnectionString.includes('sslmode=verify-ca')
    ) {
      cleanConnectionString = cleanConnectionString.replace(
        /sslmode=(require|prefer|verify-ca)/g,
        'sslmode=verify-full'
      );
    }

    const pool = new Pool({
      connectionString: cleanConnectionString,
      ssl: cleanConnectionString.includes('localhost') ? false : { rejectUnauthorized: false },
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
// AI Provider Resolution (Google AI Studio vs OpenRouter)
// ---------------------------------------------------------------------------
function getAiCredentials(customApiKey?: string) {
  dotenv.config();
  const rawKey = (customApiKey || '').trim();
  const isCustomGemini = rawKey.startsWith('AIza') || rawKey.length === 39;
  const isCustomGroq = rawKey.startsWith('gsk_');

  const geminiKey = (
    (isCustomGemini ? rawKey : '') ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_KEY ||
    process.env.GOOGLE_API_KEY ||
    ''
  ).trim();

  const groqKey = (
    (isCustomGroq ? rawKey : '') ||
    process.env.GROQ_API_KEY ||
    process.env.GROQ_KEY ||
    ''
  ).trim();

  const openRouterKey = (
    (!isCustomGemini && !isCustomGroq ? rawKey : '') ||
    process.env.OPENROUTER_API_KEY ||
    ''
  ).trim();

  return {
    geminiKey,
    groqKey,
    openRouterKey,
    hasGemini: geminiKey.length > 0,
    hasGroq: groqKey.length > 0,
    hasOpenRouter: openRouterKey.length > 0,
    provider: isCustomGroq ? 'groq' : (geminiKey.length > 0 ? 'gemini' : (openRouterKey.length > 0 ? 'openrouter' : (groqKey.length > 0 ? 'groq' : 'none'))),
  };
}

async function callGroqDirect({
  apiKey,
  systemPrompt,
  imagesBase64 = [],
  model = 'qwen/qwen3.6-27b',
}: {
  apiKey: string;
  systemPrompt?: string;
  imagesBase64?: string[];
  model?: string;
}): Promise<string> {
  const contentItems: any[] = [];
  if (systemPrompt) {
    contentItems.push({ type: 'text', text: systemPrompt });
  }

  for (const img of imagesBase64) {
    let finalUrl = img.trim();
    if (!finalUrl.startsWith('data:')) {
      finalUrl = `data:image/jpeg;base64,${finalUrl}`;
    }
    contentItems.push({
      type: 'image_url',
      image_url: { url: finalUrl },
    });
  }

  // Attempt 1: Call Groq
  let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: model || 'qwen/qwen3.6-27b',
      messages: [{ role: 'user', content: contentItems }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  // Attempt 2: If Groq rejected response_format with json_validate_failed (400), retry without strict response_format
  if (!response.ok && (response.status === 400 || response.status === 422)) {
    const errText = await response.text();
    if (errText.includes('json_validate_failed') || errText.includes('response_format')) {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: model || 'qwen/qwen3.6-27b',
          messages: [{ role: 'user', content: contentItems }],
          temperature: 0.1,
        }),
      });
    } else {
      throw new Error(`Groq error ${response.status}: ${errText}`);
    }
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

const GEMINI_CASCADE_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
];

async function callGeminiDirect({
  apiKey,
  systemPrompt,
  imagesBase64 = [],
  promptText = '',
  model,
  responseMimeType = 'application/json',
}: {
  apiKey: string;
  systemPrompt?: string;
  imagesBase64?: string[];
  promptText?: string;
  model?: string;
  responseMimeType?: string;
}): Promise<{ text: string; modelUsed: string }> {
  const cleanKey = apiKey.trim();
  const modelsToTry = model
    ? [model, ...GEMINI_CASCADE_MODELS.filter((m) => m !== model)]
    : GEMINI_CASCADE_MODELS;

  const parts: any[] = [];
  const combinedText = [systemPrompt, promptText].filter(Boolean).join('\n\n');
  if (combinedText) {
    parts.push({ text: combinedText });
  }

  for (const img of imagesBase64) {
    let mimeType = 'image/jpeg';
    let dataStr = img.trim();
    if (dataStr.startsWith('data:')) {
      const match = dataStr.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        dataStr = match[2];
      }
    }
    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: dataStr,
      },
    });
  }

  const payload: any = {
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    generationConfig: {
      temperature: 0.1,
    },
  };

  if (responseMimeType) {
    payload.generationConfig.responseMimeType = responseMimeType;
  }

  let lastErrorText = '';

  for (const targetModel of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${cleanKey}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const textOutput = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textOutput) {
          return { text: textOutput, modelUsed: `Google ${targetModel} (AI Studio)` };
        }
      }

      const errText = await res.text();
      lastErrorText = `[${targetModel}] HTTP ${res.status}: ${errText.substring(0, 150)}`;
      console.warn(`[Google AI Studio Cascade] Model ${targetModel} returned status ${res.status}, auto-switching to next model in cascade...`);
    } catch (fetchErr: any) {
      lastErrorText = `[${targetModel}] ${fetchErr.message}`;
      console.warn(`[Google AI Studio Cascade] Model ${targetModel} fetch error:`, fetchErr.message);
    }
  }

  throw new Error(`Google AI Studio Cascade Error: All models in cascade failed. Last error: ${lastErrorText}`);
}

// ---------------------------------------------------------------------------
// Health check endpoint
// ---------------------------------------------------------------------------
router.get('/health', (_req, res) => {
  dotenv.config();
  const db = getDatabase();
  const aiCreds = getAiCredentials();
  res.json({
    status: 'ok',
    environment: process.env.VERCEL ? 'vercel_serverless' : 'local_node',
    hasGeminiKey: aiCreds.hasGemini,
    hasOpenRouterKey: aiCreds.hasOpenRouter,
    activeProvider: aiCreds.hasGemini ? 'Google AI Studio (Gemini)' : (aiCreds.hasOpenRouter ? 'OpenRouter' : 'none'),
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

    const { imageBase64, intervalImageBase64, imagesBase64, customApiKey } = body;

    const rawImages: string[] = [];
    if (imageBase64 && typeof imageBase64 === 'string') rawImages.push(imageBase64);
    if (intervalImageBase64 && typeof intervalImageBase64 === 'string') rawImages.push(intervalImageBase64);
    if (Array.isArray(imagesBase64)) {
      for (const img of imagesBase64) {
        if (img && typeof img === 'string') rawImages.push(img);
      }
    }

    // Filter and sanitize valid images (ignore blob: or broken strings)
    const validImages = rawImages.filter((img) => {
      if (!img || typeof img !== 'string') return false;
      const trimmed = img.trim();
      if (trimmed.startsWith('blob:')) return false;
      return trimmed.startsWith('data:image/') || trimmed.length > 50;
    });

    if (validImages.length === 0) {
      return res.status(400).json({ error: 'Missing valid imageBase64 or screenshots in request body' });
    }

    const aiCreds = getAiCredentials(customApiKey);
    if (!aiCreds.hasGemini && !aiCreds.hasOpenRouter) {
      return res.status(400).json({
        error: 'AI API key is missing. Please set GEMINI_API_KEY (from Google AI Studio) or OPENROUTER_API_KEY in Vercel Environment Variables.',
        code: 'MISSING_API_KEY',
      });
    }

    const imageContentItems = validImages.map((img) => {
      let formatted = img.trim();
      if (!formatted.startsWith('data:image/')) {
        formatted = `data:image/jpeg;base64,${formatted}`;
      }
      return { type: 'image_url', image_url: { url: formatted } };
    });

    const systemPrompt = `You are an expert sports data extraction AI specializing in running result screenshots from Huawei Health, Amazfit, Zepp, Apple Fitness, Garmin Connect, Strava, Coros, Nike Run Club, and Samsung Health.

Read the provided screenshot(s) carefully. You may receive screenshots showing the main workout overview, interval segments/laps table (e.g. Huawei Health "Segments" tab), splits table, or charts.
Merge, cross-correlate, and extract all workout metrics accurately.

CRITICAL PARSING RULES:
1. Decimal Separators: In European/Huawei locales, comma ',' represents a decimal point. Convert '6,50' to 6.50, '1,72' to 1.72, '0,40' to 0.40, '0,02' to 0.02, '57,4' to 57.4, '89,3' to 89.3.
2. Workout Time / Duration:
   - Look at the main workout duration counter or the Total row.
   - If formatted as "00:15:20" or "01:01:40" (HH:MM:SS), calculate total seconds: 15m + 20s = 920s; 1h + 1m + 40s = 3700s.
   - If formatted as "02:30" (MM:SS), calculate total seconds: 2m + 30s = 150s.
3. Pace:
   - Convert pace formatted as "6'16\"" (6 min 16 sec) to total seconds: 6 * 60 + 16 = 376s.
   - Convert pace formatted as "8'55\"" to total seconds: 8 * 60 + 55 = 535s.
   - Convert pace formatted as "64'47\"" to total seconds: 64 * 60 + 47 = 3887s.
4. Segments & Interval Laps Table (e.g. Huawei Health "Segments" tab with columns: Segments, Type, Duration, Distance (km), Pace (/km), Avg heart rate (bpm)):
   - Extract EVERY row into the "splits" array:
     [
       {
         "km": 1,
         "type": "Run",
         "duration_seconds": 150,
         "distance_km": 0.40,
         "pace_seconds": 376,
         "avg_heart_rate": 147,
         "elevation_diff_m": 0
       },
       {
         "km": 2,
         "type": "Rest",
         "duration_seconds": 75,
         "distance_km": 0.02,
         "pace_seconds": 3887,
         "avg_heart_rate": 155,
         "elevation_diff_m": 0
       },
       ...
     ]
   - If there is a "Total" row at the bottom:
     - Distance "1,72" -> "distance_km": 1.72
     - Duration "00:15:20" -> "duration_seconds": 920
     - Pace "8'55\"" -> "pace_seconds_per_km": 535
     - Avg HR "162" -> "avg_heart_rate": 162
5. Standard Kilometer Splits:
   - If standard kilometer splits (KM 1, KM 2...) are shown, extract into "splits": [ { "km": 1, "pace_seconds": 360, "elevation_diff_m": 0 }, ... ].
6. Heart Rate & Zones:
   - Avg Heart Rate (e.g. 162 bpm) -> avg_heart_rate: 162.
   - Max Heart Rate -> max_heart_rate.
7. Performance, Form & Elevation:
   - Extract cadence, steps, stride length, TE, VO2max, elevation gain/loss if visible.
8. Source:
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
  "splits": [
    {
      "km": number,
      "type": string | null,
      "duration_seconds": number | null,
      "distance_km": number | null,
      "pace_seconds": number,
      "avg_heart_rate": number | null,
      "elevation_diff_m": number | null
    }
  ] | null,
  "heart_rate_zones": [ { "zone": number, "name": string, "percentage": number, "duration_seconds": number | null, "bpm_range": string | null } ] | null,
  "elevation_points": [ { "distance_km": number, "elevation_m": number, "heart_rate": number | null, "pace_seconds": number | null, "cadence": number | null } ] | null,
  "raw_notes": string | null
}`;


    const startTime = performance.now();
    let rawContent = '';
    let modelUsed = '';
    let lastErrorText = '';

    const VISION_MODEL_MAP: Record<string, string> = {
      groq: 'qwen/qwen3.6-27b',
      nvidia: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
      nvidia_safety: 'nvidia/nemotron-3.5-content-safety:free',
      gemma: 'google/gemma-4-26b-a4b-it:free',
      dots: 'dots-studio/dots-3-note-preview:free',
      gemini: 'google/gemini-2.5-flash-lite',
    };

    const requestedModel = (body.model || 'nvidia').toString().toLowerCase();
    let targetModel = VISION_MODEL_MAP[requestedModel] || requestedModel;
    if (!targetModel.includes('/')) {
      targetModel = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';
    }

    // Provider 1: Direct Groq (if requestedModel is groq or user provided a Groq API key)
    if ((requestedModel === 'groq' || aiCreds.provider === 'groq') && aiCreds.hasGroq) {
      try {
        rawContent = await callGroqDirect({
          apiKey: aiCreds.groqKey,
          systemPrompt,
          imagesBase64: validImages,
          model: 'qwen/qwen3.6-27b',
        });
        modelUsed = 'Groq Qwen 3.6 27B (LPU)';
      } catch (groqErr: any) {
        lastErrorText = groqErr.message;
        console.warn('[Runno OCR] Direct Groq error, checking fallback:', groqErr.message);
      }
    }

    // Provider 2: Direct Google AI Studio with Smart Cascade (gemini-3.7-flash -> 3.5 -> 2.5 -> 2.5-lite)
    if (!rawContent && aiCreds.hasGemini) {
      try {
        const geminiRes = await callGeminiDirect({
          apiKey: aiCreds.geminiKey,
          systemPrompt,
          imagesBase64: validImages,
          model: 'gemini-3.7-flash',
          responseMimeType: 'application/json',
        });
        rawContent = geminiRes.text;
        modelUsed = geminiRes.modelUsed;
      } catch (geminiErr: any) {
        lastErrorText = geminiErr.message;
        console.warn('[Runno OCR] Direct Gemini error, checking OpenRouter fallback:', geminiErr.message);
      }
    }

    // Provider 3: OpenRouter with selected vision model and fast fallbacks
    if (!rawContent && aiCreds.hasOpenRouter) {
      const candidateModels = [
        targetModel,
        'google/gemini-2.5-flash-lite',
        'google/gemma-4-26b-a4b-it:free',
        'nvidia/nemotron-3.5-content-safety:free',
        'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
        'dots-studio/dots-3-note-preview:free',
      ].filter((m, idx, arr) => m && arr.indexOf(m) === idx) as string[];

      for (const m of candidateModels) {
        modelUsed = m;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 28000);

          const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${aiCreds.openRouterKey}`,
              'HTTP-Referer': 'https://runno.app',
              'X-Title': 'Runno Running Tracker',
            },
            body: JSON.stringify({
              model: m,
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: systemPrompt },
                    ...imageContentItems,
                  ],
                },
              ],
              max_tokens: 2500,
              temperature: 0.1,
            }),
          });
          clearTimeout(timeoutId);

          if (openRouterResponse.ok) {
            const data = await openRouterResponse.json();
            rawContent = data.choices?.[0]?.message?.content || '';
            if (rawContent) break;
          }
          lastErrorText = await openRouterResponse.text();
        } catch (err: any) {
          lastErrorText = err.message;
        }
      }
    }

    const durationMs = Math.round(performance.now() - startTime);
    const durationSeconds = Number((durationMs / 1000).toFixed(2));

    if (!rawContent) {
      return res.status(500).json({
        error: `AI analysis error: ${lastErrorText || 'Failed to extract running data.'}`,
        durationMs,
        durationSeconds,
      });
    }

    const cleanedJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsedData = JSON.parse(cleanedJson);
      res.json({
        success: true,
        data: parsedData,
        modelUsed: modelUsed || 'AI Model',
        durationMs,
        durationSeconds,
      });
    } catch (parseError) {
      res.json({
        success: true,
        data: { raw_notes: rawContent },
        modelUsed: modelUsed || 'AI Model',
        durationMs,
        durationSeconds,
      });
    }
  } catch (error: any) {
    console.error('[Runno] Screenshot Analysis Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// ---------------------------------------------------------------------------
// Pre-flight AI Vision Diagnostic Endpoint
// ---------------------------------------------------------------------------
router.post('/test-vision', async (req, res) => {
  try {
    dotenv.config();
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (_) {}
    }
    body = body || {};

    const aiCreds = getAiCredentials(body.customApiKey);
    if (!aiCreds.hasGemini && !aiCreds.hasOpenRouter) {
      return res.status(400).json({
        success: false,
        error: 'API Key missing. Please configure GEMINI_API_KEY (Google AI Studio) or OPENROUTER_API_KEY.',
      });
    }

    const start = performance.now();

    if (aiCreds.hasGemini) {
      try {
        const geminiRes = await callGeminiDirect({
          apiKey: aiCreds.geminiKey,
          promptText: 'Ping: reply with OK.',
          responseMimeType: undefined,
          model: 'gemini-3.7-flash',
        });
        const durationMs = Math.round(performance.now() - start);
        return res.json({
          success: true,
          status: 200,
          modelUsed: geminiRes.modelUsed,
          durationMs,
          message: 'Google AI Studio Cascade (Gemini 3.7 → 2.5) is responsive and ready for image extraction.',
        });
      } catch (geminiErr: any) {
        if (!aiCreds.hasOpenRouter && !aiCreds.hasGroq) {
          return res.status(200).json({
            success: false,
            modelUsed: 'Google Gemini (AI Studio)',
            durationMs: Math.round(performance.now() - start),
            error: geminiErr.message,
          });
        }
      }
    }

    const VISION_MODEL_MAP: Record<string, string> = {
      groq: 'qwen/qwen3.6-27b',
      nvidia: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
      nvidia_safety: 'nvidia/nemotron-3.5-content-safety:free',
      gemma: 'google/gemma-4-26b-a4b-it:free',
      dots: 'dots-studio/dots-3-note-preview:free',
      gemini: 'google/gemini-2.5-flash-lite',
    };

    const requestedModel = (body.model || 'nvidia').toString().toLowerCase();
    let targetModel = VISION_MODEL_MAP[requestedModel] || requestedModel;
    if (!targetModel.includes('/')) {
      targetModel = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';
    }

    // Direct Groq ping test
    if ((requestedModel === 'groq' || aiCreds.provider === 'groq') && aiCreds.hasGroq) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${aiCreds.groqKey}`,
          },
          body: JSON.stringify({
            model: 'qwen/qwen3.6-27b',
            messages: [{ role: 'user', content: 'Ping: reply with OK.' }],
            max_tokens: 15,
            temperature: 0.1,
          }),
        });
        const durationMs = Math.round(performance.now() - start);
        if (groqRes.ok) {
          return res.status(200).json({
            success: true,
            status: 200,
            modelUsed: 'Groq Qwen 3.6 27B (LPU)',
            durationMs,
            message: 'Groq Vision API is responsive and ready for image extraction.',
          });
        }
        const errText = await groqRes.text();
        return res.status(200).json({
          success: false,
          status: groqRes.status,
          modelUsed: 'Groq Qwen 3.6 27B',
          durationMs,
          error: `Groq HTTP ${groqRes.status}: ${errText.substring(0, 200)}`,
        });
      } catch (groqErr: any) {
        return res.status(200).json({
          success: false,
          modelUsed: 'Groq Qwen 3.6 27B',
          durationMs: Math.round(performance.now() - start),
          error: groqErr.message,
        });
      }
    }

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiCreds.openRouterKey}`,
        'HTTP-Referer': 'https://runno.app',
        'X-Title': 'Runno Vision Preflight Diagnostic',
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [{ role: 'user', content: 'Ping: reply with OK.' }],
        max_tokens: 15,
        temperature: 0.1,
      }),
    });

    const durationMs = Math.round(performance.now() - start);

    if (!openRouterResponse.ok) {
      const errText = await openRouterResponse.text();
      let parsedErr: any = {};
      try { parsedErr = JSON.parse(errText); } catch (_) {}
      return res.status(200).json({
        success: false,
        status: openRouterResponse.status,
        modelUsed: targetModel,
        durationMs,
        error: parsedErr?.error?.message || `HTTP ${openRouterResponse.status}: ${errText.substring(0, 200)}`,
      });
    }

    res.json({
      success: true,
      status: 200,
      modelUsed: targetModel,
      durationMs,
      message: 'Model is responsive and ready for image extraction.',
    });
  } catch (err: any) {
    res.status(200).json({
      success: false,
      status: 500,
      error: err.message || 'Connection timeout or network error',
    });
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

router.post('/runs/batch', async (req, res) => {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_) {}
  }
  const runsArray: any[] = Array.isArray(body) ? body : (Array.isArray(body?.runs) ? body.runs : []);
  const db = getDatabase();

  if (!db) {
    return res.json({ success: true, savedLocally: true, count: runsArray.length });
  }

  try {
    let insertedCount = 0;
    for (const r of runsArray) {
      if (!r || (!r.distance_km && !r.duration_seconds && !r.id)) continue;
      const rec = {
        id: r.id || `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date: r.date || new Date().toISOString(),
        source: r.source || 'Huawei Health',
        distance_km: Number(r.distance_km) || 0,
        duration_seconds: Number(r.duration_seconds) || 0,
        pace_seconds_per_km: r.pace_seconds_per_km ? Number(r.pace_seconds_per_km) : null,
        avg_speed_kmh: r.avg_speed_kmh ? Number(r.avg_speed_kmh) : null,
        avg_heart_rate: r.avg_heart_rate ? Number(r.avg_heart_rate) : null,
        max_heart_rate: r.max_heart_rate ? Number(r.max_heart_rate) : null,
        cadence: r.cadence ? Number(r.cadence) : null,
        elevation_gain_m: r.elevation_gain_m ? Number(r.elevation_gain_m) : null,
        elevation_loss_m: r.elevation_loss_m ? Number(r.elevation_loss_m) : null,
        calories: r.calories ? Number(r.calories) : null,
        total_steps: r.total_steps ? Number(r.total_steps) : null,
        stride_length_cm: r.stride_length_cm ? Number(r.stride_length_cm) : null,
        ground_contact_time_ms: r.ground_contact_time_ms ? Number(r.ground_contact_time_ms) : null,
        vertical_oscillation_cm: r.vertical_oscillation_cm ? Number(r.vertical_oscillation_cm) : null,
        ground_contact_balance: r.ground_contact_balance || null,
        aerobic_te: r.aerobic_te ? Number(r.aerobic_te) : null,
        anaerobic_te: r.anaerobic_te ? Number(r.anaerobic_te) : null,
        vo2max: r.vo2max ? Number(r.vo2max) : null,
        training_load: r.training_load ? Number(r.training_load) : null,
        recovery_hours: r.recovery_hours ? Number(r.recovery_hours) : null,
        active_calories: r.active_calories ? Number(r.active_calories) : null,
        best_pace_seconds_per_km: r.best_pace_seconds_per_km ? Number(r.best_pace_seconds_per_km) : null,
        max_cadence: r.max_cadence ? Number(r.max_cadence) : null,
        splits: r.splits || null,
        elevation_points: r.elevation_points || r.elevationPoints || null,
        heart_rate_zones: r.heart_rate_zones || null,
        screenshot_url: r.screenshot_url || null,
        route_data: r.route_data || r.route || null,
        extra_metrics: r.extra_metrics || null,
        updated_at: new Date(),
      };

      await db.insert(runs).values(rec).onConflictDoUpdate({
        target: runs.id,
        set: rec,
      });
      insertedCount++;
    }

    res.json({ success: true, count: insertedCount });
  } catch (err: any) {
    console.error('DB batch insert error:', err);
    res.status(500).json({ error: 'Failed to batch save runs to database' });
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
      coachModel,
    } = body;


    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const aiCreds = getAiCredentials(customApiKey);
    if (!aiCreds.hasGemini && !aiCreds.hasOpenRouter) {
      return res.status(200).json({
        success: false,
        reply: `⚠️ **API Key AI Belum Terdeteksi**\n\nAI Coach memerlukan API key untuk berkomunikasi. Silakan tempelkan **Google Gemini API Key** (dari Google AI Studio) atau OpenRouter API Key di tab **More > Preferences**, atau tambahkan \`GEMINI_API_KEY\` di Vercel Environment Variables.`,
        debugInfo: {
          endpoint: '/api/ai-coach',
          status: 'MISSING_API_KEY',
          environment: process.env.VERCEL ? 'vercel_serverless' : 'local_node',
          hasGeminiKey: false,
          hasOpenRouterKey: false,
          hasApiKey: false,
          errorName: 'MissingApiKeyError',
          rawError: 'No GEMINI_API_KEY or OPENROUTER_API_KEY found in process.env or customApiKey.',
          clientTimestamp: new Date().toISOString(),
        },
      });
    }

    // Runner Profile Context
    const recentRuns = runnerContext.recentRuns || [];
    const unitSystem = runnerContext.unitSystem || 'metric';
     let runnerProfileSummary = `=== RUNNER SUMMARY STATS ===\n`;
    if (recentRuns.length > 0) {
      const totalKm = recentRuns.reduce((acc: number, r: any) => acc + (r.distance_km || 0), 0);
      const totalDurationSec = recentRuns.reduce((acc: number, r: any) => acc + (r.duration_seconds || 0), 0);
      const avgPace = Math.round(totalDurationSec / (totalKm || 1));
      const avgPaceMin = Math.floor(avgPace / 60);
      const avgPaceSec = String(avgPace % 60).padStart(2, '0');
      
      runnerProfileSummary += `• Total Logged Volume: ${totalKm.toFixed(2)} km\n`;
      runnerProfileSummary += `• Total Logged Runs: ${recentRuns.length} workouts\n`;
      runnerProfileSummary += `• Overall Average Pace: ${avgPaceMin}:${avgPaceSec} /km\n`;
      runnerProfileSummary += `• Preferred Units: ${unitSystem.toUpperCase()}\n\n`;
      
      const runsList = recentRuns.map((r: any, idx: number) => {
        const paceStr = r.pace_seconds_per_km
          ? `${Math.floor(r.pace_seconds_per_km / 60)}:${String(r.pace_seconds_per_km % 60).padStart(2, '0')}/km`
          : 'N/A';
        const durMin = r.duration_seconds
          ? `${Math.floor(r.duration_seconds / 60)}:${String(r.duration_seconds % 60).padStart(2, '0')}`
          : 'N/A';
        const hrStr = r.avg_heart_rate ? `HR: ${r.avg_heart_rate} bpm` : '';
        const cadStr = r.cadence ? `Cadence: ${r.cadence} spm` : '';
        const elevStr = r.elevation_gain_m ? `+${r.elevation_gain_m}m elev` : '';
        const splitsCount = r.splits?.length ? `(${r.splits.length} splits)` : '';

        const extra = [hrStr, cadStr, elevStr, splitsCount].filter(Boolean).join(', ');

        return `${idx + 1}. [${r.date || 'No date'}] ${r.distance_km ? r.distance_km.toFixed(2) : 0}km (${durMin}, Pace: ${paceStr}${extra ? ` | ${extra}` : ''})`;
      }).join('\n');

      runnerProfileSummary += `=== DETAILED LOGGED RUNS ===\n${runsList}\n`;
    } else {
      runnerProfileSummary += `No previous runs logged yet.\n`;
    }

    let planContext = 'Currently No Active Plan.';
    if (currentPlan) {
      planContext = `Current Active Plan: "${currentPlan.title}" (Goal: ${currentPlan.goal}, ${currentPlan.scheduleSummary}, Target: ${currentPlan.weeklyTargetKm}km/week, Week ${currentPlan.currentWeek || 1} of ${currentPlan.totalWeeks || 4}).`;
    }

    const systemPrompt = `You are Coach Runno, a motivating, warm, and highly experienced running coach.

${runnerProfileSummary}
${planContext}

COACHING & RESPONSE PRINCIPLES:
1. Direct, Straightforward & Concise:
   - Always answer user questions directly without unnecessary rambling or robotic disclaimers.
   - If the user asks for total distance, total runs, or overall statistics, give the exact answer immediately from the summary in 1-2 clear, encouraging sentences.
2. Natural, Friendly Persona:
   - Talk like a genuine human running coach (Indonesian by default if the user speaks Indonesian, or English if user speaks English).
   - Keep answers practical, actionable, and easy to read.
3. Structured Plan Generation:
   - When proposing, adapting, advancing, or adjusting any training plan/schedule, write your brief coaching notes AND append the complete structured plan inside a \`\`\`json_plan ... \`\`\` code block.
   - Keep each workout's "description" short and concise (1 sentence) to keep generation fast and complete.

JSON_PLAN STRUCTURE:
\`\`\`json_plan
{
  "title": "Sub-35 Min 5K Plan - Week 2",
  "goal": "Mencapai Sub-35 Menit 5K",
  "scheduleSummary": "Selasa, Kamis, Sabtu",
  "selectedDays": ["Tuesday", "Thursday", "Saturday"],
  "weeklyTargetKm": 13.5,
  "totalWeeks": 16,
  "currentWeek": 2,
  "fitnessLevel": "beginner",
  "aiAdvice": "Jaga lari santai tetap konversasional untuk pemulihan optimal.",
  "workouts": [
    {
      "dayOfWeek": 1,
      "dayName": "Senin",
      "title": "Rest & Recovery",
      "type": "rest",
      "distanceKm": 0,
      "targetPaceSecPerKm": null,
      "targetHrZone": "Rest",
      "description": "Istirahat total agar otot pulih optimal."
    },
    {
      "dayOfWeek": 2,
      "dayName": "Selasa",
      "title": "Easy Aerobic Run",
      "type": "easy",
      "distanceKm": 4.0,
      "targetPaceSecPerKm": 390,
      "targetHrZone": "Zone 2 (Aerobic)",
      "description": "Lari santai dengan ritme stabil dan nafas teratur."
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
      lowerMsg.includes('minggu') ||
      lowerMsg.includes('week') ||
      lowerMsg.includes('jadwal');

    let modeDirective = '';
    if (isExplicitPlan) {
      modeDirective = '\n\nIMPORTANT: The user wants a training plan or schedule update. You MUST provide the full ```json_plan ... ``` code block containing all 7 days alongside your coaching notes.';
    }

    let rawReply = '';
    let modelUsed = '';

    // Direct Google AI Studio Execution with Smart Cascade (Gemini 3.7 -> 3.5 -> 2.5 -> 2.5-lite)
    if (aiCreds.hasGemini) {
      try {
        const historyText = history
          .slice(-10)
          .filter((h: any) => h.content && !h.content.includes('⚠️'))
          .map((h: any) => `${h.role === 'user' ? 'Runner' : 'Coach Runno'}: ${h.content}`)
          .join('\n\n');
        
        const conversationPrompt = `${historyText ? `${historyText}\n\n` : ''}Runner: ${message}\nCoach Runno:`;

        const geminiRes = await callGeminiDirect({
          apiKey: aiCreds.geminiKey,
          systemPrompt: systemPrompt + modeDirective,
          promptText: conversationPrompt,
          model: 'gemini-3.7-flash',
          responseMimeType: undefined,
        });
        rawReply = geminiRes.text;
        modelUsed = geminiRes.modelUsed;
      } catch (geminiErr: any) {
        console.warn('[Runno AI Coach] Direct Gemini error, checking fallbacks:', geminiErr.message);
      }
    }

    // Direct Groq Execution (if requested coachModel is groq or user configured Groq)
    if (!rawReply && (coachModel === 'groq' || aiCreds.provider === 'groq' || (!aiCreds.hasGemini && aiCreds.hasGroq)) && aiCreds.hasGroq) {
      try {
        const chatMessages: any[] = [
          { role: 'system', content: systemPrompt + modeDirective },
        ];
        for (const h of history.slice(-20)) {
          if ((h.role === 'user' || h.role === 'assistant') && h.content && !h.content.includes('⚠️')) {
            chatMessages.push({ role: h.role, content: h.content });
          }
        }
        chatMessages.push({ role: 'user', content: message });

        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${aiCreds.groqKey}`,
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: chatMessages,
            max_tokens: 3000,
            temperature: 0.6,
          }),
        });

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          rawReply = groqData.choices?.[0]?.message?.content || '';
          modelUsed = 'Groq GPT-OSS 120B (GroqCloud LPU)';
        }
      } catch (groqErr: any) {
        console.warn('[Runno AI Coach] Groq error:', groqErr.message);
      }
    }

    // Fallback to OpenRouter if Gemini and Groq failed or not available
    if (!rawReply && aiCreds.hasOpenRouter) {
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

      const MODEL_MAP: Record<string, string> = {
        nvidia: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
        dots: 'dots-studio/dots-3-note-preview:free',
        gemini: 'google/gemini-2.5-flash',
      };

      let targetModel = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';
      if (coachModel) {
        if (MODEL_MAP[coachModel]) {
          targetModel = MODEL_MAP[coachModel];
        } else if (typeof coachModel === 'string' && coachModel.includes('/')) {
          targetModel = coachModel;
        }
      }

      let openRouterResponse: any = null;
      let lastErrorText = '';

      const candidateModels = [
        targetModel,
        targetModel !== 'dots-studio/dots-3-note-preview:free' ? 'dots-studio/dots-3-note-preview:free' : null,
        targetModel !== 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free' ? 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free' : null,
        'google/gemini-2.5-flash',
        'google/gemini-2.0-flash-lite-preview:free',
      ].filter(Boolean) as string[];

      for (const m of candidateModels) {
        modelUsed = m;
        try {
          openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${aiCreds.openRouterKey}`,
              'HTTP-Referer': 'https://runno.app',
              'X-Title': 'Runno AI Running Coach',
            },
            body: JSON.stringify({
              model: m,
              messages: chatMessages,
              max_tokens: 4000,
              temperature: 0.6,
            }),
          });

          if (openRouterResponse.ok) {
            const data = await openRouterResponse.json();
            rawReply = data.choices?.[0]?.message?.content || '';
            break;
          }
          lastErrorText = await openRouterResponse.text();
        } catch (err: any) {
          lastErrorText = err.message;
        }
      }

      if (!rawReply) {
        const fallbackPlan = generateAlgorithmicPlan(message, runnerContext);
        return res.json({
          success: true,
          reply: `⚠️ **AI Service Status**\n\nPanggilan ke model AI mengembalikan error. Saya telah menyiapkan jadwal latihan alternatif di bawah menggunakan offline coaching engine.`,
          suggestedPlan: fallbackPlan,
          debugInfo: {
            endpoint: '/api/ai-coach',
            status: openRouterResponse?.status || 500,
            environment: process.env.VERCEL ? 'vercel_serverless' : 'local_node',
            hasGeminiKey: aiCreds.hasGemini,
            hasOpenRouterKey: aiCreds.hasOpenRouter,
            hasApiKey: true,
            modelUsed,
            errorName: `AI_HTTP_ERROR`,
            rawError: lastErrorText,
            clientTimestamp: new Date().toISOString(),
          },
        });
      }
    }

    // Robust plan extraction with auto-repair
    function repairAndParseJson(text: string) {
      if (!text) return null;
      const clean = text.trim();
      try { return JSON.parse(clean); } catch (_) {}

      const cleaned = clean
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\u201C\u201D]/g, '"');

      try { return JSON.parse(cleaned); } catch (_) {}

      const lastObjEnd = cleaned.lastIndexOf('}');
      if (lastObjEnd !== -1) {
        let candidate = cleaned.substring(0, lastObjEnd + 1);
        let openBraces = 0;
        let openBrackets = 0;
        let inString = false;
        let escaped = false;

        for (let i = 0; i < candidate.length; i++) {
          const char = candidate[i];
          if (char === '"' && !escaped) inString = !inString;
          else if (!inString) {
            if (char === '{') openBraces++;
            else if (char === '}') openBraces--;
            else if (char === '[') openBrackets++;
            else if (char === ']') openBrackets--;
          }
          escaped = (char === '\\' && !escaped);
        }

        while (openBrackets > 0) { candidate += ']'; openBrackets--; }
        while (openBraces > 0) { candidate += '}'; openBraces--; }

        try { return JSON.parse(candidate); } catch (_) {}
      }
      return null;
    }

    let suggestedPlan: any = null;
    let cleanReply = rawReply;

    // Strategy 1: Look for ```json_plan ... ``` or ```json ... ``` code blocks
    const codeBlockMatch = rawReply.match(/```(?:json_plan|json)?\s*([\s\S]*?)(?:```|$)/);
    if (codeBlockMatch && codeBlockMatch[1] && codeBlockMatch[1].includes('"workouts"')) {
      const parsed = repairAndParseJson(codeBlockMatch[1]);
      if (parsed && (parsed.workouts || parsed.title)) {
        suggestedPlan = sanitizePlan(parsed);
        cleanReply = rawReply.replace(codeBlockMatch[0], '').trim();
      }
    }

    // Strategy 2: Look for raw JSON object containing "workouts"
    if (!suggestedPlan) {
      const firstBrace = rawReply.indexOf('{');
      const lastBrace = rawReply.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const candidate = rawReply.substring(firstBrace, lastBrace + 1);
        if (candidate.includes('"workouts"')) {
          const parsed = repairAndParseJson(candidate);
          if (parsed && (parsed.workouts || parsed.title)) {
            suggestedPlan = sanitizePlan(parsed);
            cleanReply = (rawReply.substring(0, firstBrace) + ' ' + rawReply.substring(lastBrace + 1)).trim();
          }
        }
      }
    }

    // Final cleanReply cleanup: strip any lingering raw code blocks
    cleanReply = cleanReply
      .replace(/```(?:json_plan|json)?[\s\S]*?(?:```|$)/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .trim();

    res.json({
      success: true,
      reply: cleanReply || 'Berikut adalah jadwal latihan yang telah saya susun untuk kamu:',
      suggestedPlan,
      debugInfo: {
        endpoint: '/api/ai-coach',
        status: 200,
        environment: process.env.VERCEL ? 'vercel_serverless' : 'local_node',
        hasServerEnvKey: Boolean(process.env.OPENROUTER_API_KEY),
        hasCustomClientKey: Boolean(customApiKey),
        hasApiKey: true,
        modelUsed,
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
        startDate: rec.start_date || null,
        weeklyTargetKm: rec.weekly_target_km,
        totalWeeks: rec.total_weeks,
        currentWeek: rec.current_week,
        fitnessLevel: rec.fitness_level,
        status: rec.status,
        workouts: rec.workouts,
        weeklySchedules: rec.weekly_schedules || null,
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
      start_date: planPayload.startDate || null,
      weekly_target_km: Number(planPayload.weeklyTargetKm) || 0,
      total_weeks: Number(planPayload.totalWeeks) || 4,
      current_week: Number(planPayload.currentWeek) || 1,
      fitness_level: planPayload.fitnessLevel || 'intermediate',
      status: planPayload.status || 'active',
      workouts: planPayload.workouts || [],
      weekly_schedules: planPayload.weeklySchedules || null,
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


