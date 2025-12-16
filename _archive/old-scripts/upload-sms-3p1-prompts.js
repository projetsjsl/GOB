#!/usr/bin/env node

/**
 * Upload SMS et 3pour1 prompts vers Supabase
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

console.log('🚀 Upload des prompts SMS et 3pour1...\n');

// Prompt 1: SMS Ultra-Concise
const SMS_PROMPT = fs.readFileSync('./config/prompts/sms-ultra-concise.txt', 'utf-8');

const { error: error1 } = await supabase.from('emma_system_config').upsert({
    section: 'prompts',
    key: 'sms_ultra_concise',
    value: SMS_PROMPT,
    type: 'string',
    description: 'Format ultra-concis pour SMS (max 1600 chars, 5-6 ratios clés)',
    category: 'prompt',
    is_override: false,
    updated_by: 'migration_enhanced_formats'
}, { onConflict: 'section,key' });

if (error1) console.error('❌ SMS:', error1.message);
else console.log('✅ sms_ultra_concise uploadé');

// Prompt 2: Analyse 3pour1
const ANALYSIS_3P1 = fs.readFileSync('./config/prompts/analysis-3pour1.txt', 'utf-8');

const { error: error2 } = await supabase.from('emma_system_config').upsert({
    section: 'prompts',
    key: 'analysis_3pour1',
    value: ANALYSIS_3P1,
    type: 'string',
    description: 'Template analyse 3-pour-1: DCF + Value Investing + Scénarios multiples',
    category: 'prompt',
    is_override: false,
    updated_by: 'migration_enhanced_formats'
}, { onConflict: 'section,key' });

if (error2) console.error('❌ 3pour1:', error2.message);
else console.log('✅ analysis_3pour1 uploadé');

console.log('\n✅ Tous les prompts optimisés uploadés!');
console.log('📋 Prochaine étape: Implémenter logic 3pour1 dans emma-agent.js');
