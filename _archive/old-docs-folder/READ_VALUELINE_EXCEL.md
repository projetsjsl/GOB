# Guide de Lecture du Fichier Excel ValueLine

Ce guide explique comment utiliser le fichier Excel `valueline.xlsx` pour générer automatiquement le SQL de mise à jour.

## 📋 Prérequis

1. **Fichier Excel** : `valueline.xlsx` doit être à la racine du projet (`/Users/projetsjsl/Documents/GitHub/GOB/valueline.xlsx`)

2. **Package npm** : Installer `xlsx` si ce n'est pas déjà fait :
   ```bash
   npm install xlsx
   ```

## 📊 Format du Fichier Excel

Le fichier Excel doit contenir les colonnes suivantes (les noms peuvent varier, le script les normalise automatiquement) :

- **Ticker** / **Symbol** / **Symbole** : Le symbole boursier (ex: AAPL, GOOGL)
- **Security Rank** / **Financial Strength** / **Cote Sécurité** : La cote de sécurité (ex: A+, A, B+)
- **Earnings Predictability** / **Predictability** : La prévisibilité des bénéfices (ex: 100, 95, 90)
- **Price Growth** / **Growth** : La croissance du prix (ex: A++, A+, A)
- **Persistence** : La persistance (ex: A++, A+, A)
- **Price Stability** / **Stability** : La stabilité du prix (ex: 100, 95, 90)

### Exemple de Structure

| Ticker | Security Rank | Earnings Predictability | Price Growth | Persistence | Price Stability |
|--------|---------------|------------------------|--------------|------------|-----------------|
| AAPL   | A+            | 100                    | A++          | A+         | 100             |
| GOOGL  | A             | 95                     | A+           | A          | 95              |
| MSFT   | A++           | 100                    | A++          | A++        | 100             |

## 🚀 Utilisation

### 1. Placer le Fichier Excel

Assurez-vous que `valueline.xlsx` est à la racine du projet :
```
/Users/projetsjsl/Documents/GitHub/GOB/valueline.xlsx
```

### 2. Installer les Dépendances (si nécessaire)

```bash
cd /Users/projetsjsl/Documents/GitHub/GOB
npm install xlsx
```

### 3. Exécuter le Script

```bash
node scripts/read-valueline-excel.js
```

Le script va :
- ✅ Lire le fichier Excel
- ✅ Parser les données
- ✅ Générer `supabase-update-valueline-data.sql`
- ✅ Générer `scripts/valueline-data-generated.js`

### 4. Vérifier les Fichiers Générés

#### Fichier SQL (`supabase-update-valueline-data.sql`)

Contient les commandes SQL `UPDATE` pour chaque ticker :
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

#### Fichier JavaScript (`scripts/valueline-data-generated.js`)

Contient les données au format JavaScript pour utilisation dans le script de mise à jour :
```javascript
const valuelineData = {
    'AAPL': {
        securityRank: 'A+',
        earningsPredictability: '100',
        priceGrowth: 'A++',
        persistence: 'A+',
        priceStability: '100'
    },
    // ...
};
```

## 📝 Mise à Jour dans Supabase

### Option 1: Utiliser le SQL Généré (Recommandé)

1. Ouvrir l'éditeur SQL de Supabase
2. Exécuter `supabase-add-valueline-metrics.sql` (si pas déjà fait)
3. Exécuter `supabase-update-valueline-data.sql`

### Option 2: Utiliser le Script Node.js

1. Modifier `scripts/update-tickers-valueline-metrics.js` pour utiliser les données générées :
   ```javascript
   const { valuelineData } = require('./valueline-data-generated');
   ```

2. Exécuter le script :
   ```bash
   node scripts/update-tickers-valueline-metrics.js
   ```

## 🔍 Normalisation des Colonnes

Le script normalise automatiquement les noms de colonnes. Les variantes suivantes sont reconnues :

- **Ticker** : `ticker`, `symbol`, `symbole`
- **Security Rank** : `security_rank`, `securityrank`, `financial_strength`, `cote_securite`
- **Earnings Predictability** : `earnings_predictability`, `earningspredictability`, `predictability`
- **Price Growth** : `price_growth`, `pricegrowth`, `growth`
- **Persistence** : `persistence`
- **Price Stability** : `price_stability`, `pricestability`, `stability`

## ⚠️ Notes Importantes

1. **Format des Valeurs** :
   - Security Rank : `A++`, `A+`, `A`, `B++`, `B+`, `B`, etc.
   - Earnings Predictability : Score numérique (0-100)
   - Price Growth : `A++`, `A+`, `A`, `B++`, `B+`, `B`, etc.
   - Persistence : `A++`, `A+`, `A`, `B++`, `B+`, `B`, etc.
   - Price Stability : Score numérique (0-100)

2. **Valeurs Manquantes** : Les cellules vides ou `N/A` sont ignorées

3. **Date ValueLine** : Toutes les métriques sont datées du **3 décembre 2025**

4. **Beta** : Le beta est récupéré automatiquement via l'API FMP lors de l'exécution du script de mise à jour

## 🐛 Dépannage

### Erreur: "Fichier non trouvé"
- Vérifier que `valueline.xlsx` est bien à la racine du projet
- Vérifier le chemin exact : `/Users/projetsjsl/Documents/GitHub/GOB/valueline.xlsx`

### Erreur: "Cannot find module 'xlsx'"
- Installer le package : `npm install xlsx`

### Colonnes non reconnues
- Vérifier les noms des colonnes dans le fichier Excel
- Le script affiche les colonnes trouvées lors de l'exécution
- Ajuster le mapping dans `normalizeColumnName()` si nécessaire

### Données manquantes
- Vérifier que les cellules ne sont pas vides
- Vérifier le format des valeurs (texte vs nombre)
- Le script affiche un avertissement pour les lignes avec ticker manquant

## 📊 Exemple de Sortie

```
🚀 Script de lecture ValueLine Excel
============================================================
📁 Fichier: /Users/projetsjsl/Documents/GitHub/GOB/valueline.xlsx

📖 Lecture du fichier Excel...

📋 Feuilles disponibles: Sheet1
📄 Utilisation de la feuille: "Sheet1"

✅ 150 lignes trouvées

📊 Aperçu des colonnes: Ticker, Security Rank, Earnings Predictability, Price Growth, Persistence, Price Stability

🔄 Parsing des données...

✅ 150 tickers parsés

📊 Résumé des métriques:
   - Financial Strength: 150
   - Earnings Predictability: 150
   - Price Growth: 150
   - Persistence: 150
   - Price Stability: 150

📝 Génération du SQL...
✅ SQL généré: supabase-update-valueline-data.sql
📝 Génération du fichier JavaScript...
✅ JavaScript généré: scripts/valueline-data-generated.js

============================================================
✅ Génération terminée!
```

