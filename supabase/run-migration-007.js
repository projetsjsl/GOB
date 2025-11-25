/**
 * Execute Migration 007: Fix Ticker Constraint
 * 
 * Run this in Supabase SQL Editor to allow international ticker symbols
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials');
    console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
    console.log('🚀 Running migration 007: Fix ticker constraint\n');

    try {
        // Read SQL file
        const sqlPath = path.join(__dirname, 'migrations', '007_fix_ticker_constraint.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute migration
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('❌ Migration failed:', error.message);
            console.error('Details:', error);
            process.exit(1);
        }

        console.log('✅ Migration completed successfully!');
        console.log('\nTicker constraint updated:');
        console.log('  Old: ^[A-Z0-9]{1,10}$');
        console.log('  New: ^[A-Z0-9.-]{1,20}$');
        console.log('\nNow supports:');
        console.log('  ✓ Canadian: RY.TO, TD.TO');
        console.log('  ✓ Complex: CAR-UN.TO, QBR-B.TO');
        console.log('  ✓ International: 9984.T, MC.PA');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Details:', error);
        process.exit(1);
    }
}

runMigration();
