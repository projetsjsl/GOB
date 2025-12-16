
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
const { Client } = pg;

// Helper to deduce host if not explicitly set (same logic as before)
const PROJECT_REF = 'boyuxgdplbpkknplxbxp';
const DB_HOST = process.env.SUPABASE_DB_HOST || `db.${PROJECT_REF}.supabase.co`;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || '5mUaqujMflrgZyCo'; 

async function applyMigration() {
    console.log(`🔌 Connecting to ${DB_HOST}...`);
    
    const client = new Client({
        host: DB_HOST,
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected.');

        const schemaPath = '/Users/projetsjsl/.gemini/antigravity/brain/63c2ec4e-772e-432e-9fd0-faafa6dec160/add_password_column.sql';
        console.log(`📖 Reading SQL from ${schemaPath}...`);
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('⚡ Executing migration...');
        await client.query(sql);
        console.log('✅ Migration applied: password_hash column added.');

    } catch (err) {
        console.error('❌ Error applying migration:', err);
    } finally {
        await client.end();
        console.log('🔌 Disconnected.');
    }
}

applyMigration();
