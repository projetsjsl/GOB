#!/usr/bin/env node

/**
 * MIGRATION EMMA → SUPABASE
 *
 * Ce script copie toutes les configurations Emma depuis les fichiers
 * vers la table Supabase emma_system_config
 *
 * Usage:
 *   node migrate-emma-to-supabase.js
 *
 * Prérequis:
 *   - Table emma_system_config créée (supabase-emma-admin-complete.sql)
 *   - Variables SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY définies
 */

import { createClient } from '@supabase/supabase-js';
import { CFA_SYSTEM_PROMPT } from './config/emma-cfa-prompt.js';
import fs from 'fs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

console.log('🚀 Migration Emma → Supabase');
console.log('═'.repeat(60));
console.log('');

// Vérifier les variables d'environnement
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement manquantes:');
    if (!supabaseUrl) console.error('   - SUPABASE_URL');
    if (!supabaseKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_KEY');
    console.error('');
    console.error('💡 Définir dans .env ou exporter:');
    console.error('   export SUPABASE_URL=...');
    console.error('   export SUPABASE_SERVICE_ROLE_KEY=...');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Helper pour insérer/mettre à jour une config
 */
async function upsertConfig(section, key, value, type = 'string', description = '', category = '') {
    const { error } = await supabase
        .from('emma_system_config')
        .upsert({
            section,
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
            type,
            description,
            category,
            is_override: false, // Ce sont les valeurs par défaut (pas des overrides)
            updated_by: 'migration_script'
        }, {
            onConflict: 'section,key'
        });

    if (error) {
        console.error(`❌ Erreur ${section}.${key}:`, error.message);
        return false;
    }

    console.log(`✅ ${section}.${key}`);
    return true;
}

/**
 * Migration Section 1: Prompts CFA
 */
async function migratePromptsCFA() {
    console.log('\n📝 Migration: Prompts CFA');
    console.log('─'.repeat(60));

    let count = 0;

    // Identity
    if (await upsertConfig(
        'prompts',
        'cfa_identity',
        CFA_SYSTEM_PROMPT.identity,
        'string',
        'Identité et qualifications Emma CFA',
        'prompt'
    )) count++;

    // Standards
    if (await upsertConfig(
        'prompts',
        'cfa_standards',
        CFA_SYSTEM_PROMPT.standards,
        'string',
        'Standards d\'excellence CFA®',
        'prompt'
    )) count++;

    // Output Format
    if (await upsertConfig(
        'prompts',
        'cfa_output_format',
        CFA_SYSTEM_PROMPT.outputFormat,
        'string',
        'Format de sortie Bloomberg Terminal',
        'prompt'
    )) count++;

    // Product Guidance
    if (await upsertConfig(
        'prompts',
        'cfa_product_guidance',
        CFA_SYSTEM_PROMPT.productTypeGuidance,
        'string',
        'Guidance par type de produit financier',
        'prompt'
    )) count++;

    // Perplexity Priority
    if (await upsertConfig(
        'prompts',
        'cfa_perplexity_priority',
        CFA_SYSTEM_PROMPT.perplexityPriority,
        'string',
        'Priorité d\'utilisation Perplexity',
        'prompt'
    )) count++;

    // SMS Format
    if (await upsertConfig(
        'prompts',
        'cfa_sms_format',
        CFA_SYSTEM_PROMPT.smsFormat,
        'string',
        'Format SMS optimisé',
        'prompt'
    )) count++;

    // Quality Checklist
    if (await upsertConfig(
        'prompts',
        'cfa_quality_checklist',
        CFA_SYSTEM_PROMPT.qualityChecklist,
        'string',
        'Checklist qualité avant envoi',
        'prompt'
    )) count++;

    console.log(`\n✅ ${count}/7 prompts CFA migrés`);
}

/**
 * Migration Section 2: Prompts Intentions
 */
async function migratePromptsIntentions() {
    console.log('\n🎯 Migration: Prompts Intentions');
    console.log('─'.repeat(60));

    // Charger intent prompts
    let intentPrompts;
    try {
        const module = await import('./config/intent-prompts.js');
        intentPrompts = module.INTENT_PROMPTS || module.default;
    } catch (error) {
        console.warn('⚠️  Impossible de charger intent-prompts.js:', error.message);
        return;
    }

    let count = 0;

    // Comprehensive Analysis
    if (intentPrompts.comprehensive_analysis && await upsertConfig(
        'prompts',
        'intent_comprehensive_analysis',
        intentPrompts.comprehensive_analysis,
        'string',
        'Prompt pour analyses complètes',
        'prompt'
    )) count++;

    // Stock Price
    if (intentPrompts.stock_price && await upsertConfig(
        'prompts',
        'intent_stock_price',
        intentPrompts.stock_price,
        'string',
        'Prompt pour demandes de prix',
        'prompt'
    )) count++;

    // Fundamentals
    if (intentPrompts.fundamentals && await upsertConfig(
        'prompts',
        'intent_fundamentals',
        intentPrompts.fundamentals,
        'string',
        'Prompt pour fondamentaux',
        'prompt'
    )) count++;

    // News
    if (intentPrompts.news && await upsertConfig(
        'prompts',
        'intent_news',
        intentPrompts.news,
        'string',
        'Prompt pour actualités',
        'prompt'
    )) count++;

    // Comparative Analysis
    if (intentPrompts.comparative_analysis && await upsertConfig(
        'prompts',
        'intent_comparative_analysis',
        intentPrompts.comparative_analysis,
        'string',
        'Prompt pour analyses comparatives',
        'prompt'
    )) count++;

    console.log(`\n✅ ${count} prompts intentions migrés`);
}

/**
 * Migration Section 3: Briefing Prompts
 */
async function migrateBriefingPrompts() {
    console.log('\n📧 Migration: Prompts Briefings');
    console.log('─'.repeat(60));

    // Charger briefing prompts
    let briefingPrompts;
    try {
        briefingPrompts = JSON.parse(
            fs.readFileSync('./config/briefing-prompts.json', 'utf8')
        );
    } catch (error) {
        console.warn('⚠️  Impossible de charger briefing-prompts.json:', error.message);
        return;
    }

    let count = 0;

    // Morning
    if (briefingPrompts.morning && await upsertConfig(
        'prompts',
        'briefing_morning',
        briefingPrompts.morning,
        'json',
        'Configuration briefing matinal',
        'prompt'
    )) count++;

    // Midday
    if (briefingPrompts.midday && await upsertConfig(
        'prompts',
        'briefing_midday',
        briefingPrompts.midday,
        'json',
        'Configuration briefing midi',
        'prompt'
    )) count++;

    // Evening
    if (briefingPrompts.evening && await upsertConfig(
        'prompts',
        'briefing_evening',
        briefingPrompts.evening,
        'json',
        'Configuration briefing soir',
        'prompt'
    )) count++;

    console.log(`\n✅ ${count}/3 briefings migrés`);
}

/**
 * Migration Section 4: Variables
 */
async function migrateVariables() {
    console.log('\n⚙️  Migration: Variables');
    console.log('─'.repeat(60));

    let count = 0;

    const variables = {
        max_tokens_default: { value: 4000, description: 'Nombre maximum de tokens par défaut' },
        max_tokens_briefing: { value: 10000, description: 'Nombre maximum de tokens pour briefings' },
        temperature: { value: 0.1, description: 'Température pour génération (0.0-1.0)' },
        recency_default: { value: 'month', description: 'Filtre de récence par défaut', type: 'string' },
        cache_duration_minutes: { value: 5, description: 'Durée du cache config en minutes' }
    };

    for (const [key, config] of Object.entries(variables)) {
        if (await upsertConfig(
            'variables',
            key,
            config.value,
            config.type || 'number',
            config.description,
            'variable'
        )) count++;
    }

    console.log(`\n✅ ${count}/${Object.keys(variables).length} variables migrées`);
}

/**
 * Migration Section 5: Directives
 */
async function migrateDirectives() {
    console.log('\n🎯 Migration: Directives');
    console.log('─'.repeat(60));

    let count = 0;

    const directives = {
        allow_clarifications: { value: true, description: 'Permettre à Emma de poser des questions de clarification' },
        adaptive_length: { value: true, description: 'Longueur de réponse adaptative selon complexité' },
        require_sources: { value: true, description: 'Exiger citations de sources pour données factuelles' },
        min_ratios_simple: { value: 1, description: 'Nombre minimum de ratios pour questions simples', type: 'number' },
        min_ratios_comprehensive: { value: 8, description: 'Nombre minimum de ratios pour analyses complètes', type: 'number' }
    };

    for (const [key, config] of Object.entries(directives)) {
        if (await upsertConfig(
            'directives',
            key,
            config.value,
            config.type || 'boolean',
            config.description,
            'directive'
        )) count++;
    }

    console.log(`\n✅ ${count}/${Object.keys(directives).length} directives migrées`);
}

/**
 * Migration Section 6: Routing
 */
async function migrateRouting() {
    console.log('\n🧭 Migration: Routage');
    console.log('─'.repeat(60));

    let count = 0;

    const routing = {
        use_perplexity_only_keywords: {
            value: ['fonds', 'quartile', 'macro', 'stratégie', 'crypto'],
            description: 'Keywords déclenchant Perplexity seul (sans APIs)'
        },
        require_apis_keywords: {
            value: ['prix actuel', 'ratio exact', 'rsi', 'macd'],
            description: 'Keywords nécessitant des APIs complémentaires'
        },
        intent_confidence_threshold: {
            value: 0.7,
            description: 'Seuil de confiance pour détection intention',
            type: 'number'
        }
    };

    for (const [key, config] of Object.entries(routing)) {
        if (await upsertConfig(
            'routing',
            key,
            config.value,
            config.type || 'json',
            config.description,
            'routing'
        )) count++;
    }

    console.log(`\n✅ ${count}/${Object.keys(routing).length} configs routing migrées`);
}

/**
 * Migration principale
 */
async function migrate() {
    try {
        console.log('🔍 Vérification connexion Supabase...');
        const { error: pingError } = await supabase.from('emma_system_config').select('count').limit(1);
        if (pingError) {
            throw new Error(`Connexion Supabase échouée: ${pingError.message}`);
        }
        console.log('✅ Connexion Supabase OK\n');

        // Exécuter toutes les migrations
        await migratePromptsCFA();
        await migratePromptsIntentions();
        await migrateBriefingPrompts();
        await migrateVariables();
        await migrateDirectives();
        await migrateRouting();

        // Résumé final
        console.log('\n' + '═'.repeat(60));
        console.log('🎉 MIGRATION TERMINÉE AVEC SUCCÈS !');
        console.log('═'.repeat(60));

        // Compter les configs
        const { count, error: countError } = await supabase
            .from('emma_system_config')
            .select('*', { count: 'exact', head: true });

        if (!countError) {
            console.log(`\n📊 Total configurations dans Supabase: ${count}`);
        }

        console.log('\n✅ Prochaines étapes:');
        console.log('   1. Vérifier dans Supabase Table Editor');
        console.log('   2. Ouvrir https://gobapps.com/admin-jslai.html');
        console.log('   3. Tester les modifications\n');

    } catch (error) {
        console.error('\n❌ ERREUR MIGRATION:', error);
        console.error('\nStack:', error.stack);
        process.exit(1);
    }
}

// Lancer la migration
migrate();
