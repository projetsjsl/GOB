# 🚀 Setup Simple - Interface Admin Emma

**Temps estimé : 5 minutes**

## Étape 1 : Configuration Supabase (3 min)

### Créer la table `emma_system_config`

1. Aller sur [Supabase Dashboard - SQL Editor](https://app.supabase.com/project/_/sql)

2. Coller ce SQL et cliquer **"Run"** :

```sql
-- Table pour stocker la configuration système d'Emma
CREATE TABLE IF NOT EXISTS emma_system_config (
    id BIGSERIAL PRIMARY KEY,
    section VARCHAR(100) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(100) DEFAULT 'system',

    UNIQUE(section, key)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_emma_config_section ON emma_system_config(section);
CREATE INDEX IF NOT EXISTS idx_emma_config_key ON emma_system_config(key);
CREATE INDEX IF NOT EXISTS idx_emma_config_section_key ON emma_system_config(section, key);

-- Commentaires
COMMENT ON TABLE emma_system_config IS 'Configuration système d''Emma IA - Prompts, variables, directives';
COMMENT ON COLUMN emma_system_config.section IS 'Section de configuration (prompts, variables, directives, routing)';
COMMENT ON COLUMN emma_system_config.key IS 'Clé de configuration unique dans la section';
COMMENT ON COLUMN emma_system_config.value IS 'Valeur de la configuration (JSON stringifié si type=json)';
COMMENT ON COLUMN emma_system_config.type IS 'Type de la valeur: string, number, boolean, json';
```

✅ **Vérification** : Aller dans "Table Editor" → Vous devriez voir `emma_system_config`

---

## Étape 2 : Test de l'Interface (2 min)

### Accéder à l'interface

Ouvrir dans votre navigateur :
```
https://gobapps.com/admin-jslai.html
```

### Vérifier le chargement

Vous devriez voir :
- ✅ 4 onglets : Prompts Système, Variables, Directives, Routage
- ✅ Configuration chargée automatiquement
- ✅ Possibilité de modifier et sauvegarder

---

## Étape 3 : Premier Test (1 min)

1. Aller dans l'onglet **"⚙️ Variables"**
2. Modifier **"Température"** : `0.1` → `0.2`
3. Cliquer **"💾 Sauvegarder"**
4. Cliquer **"🔄 Recharger"** dans le header
5. Vérifier que la température est bien `0.2`

✅ **Si ça fonctionne = Configuration réussie !** 🎉

---

## 📋 Checklist Complète

- [ ] Table Supabase `emma_system_config` créée
- [ ] Interface accessible à https://gobapps.com/admin-jslai.html
- [ ] Configuration se charge correctement
- [ ] Test de modification/sauvegarde réussi

---

## 🆘 Dépannage

### Interface ne charge pas
→ Vérifier le déploiement : `vercel logs --follow`

### Configuration ne se sauvegarde pas
→ Vérifier que la table Supabase existe bien

---

## 🎯 Fonctionnalités Disponibles

Une fois configuré, vous pouvez **SANS REDÉPLOYER** :

✅ **Modifier les prompts système** (identité CFA, instructions)
✅ **Ajuster les paramètres** (tokens, température, récence)
✅ **Configurer les directives** (clarifications, longueur adaptative)
✅ **Gérer le routage** (keywords Perplexity vs APIs)

---

## ⚠️ Sécurité

**IMPORTANT** : Cette interface est accessible SANS authentification.

Pour activer la sécurité :
1. Ouvrir `/api/admin/emma-config.js`
2. Décommenter les lignes 31-35 (vérification token)
3. Définir `ADMIN_API_KEY` dans Vercel

---

**Temps total : ~5 minutes**
**Difficulté : ⭐ Très facile**
