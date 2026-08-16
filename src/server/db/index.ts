import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

let dbInstance: ReturnType<typeof drizzle> | null = null;

export async function initDbSchema(pool: InstanceType<typeof Pool>) {
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

    console.log('[Runno DB] PostgreSQL runs, training_plans & coach_messages tables verified/migrated successfully.');
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

    dbInstance = drizzle(pool, { schema });

    // Initialize table in background
    initDbSchema(pool);

    return dbInstance;
  } catch (err: any) {
    console.error('[Runno DB] Failed to initialize PostgreSQL connection:', err.message);
    return null;
  }
}
