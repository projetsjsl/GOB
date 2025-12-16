# 🚀 Instructions de Configuration - Cache Nouvelles Supabase

## 📋 Checklist de Déploiement

### 1. ✅ Tables Supabase Créées
- [x] `supabase-news-cache.sql` créé
- [ ] Exécuter le script SQL dans Supabase Dashboard
- [ ] Vérifier que les tables `market_news_cache` et `symbol_news_cache` existent

### 2. ✅ API Routes Créées
- [x] `/api/news/cached.js` - Lecture depuis le cache
- [x] `/api/cron/refresh-news.js` - Actualisation automatique du cache
- [ ] Tester les endpoints après déploiement

### 3. ✅ Configuration Vercel
- [x] `vercel.json` mis à jour avec les crons
- [ ] Variables d'environnement configurées (voir section ci-dessous)

### 4. ✅ Frontend Modifié
- [x] `fetchNews()` utilise maintenant le cache en priorité
- [x] `fetchSymbolNews()` ajoutée pour les nouvelles par symbole
- [ ] Tester l'interface utilisateur

---

## 🔧 Configuration des Variables d'Environnement

### Variables Requises dans Vercel

1. **CRON_SECRET** (Nouvelle)
   ```bash
   # Générer le secret
   ./generate-cron-secret.sh
   
   # Ajouter dans Vercel Dashboard > Settings > Environment Variables
   Name: CRON_SECRET
   Value: [valeur générée par le script]
   Environment: Production, Preview, Development
   ```

2. **Variables Existantes** (Vérifier qu'elles sont configurées)
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `FMP_API_KEY`
   - `MARKETAUX_API_KEY`
   - `ALPHA_VANTAGE_API_KEY` (optionnel)

---

## 🗄️ Configuration Supabase

### 1. Exécuter le Script SQL
```sql
-- Copier le contenu de supabase-news-cache.sql
-- L'exécuter dans Supabase Dashboard > SQL Editor
```

### 2. Vérifier les Tables
```sql
-- Vérifier que les tables existent
SELECT COUNT(*) FROM market_news_cache;
SELECT COUNT(*) FROM symbol_news_cache;

-- Vérifier les index
SELECT indexname FROM pg_indexes WHERE tablename IN ('market_news_cache', 'symbol_news_cache');
```

---

## 🧪 Tests de Validation

### 1. Test de l'API de Cache
```bash
# Test nouvelles générales
curl "https://votre-domaine.vercel.app/api/news/cached?type=general&limit=10"

# Test nouvelles par symbole
curl "https://votre-domaine.vercel.app/api/news/cached?type=symbol&symbol=AAPL&limit=10"
```

### 2. Test du Cron Job
```bash
# Test manuel du refresh (remplacer YOUR_CRON_SECRET)
curl -X POST "https://votre-domaine.vercel.app/api/cron/refresh-news" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 3. Test Frontend
- Ouvrir le dashboard
- Vérifier que les nouvelles se chargent depuis le cache
- Vérifier les messages de statut dans la console

---

## 📊 Monitoring et Logs

### Logs Vercel
- Aller dans Vercel Dashboard > Functions
- Surveiller les logs de `/api/cron/refresh-news`
- Vérifier les erreurs éventuelles

### Logs Supabase
- Aller dans Supabase Dashboard > Logs
- Surveiller les requêtes vers les tables de cache
- Vérifier les performances

### Métriques Attendues
- **Réduction API calls** : 85-95% de moins
- **Performance** : Réponses < 100ms depuis Supabase
- **Fraîcheur** : Nouvelles < 30 min pour générales, < 15 min pour watchlist

---

## 🔄 Fonctionnement du Système

### Cycle de Vie des Nouvelles

1. **Cron Job** (toutes les 15 minutes)
   - Récupère nouvelles depuis 3 sources (Marketaux, FMP, Alpha Vantage)
   - Déduplique par titre
   - Sauvegarde dans Supabase

2. **Frontend** (à chaque chargement)
   - Lit depuis le cache Supabase
   - Si cache vide/vieux → fallback vers API directe
   - Affiche les nouvelles avec indicateur de source

3. **Cache Expiration**
   - Nouvelles générales : 30 minutes
   - Nouvelles par symbole : 15 minutes

### Sources de Nouvelles

| Source | Type | Sentiment | Limite Gratuite |
|--------|------|-----------|-----------------|
| **Marketaux** | Général + Symboles | ✅ Oui | 100 req/jour |
| **FMP** | Financier | ❌ Non | 250 req/jour |
| **Alpha Vantage** | Général + Symboles | ✅ Oui | 25 req/jour |

---

## 🚨 Dépannage

### Problèmes Courants

1. **Cache toujours vide**
   - Vérifier que le cron job s'exécute
   - Vérifier les clés API dans les logs
   - Vérifier la configuration Supabase

2. **Erreur 401 sur cron**
   - Vérifier que `CRON_SECRET` est configuré
   - Vérifier que le secret correspond

3. **Nouvelles pas à jour**
   - Vérifier la fréquence du cron (15 min)
   - Vérifier les limites API
   - Vérifier les logs d'erreur

### Commandes de Debug

```bash
# Vérifier le statut des APIs
curl "https://votre-domaine.vercel.app/api/status"

# Forcer un refresh manuel
curl -X POST "https://votre-domaine.vercel.app/api/cron/refresh-news" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Vérifier le cache Supabase
curl "https://votre-domaine.vercel.app/api/news/cached?type=general&limit=5"
```

---

## 📈 Optimisations Futures

### Court Terme
- [ ] Ajouter plus de sources de nouvelles
- [ ] Implémenter la pagination
- [ ] Ajouter des filtres par sentiment

### Moyen Terme
- [ ] Cache intelligent par utilisateur
- [ ] Notifications push pour nouvelles importantes
- [ ] Analytics d'utilisation

### Long Terme
- [ ] Machine Learning pour curation
- [ ] Intégration avec réseaux sociaux
- [ ] API publique pour développeurs

---

**Date de création** : 2024-10-13  
**Version** : 1.0  
**Statut** : Prêt pour déploiement
