-- ============================================
-- TABLE: email_recipients
-- Gestion centralisée des destinataires email pour les briefings
-- ============================================
--
-- Une seule liste d'emails avec des colonnes de cases à cocher
-- pour indiquer si chaque email doit recevoir chaque type de briefing
--

CREATE TABLE IF NOT EXISTS email_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  label TEXT,
  morning BOOLEAN DEFAULT false,
  midday BOOLEAN DEFAULT false,
  evening BOOLEAN DEFAULT false,
  custom BOOLEAN DEFAULT false,
  is_preview BOOLEAN DEFAULT false, -- Email pour les previews (tests manuels)
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_email_recipients_email ON email_recipients(email);
CREATE INDEX IF NOT EXISTS idx_email_recipients_active ON email_recipients(active);
CREATE INDEX IF NOT EXISTS idx_email_recipients_preview ON email_recipients(is_preview);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_email_recipients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_email_recipients_updated_at ON email_recipients;
CREATE TRIGGER trigger_update_email_recipients_updated_at
BEFORE UPDATE ON email_recipients
FOR EACH ROW
EXECUTE FUNCTION update_email_recipients_updated_at();

-- Commentaires
COMMENT ON TABLE email_recipients IS 'Liste centralisée des destinataires email pour les briefings automatisés';
COMMENT ON COLUMN email_recipients.email IS 'Adresse email unique';
COMMENT ON COLUMN email_recipients.label IS 'Nom/label optionnel pour identifier l''email';
COMMENT ON COLUMN email_recipients.morning IS 'Recevoir les briefings du matin';
COMMENT ON COLUMN email_recipients.midday IS 'Recevoir les briefings de midi';
COMMENT ON COLUMN email_recipients.evening IS 'Recevoir les briefings du soir';
COMMENT ON COLUMN email_recipients.custom IS 'Recevoir les briefings personnalisés';
COMMENT ON COLUMN email_recipients.is_preview IS 'Email utilisé pour les previews (tests manuels)';
COMMENT ON COLUMN email_recipients.active IS 'Email actif (peut être désactivé sans suppression)';

-- Données initiales (email par défaut)
INSERT INTO email_recipients (email, label, morning, midday, evening, custom, is_preview, active)
VALUES ('projetsjsl@gmail.com', 'Email principal', true, true, true, true, true, true)
ON CONFLICT (email) DO NOTHING;

-- RLS (Row Level Security) - Optionnel, selon vos besoins
-- ALTER TABLE email_recipients ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Allow all operations for service role"
-- ON email_recipients
-- FOR ALL
-- USING (true)
-- WITH CHECK (true);

