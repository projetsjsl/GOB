# Migration 013: Ajouter colonnes start_date et end_date à task_templates

## ⚠️ IMPORTANT: Exécuter cette migration dans le Supabase SQL Editor

### Problème résolu :
- Erreur : `Could not find the 'endDate' column of 'task_templates' in the schema cache`
- Les colonnes `start_date` et `end_date` n'existent pas dans la table `task_templates`

### Étapes :

1. **Allez sur** : https://supabase.com/dashboard
2. **Sélectionnez** votre projet
3. **Cliquez** sur "SQL Editor" dans la barre latérale
4. **Créez** une nouvelle query
5. **Copiez-collez** le contenu de `013_add_task_dates.sql`
6. **Exécutez** (Run)

### Vérification :

Après exécution, vérifiez que les colonnes existent :
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'task_templates' 
AND column_name IN ('start_date', 'end_date');
```

Vous devriez voir :
- `start_date` (type: date)
- `end_date` (type: date)

### Résultat :

- ✅ Les colonnes `start_date` et `end_date` seront ajoutées
- ✅ Toutes les dates seront forcées dans Q1 2026 (2026-01-01 à 2026-03-31)
- ✅ Les dates existantes seront mises à jour avec des valeurs par défaut
- ✅ Les calendriers pourront sauvegarder les dates sans erreur


