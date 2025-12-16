#!/usr/bin/env node

/**
 * Upload simple des 3 prompts optimisés
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://gob-watchlist.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
    console.error('❌ SUPABASE key manquante');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Upload des prompts optimisés...\n');

// Prompt 1: Web Enhanced
const WEB_PROMPT = fs.readFileSync('./config/prompts/web-enhanced.txt', 'utf-8');

const { error1 } = await supabase.from('emma_system_config').upsert({
    section: 'prompts',
    key: 'web_enhanced_format',
    value: WEB_PROMPT,
    type: 'string',
    description: 'Format visuel optimisé pour réponses Web (tableaux, emojis, sections)',
    category: 'prompt',
    is_override: false,
    updated_by: 'migration_enhanced_formats'
}, { onConflict: 'section,key' });

if (error1) console.error('❌ Web:', error1.message);
else console.log('✅ web_enhanced_format uploadé');

console.log('\n✅ Prompts uploadés! Testez Emma maintenant.');
