# Guide d'Accès à Supabase

## 🔗 Accès Dashboard

1. **URL** : https://supabase.com/dashboard
2. **Connexion** : Utilisez vos identifiants Supabase
3. **Projet** : Sélectionnez votre projet GOB

## 📍 Navigation dans Supabase

### SQL Editor
- Menu gauche → **SQL Editor**
- Permet d'exécuter les scripts SQL
- Historique des requêtes disponible

### Table Editor
- Menu gauche → **Table Editor**
- Sélectionnez la table `tickers`
- Permet de voir/modifier les données directement

### Database
- Menu gauche → **Database**
- Voir la structure complète de la base
- Gérer les index, contraintes, etc.

## 🔑 Variables d'Environnement

Les variables suivantes sont nécessaires (définies dans Vercel) :

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (service_role key)
SUPABASE_KEY=eyJhbGc... (anon key)
```

## 📋 Scripts SQL à Exécuter

### Dans l'Ordre :

1. **Structure** (Créer colonnes) :
   - `supabase-add-valueline-metrics.sql`
   - `supabase-add-valueline-corridor.sql`
   - `supabase-add-safety-score.sql`

2. **Données** (Remplir colonnes) :
   - `supabase-update-valueline-data.sql`

## ✅ Vérification

Après exécution, vérifiez avec :

```sql
SELECT 
    COUNT(*) as total,
    COUNT(security_rank) as with_security_rank,
    COUNT(valueline_proj_low_return) as with_corridor
FROM tickers;
```
