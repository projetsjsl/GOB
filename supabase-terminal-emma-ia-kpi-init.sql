-- ============================================
-- Terminal Emma IA - Initialisation des KPI de base
-- ============================================
-- Ce script crée des KPI prédéfinis pour le Terminal Emma IA
-- 
-- IMPORTANT: Exécutez d'abord supabase-terminal-emma-ia-schema-ADAPTED.sql
-- pour créer les tables nécessaires.

-- Vérifier que la table existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'kpi_definitions'
    ) THEN
        RAISE EXCEPTION 'La table kpi_definitions n''existe pas. Exécutez d''abord supabase-terminal-emma-ia-schema-ADAPTED.sql';
    END IF;
END $$;

-- ============================================
-- 1. Quality Score V1
-- ============================================
INSERT INTO kpi_definitions (name, code, expression, description, category, is_active, is_public, version)
VALUES (
    'Quality Score V1',
    'QUALITY_SCORE_V1',
    '(ROIC_TTM * 0.3) + (NET_MARGIN_TTM * 0.3) + (FCF_YIELD * 0.4)',
    'Score de qualité basé sur ROIC, marge nette et FCF yield. Combine rentabilité et génération de cash.',
    'Quality',
    true,
    true,
    1
)
ON CONFLICT (code) DO UPDATE SET
    expression = EXCLUDED.expression,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Variables pour Quality Score V1
INSERT INTO kpi_variables (kpi_id, variable_name, metric_code, weight, order_index)
SELECT 
    id,
    'ROIC_TTM',
    'ROIC_TTM',
    0.3,
    1
FROM kpi_definitions WHERE code = 'QUALITY_SCORE_V1'
ON CONFLICT (kpi_id, variable_name) DO NOTHING;

INSERT INTO kpi_variables (kpi_id, variable_name, metric_code, weight, order_index)
SELECT 
    id,
    'NET_MARGIN_TTM',
    'NET_MARGIN_TTM',
    0.3,
    2
FROM kpi_definitions WHERE code = 'QUALITY_SCORE_V1'
ON CONFLICT (kpi_id, variable_name) DO NOTHING;

INSERT INTO kpi_variables (kpi_id, variable_name, metric_code, weight, order_index)
SELECT 
    id,
    'FCF_YIELD',
    'FCF_YIELD',
    0.4,
    3
FROM kpi_definitions WHERE code = 'QUALITY_SCORE_V1'
ON CONFLICT (kpi_id, variable_name) DO NOTHING;

-- ============================================
-- 2. Value Score V1
-- ============================================
INSERT INTO kpi_definitions (name, code, expression, description, category, is_active, is_public, version)
VALUES (
    'Value Score V1',
    'VALUE_SCORE_V1',
    'NORMALIZE(P_E_TTM, 5, 30) * 0.3 + NORMALIZE(P_B_TTM, 0.5, 5) * 0.3 + NORMALIZE(P_FCF_TTM, 5, 50) * 0.4',
    'Score de valorisation basé sur P/E, P/B et P/FCF. Plus bas = meilleure valorisation.',
    'Value',
    true,
    true,
    1
)
ON CONFLICT (code) DO UPDATE SET
    expression = EXCLUDED.expression,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Variables pour Value Score V1
INSERT INTO kpi_variables (kpi_id, variable_name, metric_code, weight, order_index)
SELECT 
    id,
    'P_E_TTM',
    'P_E_TTM',
    0.3,
    1
FROM kpi_definitions WHERE code = 'VALUE_SCORE_V1'
ON CONFLICT DO NOTHING;

INSERT INTO kpi_variables (kpi_id, variable_name, metric_code, weight, order_index)
SELECT 
    id,
    'P_B_TTM',
    'P_B_TTM',
    0.3,
    2
FROM kpi_definitions WHERE code = 'VALUE_SCORE_V1'
ON CONFLICT DO NOTHING;

INSERT INTO kpi_variables (kpi_id, variable_name, metric_code, weight, order_index)
SELECT 
    id,
    'P_FCF_TTM',
    'P_FCF_TTM',
    0.4,
    3
FROM kpi_definitions WHERE code = 'VALUE_SCORE_V1'
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. Momentum Score V1
-- ============================================
INSERT INTO kpi_definitions (name, code, expression, description, category, is_active, is_public, version)
VALUES (
    'Momentum Score V1',
    'MOMENTUM_SCORE_V1',
    'DAILY_CHANGE_PCT * 0.5 + IF(DAILY_CHANGE_PCT > 0, 1, -1) * 0.5',
    'Score de momentum basé sur la variation journalière. Indique la tendance à court terme.',
    'Momentum',
    true,
    true,
    1
)
ON CONFLICT (code) DO UPDATE SET
    expression = EXCLUDED.expression,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Variables pour Momentum Score V1
INSERT INTO kpi_variables (kpi_id, variable_name, metric_code, weight, order_index)
SELECT 
    id,
    'DAILY_CHANGE_PCT',
    'DAILY_CHANGE_PCT',
    1.0,
    1
FROM kpi_definitions WHERE code = 'MOMENTUM_SCORE_V1'
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. Financial Health Score V1
-- ============================================
INSERT INTO kpi_definitions (name, code, expression, description, category, is_active, is_public, version)
VALUES (
    'Financial Health Score V1',
    'FINANCIAL_HEALTH_SCORE_V1',
    'NORMALIZE(CURRENT_RATIO_TTM, 0.5, 3) * 0.4 + NORMALIZE(DEBT_TO_EQUITY_TTM, 0, 2) * 0.3 + NORMALIZE(QUICK_RATIO_TTM, 0.3, 2) * 0.3',
    'Score de santé financière basé sur les ratios de liquidité et d endettement.',
    'Financial Health',
    true,
    true,
    1
)
ON CONFLICT (code) DO UPDATE SET
    expression = EXCLUDED.expression,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Variables pour Financial Health Score V1
INSERT INTO kpi_variables (kpi_id, variable_name, metric_code, weight, order_index)
SELECT 
    id,
    'CURRENT_RATIO_TTM',
    'CURRENT_RATIO_TTM',
    0.4,
    1
FROM kpi_definitions WHERE code = 'FINANCIAL_HEALTH_SCORE_V1'
ON CONFLICT DO NOTHING;

INSERT INTO kpi_variables (kpi_id, variable_name, metric_code, weight, order_index)
SELECT 
    id,
    'DEBT_TO_EQUITY_TTM',
    'DEBT_TO_EQUITY_TTM',
    0.3,
    2
FROM kpi_definitions WHERE code = 'FINANCIAL_HEALTH_SCORE_V1'
ON CONFLICT DO NOTHING;

INSERT INTO kpi_variables (kpi_id, variable_name, metric_code, weight, order_index)
SELECT 
    id,
    'QUICK_RATIO_TTM',
    'QUICK_RATIO_TTM',
    0.3,
    3
FROM kpi_definitions WHERE code = 'FINANCIAL_HEALTH_SCORE_V1'
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. Composite Emma Score (Score global)
-- ============================================
INSERT INTO kpi_definitions (name, code, expression, description, category, is_active, is_public, version)
VALUES (
    'Composite Emma Score',
    'EMMA_COMPOSITE_SCORE_V1',
    '(QUALITY_SCORE_V1 * 0.4) + (VALUE_SCORE_V1 * 0.3) + (MOMENTUM_SCORE_V1 * 0.2) + (FINANCIAL_HEALTH_SCORE_V1 * 0.1)',
    'Score composite Emma combinant qualité, valorisation, momentum et santé financière.',
    'Composite',
    true,
    true,
    1
)
ON CONFLICT (code) DO UPDATE SET
    expression = EXCLUDED.expression,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Note: Ce KPI composite nécessite que les autres KPI soient calculés d'abord
-- Il faudra implémenter une logique de calcul en cascade dans le moteur KPI

-- ============================================
-- Vérification
-- ============================================
SELECT 
    kd.name,
    kd.code,
    kd.category,
    COUNT(kv.id) as variable_count
FROM kpi_definitions kd
LEFT JOIN kpi_variables kv ON kd.id = kv.kpi_id
WHERE kd.is_active = true
GROUP BY kd.id, kd.name, kd.code, kd.category
ORDER BY kd.category, kd.name;

