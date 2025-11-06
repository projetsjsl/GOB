-- =====================================================
-- EMMA IA - CACHE INTELLIGENT (2 HEURES)
-- =====================================================
-- Objectif: Réduire coûts SMS et améliorer temps de réponse
-- Durée cache: 2 heures
-- Économie estimée: 10-15% coûts SMS
-- =====================================================

-- Table principale pour le cache des réponses
CREATE TABLE IF NOT EXISTS response_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  ticker text,
  analysis_type text,
  channel text, -- 'sms', 'web', 'email'
  response text NOT NULL,
  metadata jsonb,
  created_at timestamp DEFAULT now(),
  expires_at timestamp NOT NULL,
  hit_count integer DEFAULT 0
);

-- Index pour recherche rapide par clé
CREATE INDEX IF NOT EXISTS idx_cache_key ON response_cache(cache_key);

-- Index pour nettoyage des entrées expirées
CREATE INDEX IF NOT EXISTS idx_expires_at ON response_cache(expires_at);

-- Index pour recherche par ticker
CREATE INDEX IF NOT EXISTS idx_ticker ON response_cache(ticker);

-- Index pour recherche par canal
CREATE INDEX IF NOT EXISTS idx_channel ON response_cache(channel);

-- Fonction pour nettoyer automatiquement les entrées expirées
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM response_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour documentation
COMMENT ON TABLE response_cache IS 'Cache intelligent des réponses Emma IA (durée: 2h)';
COMMENT ON COLUMN response_cache.cache_key IS 'Clé unique générée: hash(ticker+type+channel)';
COMMENT ON COLUMN response_cache.ticker IS 'Ticker analysé (ex: AAPL, MSFT)';
COMMENT ON COLUMN response_cache.analysis_type IS 'Type d''analyse (ex: ticker_analysis, portfolio_advice)';
COMMENT ON COLUMN response_cache.channel IS 'Canal de communication (sms, web, email)';
COMMENT ON COLUMN response_cache.response IS 'Réponse complète d''Emma';
COMMENT ON COLUMN response_cache.metadata IS 'Métadonnées additionnelles (user_id, query, etc.)';
COMMENT ON COLUMN response_cache.expires_at IS 'Date d''expiration (created_at + 2h)';
COMMENT ON COLUMN response_cache.hit_count IS 'Nombre de fois que cette réponse a été servie du cache';

-- =====================================================
-- INSTRUCTIONS D'UTILISATION
-- =====================================================
-- 1. Exécuter ce script dans Supabase SQL Editor
-- 2. Vérifier la création: SELECT * FROM response_cache LIMIT 1;
-- 3. Le cache sera utilisé automatiquement par api/chat.js
-- 4. Pour nettoyer manuellement: SELECT clean_expired_cache();
-- =====================================================

