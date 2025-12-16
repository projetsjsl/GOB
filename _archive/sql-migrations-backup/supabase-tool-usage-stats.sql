-- =====================================================
-- SUPABASE TABLE: Tool Usage Statistics
-- =====================================================
-- Stores Emma AI tool usage statistics for performance tracking
-- Replaces file-based usage_stats.json (not compatible with Vercel read-only filesystem)

CREATE TABLE IF NOT EXISTS tool_usage_stats (
    tool_id TEXT PRIMARY KEY,
    total_calls INTEGER DEFAULT 0,
    successful_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    average_response_time_ms INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    success_rate NUMERIC(5,2) DEFAULT 0.00,
    error_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_tool_usage_stats_last_used ON tool_usage_stats(last_used DESC);
CREATE INDEX IF NOT EXISTS idx_tool_usage_stats_success_rate ON tool_usage_stats(success_rate DESC);

-- Trigger pour mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_tool_usage_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tool_usage_stats_updated_at ON tool_usage_stats;
CREATE TRIGGER trigger_update_tool_usage_stats_updated_at
    BEFORE UPDATE ON tool_usage_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_tool_usage_stats_updated_at();

-- Fonction pour mettre à jour les statistiques d'un outil
CREATE OR REPLACE FUNCTION update_tool_stats(
    p_tool_id TEXT,
    p_success BOOLEAN,
    p_execution_time INTEGER,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_stats RECORD;
    v_new_error_history JSONB;
BEGIN
    -- Récupérer les stats actuelles
    SELECT * INTO v_stats FROM tool_usage_stats WHERE tool_id = p_tool_id;

    -- Si le tool n'existe pas, le créer
    IF v_stats IS NULL THEN
        INSERT INTO tool_usage_stats (
            tool_id,
            total_calls,
            successful_calls,
            failed_calls,
            average_response_time_ms,
            last_used,
            success_rate,
            error_history
        ) VALUES (
            p_tool_id,
            1,
            CASE WHEN p_success THEN 1 ELSE 0 END,
            CASE WHEN p_success THEN 0 ELSE 1 END,
            p_execution_time,
            NOW(),
            CASE WHEN p_success THEN 100.00 ELSE 0.00 END,
            CASE
                WHEN p_error_message IS NOT NULL THEN
                    jsonb_build_array(
                        jsonb_build_object(
                            'timestamp', NOW(),
                            'error', p_error_message
                        )
                    )
                ELSE '[]'::jsonb
            END
        );
    ELSE
        -- Mettre à jour les stats existantes
        v_new_error_history := v_stats.error_history;

        -- Ajouter l'erreur si présente
        IF p_error_message IS NOT NULL THEN
            v_new_error_history := v_new_error_history || jsonb_build_array(
                jsonb_build_object(
                    'timestamp', NOW(),
                    'error', p_error_message
                )
            );

            -- Garder seulement les 10 dernières erreurs
            IF jsonb_array_length(v_new_error_history) > 10 THEN
                v_new_error_history := jsonb_agg(elem)
                    FROM (
                        SELECT elem FROM jsonb_array_elements(v_new_error_history) elem
                        ORDER BY (elem->>'timestamp') DESC
                        LIMIT 10
                    ) sub;
            END IF;
        END IF;

        -- Calculer les nouvelles valeurs
        UPDATE tool_usage_stats
        SET
            total_calls = v_stats.total_calls + 1,
            successful_calls = v_stats.successful_calls + CASE WHEN p_success THEN 1 ELSE 0 END,
            failed_calls = v_stats.failed_calls + CASE WHEN p_success THEN 0 ELSE 1 END,
            average_response_time_ms = CASE
                WHEN p_execution_time > 0 THEN
                    ROUND((v_stats.average_response_time_ms * v_stats.total_calls + p_execution_time) / (v_stats.total_calls + 1))
                ELSE v_stats.average_response_time_ms
            END,
            last_used = NOW(),
            success_rate = ROUND(
                ((v_stats.successful_calls + CASE WHEN p_success THEN 1 ELSE 0 END) * 100.0) / (v_stats.total_calls + 1),
                2
            ),
            error_history = v_new_error_history
        WHERE tool_id = p_tool_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les stats de tous les outils
CREATE OR REPLACE FUNCTION get_all_tool_stats()
RETURNS TABLE (
    tool_id TEXT,
    total_calls INTEGER,
    successful_calls INTEGER,
    failed_calls INTEGER,
    average_response_time_ms INTEGER,
    last_used TIMESTAMP WITH TIME ZONE,
    success_rate NUMERIC,
    error_history JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.tool_id,
        t.total_calls,
        t.successful_calls,
        t.failed_calls,
        t.average_response_time_ms,
        t.last_used,
        t.success_rate,
        t.error_history
    FROM tool_usage_stats t
    ORDER BY t.last_used DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour documentation
COMMENT ON TABLE tool_usage_stats IS 'Statistiques d''utilisation des outils Emma AI pour suivi de performance';
COMMENT ON COLUMN tool_usage_stats.tool_id IS 'ID unique de l''outil (ex: fmp-quote, polygon-stock-price)';
COMMENT ON COLUMN tool_usage_stats.total_calls IS 'Nombre total d''appels à cet outil';
COMMENT ON COLUMN tool_usage_stats.successful_calls IS 'Nombre d''appels réussis';
COMMENT ON COLUMN tool_usage_stats.failed_calls IS 'Nombre d''échecs';
COMMENT ON COLUMN tool_usage_stats.average_response_time_ms IS 'Temps de réponse moyen en millisecondes';
COMMENT ON COLUMN tool_usage_stats.last_used IS 'Dernière utilisation de l''outil';
COMMENT ON COLUMN tool_usage_stats.success_rate IS 'Taux de succès en pourcentage (0-100)';
COMMENT ON COLUMN tool_usage_stats.error_history IS 'Historique des 10 dernières erreurs (JSON array)';

-- Permissions (RLS - Row Level Security)
ALTER TABLE tool_usage_stats ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs authentifiés peuvent lire les stats
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les stats"
    ON tool_usage_stats
    FOR SELECT
    TO authenticated
    USING (true);

-- Politique: Seul le service role peut écrire les stats
CREATE POLICY "Seul le service role peut modifier les stats"
    ON tool_usage_stats
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
