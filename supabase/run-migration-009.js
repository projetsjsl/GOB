/**
 * Execute migration 009: Add color column to resources table
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('🔄 Running migration 009: Add color column to resources...\n');

    try {
        // Check if column already exists by trying to select it
        const { data: testData, error: testError } = await supabase
            .from('resources')
            .select('color')
            .limit(1);

        if (!testError) {
            console.log('✅ Column "color" already exists in resources table!');
            console.log('   No migration needed.');
            return;
        }

        // Column doesn't exist, we need to add it via raw SQL
        // Supabase JS client can't execute ALTER TABLE directly
        // We'll use the rpc method if a helper function exists
        
        console.log('⚠️  Cannot execute ALTER TABLE via Supabase JS client.');
        console.log('\n📋 Please run this SQL in Supabase Dashboard SQL Editor:');
        console.log('   https://supabase.com/dashboard/project/_/sql/new\n');
        console.log('─'.repeat(60));
        console.log(`
ALTER TABLE resources ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6';
COMMENT ON COLUMN resources.color IS 'Hex color code for resource avatar display';
        `.trim());
        console.log('─'.repeat(60));
        
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

runMigration();

