# 📊 Explication : `ticker_price_cache`

## 🎯 Qu'est-ce que `ticker_price_cache` ?

`ticker_price_cache` est une **table Supabase** qui stocke **uniquement les prix** des actions en temps réel.

### **Objectif Principal**

Réduire l'**egress Supabase** (données transférées) en évitant de :
- ❌ Appeler FMP pour chaque ticker individuellement
- ❌ Transférer toutes les données historiques à chaque requête
- ❌ Recalculer les métriques à chaque fois

---

## 📋 Structure de la Table

```sql
CREATE TABLE ticker_price_cache (
    ticker TEXT PRIMARY KEY,
    
    -- PRIX UNIQUEMENT (mises à jour fréquentes)
    current_price DECIMAL(12,2),
    change_percent DECIMAL(8,4),
    change_amount DECIMAL(12,2),
    volume BIGINT,
    market_cap BIGINT,
    
    -- Métadonnées
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 minutes',
    source TEXT DEFAULT 'fmp'
);
```

### **Colonnes**

| Colonne | Type | Description |
|---------|------|-------------|
| `ticker` | TEXT | Symbole de l'action (ex: 'AAPL') |
| `current_price` | DECIMAL | Prix actuel de l'action |
| `change_percent` | DECIMAL | Variation en % (ex: 1.5 = +1.5%) |
| `change_amount` | DECIMAL | Variation en $ (ex: 2.50 = +$2.50) |
| `volume` | BIGINT | Volume échangé |
| `market_cap` | BIGINT | Capitalisation boursière |
| `updated_at` | TIMESTAMPTZ | Date de dernière mise à jour |
| `expires_at` | TIMESTAMPTZ | Date d'expiration (15 min) |
| `source` | TEXT | Source des données ('fmp') |

---

## 🔄 Comment ça Fonctionne ?

### **1. Mise à Jour Automatique (Cron Job)**

Un **cron job Vercel** s'exécute **toutes les 5 minutes** :

```javascript
// api/cron/fmp-batch-sync.js
// Exécuté automatiquement toutes les 5 minutes

1. Récupère tous les tickers actifs depuis Supabase (1 requête)
2. Appelle FMP en batch pour les quotes (quelques requêtes max)
3. Upsert massif dans ticker_price_cache (1 requête)
```

**Configuration** (`vercel.json`) :
```json
{
  "crons": [
    {
      "path": "/api/cron/fmp-batch-sync",
      "schedule": "*/5 * * * *"  // Toutes les 5 minutes
    }
  ]
}
```

### **2. Utilisation dans l'Application**

Quand l'application 3p1 a besoin du prix d'un ticker :

```typescript
// public/3p1/services/marketDataCache.ts

// Au lieu d'appeler FMP pour chaque ticker :
❌ fetch('/api/fmp-company-data?symbol=AAPL')  // Lent, coûteux

// On charge depuis le cache :
✅ fetch('/api/market-data-batch?tickers=AAPL,MSFT,GOOGL')  // Rapide, batch
```

**Avantages** :
- ✅ **1 requête** pour N tickers (au lieu de N requêtes)
- ✅ **Rapide** : Données déjà dans Supabase
- ✅ **Moins d'egress** : Seulement les prix (pas toutes les données historiques)

---

## 📊 Flux Complet

```
┌─────────────────────────────────────────────────────────┐
│  CRON JOB (Toutes les 5 minutes)                       │
└─────────────────────────────────────────────────────────┘
         │
         ▼
1. Récupère tous les tickers actifs (Supabase)
   └─ SELECT ticker FROM tickers WHERE is_active = true
         │
         ▼
2. Appelle FMP en batch (100 tickers par requête)
   └─ GET /api/v3/quote/AAPL,MSFT,GOOGL,...?apikey=XXX
         │
         ▼
3. Upsert dans ticker_price_cache (1 requête)
   └─ INSERT ... ON CONFLICT DO UPDATE
         │
         ▼
✅ Cache mis à jour (valide 15 minutes)

┌─────────────────────────────────────────────────────────┐
│  APPLICATION 3P1 (Quand besoin du prix)                 │
└─────────────────────────────────────────────────────────┘
         │
         ▼
1. Appelle /api/market-data-batch?tickers=AAPL,MSFT
         │
         ▼
2. API lit depuis ticker_price_cache
   └─ SELECT * FROM ticker_price_cache WHERE ticker IN (...)
         │
         ▼
3. Retourne les prix (rapide, pas de FMP)
   └─ { currentPrice: 150.50, changePercent: 1.2, ... }
```

---

## 🎯 Pourquoi `ticker_price_cache` et pas `ticker_market_cache` ?

### **Problème Initial**

On avait créé `ticker_market_cache` avec **toutes les données** :
- Prix
- Ratios (P/E, P/CF, P/BV)
- Métriques financières
- Données historiques

**Problème** :
- ❌ **Trop de données** transférées (egress élevé)
- ❌ **Mise à jour complexe** (tous les ratios changent rarement)
- ❌ **Redondance** avec `finance_pro_snapshots` (données historiques)

### **Solution Optimisée**

`ticker_price_cache` contient **uniquement les prix** :
- ✅ **Léger** : Seulement 6 colonnes (vs 20+)
- ✅ **Fréquent** : Mise à jour toutes les 5 minutes (prix change souvent)
- ✅ **Efficace** : 1 requête pour N tickers

**Les autres données** (historiques, ratios) restent dans :
- `finance_pro_snapshots` : Données historiques complètes
- Calculées à la demande dans 3p1 : Ratios calculés depuis les données historiques

---

## 📈 Comparaison Avant/Après

### **Avant (Sans Cache)**

```
Application 3p1 → FMP (800 appels) → Affichage
❌ 800 requêtes FMP
❌ Lent (1-2 minutes)
❌ Coûteux (API calls)
❌ Egress Supabase élevé
```

### **Après (Avec Cache)**

```
Cron Job (5 min) → FMP (batch) → ticker_price_cache
Application 3p1 → ticker_price_cache → Affichage
✅ 1 requête batch FMP (toutes les 5 min)
✅ 1 requête Supabase pour N tickers
✅ Rapide (2-5 secondes)
✅ Moins coûteux
✅ Egress Supabase réduit
```

---

## 🔍 Exemple Concret

### **Scénario : 800 Tickers Actifs**

**Sans Cache** :
- 800 appels FMP individuels
- ~2 minutes de chargement
- 800 requêtes API FMP

**Avec Cache** :
- 1 cron job toutes les 5 min (8 appels FMP batch de 100)
- Application : 1 requête Supabase pour 800 tickers
- ~2-5 secondes de chargement
- 8 requêtes API FMP (toutes les 5 min, pas à chaque ouverture)

**Réduction** :
- ✅ **99% moins d'appels FMP** à l'ouverture
- ✅ **10-20x plus rapide**
- ✅ **Egress Supabase réduit** (prix uniquement vs toutes les données)

---

## ⚙️ Configuration

### **Expiration du Cache**

Le cache expire après **15 minutes** :

```sql
expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 minutes'
```

**Pourquoi 15 minutes ?**
- Les prix changent fréquemment (pendant les heures de marché)
- 15 minutes = bon compromis entre fraîcheur et performance
- Le cron job met à jour toutes les 5 minutes (donc toujours frais)

### **Nettoyage Automatique**

Les entrées expirées (> 1 heure) sont nettoyées automatiquement :

```sql
CREATE FUNCTION cleanup_expired_ticker_price_cache()
-- Supprime les entrées > 1 heure
```

---

## 🎯 Résumé

**`ticker_price_cache`** est une table Supabase qui :
1. ✅ Stocke **uniquement les prix** (léger)
2. ✅ Mis à jour **automatiquement** toutes les 5 minutes (cron)
3. ✅ Permet de charger **N tickers en 1 requête** (batch)
4. ✅ Réduit l'**egress Supabase** (prix uniquement)
5. ✅ Évite les **appels FMP répétés** à l'ouverture

**Utilisation** :
- ✅ Chargement initial : Prix depuis cache (rapide)
- ✅ Données historiques : Depuis `finance_pro_snapshots` (si existe)
- ✅ Synchronisation : FMP complet (action utilisateur)

