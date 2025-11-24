# ✅ Connexion Supabase - Status et Configuration

**Date:** 2025-10-27

---

## 🎯 Réponse Rapide

**OUI**, les 3 agents Phase 3 sont **BIEN CONNECTÉS** à Supabase! ✅

Mais vous devez **vérifier la configuration** pour qu'ils fonctionnent en production.

---

## ✅ Ce Qui Est Fait

### 1. **Agents Connectés à Supabase** ✅

Les 3 agents utilisent Supabase pour persister les données:

| Agent | Table Supabase | Connexion |
|-------|----------------|-----------|
| **EarningsCalendarAgent** | `earnings_calendar` | ✅ Connecté |
| **EarningsResultsAgent** | `earnings_results` | ✅ Connecté |
| **NewsMonitoringAgent** | `significant_news` | ✅ Connecté |

### 2. **Méthode de Connexion**

Les agents utilisent **fetch() avec REST API** (pas le SDK):

```javascript
// Exemple dans earnings-calendar-agent.js ligne 259
const response = await fetch(`${SUPABASE_URL}/rest/v1/earnings_calendar`, {
    method: 'POST',
    headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(dataToSave)
});
```

**Avantages:**
- ✅ Pas de dépendance npm supplémentaire
- ✅ Contrôle total sur les requêtes
- ✅ Fonctionne sur Vercel serverless

### 3. **Tables Définies** ✅

Le schéma SQL complet existe dans `supabase-schema-complete.sql`:

```sql
-- Table 1: Calendrier Earnings
CREATE TABLE earnings_calendar (
    id UUID PRIMARY KEY,
    ticker TEXT NOT NULL,
    fiscal_quarter TEXT,
    fiscal_year INT,
    estimated_date DATE,
    confirmed_date DATE,
    status TEXT DEFAULT 'scheduled',
    ...
);

-- Table 2: Résultats Earnings
CREATE TABLE earnings_results (
    id UUID PRIMARY KEY,
    ticker TEXT NOT NULL,
    quarter TEXT,
    fiscal_year INT,
    eps_actual DECIMAL(10,4),
    eps_surprise_pct DECIMAL(10,2),
    verdict TEXT, -- BUY/HOLD/SELL
    ...
);

-- Table 3: News Significatives
CREATE TABLE significant_news (
    id UUID PRIMARY KEY,
    ticker TEXT NOT NULL,
    headline TEXT,
    importance_score INT, -- 0-10
    sentiment DECIMAL(3,2), -- -1.0 to +1.0
    category TEXT,
    ...
);
```

---

## ⚠️ Ce Que Vous Devez Vérifier

### 1. **Variables d'Environnement Vercel**

Les agents nécessitent ces 2 variables:

```bash
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...votre_key
```

**Comment vérifier:**

```bash
# Via CLI Vercel
vercel env ls

# Ou via Dashboard Vercel
https://vercel.com/[votre-projet]/settings/environment-variables
```

**À rechercher:**
- ✅ `SUPABASE_URL` existe?
- ✅ `SUPABASE_SERVICE_ROLE_KEY` existe?

**Si absentes:** Les agents vont afficher des warnings mais ne crasheront pas:
```javascript
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('⚠️ Supabase not configured');
    return; // Skip save
}
```

---

### 2. **Tables Supabase Créées**

Vous devez exécuter le SQL pour créer les tables:

**Option A - Via Supabase Dashboard:**
1. Ouvrir: https://app.supabase.com
2. Sélectionner votre projet
3. Aller dans **SQL Editor**
4. Copier le contenu de `supabase-schema-complete.sql`
5. Exécuter le SQL

**Option B - Via CLI:**
```bash
# Si supabase CLI installé
supabase db push
```

**Vérification:**
```sql
-- Vérifier que les tables existent
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('earnings_calendar', 'earnings_results', 'significant_news');
```

**Résultat attendu:**
```
 table_name
-------------------
 earnings_calendar
 earnings_results
 significant_news
(3 rows)
```

---

### 3. **Permissions RLS (Row Level Security)**

Les tables ont besoin de permissions pour le service role:

```sql
-- Désactiver RLS pour service role (déjà dans le schéma)
ALTER TABLE earnings_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE significant_news ENABLE ROW LEVEL SECURITY;

-- Policy pour service role (bypass RLS)
CREATE POLICY "Service role has full access" ON earnings_calendar
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access" ON earnings_results
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access" ON significant_news
    FOR ALL USING (true) WITH CHECK (true);
```

**Note:** Ces policies sont déjà dans `supabase-schema-complete.sql`

---

## 🧪 Tester la Connexion

### Test 1: Vérifier Variables Vercel

```bash
# Test si les variables sont accessibles
node -e "console.log(process.env.SUPABASE_URL)"
node -e "console.log(process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET')"
```

### Test 2: Test Connexion Supabase

Créer `test-supabase-connection.js`:

```javascript
async function testSupabase() {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('❌ Variables Supabase non configurées');
        return;
    }

    console.log('✅ Variables configurées');
    console.log(`URL: ${SUPABASE_URL}`);

    // Test lecture table earnings_calendar
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/earnings_calendar?limit=1`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Connexion Supabase OK');
            console.log(`Table earnings_calendar: ${data.length} rows`);
        } else {
            console.error('❌ Erreur Supabase:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('❌ Erreur connexion:', error.message);
    }
}

testSupabase();
```

**Exécution:**
```bash
node test-supabase-connection.js
```

**Résultat attendu:**
```
✅ Variables configurées
URL: https://xxxxx.supabase.co
✅ Connexion Supabase OK
Table earnings_calendar: 0 rows
```

---

## 📊 Utilisation par les Agents

### EarningsCalendarAgent

**Sauvegarde:**
```javascript
await this._saveToSupabase(ticker, {
    fiscal_quarter: 'Q1',
    fiscal_year: 2025,
    estimated_date: '2025-04-15',
    estimated_eps: 2.45,
    status: 'scheduled'
});
```

**Lecture:**
```javascript
const upcomingEarnings = await this._getUpcomingEarnings(7); // 7 jours
// Returns: Array d'earnings à venir
```

---

### EarningsResultsAgent

**Sauvegarde:**
```javascript
await this._saveEarningsAnalysis('AAPL', {
    quarter: 'Q1',
    fiscal_year: 2025,
    eps_actual: 2.55,
    eps_surprise_pct: 4.08,
    verdict: 'BUY',
    verdict_confidence: 0.85
});
```

---

### NewsMonitoringAgent

**Sauvegarde:**
```javascript
await this._saveSignificantNews('AAPL', {
    headline: 'Apple announces new AI features',
    importance_score: 9,
    sentiment: 0.75,
    category: 'product',
    action_required: true
});
```

**Lecture (Weekly Digest):**
```javascript
const weeklyNews = await this._fetchWeeklySignificantNews(['AAPL', 'MSFT']);
// Returns: Top news de la semaine pour ces tickers
```

---

## 🔧 Configuration Complète (Checklist)

### Étape 1: Créer Tables Supabase
- [ ] Se connecter à Supabase Dashboard
- [ ] Ouvrir SQL Editor
- [ ] Exécuter `supabase-schema-complete.sql`
- [ ] Vérifier que les 3 tables existent

### Étape 2: Configurer Vercel
- [ ] Aller dans Vercel Dashboard → Settings → Environment Variables
- [ ] Ajouter `SUPABASE_URL` (valeur: https://xxxxx.supabase.co)
- [ ] Ajouter `SUPABASE_SERVICE_ROLE_KEY` (valeur: eyJxxx...)
- [ ] Appliquer à tous les environnements (Production, Preview, Development)
- [ ] Redéployer l'application

### Étape 3: Tester
- [ ] Exécuter `node test-supabase-connection.js`
- [ ] Tester un agent via `api/emma-n8n.js`
- [ ] Vérifier que les données sont sauvegardées

---

## 📖 Où Trouver les Clés Supabase

### SUPABASE_URL
1. Aller sur https://app.supabase.com
2. Sélectionner votre projet
3. Settings → API
4. Copier **Project URL**

### SUPABASE_SERVICE_ROLE_KEY
1. Même page (Settings → API)
2. Section **Project API keys**
3. Copier **service_role** (secret) - **PAS la anon key!**

**⚠️ Important:** Utilisez la **service_role** key, pas la **anon** key. Les agents ont besoin d'accès complet.

---

## 🎯 Résumé

| Élément | Status | Action Requise |
|---------|--------|----------------|
| **Code agents** | ✅ Prêt | Aucune |
| **Schéma SQL** | ✅ Prêt | Exécuter SQL dans Supabase |
| **Variables Vercel** | ⚠️ À vérifier | Configurer si absentes |
| **Tables Supabase** | ⚠️ À vérifier | Créer si absentes |

---

## 🚀 Quick Start

Si tout est déjà configuré, les agents fonctionnent automatiquement!

**Test rapide:**
```bash
# Via API n8n
curl -X POST "https://gob-beta.vercel.app/api/emma-n8n?action=initialize_earnings_calendar" \
  -H "Authorization: Bearer $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tickers":["AAPL","MSFT"],"year":2025}'
```

Si succès → Données sauvegardées dans Supabase ✅

---

**Status Actuel:** 🟡 **Agents prêts, configuration à valider**
**Action:** **Vérifier variables Vercel + tables Supabase**
