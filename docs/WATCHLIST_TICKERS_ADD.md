# Ajout de Tickers à la Watchlist Supabase

Ce document explique comment ajouter tous les tickers fournis à la watchlist Supabase.

## Fichiers créés

1. **`supabase-add-watchlist-tickers.sql`** - Script SQL à exécuter directement dans Supabase
2. **`scripts/add-watchlist-tickers.js`** - Script Node.js pour ajouter les tickers via l'API
3. **`scripts/check-existing-tickers.js`** - Script pour vérifier quels tickers existent déjà

## Méthode 1: Exécution SQL directe (Recommandée)

1. Ouvrir l'éditeur SQL dans Supabase Dashboard
2. Copier le contenu de `supabase-add-watchlist-tickers.sql`
3. Exécuter le script
4. Vérifier les résultats avec les requêtes de vérification incluses

## Méthode 2: Script Node.js

### Prérequis

```bash
# Installer les dépendances si nécessaire
npm install @supabase/supabase-js dotenv
```

### Configuration

Assurez-vous d'avoir les variables d'environnement configurées dans `.env.local`:

```bash
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
```

### Vérification des tickers existants

```bash
node scripts/check-existing-tickers.js
```

Ce script affiche:
- Les tickers qui existent déjà
- Les tickers manquants
- Les tickers qui doivent être mis à jour (team → both)

### Ajout des tickers

```bash
node scripts/add-watchlist-tickers.js
```

Ce script:
- Vérifie les tickers existants
- Ajoute les nouveaux tickers avec `source='watchlist'`
- Met à jour les tickers existants:
  - Si `source='team'` → met à `source='both'`
  - Si `source='watchlist'` → reste `source='watchlist'`
  - Si `source='both'` → reste `source='both'`

## Gestion des conflits

### Tickers en double

Certains tickers apparaissent deux fois dans la liste originale mais représentent des compagnies différentes:

1. **SAP**:
   - SAP SE (Allemagne) - Software - **Conservé**
   - Saputo Inc. (Canada) - Retail - **Non ajouté** (conflit de ticker)

2. **T**:
   - AT&T Inc. (US) - Telecom - **Conservé**
   - TELUS Corporation (Canada) - Telecom - **Non ajouté** (conflit de ticker)

Ces conflits sont gérés automatiquement par la contrainte UNIQUE sur le ticker dans Supabase. Le premier ticker inséré sera conservé.

## Résultat attendu

Après l'exécution, vous devriez avoir:
- Tous les tickers de la liste ajoutés à la table `tickers`
- `source='watchlist'` pour les nouveaux tickers
- `source='both'` pour les tickers qui étaient déjà dans `source='team'`
- `is_active=true` pour tous sauf WJA (WestJet, delistée)

## Vérification dans 3p1

L'application 3p1 charge automatiquement les tickers depuis Supabase via l'API `/api/admin/tickers`. 

Pour actualiser:
1. Recharger la page 3p1
2. Les nouveaux tickers apparaîtront avec l'icône œil (watchlist) ou étoile (portefeuille) selon leur `source`

## Statistiques

Pour vérifier les statistiques après l'ajout:

```sql
SELECT 
    source,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_active = true) as active
FROM tickers
WHERE source IN ('watchlist', 'both')
GROUP BY source
ORDER BY source;
```

## Notes importantes

- Le script gère automatiquement les conflits avec `ON CONFLICT DO UPDATE`
- Les tickers existants ne sont pas supprimés, seulement mis à jour
- WestJet (WJA) est marqué comme `is_active=false` car elle est delistée
- Tous les tickers sont ajoutés avec `priority=1` par défaut






