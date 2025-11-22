/**
 * Script pour vérifier les prompts manquants dans Supabase
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔍 Vérification des prompts manquants\n');

// Prompts attendus
const expectedPrompts = [
    'briefing_morning',
    'briefing_midday',
    'briefing_evening',
    'cfa_identity',
    'cfa_standards',
    'cfa_perplexity_priority',
    'intent_fundamentals',
    'intent_comparative_analysis',
    'intent_comprehensive_analysis'
];

async function checkPrompts() {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.log('⚠️  Credentials Supabase manquants');
        console.log('   Checking via API instead...\n');

        // Vérifier via API publique
        const response = await fetch('https://gobapps.com/api/admin/emma-config');
        const data = await response.json();
        const prompts = data.config?.prompts || {};

        console.log(`📊 Prompts trouvés via API: ${Object.keys(prompts).length}\n`);

        const found = [];
        const missing = [];

        expectedPrompts.forEach(key => {
            if (prompts[key]) {
                found.push(key);
                console.log(`✅ ${key}`);
            } else {
                missing.push(key);
                console.log(`❌ ${key} - MANQUANT`);
            }
        });

        console.log('\n' + '='.repeat(60));
        console.log(`📈 Résumé: ${found.length}/${expectedPrompts.length} prompts présents`);
        console.log(`❌ Manquants: ${missing.length}`);

        if (missing.length > 0) {
            console.log('\n⚠️  PROMPTS MANQUANTS:');
            missing.forEach(key => console.log(`   - ${key}`));

            console.log('\n💡 SOLUTION:');
            console.log('   Les briefings doivent être ajoutés manuellement dans Supabase.');
            console.log('   Utilisez emma-config.html pour les créer:');
            console.log('   1. Ouvrir https://gobapps.com/emma-config.html');
            console.log('   2. Cliquer "+ Ajouter"');
            console.log('   3. Créer chaque prompt manquant');
        }

        return missing;
    }

    // Si credentials disponibles, vérifier directement Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase
        .from('emma_config')
        .select('key, description');

    if (error) {
        console.log('❌ Erreur Supabase:', error.message);
        return;
    }

    console.log(`📊 Prompts trouvés dans emma_config: ${data.length}\n`);

    const found = [];
    const missing = [];

    expectedPrompts.forEach(key => {
        const exists = data.find(p => p.key === key);
        if (exists) {
            found.push(key);
            console.log(`✅ ${key}`);
        } else {
            missing.push(key);
            console.log(`❌ ${key} - MANQUANT`);
        }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`📈 Résumé: ${found.length}/${expectedPrompts.length} prompts présents`);

    return missing;
}

checkPrompts().catch(console.error);
