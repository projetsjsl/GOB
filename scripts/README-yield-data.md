# Scripts de gestion des données Yield Curve

## Scripts disponibles

### 1. `fill-missing-yield-data.js`
**Remplit automatiquement les dates manquantes dans Supabase**

Ce script identifie les dates manquantes dans `yield_curve_data` et les remplit en utilisant les APIs FRED (US) et Bank of Canada.

**Usage:**
```bash
# Mode dry-run (affiche les dates manquantes sans insérer)
node scripts/fill-missing-yield-data.js --days=30 --country=both --dry-run

# Remplir les dates manquantes des 30 derniers jours
node scripts/fill-missing-yield-data.js --days=30 --country=both

# Remplir uniquement US
node scripts/fill-missing-yield-data.js --days=30 --country=us

# Utiliser l'API locale au lieu des APIs directes
node scripts/fill-missing-yield-data.js --days=30 --use-api
```

**Options:**
- `--days=N` : Nombre de jours à vérifier en arrière (défaut: 30)
- `--country=X` : Pays à vérifier: `us`, `canada`, `both` (défaut: `both`)
- `--use-api` : Utiliser l'API `/api/yield-curve` au lieu des APIs directes
- `--dry-run` : Afficher les dates manquantes sans insérer

**Exemple de sortie:**
```
🚀 Fill Missing Yield Curve Data
==================================================

📋 Configuration:
   Période: 30 jours
   Pays: both
   Méthode: APIs directes (FRED/BoC)
   Dry run: false

🔍 Recherche dates manquantes pour US...
   13 dates manquantes trouvées

📊 Remplissage US (13 dates manquantes)...
   ✅ 13 réussis, ❌ 0 échoués
```

### 2. `backfill-yield-curve-history.js`
**Remplit l'historique complet sur une période donnée**

Ce script récupère toutes les données historiques sur une période spécifiée, même si certaines dates existent déjà.

**Usage:**
```bash
# Récupérer 12 mois d'historique
node scripts/backfill-yield-curve-history.js --months=12

# Récupérer uniquement US
node scripts/backfill-yield-curve-history.js --months=6 --country=us

# Mode dry-run
node scripts/backfill-yield-curve-history.js --months=12 --dry-run
```

**Options:**
- `--months=N` : Nombre de mois d'historique à récupérer (défaut: 12)
- `--country=X` : Pays à récupérer: `us`, `canada`, `both` (défaut: `both`)
- `--dry-run` : Afficher les dates sans insérer dans la DB

## Quand utiliser chaque script?

### `fill-missing-yield-data.js`
- ✅ **Utilisation quotidienne/hebdomadaire** pour maintenir les données à jour
- ✅ Remplit uniquement les dates manquantes (plus rapide)
- ✅ Idéal pour un cron job quotidien
- ✅ Vérifie les 30 derniers jours par défaut

### `backfill-yield-curve-history.js`
- ✅ **Utilisation ponctuelle** pour remplir une grande période historique
- ✅ Récupère toutes les données de la période (même si certaines existent)
- ✅ Idéal pour initialiser la base de données ou remplir une période manquante
- ✅ Plus lent car récupère toutes les données

## Automatisation

### Cron job quotidien (recommandé)

Ajoutez à votre crontab pour exécuter le script quotidiennement:

```bash
# Remplir les dates manquantes chaque jour à 2h du matin
0 2 * * * cd /path/to/GOB && node scripts/fill-missing-yield-data.js --days=7 --country=both >> /var/log/yield-data-fill.log 2>&1
```

### Via GitHub Actions (si le repo est sur GitHub)

Créez `.github/workflows/fill-yield-data.yml`:

```yaml
name: Fill Missing Yield Data

on:
  schedule:
    - cron: '0 2 * * *'  # Tous les jours à 2h UTC
  workflow_dispatch:  # Permet l'exécution manuelle

jobs:
  fill-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node scripts/fill-missing-yield-data.js --days=7 --country=both
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          FRED_API_KEY: ${{ secrets.FRED_API_KEY }}
```

## Variables d'environnement requises

Les deux scripts nécessitent:

```bash
SUPABASE_URL=https://gob-watchlist.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role
FRED_API_KEY=votre_cle_fred  # Optionnel pour fill-missing-yield-data si --use-api
```

## Vérification des données

Pour vérifier l'état des données dans Supabase:

```sql
-- Compter les enregistrements par pays
SELECT 
  country, 
  COUNT(*) as count, 
  MIN(data_date) as earliest_date, 
  MAX(data_date) as latest_date 
FROM yield_curve_data 
GROUP BY country;

-- Trouver les dates manquantes des 30 derniers jours
WITH date_series AS (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    '1 day'::interval
  )::date AS date
),
us_dates AS (
  SELECT DISTINCT data_date FROM yield_curve_data WHERE country = 'us'
),
canada_dates AS (
  SELECT DISTINCT data_date FROM yield_curve_data WHERE country = 'canada'
)
SELECT 
  ds.date,
  CASE WHEN ud.data_date IS NULL THEN 'missing' ELSE 'exists' END as us_status,
  CASE WHEN cd.data_date IS NULL THEN 'missing' ELSE 'exists' END as canada_status
FROM date_series ds
LEFT JOIN us_dates ud ON ud.data_date = ds.date
LEFT JOIN canada_dates cd ON cd.data_date = ds.date
WHERE ud.data_date IS NULL OR cd.data_date IS NULL
ORDER BY ds.date DESC;
```

## Notes importantes

1. **Rate limiting**: Les scripts incluent des pauses entre les appels API pour respecter les limites de taux
2. **Weekends/Jours fériés**: Certaines dates peuvent ne pas avoir de données (marchés fermés). C'est normal.
3. **Données futures**: Les dates futures (au-delà d'aujourd'hui) ne seront pas récupérées
4. **Upsert**: Les scripts utilisent `upsert` donc les données existantes seront mises à jour si nécessaire
