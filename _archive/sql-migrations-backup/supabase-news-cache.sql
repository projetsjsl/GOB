-- ========================================
-- SUPABASE NEWS CACHE - Tables pour le cache des nouvelles
-- ========================================

-- Table pour les nouvelles générales du marché
CREATE TABLE IF NOT EXISTS market_news_cache (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  source TEXT,
  published_at TIMESTAMPTZ,
  category TEXT,
  sentiment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les nouvelles spécifiques aux symboles
CREATE TABLE IF NOT EXISTS symbol_news_cache (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  source TEXT,
  published_at TIMESTAMPTZ,
  sentiment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_market_news_updated ON market_news_cache(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_news_published ON market_news_cache(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_news_source ON market_news_cache(source);

CREATE INDEX IF NOT EXISTS idx_symbol_news_symbol ON symbol_news_cache(symbol);
CREATE INDEX IF NOT EXISTS idx_symbol_news_updated ON symbol_news_cache(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_symbol_news_published ON symbol_news_cache(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_symbol_news_source ON symbol_news_cache(source);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_market_news_updated_at 
    BEFORE UPDATE ON market_news_cache 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_symbol_news_updated_at 
    BEFORE UPDATE ON symbol_news_cache 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Optionnel
-- ALTER TABLE market_news_cache ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE symbol_news_cache ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'accès public (pour ce projet)
-- CREATE POLICY "Allow public access" ON market_news_cache
--     FOR ALL USING (true);
-- CREATE POLICY "Allow public access" ON symbol_news_cache
--     FOR ALL USING (true);

-- Vérifier la création
SELECT 'Tables créées avec succès' as status;
SELECT COUNT(*) as market_news_count FROM market_news_cache;
SELECT COUNT(*) as symbol_news_count FROM symbol_news_cache;
