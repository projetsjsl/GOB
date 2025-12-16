# 🗄️ Guide d'Installation Supabase - Système de Données Historiques

## 📋 **Vue d'ensemble**

Ce guide vous explique comment configurer Supabase pour le système de données historiques de JLab™, qui permet de :
- ✅ Mettre en cache les données financières localement
- ✅ Réduire les appels aux APIs externes
- ✅ Améliorer les performances du dashboard
- ✅ Fournir des données même en cas de panne des APIs externes

## 🚀 **Étape 1 : Créer un Projet Supabase**

1. **Aller sur [supabase.com](https://supabase.com)**
2. **Se connecter ou créer un compte**
3. **Cliquer sur "New Project"**
4. **Remplir les informations :**
   - Nom du projet : `jlab-historical-data`
   - Mot de passe de base de données : (générer un mot de passe fort)
   - Région : Choisir la plus proche (Europe pour la France)

## 🗄️ **Étape 2 : Créer les Tables**

1. **Aller dans l'onglet "SQL Editor"**
2. **Cliquer sur "New Query"**
3. **Copier et coller le contenu de `supabase-historical-tables.sql`**
4. **Cliquer sur "Run"**

```sql
-- Le script créera automatiquement :
-- ✅ 7 tables pour les différents types de données
-- ✅ Index pour optimiser les performances
-- ✅ Triggers pour maintenir la cohérence
-- ✅ Politiques RLS pour la sécurité
-- ✅ Fonction de nettoyage automatique
```

## 🔑 **Étape 3 : Récupérer les Clés API**

1. **Aller dans l'onglet "Settings" > "API"**
2. **Copier les valeurs suivantes :**
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`

## ⚙️ **Étape 4 : Configurer les Variables d'Environnement**

### **Pour Vercel (Production) :**
1. Aller dans votre projet Vercel
2. Onglet "Settings" > "Environment Variables"
3. Ajouter :
   ```
   SUPABASE_URL=https://votre-projet.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### **Pour le Développement Local :**
1. Créer un fichier `.env.local` à la racine du projet
2. Ajouter :
   ```
   SUPABASE_URL=https://votre-projet.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 🧪 **Étape 5 : Tester la Configuration**

### **Test 1 : Vérifier les Tables**
```sql
-- Dans l'éditeur SQL Supabase
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%stock%' OR table_name LIKE '%financial%' 
OR table_name LIKE '%news%' OR table_name LIKE '%analyst%' 
OR table_name LIKE '%earnings%';
```

### **Test 2 : Tester l'API Hybride**
```bash
# Tester l'API hybride
curl "https://votre-site.vercel.app/api/hybrid-data?symbol=AAPL&dataType=quote&syncIfNeeded=true"
```

### **Test 3 : Vérifier les Données en Cache**
```sql
-- Dans l'éditeur SQL Supabase
SELECT symbol, last_updated FROM stock_quotes ORDER BY last_updated DESC LIMIT 5;
```

## 📊 **Étape 6 : Monitoring et Maintenance**

### **Surveillance des Performances**
- **Dashboard Supabase** : Onglet "Reports" pour voir les métriques
- **Logs** : Onglet "Logs" pour surveiller les erreurs
- **Storage** : Onglet "Storage" pour voir l'utilisation

### **Nettoyage Automatique**
Le script SQL inclut une fonction `clean_old_data()` qui supprime automatiquement les données de plus de 7 jours.

Pour l'exécuter manuellement :
```sql
SELECT clean_old_data();
```

### **Sauvegarde**
- **Sauvegardes automatiques** : Supabase fait des sauvegardes quotidiennes
- **Export manuel** : Onglet "Settings" > "Database" > "Backups"

## 🔧 **Dépannage**

### **Problème : "Table doesn't exist"**
```bash
# Solution : Vérifier que le script SQL a été exécuté
# Relancer le script supabase-historical-tables.sql
```

### **Problème : "Permission denied"**
```bash
# Solution : Vérifier les politiques RLS
# Les politiques publiques sont configurées dans le script
```

### **Problème : "API key invalid"**
```bash
# Solution : Vérifier les variables d'environnement
# S'assurer que SUPABASE_URL et SUPABASE_ANON_KEY sont corrects
```

### **Problème : "Connection timeout"**
```bash
# Solution : Vérifier la région Supabase
# Choisir une région plus proche de vos utilisateurs
```

## 📈 **Optimisations Avancées**

### **Index Personnalisés**
```sql
-- Pour des requêtes spécifiques fréquentes
CREATE INDEX idx_stock_quotes_symbol_updated 
ON stock_quotes(symbol, last_updated DESC);
```

### **Politiques RLS Avancées**
```sql
-- Pour des accès plus granulaires
CREATE POLICY "Allow read for specific users" 
ON stock_quotes FOR SELECT 
USING (auth.uid() = user_id);
```

### **Fonctions Personnalisées**
```sql
-- Pour des calculs complexes
CREATE OR REPLACE FUNCTION get_stock_performance(symbol TEXT, days INTEGER)
RETURNS JSONB AS $$
-- Logique personnalisée
$$ LANGUAGE plpgsql;
```

## 🎯 **Résultats Attendus**

Une fois configuré, vous devriez voir :

### **Dans les Logs de l'API :**
```
🔄 API Hybride - quote pour AAPL
📡 Synchronisation avec APIs externes pour AAPL (quote)
💾 Données sauvegardées en local pour AAPL (quote)
```

### **Dans Supabase :**
- Tables créées avec des données
- Index optimisés
- Politiques RLS actives

### **Dans le Dashboard :**
- Chargement plus rapide des données
- Données disponibles même hors ligne
- Indicateurs de source (local/external)

## 🚨 **Sécurité**

### **Bonnes Pratiques :**
- ✅ Utiliser l'API key `anon` (publique) uniquement
- ✅ Ne jamais exposer la clé `service_role`
- ✅ Activer RLS sur toutes les tables
- ✅ Limiter les accès par IP si nécessaire

### **Variables d'Environnement Sécurisées :**
```bash
# ✅ Correct
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ❌ Incorrect (ne jamais faire)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📞 **Support**

En cas de problème :
1. **Vérifier les logs** dans Supabase et Vercel
2. **Consulter la documentation** [supabase.com/docs](https://supabase.com/docs)
3. **Tester avec des données simples** d'abord
4. **Vérifier les variables d'environnement**

---

## ✅ **Checklist de Validation**

- [ ] Projet Supabase créé
- [ ] Tables créées avec le script SQL
- [ ] Variables d'environnement configurées
- [ ] API hybride testée avec succès
- [ ] Données visibles dans Supabase
- [ ] Dashboard affiche les données correctement
- [ ] Logs montrent la synchronisation
- [ ] Performance améliorée

**🎉 Félicitations ! Votre système de données historiques est opérationnel !**
