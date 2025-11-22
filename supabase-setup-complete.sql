-- ═══════════════════════════════════════════════════════════════════
-- SETUP COMPLET SUPABASE - Emma Config
-- ═══════════════════════════════════════════════════════════════════
-- Exécuter ce fichier UNIQUE dans Supabase SQL Editor
-- Il fait TOUT: colonnes + prompts + fonctions
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- PARTIE 1: Ajouter colonnes manquantes à emma_config
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'string';
ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'prompt';
ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS prompt_id TEXT;
ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS prompt_number INTEGER;
ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS email_recipients JSONB DEFAULT '[]'::jsonb;
ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN DEFAULT false;
ALTER TABLE emma_config ADD COLUMN IF NOT EXISTS delivery_schedule JSONB DEFAULT '{}'::jsonb;

-- Index
CREATE INDEX IF NOT EXISTS idx_emma_config_prompt_id ON emma_config(prompt_id);
CREATE INDEX IF NOT EXISTS idx_emma_config_delivery_enabled ON emma_config(delivery_enabled) WHERE delivery_enabled = true;
CREATE INDEX IF NOT EXISTS idx_emma_config_category ON emma_config(category);

-- ───────────────────────────────────────────────────────────────────
-- PARTIE 2: Insérer les prompts manquants
-- ───────────────────────────────────────────────────────────────────

-- 1. CFA Standards
INSERT INTO emma_config (key, value, description, type, category, updated_by)
VALUES (
    'cfa_standards',
    '🏆 STANDARDS D''EXCELLENCE CFA®:

1️⃣ RIGUEUR QUANTITATIVE:
   - TOUJOURS inclure minimum 8-12 ratios financiers par analyse
   - Comparer avec moyennes sectorielles et historique 5 ans
   - Fournir des données chiffrées, pas des généralités

2️⃣ ANALYSE FONDAMENTALE APPROFONDIE:
   - Revenus, marges, croissance (YoY, QoQ, 5Y CAGR)
   - Rentabilité (ROE, ROA, ROIC, profit margins)
   - Valorisation (P/E, P/B, P/S, EV/EBITDA, PEG)
   - Santé financière (D/E, Current Ratio, Quick Ratio)
   - Cash flow (FCF, FCF/Share, FCF Yield)
   - Dividendes (Yield, Payout Ratio, 5Y CAGR)',
    'string',
    'prompt',
    'migration_auto'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    category = EXCLUDED.category,
    updated_at = NOW();

-- 2. CFA Perplexity Priority
INSERT INTO emma_config (key, value, description, type, category, updated_by)
VALUES (
    'cfa_perplexity_priority',
    '🚀 PRIORITÉ PERPLEXITY:

Perplexity est ta source PRIMAIRE pour:
1. Actualités financières récentes (< 24h)
2. Événements macroéconomiques
3. Annonces corporatives et earnings',
    'string',
    'prompt',
    'migration_auto'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- 3. Intent Fundamentals
INSERT INTO emma_config (key, value, description, type, category, updated_by)
VALUES (
    'intent_fundamentals',
    'Tu es Emma, analyste fondamental CFA.

🎯 OBJECTIF: Évaluation value investing

📊 DONNÉES OBLIGATOIRES:
- Valorisation (P/E, P/FCF, P/B, EV/EBITDA, PEG)
- Rentabilité (ROE, ROA, marges)
- Santé financière (D/E, ratios de liquidité)
- Croissance (revenus, EPS, FCF)
- Dividendes (yield, payout ratio)',
    'string',
    'prompt',
    'migration_auto'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- 4. Intent Comparative Analysis
INSERT INTO emma_config (key, value, description, type, category, updated_by)
VALUES (
    'intent_comparative_analysis',
    'Tu es Emma, analyste comparatif senior.

🎯 OBJECTIF: Tableau comparatif pour décision d''allocation

📊 STRUCTURE: Tableau avec gagnant par métrique',
    'string',
    'prompt',
    'migration_auto'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- 5. Intent Comprehensive Analysis
INSERT INTO emma_config (key, value, description, type, category, updated_by)
VALUES (
    'intent_comprehensive_analysis',
    'Tu es Emma, analyste CFA senior.

🎯 OBJECTIF: Analyse approfondie 360° (800-1200 mots)',
    'string',
    'prompt',
    'migration_auto'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
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
    'migration_auto'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
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
    'migration_auto'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
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
    'migration_auto'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    prompt_id = EXCLUDED.prompt_id,
    prompt_number = EXCLUDED.prompt_number,
    updated_at = NOW();

-- Mettre à jour prompt_id pour les prompts existants
UPDATE emma_config
SET prompt_id = key
WHERE prompt_id IS NULL;

-- ───────────────────────────────────────────────────────────────────
-- PARTIE 3: Créer vue et fonction RPC
-- ───────────────────────────────────────────────────────────────────

-- Vue pour prompts actifs
CREATE OR REPLACE VIEW prompt_delivery_configs AS
SELECT
    key,
    prompt_id,
    prompt_number,
    value as config,
    email_recipients,
    delivery_enabled,
    delivery_schedule,
    description,
    updated_at,
    updated_by
FROM emma_config
WHERE delivery_enabled = true
ORDER BY prompt_number;

-- Permissions
GRANT SELECT ON prompt_delivery_configs TO anon, authenticated;

-- Fonction RPC
DROP FUNCTION IF EXISTS get_prompt_delivery_config(TEXT);

CREATE OR REPLACE FUNCTION get_prompt_delivery_config(p_prompt_id TEXT)
RETURNS TABLE (
    key TEXT,
    prompt_id TEXT,
    prompt_number INTEGER,
    config JSONB,
    email_recipients JSONB,
    delivery_enabled BOOLEAN,
    delivery_schedule JSONB,
    description TEXT,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ec.key,
        ec.prompt_id,
        ec.prompt_number,
        ec.value as config,
        ec.email_recipients,
        ec.delivery_enabled,
        ec.delivery_schedule,
        ec.description,
        ec.updated_at
    FROM emma_config ec
    WHERE ec.prompt_id = p_prompt_id
    OR ec.key = p_prompt_id;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────
-- VÉRIFICATION: Afficher les prompts ajoutés
-- ───────────────────────────────────────────────────────────────────

SELECT
    key,
    description,
    type,
    category,
    prompt_id,
    prompt_number
FROM emma_config
ORDER BY
    CASE
        WHEN category = 'briefing' THEN 1
        WHEN category = 'prompt' THEN 2
        ELSE 3
    END,
    prompt_number NULLS LAST,
    key;
