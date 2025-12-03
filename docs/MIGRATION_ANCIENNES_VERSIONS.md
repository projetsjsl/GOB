# Migration depuis les Anciennes Versions SQL

**Date** : 3 décembre 2025  
**Situation** : Vous avez déjà exécuté les anciennes versions des scripts SQL

---

## 📊 Situation Actuelle

Après avoir exécuté les anciennes versions, vous avez :
- ✅ `price_growth` (colonne existe mais toujours NULL - inutile)
- ✅ `persistence` (colonne existe et contient les données "Price Growth Persistence")

---

## 🔄 Migration Requise

### Étape 1 : Exécuter la Migration SQL

**Fichier** : `supabase-migrate-from-old-structure.sql`

Ce script va :
1. ✅ Renommer `persistence` → `price_growth_persistence` (plus explicite)
2. ✅ Supprimer `price_growth` (toujours NULL, inutile)
3. ✅ Mettre à jour les index et commentaires

**Comment exécuter** :
1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier le contenu de `supabase-migrate-from-old-structure.sql`
3. Exécuter le script
4. Vérifier les messages de confirmation

---

### Étape 2 : Mettre à Jour les Données (Optionnel)

Si vous voulez mettre à jour les données avec le nouveau script :

**Fichier** : `supabase-update-valueline-data.sql`

Ce fichier utilise maintenant `price_growth_persistence` au lieu de `persistence`.

**Note** : Si vos données sont déjà à jour dans `persistence`, elles seront automatiquement renommées en `price_growth_persistence` par la migration. Vous n'avez pas besoin de ré-exécuter ce script.

---

## ✅ Vérification

Après la migration, vérifiez que :

```sql
-- Vérifier que price_growth_persistence existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tickers' 
  AND column_name = 'price_growth_persistence';

-- Vérifier que price_growth n'existe plus
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'tickers' 
  AND column_name = 'price_growth';
-- Devrait retourner 0 lignes

-- Vérifier les données
SELECT 
    COUNT(*) as total,
    COUNT(price_growth_persistence) as avec_donnees
FROM tickers;
```

---

## 📋 Résumé des Changements

| Avant (Ancienne Version) | Après (Nouvelle Version) |
|--------------------------|--------------------------|
| `price_growth` (toujours NULL) | ❌ **Supprimé** |
| `persistence` (contient données) | ✅ **Renommé** → `price_growth_persistence` |

---

## 🚨 En Cas de Problème

Si la migration échoue :

1. **Vérifier l'état actuel** :
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'tickers' 
     AND column_name IN ('price_growth', 'persistence', 'price_growth_persistence');
   ```

2. **Migration manuelle** (si nécessaire) :
   ```sql
   -- Renommer persistence
   ALTER TABLE tickers RENAME COLUMN persistence TO price_growth_persistence;
   
   -- Supprimer price_growth (seulement si vide)
   ALTER TABLE tickers DROP COLUMN price_growth;
   ```

3. **Vérifier les données** :
   ```sql
   SELECT COUNT(*) FROM tickers WHERE price_growth_persistence IS NOT NULL;
   ```

---

## ✅ Après la Migration

Une fois la migration terminée :
- ✅ Le code TypeScript/React est déjà mis à jour
- ✅ Les scripts de génération SQL sont déjà mis à jour
- ✅ Vous pouvez utiliser `price_growth_persistence` partout

**Aucune autre action requise** ! 🎉

---

**Document créé le** : 3 décembre 2025  
**Version** : 1.0

