/**
 * Run Migration 006: Create finance_snapshots table
 */

import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// PostgreSQL connection config
const client = new Client({
    host: 'db.gob-watchlist.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD || '5mUaqujMflrgZyCo',
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    console.log('🚀 Running migration 006: Create finance_snapshots table\n');

    try {
        // Connect to database
        await client.connect();
        console.log('✅ Connected to Supabase PostgreSQL\n');

        // Read SQL file
        const sqlPath = join(__dirname, 'migrations', '006_create_finance_snapshots.sql');
        const sql = readFileSync(sqlPath, 'utf-8');

        console.log('📄 Executing migration...\n');

        // Execute SQL
        await client.query(sql);

        console.log('✅ Migration completed successfully!\n');
        console.log('📊 Table finance_snapshots created with:');
        console.log('   - UUID primary key');
        console.log('   - Indexes for ticker, is_current, created_at');
        console.log('   - Auto-update trigger for updated_at');
        console.log('   - Row Level Security policies');
        console.log('\n🎉 Ready to use!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Details:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
