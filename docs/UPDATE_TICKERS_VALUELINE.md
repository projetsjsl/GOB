# Guide de Mise à Jour des Tickers et Métriques ValueLine

Ce document explique comment ajouter de nouveaux tickers et mettre à jour les métriques ValueLine pour tous les titres.

## 📋 Étapes de Mise à Jour

### 1. Exécuter le Script SQL dans Supabase

**IMPORTANT** : Exécutez d'abord le script SQL pour ajouter les colonnes nécessaires :

```sql
-- Exécuter dans l'éditeur SQL de Supabase
-- Fichier: supabase-add-valueline-metrics.sql
```

Ce script ajoute les colonnes suivantes à la table `tickers` :
- `security_rank` (Financial Strength)
- `earnings_predictability`
- `price_growth`
- `persistence`
- `price_stability`
- `beta`
- `valueline_updated_at`

### 2. Préparer les Données ValueLine

Vous devez préparer un fichier avec les données ValueLine pour tous vos tickers. Format recommandé :

#### Option A: Format JSON

Créez un fichier `valueline-data.json` :

```json
{
  "AAPL": {
    "securityRank": "A+",
    "earningsPredictability": "100",
    "priceGrowth": "A++",
    "persistence": "A+",
    "priceStability": "100"
  },
  "GOOGL": {
    "securityRank": "A",
    "earningsPredictability": "95",
    "priceGrowth": "A+",
    "persistence": "A",
    "priceStability": "95"
  }
  // ... ajouter tous les autres tickers
}
```

#### Option B: Format CSV

Créez un fichier `valueline-data.csv` :

```csv
ticker,security_rank,earnings_predictability,price_growth,persistence,price_stability
AAPL,A+,100,A++,A+,100
GOOGL,A,95,A+,A,95
MSFT,A++,100,A++,A++,100
```

### 3. Mettre à Jour le Script de Mise à Jour

Éditez `scripts/update-tickers-valueline-metrics.js` et remplacez l'objet `valuelineData` par vos données :

```javascript
// Option 1: Charger depuis un fichier JSON
const fs = require('fs');
const valuelineData = JSON.parse(fs.readFileSync('valueline-data.json', 'utf8'));

// Option 2: Définir directement dans le code
const valuelineData = {
    'AAPL': {
        securityRank: 'A+',
        earningsPredictability: '100',
        priceGrowth: 'A++',
        persistence: 'A+',
        priceStability: '100'
    },
    // ... tous les autres tickers
};
```

### 4. Exécuter le Script de Mise à Jour

```bash
cd /Users/projetsjsl/Documents/GitHub/GOB
node scripts/update-tickers-valueline-metrics.js
```

Le script va :
- ✅ Récupérer tous les tickers actifs depuis Supabase
- ✅ Mettre à jour les métriques ValueLine pour chaque ticker
- ✅ Récupérer automatiquement le beta via l'API FMP
- ✅ Afficher un résumé des mises à jour

### 5. Ajouter les Tickers Manquants

Si vous avez des tickers manquants à ajouter :

#### Option A: Via l'Interface 3p1

1. Ouvrir Finance Pro 3p1
2. Cliquer sur le bouton "+" pour ajouter un ticker
3. Rechercher et ajouter le ticker
4. Les métriques ValueLine peuvent être éditées dans la section "Configuration"

#### Option B: Via SQL Direct

```sql
-- Ajouter un nouveau ticker avec métriques ValueLine
INSERT INTO tickers (
    ticker,
    company_name,
    sector,
    security_rank,
    earnings_predictability,
    price_growth,
    persistence,
    price_stability,
    is_active,
    source,
    valueline_updated_at
) VALUES (
    'NVO',
    'Novo Nordisk A/S',
    'Healthcare',
    'A++',
    '100',
    'A++',
    'A++',
    '100',
    true,
    'team',
    '2025-12-03 00:00:00+00'
)
ON CONFLICT (ticker) DO UPDATE SET
    security_rank = EXCLUDED.security_rank,
    earnings_predictability = EXCLUDED.earnings_predictability,
    price_growth = EXCLUDED.price_growth,
    persistence = EXCLUDED.persistence,
    price_stability = EXCLUDED.price_stability,
    valueline_updated_at = EXCLUDED.valueline_updated_at,
    updated_at = NOW();
```

#### Option C: Via Script Node.js

Modifiez `scripts/update-tickers-valueline-metrics.js` pour ajouter les nouveaux tickers :

```javascript
// Ajouter les nouveaux tickers dans Supabase d'abord
const newTickers = [
    { ticker: 'NVO', company_name: 'Novo Nordisk A/S', sector: 'Healthcare', source: 'team' },
    // ... autres nouveaux tickers
];

// Puis mettre à jour avec les métriques ValueLine
const valuelineData = {
    'NVO': {
        securityRank: 'A++',
        earningsPredictability: '100',
        priceGrowth: 'A++',
        persistence: 'A++',
        priceStability: '100'
    },
    // ...
};
```

## 🔄 Mise à Jour des Tickers Existants

### Mettre à Jour Tous les Tickers Actifs

Le script `update-tickers-valueline-metrics.js` met automatiquement à jour **tous les tickers actifs** dans Supabase.

### Mettre à Jour un Ticker Spécifique

```sql
UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '100',
    price_growth = 'A++',
    persistence = 'A+',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker = 'AAPL';
```

### Mettre à Jour Plusieurs Tickers

```sql
-- Exemple de mise à jour en masse
UPDATE tickers 
SET 
    security_rank = CASE ticker
        WHEN 'AAPL' THEN 'A+'
        WHEN 'GOOGL' THEN 'A'
        WHEN 'MSFT' THEN 'A++'
        ELSE security_rank
    END,
    earnings_predictability = CASE ticker
        WHEN 'AAPL' THEN '100'
        WHEN 'GOOGL' THEN '95'
        WHEN 'MSFT' THEN '100'
        ELSE earnings_predictability
    END,
    -- ... autres métriques
    valueline_updated_at = '2025-12-03 00:00:00+00',
    updated_at = NOW()
WHERE ticker IN ('AAPL', 'GOOGL', 'MSFT');
```

## 📊 Vérification

### Vérifier les Données dans Supabase

```sql
-- Vérifier les tickers avec métriques ValueLine
SELECT 
    ticker,
    company_name,
    security_rank,
    earnings_predictability,
    price_growth,
    persistence,
    price_stability,
    beta,
    valueline_updated_at
FROM tickers
WHERE is_active = true
ORDER BY ticker;
```

### Vérifier dans l'Interface 3p1

1. Ouvrir Finance Pro 3p1
2. Sélectionner un ticker
3. Vérifier que les métriques ValueLine apparaissent :
   - Dans le Header (barre supérieure)
   - Dans le Résumé Exécutif (colonne de droite)
   - Dans la section Configuration (éditable)

## 🎯 Format des Valeurs

### Financial Strength (security_rank)
- **Format** : `A++`, `A+`, `A`, `B++`, `B+`, `B`, `C++`, `C+`, `C`, `D++`, `D+`, `D`, `E++`, `E+`, `E`
- **Exemple** : `A+`

### Earnings Predictability
- **Format** : Score numérique (0-100)
- **Exemple** : `100`, `95`, `90`, `85`

### Price Growth
- **Format** : `A++`, `A+`, `A`, `B++`, `B+`, `B`, etc.
- **Exemple** : `A++`

### Persistence
- **Format** : `A++`, `A+`, `A`, `B++`, `B+`, `B`, etc.
- **Exemple** : `A+`

### Price Stability
- **Format** : Score numérique (0-100)
- **Exemple** : `100`, `95`, `90`, `85`

### Beta
- **Format** : Nombre décimal (ex: `1.25`, `0.85`)
- **Source** : Récupéré automatiquement via API FMP
- **Exemple** : `1.15`

## ⚠️ Notes Importantes

1. **Date ValueLine** : Toutes les métriques ValueLine sont datées du **3 décembre 2025**
2. **Beta** : Récupéré automatiquement via l'API FMP lors de l'exécution du script
3. **Préservation** : Les métriques ValueLine sont préservées lors des synchronisations API
4. **Optionnel** : Les métriques sont optionnelles - l'interface fonctionne même si elles ne sont pas définies

## 🚀 Workflow Recommandé

1. ✅ Exécuter `supabase-add-valueline-metrics.sql` dans Supabase
2. ✅ Préparer les données ValueLine pour tous vos tickers
3. ✅ Mettre à jour `scripts/update-tickers-valueline-metrics.js` avec vos données
4. ✅ Exécuter le script pour mettre à jour Supabase
5. ✅ Vérifier l'affichage dans l'interface 3p1
6. ✅ Ajouter les tickers manquants si nécessaire
7. ✅ Mettre à jour les métriques des tickers existants

## 📝 Exemple Complet

```javascript
// scripts/update-tickers-valueline-metrics.js
const valuelineData = {
    'AAPL': {
        securityRank: 'A+',
        earningsPredictability: '100',
        priceGrowth: 'A++',
        persistence: 'A+',
        priceStability: '100'
    },
    'GOOGL': {
        securityRank: 'A',
        earningsPredictability: '95',
        priceGrowth: 'A+',
        persistence: 'A',
        priceStability: '95'
    },
    'MSFT': {
        securityRank: 'A++',
        earningsPredictability: '100',
        priceGrowth: 'A++',
        persistence: 'A++',
        priceStability: '100'
    },
    // ... ajouter tous les autres tickers
};

// Exécuter: node scripts/update-tickers-valueline-metrics.js
```

