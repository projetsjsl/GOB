# 🔧 Restauration de la table team_tickers

## Problème identifié

La table `team_tickers` dans Supabase était utilisée pour remplir les onglets du dashboard (Titres, Nouvelles, Seeking Alpha), mais elle semble avoir disparu ou être vide, ce qui fait que rien ne s'affiche dans ces onglets.

## Cause du problème

1. **Incohérence dans l'API** : L'endpoint `/api/config/tickers.js` essayait de charger depuis la table `tickers` avec `source=eq.team`, alors que le reste du système utilise la table `team_tickers`.

2. **Table manquante ou vide** : La table `team_tickers` n'existe peut-être pas dans votre base de données Supabase, ou elle est vide.

## Solution appliquée

### 1. Correction de l'API `/api/config/tickers.js`

L'API a été corrigée pour utiliser la table `team_tickers` au lieu de `tickers`. Elle essaie maintenant :
- D'abord avec le filtre `active=eq.true` (nouvelle structure)
- En cas d'erreur, sans filtre (ancienne structure)
- En dernier recours, utilise les tickers de fallback hardcodés

### 2. Script SQL de restauration

Un script SQL a été créé : `supabase-team-tickers-setup.sql`

Ce script :
- ✅ Crée la table `team_tickers` si elle n'existe pas
- ✅ Ajoute les colonnes nécessaires (`active`, `priority`, `company_name`, etc.)
- ✅ Configure les politiques RLS (Row Level Security)
- ✅ Insère les 25 tickers par défaut de l'équipe
- ✅ Utilise `ON CONFLICT` pour éviter les doublons

## Instructions de restauration

### Étape 1 : Exécuter le script SQL dans Supabase

1. Ouvrez votre projet Supabase
2. Allez dans **SQL Editor**
3. Copiez-collez le contenu de `supabase-team-tickers-setup.sql`
4. Exécutez le script

### Étape 2 : Vérifier que les données sont présentes

Exécutez cette requête dans Supabase SQL Editor :

```sql
SELECT 
    ticker, 
    company_name, 
    priority, 
    active,
    added_at
FROM team_tickers
ORDER BY priority DESC, ticker ASC;
```

Vous devriez voir 25 tickers.

### Étape 3 : Tester l'API

Testez l'endpoint dans votre navigateur ou avec curl :

```bash
curl https://[votre-app].vercel.app/api/config/tickers
```

Vous devriez recevoir une réponse JSON avec :
```json
{
  "success": true,
  "team_tickers": ["GOOGL", "T", "BNS", ...],
  "team_count": 25,
  "team_source": "supabase",
  ...
}
```

### Étape 4 : Vérifier le dashboard

Rechargez votre dashboard. Les onglets **Titres**, **Nouvelles** et **Seeking Alpha** devraient maintenant afficher les données pour les 25 tickers d'équipe.

## Tickers par défaut inclus

Le script insère automatiquement ces 25 tickers :

- GOOGL (Alphabet Inc.)
- T (AT&T Inc.)
- BNS (Bank of Nova Scotia)
- TD (Toronto-Dominion Bank)
- BCE (BCE Inc.)
- CNR (Canadian National Railway)
- CSCO (Cisco Systems)
- CVS (CVS Health Corporation)
- DEO (Diageo plc)
- MDT (Medtronic plc)
- JNJ (Johnson & Johnson)
- JPM (JPMorgan Chase & Co.)
- LVMHF (LVMH Moët Hennessy Louis Vuitton)
- MG (Mistras Group Inc.)
- MFC (Manulife Financial Corporation)
- MU (Micron Technology Inc.)
- NSRGY (Nestlé S.A.)
- NKE (Nike Inc.)
- NTR (Nutrien Ltd.)
- PFE (Pfizer Inc.)
- TRP (TC Energy Corporation)
- UNH (UnitedHealth Group Inc.)
- UL (Unilever PLC)
- VZ (Verizon Communications Inc.)
- WFC (Wells Fargo & Company)

## Structure de la table team_tickers

```sql
CREATE TABLE team_tickers (
    id UUID PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL UNIQUE,
    company_name TEXT,
    priority INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Ajouter/modifier des tickers

### Via l'API

**Ajouter un ticker** :
```bash
POST /api/team-tickers
{
  "ticker": "AAPL",
  "priority": 1,
  "notes": "Apple Inc."
}
```

**Supprimer un ticker** :
```bash
DELETE /api/team-tickers?ticker=AAPL
```

### Via Supabase directement

```sql
-- Ajouter un ticker
INSERT INTO team_tickers (ticker, company_name, priority, active)
VALUES ('AAPL', 'Apple Inc.', 1, true)
ON CONFLICT (ticker) DO UPDATE SET
    active = EXCLUDED.active,
    updated_at = NOW();

-- Désactiver un ticker (au lieu de le supprimer)
UPDATE team_tickers 
SET active = false, updated_at = NOW()
WHERE ticker = 'AAPL';
```

## Vérification finale

Après avoir exécuté le script, vérifiez que tout fonctionne :

1. ✅ La table `team_tickers` existe dans Supabase
2. ✅ Elle contient 25 tickers actifs
3. ✅ L'API `/api/config/tickers` retourne les tickers depuis Supabase
4. ✅ Le dashboard affiche les données dans les onglets

## Notes importantes

- Le script utilise `ON CONFLICT` donc il est sûr de l'exécuter plusieurs fois
- Les tickers existants ne seront pas dupliqués, mais leurs données seront mises à jour
- La colonne `active` permet de désactiver des tickers sans les supprimer
- La colonne `priority` permet de trier les tickers par importance




