
import 'dotenv/config';
import { createSupabaseClient } from './lib/supabase-config.js';

async function checkConfigTables() {
    const supabase = createSupabaseClient(true);
    
    console.log('🔍 Checking emma_system_config...');
    const { error: error1 } = await supabase.from('emma_system_config').select('id').limit(1);
    
    if (error1) {
        console.error('❌ emma_system_config issue:', error1.message);
    } else {
        console.log('✅ emma_system_config exists.');
    }
}

checkConfigTables();
