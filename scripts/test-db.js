import * as dotenv from 'dotenv';
dotenv.config();
import pkg from 'pg';
const { Pool } = pkg;

async function testDb() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Connecting to Neon Database:', connectionString ? connectionString.replace(/:[^:@]+@/, ':***@') : 'NONE');

  if (!connectionString) {
    console.error('No DATABASE_URL found in .env');
    return;
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const res = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Connected successfully! Database server time:', res.rows[0].current_time);

    // Create / verify runs table
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
        screenshot_url TEXT,
        route_data JSONB,
        extra_metrics JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;
    await pool.query(createTableQuery);
    console.log('✅ Table "runs" verified / updated in PostgreSQL Neon!');

    const countRes = await pool.query('SELECT COUNT(*) as total_runs FROM runs');
    console.log('✅ Total runs currently in database:', countRes.rows[0].total_runs);

    await pool.end();
  } catch (err) {
    console.error('❌ DB connection error:', err.message);
  }
}

testDb();
