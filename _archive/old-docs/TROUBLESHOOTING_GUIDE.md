# 🔧 Guide de Dépannage - Advanced Analysis Tab

## 🚨 Problèmes Identifiés

Basé sur le screenshot, voici les problèmes potentiels et leurs solutions:

---

## ✅ CORRECTION #1: Scripts Modaux Ajoutés

**Problème:** Les nouveaux modaux n'étaient pas chargés dans le HTML principal.

**Solution:** J'ai ajouté les 6 scripts dans `beta-combined-dashboard.html`:

```html
<!-- NEW: Enhanced Analysis Modals with Full API Integration -->
<script type="text/babel" src="/js/dashboard/components/AIStockAnalysisModal.js"></script>
<script type="text/babel" src="/js/dashboard/components/NewsAndSentimentModal.js"></script>
<script type="text/babel" src="/js/dashboard/components/AnalystConsensusModal.js"></script>
<script type="text/babel" src="/js/dashboard/components/EarningsCalendarModal.js"></script>
<script type="text/babel" src="/js/dashboard/components/EconomicEventsModal.js"></script>
<script type="text/babel" src="/js/dashboard/components/WatchlistScreenerModal.js"></script>
```

✅ **Status:** CORRIGÉ

---

## 🔍 Diagnostic des Problèmes d'API

### Problème Potentiel #1: API Keys Manquantes

**Symptôme:** Modaux s'ouvrent mais affichent "Error" ou "No data"

**Vérification:**
1. Ouvrir la console du navigateur (F12)
2. Regarder pour des erreurs comme:
   - `401 Unauthorized`
   - `API_KEY not configured`
   - `PERPLEXITY_API_KEY_INVALID`

**Solution:**
Vérifier que ces clés API sont configurées dans Vercel:
- `PERPLEXITY_API_KEY`
- `OPENAI_API_KEY`
- `FMP_API_KEY`
- `FINNHUB_API_KEY` (optionnel)
- `TWELVE_DATA_API_KEY` (optionnel)

**Comment vérifier:**
```bash
# Tester l'endpoint AI Services
curl https://votre-domaine.vercel.app/api/ai-services

# Devrait retourner:
{
  "status": "healthy",
  "debug": {
    "openai_key": "sk-...XXXX",
    "perplexity_key": "pplx-...XXXX"
  }
}
```

---

### Problème Potentiel #2: Chemin API Incorrect

**Symptôme:** Modaux affichent "blank page" ou "Failed to fetch"

**Vérification Console:**
```
GET https://votre-domaine/api/marketdata?endpoint=quote&symbol=AAPL
Status: 404 Not Found
```

**Solutions:**

#### Option A: Développement Local
Si vous testez en local (http://localhost:3000), les APIs Vercel ne fonctionneront pas.

**Solution:**
```bash
# Lancer le serveur de développement
cd /Users/projetsjsl/Documents/GitHub/GOB
vercel dev
# ou
npm run dev
```

#### Option B: Production
Si vous testez sur le domaine déployé, vérifier:
1. Les APIs sont déployées sur Vercel
2. Le build est récent (redéployer si nécessaire)

```bash
# Redéployer
vercel --prod
```

---

### Problème Potentiel #3: CORS Headers

**Symptôme:** Console affiche "CORS policy blocked"

**Solution:** Les APIs incluent déjà les headers CORS. Vérifier le fichier `/api/marketdata.js`:

```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
```

Si le problème persiste, ajouter dans `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

---

### Problème Potentiel #4: Quotas API Dépassés

**Symptôme:** Certaines modales fonctionnent, d'autres non de manière intermittente

**APIs avec quotas limités:**
- FMP Free: 250 calls/day
- Polygon Free: 5 calls/min
- Perplexity: 50 req/min (premium)

**Solution:** Vérifier les quotas:
```bash
# Check FMP quota
curl https://financialmodelingprep.com/api/v3/profile/AAPL?apikey=VOTRE_CLE

# Si quota dépassé:
{
  "Error Message": "You have reached your request limit"
}
```

**Workaround:** Utiliser le système de cache (déjà implémenté):
- Les données sont cachées 5 min (quotes) à 1h (fundamentals)
- Rafraîchir uniquement si nécessaire

---

## 🧪 Tests de Débogage

### Test 1: Vérifier le Chargement des Scripts

**Ouvrir la console (F12) et taper:**
```javascript
// Vérifier que les modaux sont chargés
console.log('AIStockAnalysisModal:', typeof window.AIStockAnalysisModal);
console.log('NewsAndSentimentModal:', typeof window.NewsAndSentimentModal);
console.log('AnalystConsensusModal:', typeof window.AnalystConsensusModal);
console.log('EarningsCalendarModal:', typeof window.EarningsCalendarModal);
console.log('EconomicEventsModal:', typeof window.EconomicEventsModal);
console.log('WatchlistScreenerModal:', typeof window.WatchlistScreenerModal);

// Tous devraient retourner: "function"
```

**Si retourne "undefined":**
- Les scripts ne sont pas chargés
- Vérifier les chemins dans le HTML
- Regarder les erreurs de compilation Babel dans la console

---

### Test 2: Tester Manuellement une API

**Dans la console:**
```javascript
// Test API Quote
fetch('/api/marketdata?endpoint=quote&symbol=AAPL')
  .then(r => r.json())
  .then(data => console.log('Quote:', data))
  .catch(err => console.error('Error:', err));

// Test AI Services
fetch('/api/ai-services', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    service: 'perplexity',
    prompt: 'Test',
    section: 'news',
    max_tokens: 100
  })
})
  .then(r => r.json())
  .then(data => console.log('AI:', data))
  .catch(err => console.error('Error:', err));
```

---

### Test 3: Vérifier la Watchlist Supabase

**Console:**
```javascript
fetch('/api/supabase-watchlist')
  .then(r => r.json())
  .then(data => console.log('Watchlist:', data.tickers))
  .catch(err => console.error('Error:', err));
```

**Devrait retourner:**
```json
{
  "tickers": ["AAPL", "MSFT", "GOOGL", ...]
}
```

---

## 🔧 Solutions Rapides par Modal

### 1. AI Stock Analysis Modal

**Si vide:**
```javascript
// Console Error probable:
"PERPLEXITY_API_KEY manquante"
"AI service error: 401"
```

**Fix:**
1. Vérifier `PERPLEXITY_API_KEY` dans Vercel
2. Ou passer au mode OpenAI (cliquer le bouton "OpenAI GPT-4o")

---

### 2. News & Sentiment Modal

**Si vide:**
```javascript
// Console Error probable:
"News API error: 404"
"/api/news?symbol=AAPL - 404 Not Found"
```

**Fix:**
1. Vérifier que `/api/news.js` existe et est déployé
2. Vérifier `FMP_API_KEY`

**Workaround:** Utiliser un autre endpoint
```javascript
// Modifier NewsAndSentimentModal.js ligne 26:
const newsResponse = await fetch(`${API_BASE_URL}/api/finviz-news?ticker=${symbol}`);
```

---

### 3. Analyst Consensus Modal

**Si vide:**
```javascript
// Console Error probable:
"Analyst API error: 500"
```

**Fix:**
Vérifier que l'endpoint analyst existe dans `/api/marketdata.js` (ligne 383-429)

**Test:**
```bash
curl "https://votre-domaine/api/marketdata?endpoint=analyst&symbol=AAPL"
```

---

### 4. Earnings Calendar Modal

**Si vide:**
Même diagnostic que Analyst Consensus.

**Test:**
```bash
curl "https://votre-domaine/api/marketdata?endpoint=earnings&symbol=AAPL"
```

---

### 5. Economic Events Modal

**Si vide:**
```javascript
// Console Error probable:
"Economic calendar API error: 404"
```

**Fix:**
Vérifier que `/api/calendar-economic.js` existe et fonctionne.

**Test:**
```bash
curl "https://votre-domaine/api/calendar-economic"
```

**Workaround:** Le modal a un fallback avec données statiques qui devraient toujours s'afficher.

---

### 6. Watchlist Screener Modal

**Si vide:**
```javascript
// Console Error probable:
"Batch API error: 400"
"/api/marketdata/batch - 404 Not Found"
```

**Fix:**
1. Vérifier que `/api/marketdata/batch.js` existe
2. Ce fichier doit être dans le dossier `/api/marketdata/`

**Test:**
```bash
curl "https://votre-domaine/api/marketdata/batch?symbols=AAPL,MSFT&endpoints=quote,fundamentals"
```

---

## 🚀 Checklist de Déploiement

Avant de tester, vérifier:

- [ ] Tous les fichiers modaux sont dans `/public/js/dashboard/components/`
- [ ] Les scripts sont ajoutés dans `beta-combined-dashboard.html`
- [ ] Le code est commité et pushé sur GitHub
- [ ] Vercel a redéployé automatiquement (vérifier dashboard Vercel)
- [ ] Les API keys sont configurées dans Vercel Environment Variables
- [ ] Le domaine de production est accessible

**Redéploiement manuel si nécessaire:**
```bash
cd /Users/projetsjsl/Documents/GitHub/GOB
git push origin main
vercel --prod
```

---

## 📊 Débogage Avancé

### Activer le Mode Debug

**Dans la console:**
```javascript
// Activer les logs détaillés
localStorage.setItem('DEBUG_MODE', 'true');
location.reload();

// Les APIs loggeront maintenant tous les détails
```

### Surveiller les Appels API

**Console → Network Tab:**
1. Ouvrir F12
2. Aller dans l'onglet "Network"
3. Cliquer sur un modal
4. Regarder les requêtes XHR/Fetch
5. Vérifier:
   - Status Code (devrait être 200)
   - Response (devrait contenir des données JSON)
   - Headers (vérifier CORS)

### Erreurs Babel/React Courantes

**Si console affiche:**
```
SyntaxError: Unexpected token '<'
```

**Solution:**
Les fichiers .js doivent être transpilés par Babel. Vérifier:
```html
<script type="text/babel" src="...">
```

**Pas:**
```html
<script src="...">  <!-- ❌ Manque type="text/babel" -->
```

---

## 🆘 Support d'Urgence

Si rien ne fonctionne:

### Option 1: Fallback Statique

Modifier temporairement les modaux pour afficher des données de test:

```javascript
// Dans chaque modal, remplacer le fetch par:
setAnalysisData({
  fullText: "## Test Mode\n\nLes données de test s'affichent. L'API sera connectée bientôt.",
  model: 'test-mode'
});
setLoading(false);
```

### Option 2: Mode Démo

Créer un fichier `/public/demo-data.json`:
```json
{
  "AAPL": {
    "price": 278.85,
    "change": 1.55,
    "changePercent": 0.57,
    "pe": 35.2
  }
}
```

Et charger depuis ce fichier au lieu de l'API.

---

## 📧 Logs à Fournir pour Debug

Si le problème persiste, collecter:

1. **Console Errors** (F12 → Console → Screenshot)
2. **Network Tab** (F12 → Network → Filtrer XHR → Screenshot)
3. **Vercel Logs:**
   ```bash
   vercel logs
   ```
4. **API Test Results:**
   ```bash
   curl https://votre-domaine/api/ai-services
   curl https://votre-domaine/api/marketdata?endpoint=quote&symbol=AAPL
   ```

---

**Créé:** 2025-12-01
**Dernière mise à jour:** 2025-12-01
**Status:** Guide de dépannage actif

Bonne nuit et bon débogage! 🌙
