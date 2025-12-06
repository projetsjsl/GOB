-- ============================================
-- Terminal Emma IA - Schéma Supabase (ADAPTÉ aux tables existantes)
-- ============================================
-- Ce schéma s'adapte aux tables existantes :
-- - tickers (table principale avec source: 'team', 'watchlist', 'manual', 'both')
-- - team_tickers (peut exister encore)
-- - watchlists (peut avoir id bigint ou uuid)
-- ============================================

-- ============================================
-- 1. Table: instruments (utilise tickers existant ou crée nouveau)
-- ============================================
DO $$
DECLARE
    tickers_exists BOOLEAN;
    instruments_exists BOOLEAN;
BEGIN
    -- Vérifier si tickers existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'tickers'
    ) INTO tickers_exists;

    -- Vérifier si instruments existe déjà
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'instruments'
    ) INTO instruments_exists;

    IF NOT instruments_exists THEN
        -- Créer la table instruments
        CREATE TABLE instruments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            symbol TEXT NOT NULL UNIQUE,
            name TEXT,
            exchange TEXT,
            country TEXT,
            currency TEXT DEFAULT 'USD',
            sector TEXT,
            industry TEXT,
            market_cap NUMERIC,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX idx_instruments_symbol ON instruments(symbol);
        CREATE INDEX idx_instruments_sector ON instruments(sector);
        CREATE INDEX idx_instruments_country ON instruments(country);

        RAISE NOTICE '✅ Table instruments créée';

        -- Si tickers existe, migrer les données
        IF tickers_exists THEN
            INSERT INTO instruments (symbol, name, exchange, country, currency, sector, industry, market_cap, is_active, created_at, updated_at)
            SELECT 
                ticker,
                company_name,
                exchange,
                country,
                currency,
                sector,
                industry,
                CASE 
                    WHEN market_cap ~ '^[0-9]+\.?[0-9]*[TBMK]?$' THEN 
                        CASE 
                            WHEN market_cap ~ 'T$' THEN CAST(REPLACE(market_cap, 'T', '') AS NUMERIC) * 1000000000000
                            WHEN market_cap ~ 'B$' THEN CAST(REPLACE(market_cap, 'B', '') AS NUMERIC) * 1000000000
                            WHEN market_cap ~ 'M$' THEN CAST(REPLACE(market_cap, 'M', '') AS NUMERIC) * 1000000
                            WHEN market_cap ~ 'K$' THEN CAST(REPLACE(market_cap, 'K', '') AS NUMERIC) * 1000
                            ELSE CAST(market_cap AS NUMERIC)
                        END
                    ELSE NULL
                END,
                is_active,
                created_at,
                updated_at
            FROM tickers
            WHERE is_active = true
            ON CONFLICT (symbol) DO NOTHING;

            RAISE NOTICE '✅ Données migrées depuis tickers vers instruments';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ Table instruments existe déjà';
    END IF;
END $$;

-- ============================================
-- 2. Table: fmp_raw_cache (cache brut FMP)
-- ============================================
CREATE TABLE IF NOT EXISTS fmp_raw_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    payload JSONB NOT NULL,
    as_of DATE,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(symbol, endpoint, as_of)
);

CREATE INDEX IF NOT EXISTS idx_fmp_cache_symbol_endpoint ON fmp_raw_cache(symbol, endpoint);
CREATE INDEX IF NOT EXISTS idx_fmp_cache_fetched_at ON fmp_raw_cache(fetched_at);

-- ============================================
-- 3. Table: metrics (métriques atomiques calculées)
-- ============================================
CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL,
    metric_code TEXT NOT NULL,
    value NUMERIC,
    as_of DATE NOT NULL,
    period TEXT,
    meta JSONB,
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol, metric_code, as_of, period)
);

-- Ajouter la foreign key seulement si instruments existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instruments') THEN
        -- Vérifier si la contrainte existe déjà
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'metrics_symbol_fkey'
        ) THEN
            ALTER TABLE metrics 
            ADD CONSTRAINT metrics_symbol_fkey 
            FOREIGN KEY (symbol) REFERENCES instruments(symbol) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_metrics_symbol_code ON metrics(symbol, metric_code);
CREATE INDEX IF NOT EXISTS idx_metrics_as_of ON metrics(as_of);
CREATE INDEX IF NOT EXISTS idx_metrics_symbol_as_of ON metrics(symbol, as_of);

-- ============================================
-- 4. Table: kpi_definitions (définitions de KPI)
-- ============================================
CREATE TABLE IF NOT EXISTS kpi_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    expression TEXT NOT NULL,
    description TEXT,
    tags TEXT[],
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kpi_definitions_code ON kpi_definitions(code);
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_category ON kpi_definitions(category);
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_active ON kpi_definitions(is_active);

-- ============================================
-- 5. Table: kpi_variables
-- ============================================
CREATE TABLE IF NOT EXISTS kpi_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    variable_name TEXT NOT NULL,
    metric_code TEXT NOT NULL,
    transform JSONB,
    weight NUMERIC DEFAULT 1.0,
    order_index INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(kpi_id, variable_name)
);

CREATE INDEX IF NOT EXISTS idx_kpi_variables_kpi_id ON kpi_variables(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_variables_metric_code ON kpi_variables(metric_code);

-- ============================================
-- 6. Table: kpi_values
-- ============================================
CREATE TABLE IF NOT EXISTS kpi_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    value NUMERIC,
    as_of DATE NOT NULL,
    inputs_snapshot JSONB,
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(kpi_id, symbol, as_of)
);

-- Ajouter la foreign key seulement si instruments existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instruments') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'kpi_values_symbol_fkey'
        ) THEN
            ALTER TABLE kpi_values 
            ADD CONSTRAINT kpi_values_symbol_fkey 
            FOREIGN KEY (symbol) REFERENCES instruments(symbol) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_kpi_values_kpi_symbol ON kpi_values(kpi_id, symbol);
CREATE INDEX IF NOT EXISTS idx_kpi_values_symbol_as_of ON kpi_values(symbol, as_of);
CREATE INDEX IF NOT EXISTS idx_kpi_values_as_of ON kpi_values(as_of);

-- ============================================
-- 7. Table: watchlists (ADAPTÉ pour tables existantes)
-- ============================================
DO $$
DECLARE
    watchlists_exists BOOLEAN;
    watchlists_id_type TEXT;
    watchlists_user_id_type TEXT;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'watchlists'
    ) INTO watchlists_exists;

    IF NOT watchlists_exists THEN
        CREATE TABLE watchlists (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            is_public BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX idx_watchlists_user_id ON watchlists(user_id);
        RAISE NOTICE '✅ Table watchlists créée avec UUID';
    ELSE
        SELECT data_type INTO watchlists_id_type
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'watchlists' 
          AND column_name = 'id';

        SELECT data_type INTO watchlists_user_id_type
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'watchlists' 
          AND column_name = 'user_id';

        RAISE NOTICE 'ℹ️ Table watchlists existe avec id de type % et user_id de type %', watchlists_id_type, watchlists_user_id_type;
    END IF;
END $$;

-- ============================================
-- 8. Table: watchlist_instruments (ADAPTÉ)
-- ============================================
DO $$
DECLARE
    watchlists_id_type TEXT;
    watchlist_instruments_exists BOOLEAN;
BEGIN
    SELECT data_type INTO watchlists_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'watchlists' 
      AND column_name = 'id';

    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'watchlist_instruments'
    ) INTO watchlist_instruments_exists;

    IF NOT watchlist_instruments_exists THEN
        IF watchlists_id_type = 'bigint' OR watchlists_id_type = 'integer' THEN
            -- BIGSERIAL/SERIAL inclut déjà DEFAULT, ne pas le spécifier deux fois
            EXECUTE format('
                CREATE TABLE watchlist_instruments (
                    id %s PRIMARY KEY,
                    watchlist_id %s NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
                    symbol TEXT NOT NULL,
                    position INTEGER DEFAULT 0,
                    added_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(watchlist_id, symbol)
                )',
                CASE WHEN watchlists_id_type = 'bigint' THEN 'BIGSERIAL' ELSE 'SERIAL' END,
                watchlists_id_type
            );
        ELSE
            CREATE TABLE watchlist_instruments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
                symbol TEXT NOT NULL,
                position INTEGER DEFAULT 0,
                added_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(watchlist_id, symbol)
            );
        END IF;

        -- Ajouter foreign key vers instruments si elle existe
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instruments') THEN
            ALTER TABLE watchlist_instruments 
            ADD CONSTRAINT watchlist_instruments_symbol_fkey 
            FOREIGN KEY (symbol) REFERENCES instruments(symbol) ON DELETE CASCADE;
        END IF;

        CREATE INDEX idx_watchlist_instruments_watchlist ON watchlist_instruments(watchlist_id);
        CREATE INDEX idx_watchlist_instruments_symbol ON watchlist_instruments(symbol);
        
        RAISE NOTICE '✅ Table watchlist_instruments créée avec type compatible';
    ELSE
        RAISE NOTICE 'ℹ️ Table watchlist_instruments existe déjà';
    END IF;
END $$;

-- ============================================
-- 9. Table: job_logs
-- ============================================
CREATE TABLE IF NOT EXISTS job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL,
    status TEXT NOT NULL,
    symbol TEXT,
    endpoint TEXT,
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    execution_time_ms INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_job_logs_job_type ON job_logs(job_type);
CREATE INDEX IF NOT EXISTS idx_job_logs_status ON job_logs(status);
CREATE INDEX IF NOT EXISTS idx_job_logs_started_at ON job_logs(started_at);

-- ============================================
-- 10. Table: market_indices
-- ============================================
CREATE TABLE IF NOT EXISTS market_indices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    country TEXT,
    currency TEXT DEFAULT 'USD',
    current_value NUMERIC,
    daily_change NUMERIC,
    daily_change_pct NUMERIC,
    ytd_change_pct NUMERIC,
    as_of DATE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol, as_of)
);

CREATE INDEX IF NOT EXISTS idx_market_indices_symbol_as_of ON market_indices(symbol, as_of);

-- ============================================
-- 11. Table: price_history
-- ============================================
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL,
    date DATE NOT NULL,
    open NUMERIC,
    high NUMERIC,
    low NUMERIC,
    close NUMERIC,
    volume BIGINT,
    adjusted_close NUMERIC,
    UNIQUE(symbol, date)
);

-- Ajouter foreign key seulement si instruments existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instruments') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'price_history_symbol_fkey'
        ) THEN
            ALTER TABLE price_history 
            ADD CONSTRAINT price_history_symbol_fkey 
            FOREIGN KEY (symbol) REFERENCES instruments(symbol) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_price_history_symbol_date ON price_history(symbol, date);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(date);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
DO $$
BEGIN
    ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE fmp_raw_cache ENABLE ROW LEVEL SECURITY;
    ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
    ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE kpi_variables ENABLE ROW LEVEL SECURITY;
    ALTER TABLE kpi_values ENABLE ROW LEVEL SECURITY;
    ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
    ALTER TABLE watchlist_instruments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE market_indices ENABLE ROW LEVEL SECURITY;
    ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erreur activation RLS: %', SQLERRM;
END $$;

-- Politiques RLS (avec DROP IF EXISTS pour éviter les erreurs)
DROP POLICY IF EXISTS "Instruments are viewable by everyone" ON instruments;
CREATE POLICY "Instruments are viewable by everyone" ON instruments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Instruments are insertable by authenticated users" ON instruments;
CREATE POLICY "Instruments are insertable by authenticated users" ON instruments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Metrics are viewable by everyone" ON metrics;
CREATE POLICY "Metrics are viewable by everyone" ON metrics
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Metrics are insertable by service role" ON metrics;
CREATE POLICY "Metrics are insertable by service role" ON metrics
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public KPIs are viewable by everyone" ON kpi_definitions;
CREATE POLICY "Public KPIs are viewable by everyone" ON kpi_definitions
    FOR SELECT USING (is_public = true OR created_by = auth.uid());

DROP POLICY IF EXISTS "KPIs are insertable by authenticated users" ON kpi_definitions;
CREATE POLICY "KPIs are insertable by authenticated users" ON kpi_definitions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "KPI values are viewable by everyone" ON kpi_values;
CREATE POLICY "KPI values are viewable by everyone" ON kpi_values
    FOR SELECT USING (true);

-- Politiques RLS pour watchlists (adapter selon le type de user_id et colonnes existantes)
DO $$
DECLARE
    user_id_type TEXT;
    has_is_public BOOLEAN;
    policy_condition TEXT;
BEGIN
    -- Détecter le type de user_id
    SELECT data_type INTO user_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'watchlists' 
      AND column_name = 'user_id';

    -- Vérifier si is_public existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'watchlists' 
          AND column_name = 'is_public'
    ) INTO has_is_public;

    -- Construire la condition selon le type de user_id
    IF user_id_type = 'text' OR user_id_type = 'character varying' THEN
        IF has_is_public THEN
            policy_condition := 'auth.uid()::text = user_id OR is_public = true';
        ELSE
            policy_condition := 'auth.uid()::text = user_id';
        END IF;
    ELSE
        IF has_is_public THEN
            policy_condition := 'auth.uid() = user_id OR is_public = true';
        ELSE
            policy_condition := 'auth.uid() = user_id';
        END IF;
    END IF;

    -- Créer les politiques avec la condition adaptée
    DROP POLICY IF EXISTS "Users can view their own watchlists" ON watchlists;
    EXECUTE format('CREATE POLICY "Users can view their own watchlists" ON watchlists FOR SELECT USING (%s)', policy_condition);

    IF user_id_type = 'text' OR user_id_type = 'character varying' THEN
        DROP POLICY IF EXISTS "Users can insert their own watchlists" ON watchlists;
        CREATE POLICY "Users can insert their own watchlists" ON watchlists
            FOR INSERT WITH CHECK (auth.uid()::text = user_id);

        DROP POLICY IF EXISTS "Users can update their own watchlists" ON watchlists;
        CREATE POLICY "Users can update their own watchlists" ON watchlists
            FOR UPDATE USING (auth.uid()::text = user_id);

        DROP POLICY IF EXISTS "Users can delete their own watchlists" ON watchlists;
        CREATE POLICY "Users can delete their own watchlists" ON watchlists
            FOR DELETE USING (auth.uid()::text = user_id);
    ELSE
        DROP POLICY IF EXISTS "Users can insert their own watchlists" ON watchlists;
        CREATE POLICY "Users can insert their own watchlists" ON watchlists
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can update their own watchlists" ON watchlists;
        CREATE POLICY "Users can update their own watchlists" ON watchlists
            FOR UPDATE USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can delete their own watchlists" ON watchlists;
        CREATE POLICY "Users can delete their own watchlists" ON watchlists
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Politiques RLS pour watchlist_instruments (adapter selon le type de user_id et colonnes existantes)
DO $$
DECLARE
    user_id_type TEXT;
    has_is_public BOOLEAN;
    view_condition TEXT;
BEGIN
    -- Détecter le type de user_id
    SELECT data_type INTO user_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'watchlists' 
      AND column_name = 'user_id';

    -- Vérifier si is_public existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'watchlists' 
          AND column_name = 'is_public'
    ) INTO has_is_public;

    -- Construire la condition pour la vue
    IF user_id_type = 'text' OR user_id_type = 'character varying' THEN
        IF has_is_public THEN
            view_condition := 'watchlists.user_id = auth.uid()::text OR watchlists.is_public = true';
        ELSE
            view_condition := 'watchlists.user_id = auth.uid()::text';
        END IF;
    ELSE
        IF has_is_public THEN
            view_condition := 'watchlists.user_id = auth.uid() OR watchlists.is_public = true';
        ELSE
            view_condition := 'watchlists.user_id = auth.uid()';
        END IF;
    END IF;

    -- Créer les politiques
    DROP POLICY IF EXISTS "Users can view instruments in their watchlists" ON watchlist_instruments;
    EXECUTE format('CREATE POLICY "Users can view instruments in their watchlists" ON watchlist_instruments FOR SELECT USING (EXISTS (SELECT 1 FROM watchlists WHERE watchlists.id = watchlist_instruments.watchlist_id AND (%s)))', view_condition);

    IF user_id_type = 'text' OR user_id_type = 'character varying' THEN
        DROP POLICY IF EXISTS "Users can manage instruments in their watchlists" ON watchlist_instruments;
        CREATE POLICY "Users can manage instruments in their watchlists" ON watchlist_instruments
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM watchlists
                    WHERE watchlists.id = watchlist_instruments.watchlist_id
                    AND watchlists.user_id = auth.uid()::text
                )
            );
    ELSE
        DROP POLICY IF EXISTS "Users can manage instruments in their watchlists" ON watchlist_instruments;
        CREATE POLICY "Users can manage instruments in their watchlists" ON watchlist_instruments
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM watchlists
                    WHERE watchlists.id = watchlist_instruments.watchlist_id
                    AND watchlists.user_id = auth.uid()
                )
            );
    END IF;
END $$;

DROP POLICY IF EXISTS "Market data is viewable by everyone" ON market_indices;
CREATE POLICY "Market data is viewable by everyone" ON market_indices
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Market data is viewable by everyone" ON price_history;
CREATE POLICY "Market data is viewable by everyone" ON price_history
    FOR SELECT USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_instruments_updated_at ON instruments;
CREATE TRIGGER update_instruments_updated_at
    BEFORE UPDATE ON instruments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kpi_definitions_updated_at ON kpi_definitions;
CREATE TRIGGER update_kpi_definitions_updated_at
    BEFORE UPDATE ON kpi_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_watchlists_updated_at ON watchlists;
CREATE TRIGGER update_watchlists_updated_at
    BEFORE UPDATE ON watchlists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VUES UTILES
-- ============================================
CREATE OR REPLACE VIEW instruments_with_latest_metrics AS
SELECT 
    i.*,
    m.metric_code,
    m.value as metric_value,
    m.as_of as metric_as_of
FROM instruments i
LEFT JOIN LATERAL (
    SELECT DISTINCT ON (metric_code) *
    FROM metrics
    WHERE symbol = i.symbol
    ORDER BY metric_code, as_of DESC
) m ON true;

-- Vue: watchlists avec instruments (adaptée aux colonnes existantes)
DO $$
DECLARE
    has_name BOOLEAN;
    has_description BOOLEAN;
    view_sql TEXT;
BEGIN
    -- Vérifier quelles colonnes existent
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'watchlists' 
          AND column_name = 'name'
    ) INTO has_name;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'watchlists' 
          AND column_name = 'description'
    ) INTO has_description;

    -- Construire la vue selon les colonnes disponibles
    view_sql := 'CREATE OR REPLACE VIEW watchlists_with_instruments AS SELECT w.id as watchlist_id, w.user_id';

    IF has_name THEN
        view_sql := view_sql || ', w.name as watchlist_name';
    ELSE
        view_sql := view_sql || ', CAST(NULL AS TEXT) as watchlist_name';
    END IF;

    IF has_description THEN
        view_sql := view_sql || ', w.description';
    ELSE
        view_sql := view_sql || ', CAST(NULL AS TEXT) as description';
    END IF;

    view_sql := view_sql || ', wi.symbol, wi.position, i.name as instrument_name, i.sector, i.industry FROM watchlists w JOIN watchlist_instruments wi ON w.id = wi.watchlist_id JOIN instruments i ON wi.symbol = i.symbol ORDER BY w.id, wi.position';

    EXECUTE view_sql;
END $$;

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================
DO $$
DECLARE
    table_count INTEGER;
    tickers_count INTEGER;
    instruments_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN (
        'instruments', 'fmp_raw_cache', 'metrics', 
        'kpi_definitions', 'kpi_variables', 'kpi_values',
        'watchlists', 'watchlist_instruments',
        'job_logs', 'market_indices', 'price_history'
      );

    SELECT COUNT(*) INTO tickers_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'tickers';

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instruments') THEN
        SELECT COUNT(*) INTO instruments_count FROM instruments;
    ELSE
        instruments_count := 0;
    END IF;

    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '📊 VÉRIFICATION TERMINAL EMMA IA';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '   Tables créées: %/11', table_count;
    RAISE NOTICE '   Table tickers existe: %', CASE WHEN tickers_count > 0 THEN 'Oui' ELSE 'Non' END;
    RAISE NOTICE '   Instruments dans table: %', instruments_count;
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

