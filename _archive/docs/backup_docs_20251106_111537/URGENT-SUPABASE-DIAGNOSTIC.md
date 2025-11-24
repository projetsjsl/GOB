# 🚨 DIAGNOSTIC URGENT - Problème Watchlist Supabase

## 🔍 Problème Identifié

L'API watchlist retourne **"TypeError: fetch failed"** malgré :
- ✅ Table `watchlists` existante dans Supabase
- ✅ Variables d'environnement configurées
- ✅ Service role key fournie
- ✅ Code modifié pour utiliser la service role key

## 🛠️ Actions Immédiates Requises

### 1. **Test Direct avec vos Clés Supabase**

**Remplacez les valeurs dans `test-supabase-direct.js` :**

```javascript
// Remplacez par vos vraies valeurs
const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SUPABASE_ANON_KEY = 'eyJ...votre-anon-key';
```

**Puis exécutez :**
```bash
node test-supabase-direct.js
```

### 2. **Vérification dans Supabase Dashboard**

1. **Allez dans Supabase** : https://supabase.com/dashboard
2. **Sélectionnez votre projet** (gob-watchlist)
3. **Table Editor > watchlists**
   - Y a-t-il des données ?
   - Quelle est la structure exacte ?

4. **Authentication > Policies**
   - Y a-t-il des politiques RLS sur `watchlists` ?
   - Sont-elles permissives ?

5. **Logs**
   - Y a-t-il des erreurs récentes ?

### 3. **Test Manuel dans l'Éditeur SQL**

Exécutez dans l'éditeur SQL de Supabase :

```sql
-- Vérifier la structure
\d watchlists;

-- Vérifier les données
SELECT * FROM watchlists;

-- Vérifier les politiques
SELECT * FROM pg_policies WHERE tablename = 'watchlists';

-- Créer une watchlist de test
INSERT INTO watchlists (user_id, tickers) 
VALUES ('default', '["AAPL", "GOOGL", "MSFT"]')
ON CONFLICT (user_id) 
DO UPDATE SET tickers = EXCLUDED.tickers;
```

### 4. **Vérification Vercel**

1. **Allez dans Vercel Dashboard** : https://vercel.com/projetsjsl/gob/settings/environment-variables
2. **Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est bien configurée**
3. **Vérifiez les logs Vercel** : Functions > supabase-watchlist

## 🔍 Diagnostics Possibles

### A. **Problème RLS (Row Level Security)**
- **Symptôme** : Erreur 42501 ou accès refusé
- **Solution** : Utiliser service role key ou ajuster politiques

### B. **Table Vide**
- **Symptôme** : Erreur PGRST116 (pas de ligne trouvée)
- **Solution** : Ajouter des données de test

### C. **Structure Incorrecte**
- **Symptôme** : Erreur de colonne manquante
- **Solution** : Vérifier la structure de la table

### D. **Problème de Connexion**
- **Symptôme** : TypeError: fetch failed
- **Solution** : Vérifier les clés et l'URL

## 🎯 Actions Prioritaires

1. **Testez `test-supabase-direct.js` avec vos vraies clés**
2. **Vérifiez la structure de la table dans Supabase**
3. **Ajoutez des données de test si la table est vide**
4. **Vérifiez les politiques RLS**

## 📞 Support

Si le problème persiste après ces tests :
1. **Partagez les résultats** de `test-supabase-direct.js`
2. **Montrez la structure** de la table `watchlists`
3. **Partagez les logs** d'erreur de Supabase

---

**Le problème sera résolu une fois que nous aurons identifié la cause exacte !** 🚀
