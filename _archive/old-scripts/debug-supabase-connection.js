import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

console.log('🔍 Debugging Supabase Connection');
console.log('URL:', supabaseUrl);
console.log('Key Length:', supabaseKey ? supabaseKey.length : 'MISSING');
console.log('Key Start:', supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'N/A');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('Testing connection...');
        const { data, error } = await supabase.from('emma_system_config').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection Error:', error.message);
            console.error('Details:', error);
        } else {
            console.log('✅ Connection Successful!');
            console.log('Table emma_system_config exists.');
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err);
    }
}

testConnection();
