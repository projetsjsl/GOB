/**
 * Run Supabase migration for Finance Pro Snapshots table
 * Execute: node supabase/run-migration-005.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials');
    console.error('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

console.log('🔌 Connecting to Supabase...');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Read SQL file
const sqlPath = path.join(__dirname, 'migrations', '005_finance_pro_snapshots.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

console.log('📄 Loaded migration: 005_finance_pro_snapshots.sql');
console.log('🚀 Executing migration...\n');

// Execute migration (note: Supabase JS client doesn't directly support SQL execution)
// We need to use the Supabase Dashboard or CLI for migrations
// This script is mainly for documentation

console.log('⚠️  IMPORTANT: Supabase migrations should be run via:');
console.log('   1. Supabase Dashboard (SQL Editor)');
console.log('   2. Supabase CLI: supabase db push');
console.log('\n📋 Copy and paste this SQL into Supabase SQL Editor:\n');
console.log('='.repeat(80));
console.log(sql);
console.log('='.repeat(80));

console.log('\n✅  Alternative: Manual execution via Supabase Dashboard');
console.log('   URL: https://supabase.com/dashboard/project/_/sql');
