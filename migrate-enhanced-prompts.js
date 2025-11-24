#!/usr/bin/env node

/**
 * Migration des nouveaux prompts optimisés pour Emma
 * - Web enhanced format
 * - SMS ultra-concise
 * - Analyse 3pour1
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gob-watchlist.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement manquantes');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Prompt Web Enhanced
const WEB_ENHANCED_FORMAT = '📊 FORMAT WEB OPTIMISÉ (Maximum Détail & Visuel)\n\
\n\
═══════════════════════════════════════════════════════════\n\
🎯 STRUCTURE VISUELLE AMÉLIORÉE\n\
═══════════════════════════════════════════════════════════\n\
\n\
📊 [{TICKER}] - {NOM COMPAGNIE} - $' + '{PRICE} ({CHANGE}%)\n\
Type: {PRODUCT_TYPE} | {Secteur} | {Bourse}\n\
\n\
🎯 RÉSUMÉ EXÉCUTIF\n\
{Synthèse 2-3 phrases avec recommandation claire}\n\
\n\
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
📈 VALORISATION COMPARATIVE\n\
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
\n\
┌──────────────┬─────────┬──────────┬─────────┬───────────┐\n\
│ Ratio        │ Actuel  │ Secteur  │ Hist 5Y │ vs Hist   │\n\
├──────────────┼─────────┼──────────┼─────────┼───────────┤\n\
│ P/E (TTM)    │ XX.Xx   │ XX.Xx    │ XX.Xx   │ ±XX% ✅/⚠️│\n\
│ P/B          │ X.Xx    │ X.Xx     │ X.Xx    │ ±XX% ✅/⚠️│\n\
│ PEG Ratio    │ X.Xx  │ X.Xx     │ X.Xx    │ ✅/⚠️     │\n\
│ FCF Yield    │ X.X%    │ X.X%     │ X.X%    │ ±XX% ✅/⚠️│\n\
│ EV/EBITDA    │ XX.Xx   │ XX.Xx    │ XX.Xx   │ ±XX% ✅/⚠️│\n\
└──────────────┴─────────┴──────────┴─────────┴───────────┘\n\
\n\
💡 ANALYSE: {Paragraphe détaillé 100-150 mots sur valorisation}\n\
\n\
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
💰 FONDAMENTAUX FINANCIERS\n\
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
\n\
📊 REVENUS & CROISSANCE\n\
• Revenus TTM: $' + 'XX.XB (±X.X% YoY)\n\
• CAGR 5 ans: X.X%\n\
• Guidance: $' + 'XX.X-XX.XB\n\
\n\
💎 RENTABILITÉ\n\
• Marge brute: XX.X% (vs XX.X% secteur)\n\
• Marge opé: XX.X%\n\
• ROE: XX.X% ✅/⚠️\n\
• ROIC: XX.X% ✅/⚠️\n\
\n\
💵 GÉNÉRATION CASH\n\
• FCF TTM: $' + 'X.XB\n\
• FCF/Share: $' + 'X.XX\n\
• FCF Yield: X.X% ✅/⚠️\n\
\n\
🏦 SANTÉ FINANCIÈRE\n\
• Debt/Equity: X.Xx (✅ solide / ⚠️ élevé)\n\
• Current Ratio: X.Xx\n\
• Interest Coverage: XX.Xx\n\
\n\
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
🏰 MOAT ANALYSIS (Warren Buffett)\n\
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
\n\
🛡️ MOAT RATING: ████████░░ {X}/10 ({WIDE/MODERATE/NARROW})\n\
\n\
✅ {Avantage 1}: {Score}/10\n\
   {Description détaillée avec preuves}\n\
\n\
✅ {Avantage 2}: {Score}/10\n\
   {Description détaillée avec preuves}\n\
\n\
✅ {Avantage 3}: {Score}/10\n\
   {Description détaillée avec preuves}\n\
\n\
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
📰 CATALYSEURS & ACTUALITÉS\n\
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
\n\
{3-5 actualités récentes avec analyse d\'impact}\n\
\n\
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
🎓 RECOMMANDATION CFA® & VALUE INVESTING\n\
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\
\n\
{Paragraphe synthèse 200-300 mots}\n\
\n\
🎯 NOTATION: {STRONG BUY / BUY / HOLD / REDUCE / SELL}\n\
⏰ HORIZON: {Court/Moyen/Long terme}\n\
💼 PROFIL RISQUE: {Conservateur/Modéré/Agressif}\n\
\n\
✅ POINTS FORTS (3-5)\n\
⚠️ RISQUES (3-5)\n\
\n\
═══════════════════════════════════════════════════════════';

// Prompt SMS Ultra-Concise
const SMS_ULTRA_CONCISE = `📱 FORMAT SMS ULTRA-CONCIS (Excellence Synthétisation)

🚨 CONTRAINTES STRICTES:
• MAX 1600 caractères TOTAL
• 5-6 ratios CRITIQUES seulement
• Emojis pour lisibilité mobile
• Structure fixe: Valorisation → Moat → Reco → Catalysts → Risques
• Call-to-action vers web

📋 TEMPLATE OBLIGATOIRE:

📊 {TICKER} ${PRICE} ({CHANGE}%)

💰 VALORISATION
P/E {X.X}x vs {Y.Y}x hist ({±Z}% ✅/⚠️)
PEG {X.X}x (attractif/élevé)
FCF Yield {X.X}% (solide/faible)

🏰 MOAT: {X}/10 {WIDE/MODERATE}
• {Avantage clé 1}
• {Avantage clé 2}
• {Chiffre proof point}

🎯 RECO: {BUY/HOLD/SELL}
Val. intr: ${XXX} (↑/↓{X}%)
Marge sécu: {X}% (Graham ✅/⚠️)

📈 CATALYSTS
• {Catalyst 1}
• {Catalyst 2}

⚠️ RISQUES
• {Risque principal}
• {Risque secondaire}

💼 Analyse complète: "Detail {TICKER}" sur Emma Web

RÈGLES D'OR:
1. JAMAIS dépasser 1600 chars
2. Ratios les plus critiques SEULEMENT (P/E, PEG, FCF Yield max)
3. Une ligne par point
4. Emojis = catégories visuelles
5. Chiffres précis (pas de généralités)
6. Call-to-action TOUJOURS présent`;

// Prompt Analyse 3pour1
const ANALYSIS_3POUR1 = `💎 ANALYSE 3-POUR-1 (DCF + Value Investing + Scénarios)

Cette section fournit une analyse quantitative approfondie selon les principes de Benjamin Graham et Warren Buffett.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 DCF - VALEUR INTRINSÈQUE (Benjamin Graham)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔢 HYPOTHÈSES DE CALCUL:
• Free Cash Flow actuel: ${FCF_CURRENT}M
• Taux croissance 5Y projeté: {GROWTH_RATE}%
• WACC (coût du capital): {WACC}%
• Taux de croissance terminal: {TERMINAL_RATE}%
• Période de projection: 10 ans

📊 CALCUL DCF:
Valeur intrinsèque par action: ${INTRINSIC_VALUE}
Prix actuel: ${CURRENT_PRICE}
Marge de sécurité: {MARGIN_OF_SAFETY}%

💡 INTERPRÉTATION:
{Si marge > 30%: "✅ EXCELLENTE marge de sécurité selon Graham (>30%)"}
{Si marge 15-30%: "✅ Bonne marge de sécurité (15-30%)"}
{Si marge 0-15%: "⚠️ Marge de sécurité faible (<15%)"}
{Si marge < 0: "❌ Survalorisation actuelle"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 SCÉNARIOS MULTIPLES (3-POUR-1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 SCÉNARIO PESSIMISTE (Récession)
• Croissance FCF: {PESSIMISTIC_GROWTH}% (contraction)
• Valeur intrinsèque: ${PESSIMISTIC_VALUE}
• Upside/Downside: {PESSIMISTIC_UPSIDE}%
• Probabilité: 20%

🟡 SCÉNARIO RÉALISTE (Base Case)
• Croissance FCF: {REALISTIC_GROWTH}% (historique)
• Valeur intrinsèque: ${REALISTIC_VALUE}
• Upside/Downside: {REALISTIC_UPSIDE}%
• Probabilité: 60%

🟢 SCÉNARIO OPTIMISTE (Expansion)
• Croissance FCF: {OPTIMISTIC_GROWTH}% (accélération)
• Valeur intrinsèque: ${OPTIMISTIC_VALUE}
• Upside/Downside: {OPTIMISTIC_UPSIDE}%
• Probabilité: 20%

📊 ESPÉRANCE DE VALEUR (Probabilité-pondérée):
${E_VALUE} = (20% × ${PESSIMISTIC_VALUE}) + (60% × ${REALISTIC_VALUE}) + (20% × ${OPTIMISTIC_VALUE})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 RECOMMANDATION VALUE INVESTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💵 PRIX D'ENTRÉE SUGGÉRÉ: ${ENTRY_PRICE}
   (Valeur intrinsèque - 30% selon principes Graham)

📊 ALLOCATION RECOMMANDÉE: {ALLOCATION}% du portefeuille
   (Basé sur: conviction × marge sécurité × qualité moat)

⏰ HORIZON D'INVESTISSEMENT: {HORIZON} ans minimum
   (Value investing = long-terme)

🎓 PRINCIPES APPLIQUÉS:
• ✅ Marge de sécurité (Graham): {MARGIN}%
• ✅ Moat durable (Buffett): {MOAT_SCORE}/10
• ✅ FCF positif et croissant: ${FCF_GROWTH}%
• ✅ Management de qualité: {MANAGEMENT_SCORE}/10
• ✅ Prix < Valeur intrinsèque: {UNDERVALUED}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ SENSIBILITÉ & RISQUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 ANALYSE DE SENSIBILITÉ:
Si WACC +1%: Valeur ${VALUE_WACC_PLUS_1}
Si Croissance -2%: Valeur ${VALUE_GROWTH_MINUS_2}

🚨 RISQUES PRINCIPAUX:
• {Risque 1 avec impact quantifié}
• {Risque 2 avec impact quantifié}
• {Risque 3 avec impact quantifié}

💡 NOTE: Cette analyse suppose {ASSUMPTIONS_SUMMARY}

═══════════════════════════════════════════════════════════

⚙️ MÉTHODOLOGIE:
Calculs basés sur DCF (Discounted Cash Flow), WACC calculé via CAPM, 
hypothèses de croissance basées sur historique 5Y et consensus analystes.`;

async function migrate() {
    console.log('🚀 Migration des prompts optimisés Emma\n');
    console.log('═'.repeat(60));

    let count = 0;

    // 1. Web Enhanced Format
    console.log('\n📝 Prompt 1/3: Web Enhanced Format...');
    const { error: error1 } = await supabase
        .from('emma_system_config')
        .upsert({
            section: 'prompts',
            key: 'web_enhanced_format',
            value: WEB_ENHANCED_FORMAT,
            type: 'string',
            description: 'Format visuel optimisé pour réponses Web (tableaux, emojis, sections)',
            category: 'prompt',
            is_override: false,
            updated_by: 'migration_enhanced_formats'
        }, {
            onConflict: 'section,key'
        });

    if (error1) {
        console.error('❌ Erreur:', error1.message);
    } else {
        console.log('✅ web_enhanced_format uploadé');
        count++;
    }

    // 2. SMS Ultra-Concise
    console.log('\n📱 Prompt 2/3: SMS Ultra-Concise...');
    const { error: error2 } = await supabase
        .from('emma_system_config')
        .upsert({
            section: 'prompts',
            key: 'sms_ultra_concise',
            value: SMS_ULTRA_CONCISE,
            type: 'string',
            description: 'Format ultra-concis pour SMS (max 1600 chars, 5-6 ratios clés)',
            category: 'prompt',
            is_override: false,
            updated_by: 'migration_enhanced_formats'
        }, {
            onConflict: 'section,key'
        });

    if (error2) {
        console.error('❌ Erreur:', error2.message);
    } else {
        console.log('✅ sms_ultra_concise uploadé');
        count++;
    }

    // 3. Analyse 3pour1
    console.log('\n💎 Prompt 3/3: Analyse 3pour1...');
    const { error: error3 } = await supabase
        .from('emma_system_config')
        .upsert({
            section: 'prompts',
            key: 'analysis_3pour1',
            value: ANALYSIS_3POUR1,
            type: 'string',
            description: 'Template analyse 3-pour-1: DCF + Value Investing + Scénarios multiples',
            category: 'prompt',
            is_override: false,
            updated_by: 'migration_enhanced_formats'
        }, {
            onConflict: 'section,key'
        });

    if (error3) {
        console.error('❌ Erreur:', error3.message);
    } else {
        console.log('✅ analysis_3pour1 uploadé');
        count++;
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`✅ ${count}/3 prompts optimisés migrés avec succès!`);
    console.log('═'.repeat(60));
    console.log('\n📋 Prochaines étapes:');
    console.log('  1. Vérifier dans emma-config.html');
    console.log('  2. Implémenter logic 3pour1 dans emma-agent.js');
    console.log('  3. Tester formats Web/SMS');
    console.log('  4. Déployer en production\n');
}

migrate();
