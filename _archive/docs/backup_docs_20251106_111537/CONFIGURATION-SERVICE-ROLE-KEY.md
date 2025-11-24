# 🔑 Configuration de la Service Role Key pour Supabase

## 🎯 Objectif

Utiliser la **Service Role Key** de Supabase pour contourner les restrictions RLS (Row Level Security) et permettre à l'API watchlist de fonctionner correctement.

## 📋 Étapes de Configuration

### 1. Récupérer la Service Role Key

1. **Connectez-vous à Supabase** : https://supabase.com/dashboard
2. **Sélectionnez votre projet** (gob-watchlist)
3. **Allez dans Settings > API**
4. **Copiez la "service_role" key** (pas l'anon key)
   - Elle commence généralement par `eyJ...`
   - Elle est plus longue que l'anon key

### 2. Ajouter la Variable d'Environnement dans Vercel

1. **Allez dans Vercel Dashboard** : https://vercel.com/projetsjsl/gob/settings/environment-variables
2. **Cliquez sur "Add New"**
3. **Configurez la variable** :
   - **Name** : `SUPABASE_SERVICE_ROLE_KEY`
   - **Value** : Votre service role key
   - **Environments** : ✅ Production, ✅ Preview, ✅ Development
4. **Cliquez sur "Save"**

### 3. Test Local (Optionnel)

1. **Ouvrez** `test-service-role-local.js`
2. **Remplacez les valeurs** :
   ```javascript
   const SUPABASE_URL = 'https://votre-projet.supabase.co';
   const SUPABASE_SERVICE_ROLE_KEY = 'eyJ...votre-service-role-key';
   ```
3. **Exécutez** : `node test-service-role-local.js`

### 4. Déployer les Changements

1. **Commitez les changements** :
   ```bash
   git add .
   git commit -m "feat: Ajouter support Service Role Key pour contourner RLS"
   git push
   ```

2. **Attendez le déploiement** (2-3 minutes)

3. **Testez l'API** :
   ```bash
   node test-supabase-watchlist.js
   ```

## 🔍 Vérification

### Test de l'API

```bash
# Test GET
curl https://gobapps.com/api/supabase-watchlist

# Devrait retourner :
{
  "success": true,
  "tickers": ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"],
  "count": 5,
  "source": "supabase"
}
```

### Test du Dashboard

1. **Ouvrez** : https://gobapps.com/beta-combined-dashboard.html
2. **Allez dans l'onglet "⭐ Dan's Watchlist"**
3. **La watchlist devrait se charger automatiquement**

## 🛡️ Sécurité

### Avantages de la Service Role Key

- ✅ **Contourne RLS** : Accès complet à toutes les tables
- ✅ **Pas de restrictions** : Peut lire/écrire toutes les données
- ✅ **Idéal pour les APIs** : Fonctionne côté serveur

### Précautions

- ⚠️ **Ne jamais exposer** la service role key côté client
- ⚠️ **Utiliser seulement** dans les APIs serverless
- ⚠️ **Garder secrète** : Ne pas la commiter dans le code

## 🔧 Dépannage

### Si l'API retourne encore une erreur

1. **Vérifiez les logs Vercel** :
   - Allez dans Functions > supabase-watchlist
   - Regardez les logs d'erreur

2. **Vérifiez la variable d'environnement** :
   - Dans Vercel > Settings > Environment Variables
   - Assurez-vous que `SUPABASE_SERVICE_ROLE_KEY` est bien configurée

3. **Testez localement** :
   ```bash
   node test-service-role-local.js
   ```

### Si la table est vide

1. **Ajoutez des données de test** dans Supabase :
   ```sql
   INSERT INTO watchlists (user_id, tickers) 
   VALUES ('default', '["AAPL", "GOOGL", "MSFT"]');
   ```

2. **Ou utilisez l'API** :
   ```bash
   curl -X POST https://gobapps.com/api/supabase-watchlist \
     -H "Content-Type: application/json" \
     -d '{"action":"save","tickers":["AAPL","GOOGL","MSFT"],"userId":"default"}'
   ```

## 📊 Résultat Attendu

Après configuration :

- ✅ **API fonctionnelle** : `/api/supabase-watchlist` retourne les données
- ✅ **Dashboard opérationnel** : Watchlist se charge automatiquement
- ✅ **Persistance** : Les ajouts/suppressions sont sauvegardés
- ✅ **Pas d'erreurs RLS** : La service role key contourne les restrictions

---

**Note** : La service role key est la solution recommandée pour les APIs qui ont besoin d'un accès complet aux données Supabase.
