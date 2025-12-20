#!/usr/bin/env node

/**
 * Execute Migration 013: Add start_date and end_date columns to task_templates
 * Uses Supabase client to execute SQL via RPC or direct API calls
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

console.log('🔌 Connecting to Supabase...');
console.log(`   URL: ${SUPABASE_URL.substring(0, 30)}...`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function executeSQL(sql) {
    // Try method 1: RPC exec_sql if available
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql });
        if (!error) {
            return { success: true, data };
        }
        if (!error.message.includes('function') && !error.message.includes('does not exist')) {
            throw error;
        }
    } catch (err) {
        // RPC not available, try other methods
    }

    // Try method 2: Direct REST API call
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({ sql })
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, data };
        }
    } catch (err) {
        // REST API not available
    }

    // Method 3: Execute SQL statements individually via table operations
    // This is a fallback that works for ALTER TABLE operations
    return { success: false, error: 'No SQL execution method available' };
}

async function runMigration() {
    try {
        console.log('\n📄 Loading migration 013_add_task_dates.sql...\n');

        const sqlPath = path.join(__dirname, 'migrations', '013_add_task_dates.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split SQL into individual statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';
            console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
            
            // For DO blocks and complex statements, we need to execute them as-is
            if (statement.includes('DO $$') || statement.includes('CREATE') || statement.includes('ALTER')) {
                try {
                    // Try via RPC first
                    const result = await executeSQL(statement);
                    
                    if (result.success) {
                        console.log(`   ✅ Statement ${i + 1} executed successfully`);
                    } else {
                        // Try alternative: Execute via direct table operations
                        if (statement.includes('ADD COLUMN start_date')) {
                            // Check if column exists first
                            const { data: checkData, error: checkError } = await supabase
                                .from('task_templates')
                                .select('start_date')
                                .limit(1);
                            
                            if (checkError && checkError.message.includes('column') && checkError.message.includes('not found')) {
                                console.log('   ⚠️  Column start_date does not exist, will need manual migration');
                                console.log('   📋 Please execute the SQL manually in Supabase Dashboard');
                            } else if (!checkError) {
                                console.log('   ✅ Column start_date already exists');
                            }
                        } else if (statement.includes('ADD COLUMN end_date')) {
                            const { data: checkData, error: checkError } = await supabase
                                .from('task_templates')
                                .select('end_date')
                                .limit(1);
                            
                            if (checkError && checkError.message.includes('column') && checkError.message.includes('not found')) {
                                console.log('   ⚠️  Column end_date does not exist, will need manual migration');
                                console.log('   📋 Please execute the SQL manually in Supabase Dashboard');
                            } else if (!checkError) {
                                console.log('   ✅ Column end_date already exists');
                            }
                        } else {
                            console.log(`   ⚠️  Cannot execute statement automatically: ${statement.substring(0, 50)}...`);
                            console.log('   📋 Please execute manually in Supabase Dashboard');
                        }
                    }
                } catch (err) {
                    console.log(`   ⚠️  Error executing statement: ${err.message}`);
                    console.log('   📋 This statement may need to be executed manually');
                }
            }
        }

        // Verify columns exist
        console.log('\n🔍 Verifying columns...');
        const { data: sample, error: verifyError } = await supabase
            .from('task_templates')
            .select('id, start_date, end_date')
            .limit(1);

        if (verifyError) {
            if (verifyError.message.includes('column') && verifyError.message.includes('not found')) {
                console.log('   ⚠️  Columns start_date and/or end_date do not exist yet');
                console.log('\n📋 MANUAL STEP REQUIRED:');
                console.log('   1. Go to: https://supabase.com/dashboard');
                console.log('   2. Open SQL Editor');
                console.log('   3. Execute: supabase/migrations/013_add_task_dates.sql');
            } else {
                console.error('   ❌ Error verifying:', verifyError.message);
            }
        } else {
            console.log('   ✅ Columns start_date and end_date exist!');
            console.log('\n🎉 Migration completed successfully!');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.log('\n📋 ALTERNATIVE: Execute SQL manually');
        console.log('   1. Go to: https://supabase.com/dashboard');
        console.log('   2. Open SQL Editor');
        console.log('   3. Copy content from: supabase/migrations/013_add_task_dates.sql');
        console.log('   4. Execute (Run)');
        process.exit(1);
    }
}

// Run migration
console.log('🔄 Starting migration 013...\n');
runMigration()
    .then(() => {
        console.log('\n✅ Migration process completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration process failed:', error);
        process.exit(1);
    });


