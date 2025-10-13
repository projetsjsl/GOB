-- ============================================
-- SCRIPT DE CRÉATION DES TABLES HISTORIQUES
-- Projet: gob-watchlist
-- ============================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des cotations en temps réel
CREATE TABLE IF NOT EXISTS stock_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    data JSONB NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des profils d'entreprises
CREATE TABLE IF NOT EXISTS stock_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    data JSONB NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des ratios financiers
CREATE TABLE IF NOT EXISTS financial_ratios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    data JSONB NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des actualités
CREATE TABLE IF NOT EXISTS news_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    data JSONB NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des prix historiques
CREATE TABLE IF NOT EXISTS daily_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    data JSONB NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des recommandations d'analystes
CREATE TABLE IF NOT EXISTS analyst_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    data JSONB NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table du calendrier des résultats
CREATE TABLE IF NOT EXISTS earnings_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    data JSONB NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- ============================================

-- Index sur les symboles
CREATE INDEX IF NOT EXISTS idx_stock_quotes_symbol ON stock_quotes(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_profiles_symbol ON stock_profiles(symbol);
CREATE INDEX IF NOT EXISTS idx_financial_ratios_symbol ON financial_ratios(symbol);
CREATE INDEX IF NOT EXISTS idx_news_articles_symbol ON news_articles(symbol);
CREATE INDEX IF NOT EXISTS idx_daily_prices_symbol ON daily_prices(symbol);
CREATE INDEX IF NOT EXISTS idx_analyst_recommendations_symbol ON analyst_recommendations(symbol);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_symbol ON earnings_calendar(symbol);

-- Index sur les dates de mise à jour
CREATE INDEX IF NOT EXISTS idx_stock_quotes_updated ON stock_quotes(last_updated);
CREATE INDEX IF NOT EXISTS idx_stock_profiles_updated ON stock_profiles(last_updated);
CREATE INDEX IF NOT EXISTS idx_financial_ratios_updated ON financial_ratios(last_updated);
CREATE INDEX IF NOT EXISTS idx_news_articles_updated ON news_articles(last_updated);
CREATE INDEX IF NOT EXISTS idx_daily_prices_updated ON daily_prices(last_updated);
CREATE INDEX IF NOT EXISTS idx_analyst_recommendations_updated ON analyst_recommendations(last_updated);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_updated ON earnings_calendar(last_updated);

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour nettoyer les anciennes données (plus de 7 jours)
CREATE OR REPLACE FUNCTION clean_old_data()
RETURNS void AS $$
BEGIN
    DELETE FROM stock_quotes WHERE last_updated < NOW() - INTERVAL '7 days';
    DELETE FROM stock_profiles WHERE last_updated < NOW() - INTERVAL '7 days';
    DELETE FROM financial_ratios WHERE last_updated < NOW() - INTERVAL '7 days';
    DELETE FROM news_articles WHERE last_updated < NOW() - INTERVAL '7 days';
    DELETE FROM daily_prices WHERE last_updated < NOW() - INTERVAL '7 days';
    DELETE FROM analyst_recommendations WHERE last_updated < NOW() - INTERVAL '7 days';
    DELETE FROM earnings_calendar WHERE last_updated < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS POUR MAINTENIR LA COHÉRENCE
-- ============================================

-- Trigger pour mettre à jour automatiquement last_updated
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger à toutes les tables
CREATE TRIGGER trigger_stock_quotes_updated
    BEFORE UPDATE ON stock_quotes
    FOR EACH ROW EXECUTE FUNCTION update_last_updated();

CREATE TRIGGER trigger_stock_profiles_updated
    BEFORE UPDATE ON stock_profiles
    FOR EACH ROW EXECUTE FUNCTION update_last_updated();

CREATE TRIGGER trigger_financial_ratios_updated
    BEFORE UPDATE ON financial_ratios
    FOR EACH ROW EXECUTE FUNCTION update_last_updated();

CREATE TRIGGER trigger_news_articles_updated
    BEFORE UPDATE ON news_articles
    FOR EACH ROW EXECUTE FUNCTION update_last_updated();

CREATE TRIGGER trigger_daily_prices_updated
    BEFORE UPDATE ON daily_prices
    FOR EACH ROW EXECUTE FUNCTION update_last_updated();

CREATE TRIGGER trigger_analyst_recommendations_updated
    BEFORE UPDATE ON analyst_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_last_updated();

CREATE TRIGGER trigger_earnings_calendar_updated
    BEFORE UPDATE ON earnings_calendar
    FOR EACH ROW EXECUTE FUNCTION update_last_updated();

-- ============================================
-- POLITIQUES RLS (Row Level Security)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE stock_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ratios ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyst_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings_calendar ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous (données publiques)
CREATE POLICY "Allow public read access" ON stock_quotes FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON stock_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON financial_ratios FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON news_articles FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON daily_prices FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON analyst_recommendations FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON earnings_calendar FOR SELECT USING (true);

-- Politique pour permettre l'insertion/mise à jour (pour l'API)
CREATE POLICY "Allow API upsert" ON stock_quotes FOR ALL USING (true);
CREATE POLICY "Allow API upsert" ON stock_profiles FOR ALL USING (true);
CREATE POLICY "Allow API upsert" ON financial_ratios FOR ALL USING (true);
CREATE POLICY "Allow API upsert" ON news_articles FOR ALL USING (true);
CREATE POLICY "Allow API upsert" ON daily_prices FOR ALL USING (true);
CREATE POLICY "Allow API upsert" ON analyst_recommendations FOR ALL USING (true);
CREATE POLICY "Allow API upsert" ON earnings_calendar FOR ALL USING (true);

-- ============================================
-- COMMENTAIRES POUR LA DOCUMENTATION
-- ============================================

COMMENT ON TABLE stock_quotes IS 'Cotations en temps réel des actions';
COMMENT ON TABLE stock_profiles IS 'Profils et informations des entreprises';
COMMENT ON TABLE financial_ratios IS 'Ratios financiers et métriques';
COMMENT ON TABLE news_articles IS 'Actualités et sentiment des titres';
COMMENT ON TABLE daily_prices IS 'Prix historiques quotidiens';
COMMENT ON TABLE analyst_recommendations IS 'Recommandations des analystes';
COMMENT ON TABLE earnings_calendar IS 'Calendrier des résultats trimestriels';

-- ============================================
-- DONNÉES DE TEST (OPTIONNEL)
-- ============================================

-- Insérer quelques données de test pour vérifier le fonctionnement
-- INSERT INTO stock_quotes (symbol, data) VALUES 
-- ('AAPL', '{"price": 150.00, "change": 2.50, "changePercent": 1.69}'),
-- ('MSFT', '{"price": 300.00, "change": -1.20, "changePercent": -0.40}');

-- ============================================
-- MESSAGE DE CONFIRMATION
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Tables historiques créées avec succès !';
    RAISE NOTICE '📊 7 tables créées avec index et triggers';
    RAISE NOTICE '🔒 RLS activé avec politiques publiques';
    RAISE NOTICE '🧹 Fonction de nettoyage configurée';
END $$;
