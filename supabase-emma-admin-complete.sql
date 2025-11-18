-- ========================================
-- EMMA SYSTEM CONFIG - SCHEMA COMPLET
-- ========================================
-- Table étendue pour toutes les configurations Emma
-- Supporte: Prompts CFA, Intentions, Briefings, Variables, Directives, Routage, Outils
-- ========================================

-- Drop table si existe (pour clean install)
-- DROP TABLE IF EXISTS emma_system_config CASCADE;

-- Table principale
CREATE TABLE IF NOT EXISTS emma_system_config (
    id BIGSERIAL PRIMARY KEY,
    section VARCHAR(100) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    category VARCHAR(50),  -- 'prompt', 'variable', 'directive', 'tool', 'routing'
    priority INTEGER DEFAULT 0,  -- Pour ordonnancement dans l'interface
    enabled BOOLEAN DEFAULT TRUE,  -- Activation/désactivation
    is_override BOOLEAN DEFAULT FALSE,  -- TRUE si c'est un override (sinon valeur par défaut)
    metadata JSONB,  -- Métadonnées flexibles
    version INTEGER DEFAULT 1,  -- Versioning automatique
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(100) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Contrainte unique sur section + key
    UNIQUE(section, key)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_emma_config_section ON emma_system_config(section);
CREATE INDEX IF NOT EXISTS idx_emma_config_key ON emma_system_config(key);
CREATE INDEX IF NOT EXISTS idx_emma_config_section_key ON emma_system_config(section, key);
CREATE INDEX IF NOT EXISTS idx_emma_config_category ON emma_system_config(category);
CREATE INDEX IF NOT EXISTS idx_emma_config_enabled ON emma_system_config(enabled);
CREATE INDEX IF NOT EXISTS idx_emma_config_override ON emma_system_config(is_override);

-- Fonction de mise à jour automatique du timestamp et version
CREATE OR REPLACE FUNCTION update_emma_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-update
DROP TRIGGER IF EXISTS emma_config_update_timestamp ON emma_system_config;
CREATE TRIGGER emma_config_update_timestamp
    BEFORE UPDATE ON emma_system_config
    FOR EACH ROW
    EXECUTE FUNCTION update_emma_config_timestamp();

-- Commentaires de documentation
COMMENT ON TABLE emma_system_config IS 'Configuration système d''Emma IA - Prompts, variables, directives, routing, tools';
COMMENT ON COLUMN emma_system_config.section IS 'Section de configuration (prompts, variables, directives, routing, tools)';
COMMENT ON COLUMN emma_system_config.key IS 'Clé de configuration unique dans la section';
COMMENT ON COLUMN emma_system_config.value IS 'Valeur de la configuration (JSON stringifié si type=json)';
COMMENT ON COLUMN emma_system_config.type IS 'Type de la valeur: string, number, boolean, json';
COMMENT ON COLUMN emma_system_config.category IS 'Catégorie: prompt, variable, directive, tool, routing';
COMMENT ON COLUMN emma_system_config.priority IS 'Ordre d''affichage dans l''interface (0 = premier)';
COMMENT ON COLUMN emma_system_config.enabled IS 'Si false, la configuration est désactivée';
COMMENT ON COLUMN emma_system_config.is_override IS 'TRUE si c''est un override manuel (prioritaire sur fichiers)';
COMMENT ON COLUMN emma_system_config.metadata IS 'Métadonnées JSON additionnelles';
COMMENT ON COLUMN emma_system_config.version IS 'Version auto-incrémentée à chaque modification';
COMMENT ON COLUMN emma_system_config.updated_by IS 'Utilisateur/admin ayant modifié la configuration';

-- Vue pour faciliter les requêtes (configs actives seulement)
CREATE OR REPLACE VIEW emma_active_configs AS
SELECT
    section,
    key,
    value,
    type,
    description,
    category,
    is_override,
    updated_at,
    updated_by
FROM emma_system_config
WHERE enabled = TRUE
ORDER BY section, priority, key;

COMMENT ON VIEW emma_active_configs IS 'Vue des configurations Emma actives seulement';

-- Fonction helper pour récupérer une valeur
CREATE OR REPLACE FUNCTION get_emma_config(
    p_section VARCHAR(100),
    p_key VARCHAR(100)
) RETURNS TEXT AS $$
DECLARE
    v_value TEXT;
BEGIN
    SELECT value INTO v_value
    FROM emma_system_config
    WHERE section = p_section
      AND key = p_key
      AND enabled = TRUE
    ORDER BY is_override DESC, updated_at DESC
    LIMIT 1;

    RETURN v_value;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_emma_config IS 'Récupère la valeur d''une config (priorité aux overrides)';

-- Fonction helper pour upsert une config
CREATE OR REPLACE FUNCTION upsert_emma_config(
    p_section VARCHAR(100),
    p_key VARCHAR(100),
    p_value TEXT,
    p_type VARCHAR(20) DEFAULT 'string',
    p_description TEXT DEFAULT NULL,
    p_category VARCHAR(50) DEFAULT NULL,
    p_is_override BOOLEAN DEFAULT FALSE,
    p_updated_by VARCHAR(100) DEFAULT 'system'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO emma_system_config (
        section, key, value, type, description, category, is_override, updated_by
    ) VALUES (
        p_section, p_key, p_value, p_type, p_description, p_category, p_is_override, p_updated_by
    )
    ON CONFLICT (section, key) DO UPDATE SET
        value = EXCLUDED.value,
        type = EXCLUDED.type,
        description = COALESCE(EXCLUDED.description, emma_system_config.description),
        category = COALESCE(EXCLUDED.category, emma_system_config.category),
        is_override = EXCLUDED.is_override,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION upsert_emma_config IS 'Insert ou update une configuration Emma';

-- ========================================
-- DONNÉES PAR DÉFAUT (Structure seulement, migration remplira les valeurs)
-- ========================================

-- Ces INSERT créent la structure. Le script de migration remplira les vraies valeurs.

-- Section: prompts (Prompts CFA)
INSERT INTO emma_system_config (section, key, value, type, description, category, priority) VALUES
('prompts', 'cfa_identity', '', 'string', 'Identité et qualifications Emma CFA', 'prompt', 1),
('prompts', 'cfa_standards', '', 'string', 'Standards d''excellence CFA', 'prompt', 2),
('prompts', 'cfa_output_format', '', 'string', 'Format de sortie Bloomberg Terminal', 'prompt', 3),
('prompts', 'cfa_product_guidance', '', 'string', 'Guidance par type de produit financier', 'prompt', 4),
('prompts', 'cfa_perplexity_priority', '', 'string', 'Priorité d''utilisation Perplexity', 'prompt', 5),
('prompts', 'cfa_sms_format', '', 'string', 'Format SMS optimisé', 'prompt', 6),
('prompts', 'cfa_quality_checklist', '', 'string', 'Checklist qualité avant envoi', 'prompt', 7)
ON CONFLICT (section, key) DO NOTHING;

-- Section: prompts (Prompts Intentions)
INSERT INTO emma_system_config (section, key, value, type, description, category, priority) VALUES
('prompts', 'intent_comprehensive_analysis', '', 'string', 'Prompt pour analyses complètes', 'prompt', 10),
('prompts', 'intent_stock_price', '', 'string', 'Prompt pour demandes de prix', 'prompt', 11),
('prompts', 'intent_fundamentals', '', 'string', 'Prompt pour fondamentaux', 'prompt', 12),
('prompts', 'intent_news', '', 'string', 'Prompt pour actualités', 'prompt', 13),
('prompts', 'intent_comparative_analysis', '', 'string', 'Prompt pour analyses comparatives', 'prompt', 14)
ON CONFLICT (section, key) DO NOTHING;

-- Section: prompts (Briefings)
INSERT INTO emma_system_config (section, key, value, type, description, category, priority) VALUES
('prompts', 'briefing_morning', '{}', 'json', 'Configuration briefing matinal', 'prompt', 20),
('prompts', 'briefing_midday', '{}', 'json', 'Configuration briefing midi', 'prompt', 21),
('prompts', 'briefing_evening', '{}', 'json', 'Configuration briefing soir', 'prompt', 22)
ON CONFLICT (section, key) DO NOTHING;

-- Section: variables
INSERT INTO emma_system_config (section, key, value, type, description, category, priority) VALUES
('variables', 'max_tokens_default', '4000', 'number', 'Nombre maximum de tokens par défaut', 'variable', 1),
('variables', 'max_tokens_briefing', '10000', 'number', 'Nombre maximum de tokens pour briefings', 'variable', 2),
('variables', 'temperature', '0.1', 'number', 'Température pour génération (0.0-1.0)', 'variable', 3),
('variables', 'recency_default', 'month', 'string', 'Filtre de récence par défaut (day/week/month/year)', 'variable', 4),
('variables', 'cache_duration_minutes', '5', 'number', 'Durée du cache config en minutes', 'variable', 5)
ON CONFLICT (section, key) DO NOTHING;

-- Section: directives
INSERT INTO emma_system_config (section, key, value, type, description, category, priority) VALUES
('directives', 'allow_clarifications', 'true', 'boolean', 'Permettre à Emma de poser des questions de clarification', 'directive', 1),
('directives', 'adaptive_length', 'true', 'boolean', 'Longueur de réponse adaptative selon complexité', 'directive', 2),
('directives', 'require_sources', 'true', 'boolean', 'Exiger citations de sources pour données factuelles', 'directive', 3),
('directives', 'min_ratios_simple', '1', 'number', 'Nombre minimum de ratios pour questions simples', 'directive', 4),
('directives', 'min_ratios_comprehensive', '8', 'number', 'Nombre minimum de ratios pour analyses complètes', 'directive', 5)
ON CONFLICT (section, key) DO NOTHING;

-- Section: routing
INSERT INTO emma_system_config (section, key, value, type, description, category, priority) VALUES
('routing', 'use_perplexity_only_keywords', '["fonds", "quartile", "macro", "stratégie", "crypto"]', 'json', 'Keywords déclenchant Perplexity seul (sans APIs)', 'routing', 1),
('routing', 'require_apis_keywords', '["prix actuel", "ratio exact", "rsi", "macd"]', 'json', 'Keywords nécessitant des APIs complémentaires', 'routing', 2),
('routing', 'intent_confidence_threshold', '0.7', 'number', 'Seuil de confiance pour détection intention', 'routing', 3)
ON CONFLICT (section, key) DO NOTHING;

-- ========================================
-- SUCCÈS
-- ========================================

SELECT 'Emma System Config table created successfully!' as status;
SELECT COUNT(*) as default_configs_count FROM emma_system_config;
