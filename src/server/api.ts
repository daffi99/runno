import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { getDatabase } from './db/index';
import { runs, trainingPlans } from './db/schema';
import { eq, desc } from 'drizzle-orm';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Normalize URL path so both /api/... and /... work in Vercel serverless environments
app.use((req, _res, next) => {
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

// Safe Body Parsing (handles both streaming and pre-parsed Vercel serverless payloads)
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    next();
  } else {
    express.json({ limit: '30mb' })(req, res, next);
  }
});

app.get('/api/health', (_req, res) => {
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


app.post('/api/analyze-screenshot', async (req, res) => {
  try {
    dotenv.config();
    const { imageBase64, customApiKey } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in request body' });
    }

    const apiKey = (customApiKey || process.env.OPENROUTER_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(400).json({
        error: 'OpenRouter API key is missing. Please set OPENROUTER_API_KEY in .env or provide it in Settings > Custom OpenRouter API Key.',
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
   - Look at the main workout duration counter (often labeled Workout time, Total Time, or the primary timer box).
   - If formatted as "01:01:40" or "01:01:39" (HH:MM:SS), calculate total seconds: 1 hour + 1 min + 40 sec = 3700 seconds.
   - If formatted as "51:02" (MM:SS), calculate total seconds: 51 min + 2 sec = 3062 seconds.
   - DO NOT confuse minutes with hours. Double check HH:MM:SS arithmetic!
3. Pace:
   - Average pace (e.g. 9'29" or 9:29/km) -> pace_seconds_per_km: 569.
   - Best pace (e.g. 7'29" or 7:35/km) -> best_pace_seconds_per_km: 449.
4. Cadence & Steps:
   - Avg Cadence (e.g. 147 spm) -> cadence: 147.
   - Max Cadence (e.g. 160 spm) -> max_cadence: 160.
   - Total Steps (e.g. 9 074 steps or 9074) -> total_steps: 9074.
   - Stride Length (e.g. 121 cm or 1.21 m) -> stride_length_cm: 121.
5. Heart Rate & HR Zones:
   - Avg Heart Rate (e.g. 153 bpm) -> avg_heart_rate: 153.
   - Max Heart Rate (e.g. 179 bpm) -> max_heart_rate: 179.
   - Heart Rate Zones: If the screenshot shows an HR zones breakdown (e.g. Extreme, Anaerobic, Aerobic, Fat Burning, Warm Up with % or time), extract them into an array under "heart_rate_zones".
6. Splits / Laps Table:
   - If the screenshot shows a Kilometer/Mile Splits table or Pace chart breakdown (e.g. 1km: 9'29", 2km: 9'20", 3km: 9'10", etc.), extract an array under "splits":
     [ { "km": 1, "pace_seconds": 569, "elevation_diff_m": 0 }, ... ]
7. Chart Samples & Profiles:
   - If the screenshot shows time/distance graph charts (Heart rate curve, Pace curve, Cadence curve, Elevation curve), sample 8 to 20 representative data points along the run distance into "elevation_points":
     [ { "distance_km": 1.0, "elevation_m": 89, "heart_rate": 148, "pace_seconds": 569, "cadence": 147 }, ... ]
8. Performance & Training Metrics:
   - Aerobic Training Effect (e.g. 3.2) -> aerobic_te: 3.2.
   - VO2Max (e.g. 57.4) -> vo2max: 57.4.
   - Training Load (e.g. 68.5) -> training_load: 68.5.
   - Recovery Time (e.g. 40 hrs) -> recovery_hours: 40.
   - Active Calories (e.g. 473 kcal) -> active_calories: 473.
   - Total Calories (e.g. 658 kcal) -> calories: 658.
9. Advanced Running Form:
   - Ground Contact Time (e.g. 333 ms) -> ground_contact_time_ms: 333.
   - Vertical Oscillation (e.g. 9.7 cm) -> vertical_oscillation_cm: 9.7.
   - Ground Contact Balance (e.g. "49.9% L / 50.1% R") -> ground_contact_balance: "49.9% L / 50.1% R".
10. Elevation:
   - Elevation Gain (e.g. 39 m or 89 m) -> elevation_gain_m: 39.
   - Elevation Loss (e.g. 97 m) -> elevation_loss_m: 97.
11. Source:
   - "Huawei Health", "Amazfit", "Zepp", "Apple Fitness", "Garmin", "Strava", "Coros", "Nike Run Club", or "Other".

Never invent numbers. If a metric or table is not in the screenshot, return null or empty array.

Return ONLY a valid JSON object matching this schema (no markdown fences, no explanatory text):
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
    { "km": number, "pace_seconds": number, "elevation_diff_m": number }
  ] | null,
  "heart_rate_zones": [
    { "zone": number, "name": string, "percentage": number, "duration_seconds": number | null, "bpm_range": string | null }
  ] | null,
  "elevation_points": [
    { "distance_km": number, "elevation_m": number, "heart_rate": number | null, "pace_seconds": number | null, "cadence": number | null }
  ] | null,
  "raw_notes": string | null
}`;

    const model = 'google/gemini-2.5-flash-lite';
    console.log(`[Runno] Sending screenshot to OpenRouter with model: ${model}`);

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
              {
                type: 'text',
                text: systemPrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: formattedImageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openRouterResponse.ok) {
      const errText = await openRouterResponse.text();
      console.error(`[Runno] OpenRouter error (${openRouterResponse.status}):`, errText);
      return res.status(openRouterResponse.status).json({
        error: `OpenRouter error (${openRouterResponse.status}): ${errText}`,
        code: 'OPENROUTER_ERROR',
      });
    }

    const data = await openRouterResponse.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({
        error: 'OpenRouter returned an empty response. Please try again.',
      });
    }

    const cleanJsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const extractedData = JSON.parse(cleanJsonStr);

    console.log('[Runno] Successfully extracted running statistics:', extractedData);

    res.json({
      success: true,
      data: extractedData,
    });
  } catch (err: any) {
    console.error('[Runno] Server error analyzing screenshot:', err);
    res.status(500).json({
      error: `Server error processing screenshot: ${err.message}`,
    });
  }
});

app.get('/api/runs', async (_req, res) => {
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

app.post('/api/runs', async (req, res) => {
  const runPayload = req.body;
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
      
      // Huawei Health & Advanced Dynamics
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

      // Splits and Chart Series from screenshot or GPX
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

    console.log('[Runno DB] Saved run to PostgreSQL Neon:', newRecord.id);
    res.json({ success: true, run: newRecord });
  } catch (err: any) {
    console.error('DB insert error:', err);
    res.status(500).json({ error: 'Failed to save run to database', details: err.message });
  }
});

app.delete('/api/runs/:id', async (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  if (!db) {
    return res.json({ success: true, deletedLocally: true });
  }

  try {
    await db.delete(runs).where(eq(runs.id, id));
    console.log('[Runno DB] Deleted run from PostgreSQL Neon:', id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('DB delete error:', err);
    res.status(500).json({ error: 'Failed to delete run from database' });
  }
});

// ---------------------------------------------------------------------------
// AI Coach & Running Plan Generator API
// ---------------------------------------------------------------------------
app.post('/api/ai-coach', async (req, res) => {
  try {
    dotenv.config();
    const {
      message,
      history = [],
      currentPlan = null,
      runnerContext = {},
      customApiKey,
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = (customApiKey || process.env.OPENROUTER_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(400).json({
        error: 'OpenRouter API key is not detected on server. If you added OPENROUTER_API_KEY in Vercel Settings, please go to Vercel Deployments and click Redeploy. Or paste it directly in More > Preferences in the app.',
        code: 'MISSING_API_KEY',
      });
    }


    // Prepare runner context description
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
      
      // Last 5 runs breakdown
      const last5 = recentRuns.slice(0, 5).map((r: any) => {
        const paceStr = r.pace_seconds_per_km
          ? `${Math.floor(r.pace_seconds_per_km / 60)}:${String(r.pace_seconds_per_km % 60).padStart(2, '0')}/km`
          : 'N/A';
        return `- ${r.date}: ${r.distance_km?.toFixed(1)}km, Pace: ${paceStr}, HR: ${r.avg_heart_rate || 'N/A'} bpm, Cadence: ${r.cadence || 'N/A'} spm`;
      }).join('\n');
      runnerProfileSummary += `Recent Workouts:\n${last5}\n`;
    } else {
      runnerProfileSummary += `No previous runs logged yet. This is a new runner.\n`;
    }

    if (currentPlan) {
      runnerProfileSummary += `\nCURRENT ACTIVE PLAN:\nTitle: ${currentPlan.title}\nGoal: ${currentPlan.goal}\nSchedule: ${currentPlan.scheduleSummary}\nWeekly Target: ${currentPlan.weeklyTargetKm} km\n`;
    }

    const now = new Date();
    const todayDateId = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const todayIso = now.toISOString().split('T')[0];
    runnerProfileSummary += `\nTODAY'S CALENDAR DATE: ${todayDateId} (${todayIso})\n`;

    const systemPrompt = `You are a knowledgeable, supportive, and experienced personal running coach.
You talk like a real human coach and seasoned running partner — warm, direct, conversational, and genuinely passionate about running.

COMMUNICATION STYLE & TONE:
- Speak naturally and conversationally. Never use robotic phrases like "As an AI...", "I am programmed to...", "Hello runner!", or "Greetings!".
- Do not overuse or clutter text with markdown asterisks (avoid **bolding** every other word or section title). Write in clean, flowing, natural sentences and bullet points.
- Jump straight into the conversation with practical, friendly, and human advice.
- Ground your advice in real running experience: talk naturally about recovery, keeping easy runs truly relaxed (Zone 2), fueling, pacing by effort, listening to your body, and staying injury-free.
- DATE & CALENDAR AWARENESS: You know today's exact date (${todayDateId}). When the runner asks about dates (e.g. "mulai tanggal 18 Agustus", "kapan jadwal berikutnya?", "mulai besok"), address and calculate the dates accurately.

RUNNER CONTEXT & RECENT RUNS:
${runnerProfileSummary}

COACHING BEHAVIOR RULES:
1. DISCUSS & CONSULT FIRST (DEFAULT):
   - When the user shares goals, mentions days they want to run, or asks questions, engage in a natural two-way conversation.
   - Give direct insights on their goal, discuss pacing, schedule dates, and ideas, and ask what they think.
   - If they are discussing a schedule, wrap up naturally: "If you like how that sounds, let me know and I can lock it in as your active weekly plan!"


2. EXPLICIT PLAN CREATION ONLY:
   - ONLY when the runner explicitly asks to make/create/generate/finalize a plan (e.g. "Make this as plan", "Create a plan for Tue/Thu/Sat", "Generate my plan", "Build this schedule", "Make this my active plan", "Yes, create it"):
   - Provide your encouraging summary in markdown, AND provide the COMPLETE valid JSON plan block enclosed in \`\`\`json_plan ... \`\`\` code fence.

3. The JSON plan schema (when explicitly requested) MUST strictly match:
\`\`\`json_plan
{
  "title": "Sub-35 5K Progression - 3 Days/Week",
  "goal": "Achieve Sub-35 Min 5K",
  "scheduleSummary": "Tuesday, Thursday, Saturday",
  "selectedDays": ["Tuesday", "Thursday", "Saturday"],
  "weeklyTargetKm": 14.5,
  "totalWeeks": 4,
  "currentWeek": 1,
  "fitnessLevel": "intermediate",
  "workouts": [
    {
      "dayOfWeek": 1,
      "dayName": "Monday",
      "title": "Rest & Mobility",
      "type": "rest",
      "distanceKm": 0,
      "targetPaceSecPerKm": null,
      "targetHrZone": "Rest",
      "description": "Full recovery day. Light 10-minute stretching or foam rolling."
    },
    {
      "dayOfWeek": 2,
      "dayName": "Tuesday",
      "title": "5K Pace Intervals / Tempo",
      "type": "tempo",
      "distanceKm": 4.5,
      "targetPaceSecPerKm": 390,
      "targetHrZone": "Zone 3/4 (Threshold)",
      "description": "1km warmup, 4x500m @ 6:30/km with 90s recovery jog, 1km cooldown."
    },
    {
      "dayOfWeek": 3,
      "dayName": "Wednesday",
      "title": "Rest & Recovery",
      "type": "rest",
      "distanceKm": 0,
      "targetPaceSecPerKm": null,
      "targetHrZone": "Rest",
      "description": "Rest day to allow muscle glycogen replenishment."
    },
    {
      "dayOfWeek": 4,
      "dayName": "Thursday",
      "title": "Easy Aerobic Run",
      "type": "easy",
      "distanceKm": 4.5,
      "targetPaceSecPerKm": 430,
      "targetHrZone": "Zone 2 (Aerobic)",
      "description": "Comfortable conversational pace @ 7:10/km. Focus on relaxed breathing."
    },
    {
      "dayOfWeek": 5,
      "dayName": "Friday",
      "title": "Rest & Pre-Long Run Prep",
      "type": "rest",
      "distanceKm": 0,
      "targetPaceSecPerKm": null,
      "targetHrZone": "Rest",
      "description": "Rest and hydrate well for tomorrow's long run."
    },
    {
      "dayOfWeek": 6,
      "dayName": "Saturday",
      "title": "Endurance Long Run",
      "type": "long_run",
      "distanceKm": 5.5,
      "targetPaceSecPerKm": 440,
      "targetHrZone": "Zone 2 (Endurance)",
      "description": "Steady continuous run @ 7:20/km building aerobic base."
    },
    {
      "dayOfWeek": 0,
      "dayName": "Sunday",
      "title": "Active Recovery / Rest",
      "type": "recovery",
      "distanceKm": 0,
      "targetPaceSecPerKm": null,
      "targetHrZone": "Zone 1",
      "description": "Optional 20-minute walk or complete rest."
    }
  ],
  "aiAdvice": "Keep your easy runs strictly in Zone 2 so your legs are refreshed for quality sessions!"
}
\`\`\`

4. Workout Types available: 'easy' | 'tempo' | 'intervals' | 'long_run' | 'recovery' | 'rest' | 'race' | 'cross_train'.
5. Ensure all 7 days of the week (Monday through Sunday) are present when outputting the json_plan block.
6. Target paces must be realistic based on the runner's current fitness and logged runs. Paces in JSON must be in seconds per km (e.g. 6:30/km = 390).`;

    // Helper to test if prompt is explicitly requesting a plan
    const isExplicitPlan = (() => {
      const l = message.toLowerCase();
      return (
        l.includes('make this as plan') ||
        l.includes('make this my plan') ||
        l.includes('create a plan') ||
        l.includes('create plan') ||
        l.includes('generate plan') ||
        l.includes('build plan') ||
        l.includes('set up plan') ||
        l.includes('make a plan') ||
        l.includes('apply this plan') ||
        l.includes('yes, make plan') ||
        l.includes('yes make plan') ||
        l.includes('make plan')
      );
    })();

    if (!apiKey) {
      console.warn('[Runno AI Coach] No OpenRouter API key found');
      if (isExplicitPlan) {
        const fallbackPlan = generateAlgorithmicPlan(message, runnerContext);
        return res.json({
          success: true,
          reply: `I've put together your schedule for **${fallbackPlan.scheduleSummary}**! Take a look below and see how the workouts feel.`,
          suggestedPlan: fallbackPlan,
        });
      } else {
        return res.json({
          success: true,
          reply: `Great thinking. Setting up a steady routine is the best way to build momentum without burning out.\n\nFor 3 days a week, a balance of one tempo/interval session, one truly easy aerobic run, and a steady weekend long run works wonders.\n\nWhenever you're ready, let me know if you want me to set this up as your plan!`,
          suggestedPlan: null,
        });
      }
    }



    // Prepare message history for OpenRouter
    let modeDirective = '';
    if (isExplicitPlan) {
      modeDirective = '\n\nIMPORTANT: The user is explicitly asking to create/generate/finalize their active training plan. You MUST provide the full ```json_plan ... ``` code block with all 7 days of workouts alongside your coaching notes.';
    } else {
      modeDirective = '\n\nIMPORTANT: The user is currently discussing, exploring ideas, or asking advice. Do NOT output a json_plan block. Discuss like a coach and ask if they would like you to turn this into their active plan.';
    }

    const chatMessages: any[] = [
      { role: 'system', content: systemPrompt + modeDirective },
    ];


    // Add complete conversation history so the AI can continue prior discussions seamlessly
    for (const h of history.slice(-30)) {
      if (h.role === 'user' || h.role === 'assistant') {
        chatMessages.push({
          role: h.role,
          content: h.content,
        });
      }
    }


    // Add current user prompt
    chatMessages.push({
      role: 'user',
      content: message,
    });

    const model = 'google/gemini-2.5-flash';
    console.log(`[Runno AI Coach] Sending request to OpenRouter (${model})...`);

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
      console.error(`[Runno AI Coach] OpenRouter error (${openRouterResponse.status}):`, errText);
      const fallbackPlan = generateAlgorithmicPlan(message, runnerContext);
      return res.json({
        success: true,
        reply: `I've prepared a customized running schedule for you below based on your request! (Note: OpenRouter API error ${openRouterResponse.status}, using offline coaching engine).`,
        suggestedPlan: fallbackPlan,
      });
    }

    const data = await openRouterResponse.json();
    const rawReply = data.choices?.[0]?.message?.content || '';

    // Extract json_plan if present
    let suggestedPlan: any = null;
    let cleanReply = rawReply;

    const planMatch = rawReply.match(/```json_plan\s*([\s\S]*?)\s*```/);
    if (planMatch && planMatch[1]) {
      try {
        const parsed = JSON.parse(planMatch[1]);
        suggestedPlan = sanitizePlan(parsed);
        // Clean out the raw json_plan block from conversational text
        cleanReply = rawReply.replace(/```json_plan\s*[\s\S]*?\s*```/, '').trim();
      } catch (err: any) {
        console.warn('[Runno AI Coach] Failed to parse json_plan block:', err.message);
      }
    }


    res.json({
      success: true,
      reply: cleanReply || 'Here is your training plan:',
      suggestedPlan,
    });
  } catch (err: any) {
    console.error('[Runno AI Coach] Error:', err);
    res.status(500).json({ error: err.message || 'Internal AI Coach error' });
  }
});

// Helper to sanitize and assign unique IDs to a training plan
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

// Algorithmic Plan Generator for offline / fallback
function generateAlgorithmicPlan(prompt: string, runnerContext?: any) {
  const lower = prompt.toLowerCase();
  let days = ['Tuesday', 'Thursday', 'Saturday'];

  // Check if specific days were mentioned
  const possibleDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const foundDays = possibleDays.filter(d => lower.includes(d.toLowerCase()));
  if (foundDays.length >= 2) {
    days = foundDays;
  }

  const is10K = lower.includes('10k') || lower.includes('10 k') || lower.includes('10km');
  const isHalf = lower.includes('half') || lower.includes('21k');

  let targetTitle = '5K Progression Plan';
  let targetGoal = '5K Completion & Speed';
  let weekday1Dist = 4.0;
  let weekday2Dist = 3.5;
  let weekendDist = 6.0;

  // Use runner's recent pace if available
  let basePaceSec = 360; // 6:00/km default
  if (runnerContext?.recentRuns && runnerContext.recentRuns.length > 0) {
    const totalDuration = runnerContext.recentRuns.reduce((acc: number, r: any) => acc + (r.duration_seconds || 0), 0);
    const totalKm = runnerContext.recentRuns.reduce((acc: number, r: any) => acc + (r.distance_km || 0), 0);
    if (totalKm > 0) {
      basePaceSec = Math.round(totalDuration / totalKm);
    }
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
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
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
        description: `1km easy warmup, ${weekday1Dist - 2}km at steady threshold pace, 1km cooldown.`,
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
        description: `${weekday2Dist}km smooth conversational pace. Keep heart rate low and relaxed.`,
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
        description: `${weekendDist}km steady continuous aerobic run to build stamina and mitochondrial density.`,
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
app.get('/api/plans/active', async (_req, res) => {
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

app.post('/api/plans', async (req, res) => {
  const planPayload = req.body;
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

    console.log('[Runno DB] Saved training plan to DB:', newRecord.id);
    res.json({ success: true, plan: planPayload });
  } catch (err: any) {
    console.error('[Runno DB] Failed to save training plan:', err);
    res.status(500).json({ error: 'Failed to save training plan to database' });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Runno Backend] Server listening on http://localhost:${PORT}`);
  });
}

export default app;
export { app };


