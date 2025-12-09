import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from root .env
dotenv.config({ path: path.join(process.cwd(), '.env') });
// Also try .env.local if .env didn't have it
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const { Client } = pg;

async function runMigration() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('❌ No connection string found in environment variables (checked DATABASE_URL, SUPABASE_DB_URL, POSTGRES_URL).');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase/many cloud DBs
  });

  try {
    await client.connect();
    console.log('✅ Connected.');

    const sqlPath = path.join(process.cwd(), 'supabase-migration-roles.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error(`❌ Migration file not found at: ${sqlPath}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('📜 Executing SQL migration...');
    
    await client.query(sql);
    
    console.log('✅ Migration executed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
