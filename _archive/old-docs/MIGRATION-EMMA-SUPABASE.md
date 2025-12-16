# 🚀 Migration Emma vers Supabase - Plan Complet

**Objectif** : Centraliser TOUTES les configurations Emma dans Supabase avec interface admin, tout en gardant compatibilité n8n

---

## 📊 ÉTAT ACTUEL DE L'ARCHITECTURE

### Fichiers de Configuration Identifiés

| Fichier | Taille | Utilisation | Priorité Migration |
|---------|--------|-------------|-------------------|
| `config/emma-cfa-prompt.js` | 16K | Prompt CFA principal | 🔴 **CRITIQUE** |
| `config/intent-prompts.js` | 32K | Détection d'intention | 🔴 **CRITIQUE** |
| `config/briefing-prompts.json` | 7K | Briefings (matin/midi/soir) | 🔴 **CRITIQUE** |
| `config/tools_config.json` | 19K | Configuration outils API | 🟡 **Important** |
| `lib/dynamic-cfa-prompt.js` | 14K | Système prompts dynamiques | 🟡 **Important** |
| `lib/dynamic-prompts.js` | 18K | Autre système dynamique | 🟡 **Important** |
| `lib/emma-orchestrator.js` | 40K | Orchestrateur principal | 🟢 **Code (pas config)** |
| `public/emma-config.js` | ? | Config frontend | 🟢 **Secondaire** |

**Total configurations** : ~106K de configs à migrer

### Points d'Intégration Actuels

```
┌─────────────────────────────────────────────────────────────┐
│                     ARCHITECTURE ACTUELLE                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📱 CANAUX                                                   │
│   ├─ SMS (Twilio) ────────┐                                 │
│   ├─ Email (Resend) ──────┤                                 │
│   ├─ Messenger ───────────┼──→ api/adapters/*.js            │
│   └─ Web Chat ────────────┘                                 │
│                             │                                │
│  🔄 N8N WORKFLOWS           │                                │
│   └─ https://projetsjsl.app.n8n.cloud                       │
│        ├─ Webhook SMS                                        │
│        ├─ Webhook Email                                      │
│        └─ Webhook Briefings                                  │
│                             │                                │
│                             ↓                                │
│  🤖 EMMA AGENT (api/emma-agent.js)                          │
│   ├─ Charge: config/emma-cfa-prompt.js ← FICHIERS           │
│   ├─ Charge: config/intent-prompts.js  ← FICHIERS           │
│   ├─ Charge: config/tools_config.json  ← FICHIERS           │
│   └─ Charge: config/briefing-prompts.json ← FICHIERS        │
│                             │                                │
│                             ↓                                │
│  🔧 APIs FINANCIÈRES                                         │
│   ├─ FMP (Financial Modeling Prep)                          │
│   ├─ Polygon.io                                             │
│   ├─ Twelve Data                                            │
│   └─ Perplexity AI                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 ARCHITECTURE CIBLE (Après Migration)

```
┌─────────────────────────────────────────────────────────────┐
│                  ARCHITECTURE SUPABASE CENTRALISÉE           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🎨 INTERFACE ADMIN (admin-jslai.html)                      │
│   ├─ 📝 Prompts CFA                                         │
│   ├─ 🎯 Prompts Intentions                                  │
│   ├─ 📧 Prompts Briefings (matin/midi/soir)                 │
│   ├─ 🔧 Configuration Outils API                            │
│   ├─ ⚙️ Variables Système                                   │
│   └─ 🧭 Routage Intelligent                                 │
│        │                                                     │
│        ↓                                                     │
│  💾 SUPABASE (Source Unique de Vérité)                      │
│   Table: emma_system_config                                 │
│   ├─ Section: prompts                                       │
│   │   ├─ cfa_identity                                       │
│   │   ├─ cfa_standards                                      │
│   │   ├─ cfa_output_format                                  │
│   │   ├─ intent_analysis                                    │
│   │   ├─ briefing_morning                                   │
│   │   ├─ briefing_midday                                    │
│   │   └─ briefing_evening                                   │
│   ├─ Section: variables                                     │
│   ├─ Section: directives                                    │
│   ├─ Section: routing                                       │
│   └─ Section: tools                                         │
│        │                                                     │
│        ↓                                                     │
│  📡 API ADMIN (/api/admin/emma-config.js)                   │
│   ├─ GET /api/admin/emma-config?section=prompts            │
│   ├─ POST /api/admin/emma-config (save)                    │
│   └─ DELETE /api/admin/emma-config (delete)                │
│        │                                                     │
│        ↓                                                     │
│  🤖 EMMA AGENT (api/emma-agent.js) - MODIFIÉ               │
│   ├─ 1️⃣ TRY: Charger depuis Supabase                      │
│   ├─ 2️⃣ FALLBACK: Charger depuis fichiers config/         │
│   ├─ 3️⃣ CACHE: Mettre en cache (5 min)                    │
│   └─ ✅ Toujours fonctionnel (même si Supabase down)       │
│        │                                                     │
│        ↓                                                     │
│  🔄 N8N WORKFLOWS (INCHANGÉS)                               │
│   └─ Continue de fonctionner normalement                    │
│                                                              │
│  📱 CANAUX (INCHANGÉS)                                      │
│   └─ SMS, Email, Messenger, Web continuent normalement      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ SCHÉMA SUPABASE COMPLET

### Table `emma_system_config` (ÉTENDUE)

```sql
CREATE TABLE IF NOT EXISTS emma_system_config (
    id BIGSERIAL PRIMARY KEY,
    section VARCHAR(100) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    category VARCHAR(50),  -- 'prompt', 'variable', 'directive', 'tool', etc.
    priority INTEGER DEFAULT 0,  -- Pour ordonnancement
    enabled BOOLEAN DEFAULT TRUE,  -- Activation/désactivation
    metadata JSONB,  -- Métadonnées flexibles
    version INTEGER DEFAULT 1,  -- Versioning
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(100) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(section, key)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_emma_config_section ON emma_system_config(section);
CREATE INDEX IF NOT EXISTS idx_emma_config_category ON emma_system_config(category);
CREATE INDEX IF NOT EXISTS idx_emma_config_enabled ON emma_system_config(enabled);

-- Fonction de mise à jour automatique
CREATE OR REPLACE FUNCTION update_emma_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER emma_config_update_timestamp
    BEFORE UPDATE ON emma_system_config
    FOR EACH ROW
    EXECUTE FUNCTION update_emma_config_timestamp();
```

### Structure des Données (Sections)

#### 1. Section `prompts`

| Key | Type | Description | Taille |
|-----|------|-------------|--------|
| `cfa_identity` | string | Identité Emma CFA | 800 chars |
| `cfa_standards` | string | Standards d'excellence CFA | 2000 chars |
| `cfa_output_format` | string | Format Bloomberg Terminal | 3000 chars |
| `cfa_product_guidance` | string | Guidance par type produit | 1500 chars |
| `cfa_perplexity_priority` | string | Priorité Perplexity | 600 chars |
| `cfa_sms_format` | string | Format SMS optimisé | 800 chars |
| `cfa_quality_checklist` | string | Checklist qualité | 600 chars |
| `intent_comprehensive_analysis` | string | Intent analyse complète | 1000 chars |
| `intent_stock_price` | string | Intent prix action | 500 chars |
| `intent_fundamentals` | string | Intent fondamentaux | 700 chars |
| `intent_news` | string | Intent actualités | 500 chars |
| `briefing_morning` | json | Config briefing matin | JSON |
| `briefing_midday` | json | Config briefing midi | JSON |
| `briefing_evening` | json | Config briefing soir | JSON |

#### 2. Section `tools`

| Key | Type | Description |
|-----|------|-------------|
| `fmp_quote` | json | Config FMP Quote |
| `fmp_fundamentals` | json | Config FMP Fundamentals |
| `polygon_price` | json | Config Polygon Price |
| `perplexity_search` | json | Config Perplexity Search |
| ... | json | Tous les outils |

#### 3. Section `variables`

| Key | Type | Description |
|-----|------|-------------|
| `max_tokens_default` | number | Max tokens par défaut |
| `max_tokens_briefing` | number | Max tokens briefing |
| `temperature` | number | Température génération |
| `recency_default` | string | Récence par défaut |
| `cache_duration_minutes` | number | Durée cache config |

#### 4. Section `directives`

| Key | Type | Description |
|-----|------|-------------|
| `allow_clarifications` | boolean | Autoriser clarifications |
| `adaptive_length` | boolean | Longueur adaptative |
| `require_sources` | boolean | Exiger citations |
| `min_ratios_simple` | number | Ratios min (simple) |
| `min_ratios_comprehensive` | number | Ratios min (complet) |

#### 5. Section `routing`

| Key | Type | Description |
|-----|------|-------------|
| `use_perplexity_only_keywords` | json | Keywords Perplexity seul |
| `require_apis_keywords` | json | Keywords APIs requises |
| `intent_confidence_threshold` | number | Seuil confiance intent |

---

## 🔧 MODIFICATIONS CODE REQUISES

### 1. Modifier `api/emma-agent.js`

**Ajouter système de chargement dynamique** :

```javascript
class SmartAgent {
    constructor() {
        this.configCache = null;
        this.configCacheTimestamp = null;
        this.CONFIG_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

        // ... reste du code
    }

    /**
     * Charge la configuration depuis Supabase avec fallback vers fichiers
     */
    async _loadConfig() {
        // 1. Vérifier le cache
        if (this.configCache &&
            this.configCacheTimestamp &&
            (Date.now() - this.configCacheTimestamp < this.CONFIG_CACHE_DURATION)) {
            console.log('📦 Using cached config');
            return this.configCache;
        }

        try {
            // 2. Essayer Supabase
            console.log('💾 Loading config from Supabase...');
            const config = await this._loadFromSupabase();

            // Mettre en cache
            this.configCache = config;
            this.configCacheTimestamp = Date.now();

            console.log('✅ Config loaded from Supabase');
            return config;

        } catch (error) {
            console.warn('⚠️ Supabase config failed, falling back to files:', error.message);

            // 3. Fallback vers fichiers
            const config = await this._loadFromFiles();

            // Mettre en cache aussi
            this.configCache = config;
            this.configCacheTimestamp = Date.now();

            console.log('✅ Config loaded from files (fallback)');
            return config;
        }
    }

    async _loadFromSupabase() {
        const response = await fetch('/api/admin/emma-config');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return this._transformSupabaseConfig(data.config);
    }

    async _loadFromFiles() {
        // Charge depuis fichiers actuels (inchangé)
        return {
            prompts: CFA_SYSTEM_PROMPT,
            tools: this.toolsConfig,
            intents: await import('../config/intent-prompts.js'),
            briefings: JSON.parse(fs.readFileSync('./config/briefing-prompts.json', 'utf8'))
        };
    }

    _transformSupabaseConfig(supabaseConfig) {
        // Transforme le format Supabase vers format attendu par Emma
        return {
            prompts: {
                identity: supabaseConfig.prompts?.cfa_identity?.value || '',
                standards: supabaseConfig.prompts?.cfa_standards?.value || '',
                // ... etc
            },
            variables: {
                maxTokens: supabaseConfig.variables?.max_tokens_default?.value || 4000,
                // ... etc
            },
            // ... etc
        };
    }
}
```

### 2. Créer `lib/emma-config-loader.js`

```javascript
/**
 * Loader centralisé pour toutes les configs Emma
 * Gère Supabase + fallback fichiers + cache
 */
export class EmmaConfigLoader {
    constructor() {
        this.cache = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 min
    }

    async load(section) {
        // Try cache
        // Try Supabase
        // Fallback to files
        // Return config
    }
}
```

### 3. Modifier `api/emma-briefing.js`

Utiliser le même système de chargement pour les prompts briefing.

### 4. Modifier `api/emma-n8n.js`

S'assurer que n8n continue de fonctionner avec le nouveau système.

---

## 🎨 INTERFACE ADMIN COMPLÈTE

### Nouvelle Structure de l'Interface

```
admin-jslai.html
├─ 📝 Onglet: Prompts CFA
│  ├─ Identité CFA (textarea)
│  ├─ Standards Excellence (textarea)
│  ├─ Format Output (textarea)
│  ├─ Product Guidance (textarea)
│  ├─ Perplexity Priority (textarea)
│  ├─ SMS Format (textarea)
│  └─ Quality Checklist (textarea)
│
├─ 🎯 Onglet: Prompts Intentions
│  ├─ Comprehensive Analysis (textarea)
│  ├─ Stock Price (textarea)
│  ├─ Fundamentals (textarea)
│  ├─ News (textarea)
│  ├─ Comparative Analysis (textarea)
│  └─ ... (tous les intents)
│
├─ 📧 Onglet: Briefings
│  ├─ Morning (JSON editor)
│  ├─ Midday (JSON editor)
│  └─ Evening (JSON editor)
│
├─ 🔧 Onglet: Outils API
│  ├─ FMP Quote (JSON editor)
│  ├─ Polygon Price (JSON editor)
│  ├─ Perplexity Search (JSON editor)
│  └─ ... (tous les outils)
│
├─ ⚙️ Onglet: Variables
│  ├─ Max Tokens (number)
│  ├─ Temperature (number)
│  ├─ Cache Duration (number)
│  └─ ... (toutes variables)
│
├─ 🎯 Onglet: Directives
│  ├─ Allow Clarifications (toggle)
│  ├─ Adaptive Length (toggle)
│  └─ ... (toutes directives)
│
└─ 🧭 Onglet: Routage
   ├─ Perplexity Keywords (JSON array)
   ├─ APIs Required Keywords (JSON array)
   └─ Confidence Threshold (number)
```

---

## 📝 SCRIPT DE MIGRATION DONNÉES

### `migrate-emma-to-supabase.js`

```javascript
/**
 * Script de migration : Fichiers → Supabase
 * Lance une fois pour initialiser Supabase avec configs actuelles
 */

import { CFA_SYSTEM_PROMPT } from './config/emma-cfa-prompt.js';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
    console.log('🚀 Migration Emma configs → Supabase\n');

    // 1. Migrer prompts CFA
    await migrateSection('prompts', {
        cfa_identity: {
            value: CFA_SYSTEM_PROMPT.identity,
            type: 'string',
            description: 'Identité et qualifications Emma CFA'
        },
        cfa_standards: {
            value: CFA_SYSTEM_PROMPT.standards,
            type: 'string',
            description: 'Standards d\'excellence CFA'
        },
        // ... etc
    });

    // 2. Migrer briefing prompts
    const briefingPrompts = JSON.parse(
        fs.readFileSync('./config/briefing-prompts.json', 'utf8')
    );

    await migrateSection('prompts', {
        briefing_morning: {
            value: JSON.stringify(briefingPrompts.morning),
            type: 'json',
            description: 'Configuration briefing matinal'
        },
        // ... etc
    });

    // 3. Migrer tools config
    // 4. Migrer intent prompts
    // 5. Migrer variables
    // 6. Migrer directives

    console.log('\n✅ Migration complète !');
}

async function migrateSection(section, configs) {
    for (const [key, config] of Object.entries(configs)) {
        const { error } = await supabase
            .from('emma_system_config')
            .upsert({
                section,
                key,
                value: config.value,
                type: config.type,
                description: config.description
            });

        if (error) {
            console.error(`❌ Erreur ${section}.${key}:`, error);
        } else {
            console.log(`✅ Migré ${section}.${key}`);
        }
    }
}

migrate().catch(console.error);
```

---

## ✅ PLAN D'EXÉCUTION

### Phase 1 : Préparation (30 min)
- [ ] Créer nouvelle table Supabase étendue
- [ ] Créer script de migration `migrate-emma-to-supabase.js`
- [ ] Tester script sur données de test

### Phase 2 : Migration Données (15 min)
- [ ] Exécuter migration : Fichiers → Supabase
- [ ] Vérifier données dans Supabase Table Editor
- [ ] Backup fichiers originaux

### Phase 3 : Modifier Code (1h)
- [ ] Créer `lib/emma-config-loader.js`
- [ ] Modifier `api/emma-agent.js` pour utiliser loader
- [ ] Modifier `api/emma-briefing.js`
- [ ] Modifier `api/emma-n8n.js` (si nécessaire)
- [ ] Ajouter tests

### Phase 4 : Interface Admin (1h)
- [ ] Étendre `admin-jslai.html` avec nouveaux onglets
- [ ] Ajouter éditeurs pour prompts CFA
- [ ] Ajouter éditeurs pour prompts intentions
- [ ] Ajouter éditeur JSON pour briefings
- [ ] Ajouter éditeur JSON pour tools
- [ ] Tester sauvegarde/chargement

### Phase 5 : Tests (30 min)
- [ ] Tester chargement depuis Supabase
- [ ] Tester fallback vers fichiers (simuler Supabase down)
- [ ] Tester cache (5 min)
- [ ] Tester n8n workflows (SMS, Email)
- [ ] Tester modification via admin

### Phase 6 : Documentation (15 min)
- [ ] Documenter nouvelle architecture
- [ ] Guide d'utilisation admin
- [ ] Guide de dépannage

---

## 🔒 AVANTAGES DE CETTE ARCHITECTURE

✅ **Centralisation** : Une seule source de vérité (Supabase)
✅ **Interface admin** : Modifier sans toucher au code
✅ **Résilience** : Fallback automatique vers fichiers
✅ **Performance** : Cache 5 minutes
✅ **Versioning** : Historique des changements dans Supabase
✅ **N8N compatible** : Aucun changement requis pour n8n
✅ **Migration douce** : Fichiers restent comme backup

---

## 🆘 ROLLBACK PLAN

Si problème après migration :

1. **Désactiver Supabase** : Forcer fallback fichiers
2. **Restaurer fichiers** : Depuis backup
3. **Revenir code** : Git revert
4. **N8N** : Continue de fonctionner (inchangé)

---

## 📊 MÉTRIQUES DE SUCCÈS

- ✅ Toutes les configs visibles dans admin
- ✅ Modification config = effet immédiat (après cache 5 min)
- ✅ N8N continue de fonctionner
- ✅ Emma répond correctement SMS/Email/Web
- ✅ Performance inchangée ou améliorée

---

**Temps total estimé** : ~3 heures
**Difficulté** : ⭐⭐⭐ Moyenne-Élevée
**Impact** : 🚀 MAJEUR - Gestion Emma simplifiée

---

**Prêt à commencer la migration ?**
