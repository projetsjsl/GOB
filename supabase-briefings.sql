-- ============================================================================
-- Table: briefings
-- Stockage des briefings email générés
-- ============================================================================

CREATE TABLE IF NOT EXISTS briefings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('morning', 'noon', 'evening')),
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  market_data JSONB,
  analysis TEXT,
  recipients TEXT[], -- Liste des destinataires (optionnel)
  sent_at TIMESTAMPTZ, -- Timestamp d'envoi (optionnel)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_briefings_type ON briefings(type);
CREATE INDEX IF NOT EXISTS idx_briefings_created_at ON briefings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_briefings_sent_at ON briefings(sent_at DESC);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_briefings_updated_at 
    BEFORE UPDATE ON briefings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - optionnel selon vos besoins
-- ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;

-- Politique d'accès - à adapter selon votre configuration
-- CREATE POLICY "Allow all operations for authenticated users" ON briefings
--     FOR ALL USING (auth.role() = 'authenticated');

-- Commentaires pour documentation
COMMENT ON TABLE briefings IS 'Stockage des briefings email automatisés';
COMMENT ON COLUMN briefings.type IS 'Type de briefing: morning, noon, evening';
COMMENT ON COLUMN briefings.subject IS 'Sujet de l''email';
COMMENT ON COLUMN briefings.html_content IS 'Contenu HTML de l''email';
COMMENT ON COLUMN briefings.market_data IS 'Données marché utilisées (JSON)';
COMMENT ON COLUMN briefings.analysis IS 'Analyse générée par IA';
COMMENT ON COLUMN briefings.recipients IS 'Liste des destinataires (optionnel)';
COMMENT ON COLUMN briefings.sent_at IS 'Timestamp d''envoi (optionnel)';
