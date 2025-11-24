/**
 * Create finance_pro_snapshots table using Supabase REST API
 * This bypasses the need for SQL Editor access
 */

const https = require('https');

// Load environment
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

// Extract project ref from URL (e.g., https://abcd1234.supabase.co → abcd1234)
const projectRef = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log('🚀 Creating finance_pro_snapshots table programmatically\n');
console.log(`📍 Project: ${projectRef}`);
console.log(`🔗 URL: ${SUPABASE_URL}\n`);

// Since we can't execute arbitrary SQL via REST API,
// we'll create a workaround: use Supabase client to insert initial structure

async function createTableViaClient() {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log('📝 Method: Using Supabase JavaScript client\n');

    // Attempt 1: Check if table exists by trying to query it
    console.log('1️⃣  Checking if table exists...');
    const { data: existingData, error: checkError } = await supabase
        .from('finance_pro_snapshots')
        .select('id')
        .limit(1);

    if (!checkError) {
        console.log('✅ Table already exists!');
        console.log(`   Found ${existingData?.length || 0} records\n`);

        // List existing snapshots
        const { data: snapshots } = await supabase
            .from('finance_pro_snapshots')
            .select('ticker, snapshot_date, version')
            .order('created_at', { ascending: false })
            .limit(5);

        if (snapshots && snapshots.length > 0) {
            console.log('📊 Recent snapshots:');
            snapshots.forEach(s => {
                console.log(`   - ${s.ticker} v${s.version} (${s.snapshot_date})`);
            });
        }

        return true;
    }

    // Table doesn't exist - we need to create it
    console.log('⚠️  Table does not exist');
    console.log('   Error: ', checkError.message, '\n');

    console.log('❌ Cannot create table programmatically via Supabase JS client');
    console.log('   (Requires SQL execution privileges)\n');

    console.log('✅ SOLUTION: Use Supabase CLI or Dashboard\n');

    console.log('📋 OPTION 1: Supabase Dashboard');
    console.log('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    console.log('   2. Paste SQL from: supabase/migrations/005_finance_pro_snapshots.sql');
    console.log('   3. Click "Run"\n');

    console.log('📋 OPTION 2: Supabase CLI (if installed)');
    console.log('   $ supabase db push\n');

    console.log('📋 OPTION 3: Copy SQL directly:');
    console.log('   Run this command to see the SQL:');
    console.log('   $ cat supabase/migrations/005_finance_pro_snapshots.sql\n');

    return false;
}

createTableViaClient()
    .then(success => {
        if (success) {
            console.log('\n🎉 Migration verified - table is ready!');
            console.log('\n✅ Next step: Test the API');
            console.log('   $ node test-finance-snapshots.js\n');
        } else {
            console.log('⏸️  Waiting for manual migration...\n');
        }
    })
    .catch(err => {
        console.error('❌ Error:', err.message);
    });
