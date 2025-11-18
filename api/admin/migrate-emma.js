/**
 * API ENDPOINT: Migration Emma → Supabase
 *
 * Exécute la migration des configurations Emma depuis les fichiers
 * vers Supabase en utilisant les variables d'environnement Vercel
 *
 * Usage:
 *   GET https://gobapps.com/api/admin/migrate-emma
 */

import { createClient } from '@supabase/supabase-js';
import { CFA_SYSTEM_PROMPT } from '../../config/emma-cfa-prompt.js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    // Vérifier les variables d'environnement
    if (!supabaseUrl || !supabaseKey) {
        const missing = [];
        if (!supabaseUrl) missing.push('SUPABASE_URL');
        if (!supabaseKey) missing.push('SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_KEY');

        return res.status(503).json({
            error: 'Variables d\'environnement manquantes',
            missing,
            message: 'Configurez les variables dans Vercel → Settings → Environment Variables'
        });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const results = {
        started: new Date().toISOString(),
        sections: {},
        errors: [],
        total: 0
    };

    /**
     * Helper pour insérer/mettre à jour une config
     */
    async function upsertConfig(section, key, value, type = 'string', description = '', category = '') {
        try {
            const { error } = await supabase
                .from('emma_system_config')
                .upsert({
                    section,
                    key,
                    value: typeof value === 'object' ? JSON.stringify(value) : String(value),
                    type,
                    description,
                    category,
                    is_override: false,
                    updated_by: 'migration_api'
                }, {
                    onConflict: 'section,key'
                });

            if (error) {
                results.errors.push({ section, key, error: error.message });
                return false;
            }

            results.total++;
            return true;
        } catch (error) {
            results.errors.push({ section, key, error: error.message });
            return false;
        }
    }

    try {
        // ========================================
        // Section 1: Prompts CFA
        // ========================================
        results.sections.prompts_cfa = { count: 0, total: 7 };

        await upsertConfig('prompts', 'cfa_identity', CFA_SYSTEM_PROMPT.identity, 'string', 'Identité et qualifications Emma CFA', 'prompt') && results.sections.prompts_cfa.count++;
        await upsertConfig('prompts', 'cfa_standards', CFA_SYSTEM_PROMPT.standards, 'string', 'Standards d\'excellence CFA®', 'prompt') && results.sections.prompts_cfa.count++;
        await upsertConfig('prompts', 'cfa_output_format', CFA_SYSTEM_PROMPT.outputFormat, 'string', 'Format de sortie Bloomberg Terminal', 'prompt') && results.sections.prompts_cfa.count++;
        await upsertConfig('prompts', 'cfa_product_guidance', CFA_SYSTEM_PROMPT.productTypeGuidance, 'string', 'Guidance par type de produit financier', 'prompt') && results.sections.prompts_cfa.count++;
        await upsertConfig('prompts', 'cfa_perplexity_priority', CFA_SYSTEM_PROMPT.perplexityPriority, 'string', 'Priorité d\'utilisation Perplexity', 'prompt') && results.sections.prompts_cfa.count++;
        await upsertConfig('prompts', 'cfa_sms_format', CFA_SYSTEM_PROMPT.smsFormat, 'string', 'Format SMS optimisé', 'prompt') && results.sections.prompts_cfa.count++;
        await upsertConfig('prompts', 'cfa_quality_checklist', CFA_SYSTEM_PROMPT.qualityChecklist, 'string', 'Checklist qualité avant envoi', 'prompt') && results.sections.prompts_cfa.count++;

        // ========================================
        // Section 2: Prompts Intentions
        // ========================================
        results.sections.prompts_intentions = { count: 0, total: 5 };

        try {
            const intentModule = await import('../../config/intent-prompts.js');
            const intentPrompts = intentModule.INTENT_PROMPTS || intentModule.default;

            if (intentPrompts.comprehensive_analysis) {
                await upsertConfig('prompts', 'intent_comprehensive_analysis', intentPrompts.comprehensive_analysis, 'string', 'Prompt pour analyses complètes', 'prompt') && results.sections.prompts_intentions.count++;
            }
            if (intentPrompts.stock_price) {
                await upsertConfig('prompts', 'intent_stock_price', intentPrompts.stock_price, 'string', 'Prompt pour demandes de prix', 'prompt') && results.sections.prompts_intentions.count++;
            }
            if (intentPrompts.fundamentals) {
                await upsertConfig('prompts', 'intent_fundamentals', intentPrompts.fundamentals, 'string', 'Prompt pour fondamentaux', 'prompt') && results.sections.prompts_intentions.count++;
            }
            if (intentPrompts.news) {
                await upsertConfig('prompts', 'intent_news', intentPrompts.news, 'string', 'Prompt pour actualités', 'prompt') && results.sections.prompts_intentions.count++;
            }
            if (intentPrompts.comparative_analysis) {
                await upsertConfig('prompts', 'intent_comparative_analysis', intentPrompts.comparative_analysis, 'string', 'Prompt pour analyses comparatives', 'prompt') && results.sections.prompts_intentions.count++;
            }
        } catch (error) {
            results.errors.push({ section: 'prompts_intentions', error: error.message });
        }

        // ========================================
        // Section 3: Briefing Prompts
        // ========================================
        results.sections.briefings = { count: 0, total: 3 };

        try {
            const briefingPath = path.join(process.cwd(), 'config/briefing-prompts.json');
            const briefingData = JSON.parse(fs.readFileSync(briefingPath, 'utf8'));

            if (briefingData.morning) {
                await upsertConfig('prompts', 'briefing_morning', briefingData.morning, 'json', 'Configuration briefing matinal', 'prompt') && results.sections.briefings.count++;
            }
            if (briefingData.midday) {
                await upsertConfig('prompts', 'briefing_midday', briefingData.midday, 'json', 'Configuration briefing midi', 'prompt') && results.sections.briefings.count++;
            }
            if (briefingData.evening) {
                await upsertConfig('prompts', 'briefing_evening', briefingData.evening, 'json', 'Configuration briefing soir', 'prompt') && results.sections.briefings.count++;
            }
        } catch (error) {
            results.errors.push({ section: 'briefings', error: error.message });
        }

        // ========================================
        // Section 4: Variables
        // ========================================
        results.sections.variables = { count: 0, total: 5 };

        const variables = {
            max_tokens_default: { value: 4000, description: 'Nombre maximum de tokens par défaut' },
            max_tokens_briefing: { value: 10000, description: 'Nombre maximum de tokens pour briefings' },
            temperature: { value: 0.1, description: 'Température pour génération (0.0-1.0)' },
            recency_default: { value: 'month', description: 'Filtre de récence par défaut', type: 'string' },
            cache_duration_minutes: { value: 5, description: 'Durée du cache config en minutes' }
        };

        for (const [key, config] of Object.entries(variables)) {
            await upsertConfig('variables', key, config.value, config.type || 'number', config.description, 'variable') && results.sections.variables.count++;
        }

        // ========================================
        // Section 5: Directives
        // ========================================
        results.sections.directives = { count: 0, total: 5 };

        const directives = {
            allow_clarifications: { value: true, description: 'Permettre à Emma de poser des questions de clarification' },
            adaptive_length: { value: true, description: 'Longueur de réponse adaptative selon complexité' },
            require_sources: { value: true, description: 'Exiger citations de sources pour données factuelles' },
            min_ratios_simple: { value: 1, description: 'Nombre minimum de ratios pour questions simples', type: 'number' },
            min_ratios_comprehensive: { value: 8, description: 'Nombre minimum de ratios pour analyses complètes', type: 'number' }
        };

        for (const [key, config] of Object.entries(directives)) {
            await upsertConfig('directives', key, config.value, config.type || 'boolean', config.description, 'directive') && results.sections.directives.count++;
        }

        // ========================================
        // Section 6: Routing
        // ========================================
        results.sections.routing = { count: 0, total: 3 };

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
            await upsertConfig('routing', key, config.value, config.type || 'json', config.description, 'routing') && results.sections.routing.count++;
        }

        // ========================================
        // Résumé final
        // ========================================
        const { count, error: countError } = await supabase
            .from('emma_system_config')
            .select('*', { count: 'exact', head: true });

        results.completed = new Date().toISOString();
        results.total_in_db = count;
        results.success = results.errors.length === 0;

        return res.status(200).json({
            success: true,
            message: 'Migration terminée',
            results
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Erreur durant la migration',
            message: error.message,
            stack: error.stack,
            results
        });
    }
}
