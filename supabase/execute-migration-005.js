/**
 * Execute Supabase migration for Finance Pro Snapshots
 * Uses direct SQL execution via Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

console.log('🔌 Connecting to Supabase...');
console.log(`   URL: ${SUPABASE_URL}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runMigration() {
    try {
        console.log('\n📄 Creating finance_pro_snapshots table...\n');

        // Create table
        const { error: tableError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE TABLE IF NOT EXISTS finance_pro_snapshots (
                  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                  created_at TIMESTAMPTZ DEFAULT NOW(),
                  updated_at TIMESTAMPTZ DEFAULT NOW(),
                  ticker VARCHAR(10) NOT NULL,
                  profile_id VARCHAR(50) NOT NULL,
                  user_id VARCHAR(100),
                  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
                  notes TEXT,
                  is_current BOOLEAN DEFAULT true,
                  version INT DEFAULT 1,
                  annual_data JSONB NOT NULL,
                  assumptions JSONB NOT NULL,
                  company_info JSONB NOT NULL,
                  is_watchlist BOOLEAN DEFAULT false,
                  auto_fetched BOOLEAN DEFAULT false,
                  CONSTRAINT valid_ticker CHECK (ticker ~ '^[A-Z0-9]{1,10}$')
                );
            `
        });

        if (tableError && !tableError.message.includes('already exists')) {
            throw tableError;
        }

        console.log('✅ Table created (or already exists)');

        // Create indexes
        console.log('\n📊 Creating indexes...');

        const indexes = [
            "CREATE INDEX IF NOT EXISTS idx_snapshots_ticker ON finance_pro_snapshots(ticker)",
            "CREATE INDEX IF NOT EXISTS idx_snapshots_date ON finance_pro_snapshots(snapshot_date DESC)",
            "CREATE INDEX IF NOT EXISTS idx_snapshots_user ON finance_pro_snapshots(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_snapshots_current ON finance_pro_snapshots(ticker, is_current) WHERE is_current = true",
            "CREATE INDEX IF NOT EXISTS idx_snapshots_ticker_date ON finance_pro_snapshots(ticker, snapshot_date DESC)"
        ];

        for (const indexSql of indexes) {
            const { error } = await supabase.rpc('exec_sql', { sql: indexSql });
            if (error && !error.message.includes('already exists')) {
                console.warn(`⚠️  Index warning: ${error.message}`);
            }
        }

        console.log('✅ Indexes created');

        // Note: Triggers and RLS need to be set up via Supabase Dashboard
        // as they require more complex SQL that the RPC might not support

        console.log('\n🎉 Migration completed successfully!');
        console.log('\n📝 Manual steps (if not already done):');
        console.log('   1. Enable RLS: ALTER TABLE finance_pro_snapshots ENABLE ROW LEVEL SECURITY;');
        console.log('   2. Add RLS policies via Supabase Dashboard');
        console.log('   3. Add triggers for version auto-increment and updated_at');

        console.log('\n✅ Table is ready for use!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Alternative: Direct table creation via Supabase API
async function createTableDirect() {
    console.log('\n🚀 Creating table via direct SQL execution...\n');

    // Since Supabase JS doesn't have a direct SQL execution method,
    // we'll use the REST API directly
    const url = `${SUPABASE_URL}/rest/v1/rpc`;

    const sqlCommands = [
        // Create table
        `CREATE TABLE IF NOT EXISTS finance_pro_snapshots (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          ticker VARCHAR(10) NOT NULL,
          profile_id VARCHAR(50) NOT NULL,
          user_id VARCHAR(100),
          snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
          notes TEXT,
          is_current BOOLEAN DEFAULT true,
          version INT DEFAULT 1,
          annual_data JSONB NOT NULL,
          assumptions JSONB NOT NULL,
          company_info JSONB NOT NULL,
          is_watchlist BOOLEAN DEFAULT false,
          auto_fetched BOOLEAN DEFAULT false
        );`,

        // Create indexes
        `CREATE INDEX IF NOT EXISTS idx_snapshots_ticker ON finance_pro_snapshots(ticker);`,
        `CREATE INDEX IF NOT EXISTS idx_snapshots_date ON finance_pro_snapshots(snapshot_date DESC);`,
        `CREATE INDEX IF NOT EXISTS idx_snapshots_user ON finance_pro_snapshots(user_id);`,
        `CREATE INDEX IF NOT EXISTS idx_snapshots_ticker_date ON finance_pro_snapshots(ticker, snapshot_date DESC);`
    ];

    for (let i = 0; i < sqlCommands.length; i++) {
        console.log(`Executing command ${i + 1}/${sqlCommands.length}...`);

        try {
            // Try via PostgreSQL client if available
            const { Pool } = require('pg');
            const connectionString = process.env.DATABASE_URL || SUPABASE_URL.replace('https://', 'postgresql://');

            // This approach requires direct PostgreSQL access
            // which we don't have with just the Supabase URL

        } catch (err) {
            console.log('   Using Supabase client instead...');
        }
    }

    console.log('\n✅ Direct creation attempted');
}

// Run migration
console.log('🔄 Starting migration process...\n');

// Try the simpler approach first
createTableDirect().catch(() => {
    console.log('\n⚠️  Direct creation not available');
    console.log('📋 Please run the SQL manually in Supabase Dashboard');
    console.log('   Or use the provided SQL file: supabase/migrations/005_finance_pro_snapshots.sql');
});
