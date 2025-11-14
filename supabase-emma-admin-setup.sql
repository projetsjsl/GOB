-- Table pour stocker la configuration système d'Emma
-- Permet de modifier prompts, variables, directives sans redéployer

CREATE TABLE IF NOT EXISTS emma_system_config (
    id BIGSERIAL PRIMARY KEY,
    section VARCHAR(100) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(100) DEFAULT 'system',
    
    -- Contrainte unique sur section + key
    UNIQUE(section, key)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_emma_config_section ON emma_system_config(section);
CREATE INDEX IF NOT EXISTS idx_emma_config_key ON emma_system_config(key);
CREATE INDEX IF NOT EXISTS idx_emma_config_section_key ON emma_system_config(section, key);

-- RLS (Row Level Security) - Optionnel selon besoins
-- ALTER TABLE emma_system_config ENABLE ROW LEVEL SECURITY;

-- Policy pour lecture publique (si nécessaire)
-- CREATE POLICY "Public read access" ON emma_system_config FOR SELECT USING (true);

-- Policy pour écriture admin uniquement (si RLS activé)
-- CREATE POLICY "Admin write access" ON emma_system_config 
--   FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Commentaires
COMMENT ON TABLE emma_system_config IS 'Configuration système d''Emma IA - Prompts, variables, directives';
COMMENT ON COLUMN emma_system_config.section IS 'Section de configuration (prompts, variables, directives, routing)';
COMMENT ON COLUMN emma_system_config.key IS 'Clé de configuration unique dans la section';
COMMENT ON COLUMN emma_system_config.value IS 'Valeur de la configuration (JSON stringifié si type=json)';
COMMENT ON COLUMN emma_system_config.type IS 'Type de la valeur: string, number, boolean, json';
COMMENT ON COLUMN emma_system_config.description IS 'Description de la configuration';
COMMENT ON COLUMN emma_system_config.updated_by IS 'Utilisateur/admin ayant modifié la configuration';
