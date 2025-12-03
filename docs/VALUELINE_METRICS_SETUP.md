# Guide de Configuration des Métriques ValueLine

Ce document explique comment configurer et mettre à jour les métriques ValueLine dans l'application Finance Pro 3p1.

## 📊 Métriques ValueLine

Les 5 métriques suivantes proviennent de **ValueLine au 3 décembre 2025** :

1. **Financial Strength (Cote de sécurité)** - `security_rank`
2. **Earnings Predictability** - `earnings_predictability`
3. **Price Growth** - `price_growth`
4. **Persistence** - `persistence`
5. **Price Stability** - `price_stability`

**Plus le Beta** (volatilité relative au marché) récupéré automatiquement via l'API FMP.

## 🗄️ Structure Supabase

### 1. Exécuter le script SQL

Exécutez le script `supabase-add-valueline-metrics.sql` dans l'éditeur SQL de Supabase pour ajouter les colonnes nécessaires :

```sql
-- Le script ajoute automatiquement :
-- - security_rank (VARCHAR(10))
-- - earnings_predictability (VARCHAR(10))
-- - price_growth (VARCHAR(10))
-- - persistence (VARCHAR(10))
-- - price_stability (VARCHAR(10))
-- - beta (DECIMAL(5,2))
-- - valueline_updated_at (TIMESTAMP)
```

### 2. Structure de la table `tickers`

Après exécution du script, la table `tickers` contiendra :

```sql
CREATE TABLE tickers (
    -- ... colonnes existantes ...
    security_rank VARCHAR(10),
    earnings_predictability VARCHAR(10),
    price_growth VARCHAR(10),
    persistence VARCHAR(10),
    price_stability VARCHAR(10),
    beta DECIMAL(5,2),
    valueline_updated_at TIMESTAMP WITH TIME ZONE
);
```

## 📝 Mise à jour des données

### Option 1: Script Node.js (Recommandé)

1. **Préparer les données ValueLine**

   Éditez `scripts/update-tickers-valueline-metrics.js` et ajoutez vos données dans l'objet `valuelineData` :

   ```javascript
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
       // ... ajouter tous les autres tickers
   };
   ```

2. **Exécuter le script**

   ```bash
   cd /Users/projetsjsl/Documents/GitHub/GOB
   node scripts/update-tickers-valueline-metrics.js
   ```

   Le script va :
   - Récupérer tous les tickers actifs depuis Supabase
   - Mettre à jour les métriques ValueLine pour chaque ticker
   - Récupérer automatiquement le beta via l'API FMP
   - Afficher un résumé des mises à jour

### Option 2: Mise à jour manuelle via SQL

```sql
UPDATE tickers 
SET 
    security_rank = 'A+',
    earnings_predictability = '100',
    price_growth = 'A++',
    persistence = 'A+',
    price_stability = '100',
    valueline_updated_at = '2025-12-03 00:00:00+00'
WHERE ticker = 'AAPL';
```

### Option 3: Mise à jour via l'interface 3p1

Les métriques ValueLine peuvent être éditées directement dans l'interface Finance Pro 3p1 :

1. Ouvrir un ticker
2. Aller dans la section "Configuration" (icône ⚙️)
3. Modifier les champs :
   - Financial Strength (ValueLine 3 déc 2025)
   - Earnings Predictability (ValueLine 3 déc 2025)
   - Price Growth (ValueLine 3 déc 2025)
   - Persistence (ValueLine 3 déc 2025)
   - Price Stability (ValueLine 3 déc 2025)

Les modifications sont sauvegardées automatiquement dans `localStorage` et peuvent être synchronisées avec Supabase.

## 🎨 Affichage dans l'interface

### Header (Barre supérieure)

Les métriques sont affichées sous forme de badges dans la barre supérieure :
- **CÔTE SÉCURITÉ** (vert) - Financial Strength
- **BETA** (bleu) - Beta (si disponible)
- **EARNINGS PRED.** (violet) - Earnings Predictability (si disponible)
- **PRICE GROWTH** (indigo) - Price Growth (si disponible)
- **PERSISTENCE** (rose) - Persistence (si disponible)
- **PRICE STABILITY** (turquoise) - Price Stability (si disponible)

Chaque badge indique "ValueLine 3 déc 2025" en petit texte.

### Résumé Exécutif (Colonne de droite)

Les métriques sont affichées sous forme de cartes dans le résumé exécutif :
- Carte **Financial Strength** (vert)
- Carte **Earnings Predictability** (violet) - si disponible
- Carte **Price Growth** (indigo) - si disponible
- Carte **Persistence** (rose) - si disponible
- Carte **Price Stability** (turquoise) - si disponible
- Carte **Beta** (bleu) - si disponible

Chaque carte indique la source et la date.

## 🔄 Synchronisation automatique

### Chargement depuis Supabase

Lors du chargement des tickers depuis Supabase, les métriques ValueLine sont automatiquement chargées et mappées vers l'interface :

```typescript
// Mapping automatique dans App.tsx
info: {
    securityRank: supabaseTicker.security_rank || 'N/A',
    earningsPredictability: supabaseTicker.earnings_predictability,
    priceGrowth: supabaseTicker.price_growth,
    persistence: supabaseTicker.persistence,
    priceStability: supabaseTicker.price_stability,
    beta: supabaseTicker.beta
}
```

### Préservation lors de la synchronisation API

Lors d'une synchronisation de données via l'API FMP, les métriques ValueLine sont **préservées** et ne sont pas écrasées par les données de l'API.

## 📋 Format des valeurs

### Financial Strength (security_rank)
- Format : `A++`, `A+`, `A`, `B++`, `B+`, `B`, `C++`, `C+`, `C`, etc.
- Exemple : `A+`

### Earnings Predictability
- Format : Score numérique (0-100)
- Exemple : `100`, `95`, `90`

### Price Growth
- Format : `A++`, `A+`, `A`, `B++`, `B+`, `B`, etc.
- Exemple : `A++`

### Persistence
- Format : `A++`, `A+`, `A`, `B++`, `B+`, `B`, etc.
- Exemple : `A+`

### Price Stability
- Format : Score numérique (0-100)
- Exemple : `100`, `95`, `90`

### Beta
- Format : Nombre décimal (ex: `1.25`, `0.85`)
- Source : API FMP (récupéré automatiquement)
- Exemple : `1.15`

## 🔍 Vérification

Pour vérifier que les métriques sont bien chargées :

1. Ouvrir la console du navigateur (F12)
2. Vérifier les logs lors du chargement des tickers
3. Vérifier que les métriques apparaissent dans l'interface

## 📝 Notes importantes

- Les métriques ValueLine sont **optionnelles** - l'interface fonctionne même si elles ne sont pas définies
- Le **Beta** est récupéré automatiquement via l'API FMP lors de la synchronisation
- Les métriques ValueLine sont **préservées** lors des synchronisations API
- La date "3 décembre 2025" est codée en dur dans l'interface pour indiquer la source ValueLine

## 🚀 Prochaines étapes

1. Exécuter `supabase-add-valueline-metrics.sql` dans Supabase
2. Préparer les données ValueLine pour tous vos tickers
3. Exécuter `scripts/update-tickers-valueline-metrics.js` pour mettre à jour Supabase
4. Vérifier l'affichage dans l'interface 3p1

