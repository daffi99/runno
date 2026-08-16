import * as dotenv from 'dotenv';
dotenv.config();
import pkg from 'pg';
const { Pool } = pkg;

async function clearDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('No DATABASE_URL set');
    return;
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pool.query('DELETE FROM runs;');
    console.log('✅ PostgreSQL database table "runs" is now completely empty.');
    await pool.end();
  } catch (err) {
    console.error('Error clearing DB:', err.message);
  }
}

clearDb();
