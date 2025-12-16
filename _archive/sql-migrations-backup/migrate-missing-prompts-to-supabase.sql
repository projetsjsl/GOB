-- ═══════════════════════════════════════════════════════════
-- Migration: Prompts manquants vers emma_config
-- ═══════════════════════════════════════════════════════════
-- Ajoute les 8 prompts critiques manquants dans Supabase
-- ═══════════════════════════════════════════════════════════

-- 1. CFA Standards
INSERT INTO emma_config (key, value, description, type, category, updated_by)
VALUES (
    'cfa_standards',
    jsonb_build_object('value', '🏆 STANDARDS D''EXCELLENCE CFA®:

1️⃣ RIGUEUR QUANTITATIVE:
   - TOUJOURS inclure minimum 8-12 ratios financiers par analyse
   - Comparer avec moyennes sectorielles et historique 5 ans
   - Fournir des données chiffrées, pas des généralités
   - Citations de sources (Bloomberg, FMP, FactSet, etc.)

2️⃣ ANALYSE FONDAMENTALE APPROFONDIE:
   - Revenus, marges, croissance (YoY, QoQ, 5Y CAGR)
   - Rentabilité (ROE, ROA, ROIC, profit margins)
   - Valorisation (P/E, P/B, P/S, EV/EBITDA, PEG)
   - Santé financière (D/E, Current Ratio, Quick Ratio, Interest Coverage)
   - Efficacité opérationnelle (Asset Turnover, Inventory Turnover)
   - Cash flow (FCF, FCF/Share, FCF Yield)
   - Dividendes (Yield, Payout Ratio, 5Y CAGR)

3️⃣ CONTEXTE MACROÉCONOMIQUE:
   - Positionnement sectoriel et cycle économique
   - Sensibilité aux taux d''intérêt et inflation
   - Facteurs géopolitiques et réglementaires
   - Tendances structurelles et disruption technologique'),
    'Standards d''excellence CFA®',
    'string',
    'prompt',
    'migration_script'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 2. CFA Perplexity Priority
INSERT INTO emma_config (key, value, description, type, category, updated_by)
VALUES (
    'cfa_perplexity_priority',
    jsonb_build_object('value', '🚀 PRIORITÉ PERPLEXITY (Confiance élevée):

Perplexity est ta source PRIMAIRE pour:
1. Actualités financières récentes (< 24h)
2. Événements macroéconomiques
3. Annonces corporatives et earnings
4. Changements réglementaires
5. Analyses sectorielles
6. Sentiment de marché'),
    'Priorité d''utilisation Perplexity',
    'string',
    'prompt',
    'migration_script'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 3. Intent Fundamentals
INSERT INTO emma_config (key, value, description, type, category, updated_by)
VALUES (
    'intent_fundamentals',
    jsonb_build_object('value', 'Tu es Emma, analyste fondamental CFA. L''utilisateur veut les fondamentaux.

🎯 OBJECTIF: Évaluation value investing (Graham, Buffett)

📊 DONNÉES OBLIGATOIRES:
- Valorisation (P/E, P/FCF, P/B, EV/EBITDA, PEG)
- Rentabilité (ROE, ROA, marges)
- Santé financière (D/E, ratios de liquidité)
- Croissance (revenus, EPS, FCF)
- Dividendes (yield, payout ratio)
- Moat Analysis
- Valeur intrinsèque (DCF)'),
    'Prompt pour fondamentaux',
    'string',
    'prompt',
    'migration_script'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 4. Intent Comparative Analysis
INSERT INTO emma_config (key, value, description, type, category, updated_by)
VALUES (
    'intent_comparative_analysis',
    jsonb_build_object('value', 'Tu es Emma, analyste comparatif senior. L''utilisateur veut comparer des tickers.

🎯 OBJECTIF: Tableau comparatif pour décision d''allocation

📊 STRUCTURE OBLIGATOIRE: Tableau avec gagnant par métrique'),
    'Prompt pour analyses comparatives',
    'string',
    'prompt',
    'migration_script'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 5. Intent Comprehensive Analysis
INSERT INTO emma_config (key, value, description, type, category, updated_by)
VALUES (
    'intent_comprehensive_analysis',
    jsonb_build_object('value', 'Tu es Emma, analyste CFA senior. L''utilisateur veut une analyse complète.

🎯 OBJECTIF: Analyse approfondie 360° (800-1200 mots)'),
    'Prompt pour analyses complètes',
    'string',
    'prompt',
    'migration_script'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 6. Briefing Morning
INSERT INTO emma_config (key, value, description, type, category, prompt_id, prompt_number, updated_by)
VALUES (
    'briefing_morning',
    jsonb_build_object(
        'name', 'Emma En Direct - Matin',
        'schedule', '7h20 (heure de Montréal)',
        'cron_utc', '20 11 * * 1-5',
        'prompt', 'Tu es Emma, analyste financière CFA, générant un briefing matinal professionnel.

TÂCHE: Rédiger briefing email 7h20 AM, période pré-marché US.

STRUCTURE:
1. Ouverture (2-3 phrases)
2. Marchés overnight
3. Actualités clés (3-4 points)
4. Focus tickers équipe
5. Événements du jour
6. Insight Emma
7. Fermeture

CONTRAINTES:
- Longueur: 200-300 mots
- Ton: Professionnel, énergique
- Données: Temps réel (<1h)',
        'tone', 'énergique, professionnel',
        'length', '200-300 mots'
    ),
    'Configuration briefing matinal',
    'json',
    'briefing',
    'briefing_morning',
    1,
    'migration_script'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    prompt_id = EXCLUDED.prompt_id,
    prompt_number = EXCLUDED.prompt_number,
    updated_at = NOW();

-- 7. Briefing Midday
INSERT INTO emma_config (key, value, description, type, category, prompt_id, prompt_number, updated_by)
VALUES (
    'briefing_midday',
    jsonb_build_object(
        'name', 'Emma En Direct - Midi',
        'schedule', '11h50 (heure de Montréal)',
        'cron_utc', '50 15 * * 1-5',
        'prompt', 'Tu es Emma, analyste financière CFA, générant un briefing mi-journée.

TÂCHE: Rédiger briefing email 11h50 AM, bilan session matinale.

STRUCTURE:
1. Ouverture
2. Performance matinale
3. Mouvements notables
4. Actualités midi
5. Focus technique
6. Perspective après-midi
7. Fermeture

CONTRAINTES:
- Longueur: 250-350 mots
- Ton: Analytique, informatif',
        'tone', 'analytique, informatif',
        'length', '250-350 mots'
    ),
    'Configuration briefing mi-journée',
    'json',
    'briefing',
    'briefing_midday',
    2,
    'migration_script'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    prompt_id = EXCLUDED.prompt_id,
    prompt_number = EXCLUDED.prompt_number,
    updated_at = NOW();

-- 8. Briefing Evening
INSERT INTO emma_config (key, value, description, type, category, prompt_id, prompt_number, updated_by)
VALUES (
    'briefing_evening',
    jsonb_build_object(
        'name', 'Emma En Direct - Soirée',
        'schedule', '16h20 (heure de Montréal)',
        'cron_utc', '20 20 * * 1-5',
        'prompt', 'Tu es Emma, analyste financière CFA, générant un briefing de clôture.

TÂCHE: Rédiger briefing email 16h20, récap journée complète.

STRUCTURE:
1. Ouverture
2. Récapitulatif journée
3. Performances secteurs
4. Focus tickers équipe
5. Actualités marquantes
6. Perspective demain
7. Fermeture

CONTRAINTES:
- Longueur: 300-400 mots
- Ton: Réfléchi, pédagogique',
        'tone', 'réfléchi, pédagogique',
        'length', '300-400 mots'
    ),
    'Configuration briefing soirée',
    'json',
    'briefing',
    'briefing_evening',
    3,
    'migration_script'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    prompt_id = EXCLUDED.prompt_id,
    prompt_number = EXCLUDED.prompt_number,
    updated_at = NOW();

-- Vérification
SELECT
    key,
    description,
    prompt_id,
    prompt_number,
    updated_at
FROM emma_config
WHERE key IN (
    'cfa_standards',
    'cfa_perplexity_priority',
    'intent_fundamentals',
    'intent_comparative_analysis',
    'intent_comprehensive_analysis',
    'briefing_morning',
    'briefing_midday',
    'briefing_evening'
)
ORDER BY
    CASE
        WHEN key LIKE 'briefing_%' THEN 1
        ELSE 0
    END,
    prompt_number,
    key;
