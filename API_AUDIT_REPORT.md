# Audit Complet des APIs - GOB Dashboard

**Date:** 26 Décembre 2025
**Total d'endpoints API:** 101
**Branche:** `claude/validate-vercel-deployment-BGrrA`

---

## Vue d'Ensemble

Le dashboard GOB possède **101 fichiers API** répartis dans plusieurs catégories fonctionnelles.

### Répartition par Catégorie

| Catégorie | Nombre | Description |
|-----------|--------|-------------|
| Market Data | 15 | FMP, Finnhub, données de marché |
| Emma/AI | 12 | Agent IA, chat, orchestrateur |
| Briefings | 8 | Génération et envoi de briefings |
| Calendriers | 3 | Earnings, dividendes, économique |
| Administration | 13 | Configuration, tickers, LLM |
| Adapters | 3 | SMS, Email, Messenger |
| GroupChat | 10 | Chat de groupe intégré |
| Supabase | 4 | Watchlist, cache, conversation |
| Cron Jobs | 3 | Tâches planifiées |
| Autres | 30 | Utilitaires, proxy, configuration |

---

## APIs Critiques à Tester

### 1. Market Data (Priorité HAUTE)

#### `/api/marketdata/batch.js`
- **Fonction:** Récupération batch de données de marché
- **Timeout Vercel:** 30s
- **Test:**
  ```bash
  curl "https://gobapps.com/api/marketdata/batch?symbols=AAPL,GOOGL,MSFT"
  ```
- **Attendu:** JSON avec quotes pour AAPL, GOOGL, MSFT
- **Dépendances:** FMP API key

#### `/api/fmp.js`
- **Fonction:** Proxy vers Financial Modeling Prep API
- **Endpoints multiples:** quote, profile, ratios, etc.
- **Test:**
  ```bash
  curl "https://gobapps.com/api/fmp?endpoint=quote&symbol=AAPL"
  ```

#### `/api/finnhub.js`
- **Fonction:** Données de marché Finnhub
- **Test:**
  ```bash
  curl "https://gobapps.com/api/finnhub?symbol=AAPL"
  ```

---

### 2. Emma/AI Services (Priorité HAUTE)

#### `/api/emma-agent.js`
- **Fonction:** Agent IA principal Emma
- **Timeout Vercel:** 300s (5 min)
- **Test:**
  ```bash
  curl -X POST https://gobapps.com/api/emma-agent \
    -H "Content-Type: application/json" \
    -d '{"message":"Bonjour Emma","conversationId":"test-123"}'
  ```
- **Attendu:** Réponse streaming de l'agent
- **Dépendances:** Anthropic API, Supabase

#### `/api/gemini/chat.js`
- **Fonction:** Chat avec Gemini
- **Timeout Vercel:** 30s
- **Test:**
  ```bash
  curl -X POST https://gobapps.com/api/gemini/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"Test","history":[]}'
  ```

#### `/api/ai-services.js`
- **Fonction:** Services IA consolidés
- **Timeout Vercel:** 120s
- **Fonctions multiples:** market analysis, briefings, etc.

---

### 3. Briefings (Priorité HAUTE)

#### `/api/briefing.js`
- **Fonction:** Génération de briefings
- **Timeout Vercel:** 60s
- **Test:**
  ```bash
  curl "https://gobapps.com/api/briefing?type=morning"
  ```
- **Attendu:** Briefing matinal formaté

#### `/api/emma-briefing.js`
- **Fonction:** Briefing généré par Emma
- **Timeout Vercel:** 45s
- **Test:**
  ```bash
  curl "https://gobapps.com/api/emma-briefing?type=evening"
  ```

#### `/api/send-briefing.js`
- **Fonction:** Envoi de briefings par email
- **Dépendances:** Resend API

---

### 4. Calendriers (Priorité MOYENNE)

#### `/api/calendar-earnings.js`
- **Fonction:** Calendrier des résultats financiers
- **Timeout Vercel:** 15s
- **Test:**
  ```bash
  curl "https://gobapps.com/api/calendar-earnings"
  ```
- **Attendu:** Liste des earnings à venir

#### `/api/calendar-dividends.js`
- **Fonction:** Calendrier des dividendes
- **Timeout Vercel:** 15s

---

### 5. Watchlist & Supabase (Priorité HAUTE)

#### `/api/supabase-watchlist.js`
- **Fonction:** Gestion de watchlist dans Supabase
- **Timeout Vercel:** 15s
- **Test:**
  ```bash
  curl "https://gobapps.com/api/supabase-watchlist?action=list"
  ```
- **Attendu:** Liste des tickers dans la watchlist
- **Dépendances:** Supabase credentials

#### `/api/supabase-conversation.js`
- **Fonction:** Historique de conversation
- **Dépendances:** Supabase

---

### 6. News & Analysis (Priorité MOYENNE)

#### `/api/news.js`
- **Fonction:** Agrégation de news multi-sources
- **Timeout Vercel:** 30s
- **Test:**
  ```bash
  curl "https://gobapps.com/api/news?query=AAPL&limit=10"
  ```
- **Attendu:** Articles de news filtrés

#### `/api/finviz-news.js`
- **Fonction:** News depuis Finviz
- **Timeout Vercel:** 15s

#### `/api/finviz-why-moving.js`
- **Fonction:** Raisons des mouvements de prix
- **Timeout Vercel:** 15s

---

### 7. Screeners (Priorité MOYENNE)

#### `/api/fmp-stock-screener.js`
- **Fonction:** Screener de stocks
- **Timeout Vercel:** 30s
- **Test:**
  ```bash
  curl "https://gobapps.com/api/fmp-stock-screener?marketCapMoreThan=1000000000"
  ```

#### `/api/rsi-screener.js`
- **Fonction:** Screener basé sur RSI
- **Timeout Vercel:** 300s (5 min)

---

### 8. Administration (Priorité BASSE - Protected)

#### `/api/admin/tickers.js`
- **Fonction:** Gestion des tickers
- **Timeout Vercel:** 15s
- **Protection:** Devrait nécessiter authentification

#### `/api/admin/emma-config.js`
- **Fonction:** Configuration d'Emma
- **Protection:** Admin only

---

## Configuration Vercel Validée

### Timeouts Configurés

Vérification dans `vercel.json`:

```json
"functions": {
  "api/emma-agent.js": { "maxDuration": 300 },      // ✅ 5 min
  "api/briefing.js": { "maxDuration": 60 },          // ✅ 1 min
  "api/ai-services.js": { "maxDuration": 120 },      // ✅ 2 min
  "api/marketdata/batch.js": { "maxDuration": 30 },  // ✅ 30s
  "api/gemini/chat.js": { "maxDuration": 30 },       // ✅ 30s
  // ... etc
}
```

✅ **Tous les endpoints critiques ont des timeouts appropriés**

### Headers CORS

```json
"headers": [{
  "source": "/api/(.*)",
  "headers": [
    { "key": "Access-Control-Allow-Origin", "value": "*" },
    { "key": "Access-Control-Allow-Methods", "value": "GET,POST,OPTIONS" },
    { "key": "Access-Control-Allow-Headers", "value": "Content-Type" }
  ]
}]
```

✅ **CORS configuré correctement**

---

## Variables d'Environnement Requises

### APIs Externes

| Variable | Service | Requis Pour |
|----------|---------|-------------|
| `FMP_API_KEY` | Financial Modeling Prep | Market data, screeners |
| `FINNHUB_API_KEY` | Finnhub | Alternative market data |
| `ANTHROPIC_API_KEY` | Claude (Anthropic) | Emma agent |
| `GOOGLE_GEMINI_API_KEY` | Gemini | Chat alternatif |
| `RESEND_API_KEY` | Resend | Envoi d'emails |
| `TWILIO_ACCOUNT_SID` | Twilio | SMS |
| `TWILIO_AUTH_TOKEN` | Twilio | SMS |

### Base de Données

| Variable | Service | Requis Pour |
|----------|---------|-------------|
| `SUPABASE_URL` | Supabase | Watchlist, conversations, cache |
| `SUPABASE_SERVICE_KEY` | Supabase | Accès backend |

### Configuration

| Variable | Utilisation |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL de base de l'API |
| `VERCEL_URL` | URL automatique Vercel |

---

## Script de Test Automatisé

### test-all-apis.sh

```bash
#!/bin/bash

# Configuration
BASE_URL=${1:-"https://gobapps.com"}
RESULTS_FILE="api-test-results-$(date +%Y%m%d-%H%M%S).json"

echo "🔍 Testing APIs on $BASE_URL"
echo "Results will be saved to: $RESULTS_FILE"

# Initialize results
echo "{\"timestamp\": \"$(date -Iseconds)\", \"base_url\": \"$BASE_URL\", \"tests\": [" > $RESULTS_FILE

# Test counter
total=0
passed=0
failed=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local expected_status=${4:-200}

    total=$((total + 1))
    echo -n "Testing $name... "

    http_code=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$url")

    if [ "$http_code" -eq "$expected_status" ]; then
        echo "✅ PASS ($http_code)"
        passed=$((passed + 1))
        result="PASS"
    else
        echo "❌ FAIL (got $http_code, expected $expected_status)"
        failed=$((failed + 1))
        result="FAIL"
    fi

    # Add to JSON (simplified)
    echo "{\"name\": \"$name\", \"url\": \"$url\", \"status\": $http_code, \"result\": \"$result\"}," >> $RESULTS_FILE
}

echo ""
echo "=== Market Data APIs ==="
test_endpoint "FMP Quote" "$BASE_URL/api/fmp?endpoint=quote&symbol=AAPL" GET 200
test_endpoint "Market Data Batch" "$BASE_URL/api/marketdata/batch?symbols=AAPL,GOOGL" GET 200
test_endpoint "Finnhub" "$BASE_URL/api/finnhub?symbol=AAPL" GET 200

echo ""
echo "=== Calendar APIs ==="
test_endpoint "Calendar Earnings" "$BASE_URL/api/calendar-earnings" GET 200
test_endpoint "Calendar Dividends" "$BASE_URL/api/calendar-dividends" GET 200

echo ""
echo "=== News APIs ==="
test_endpoint "News" "$BASE_URL/api/news?query=AAPL&limit=5" GET 200
test_endpoint "Finviz News" "$BASE_URL/api/finviz-news" GET 200

echo ""
echo "=== Supabase APIs ==="
test_endpoint "Supabase Watchlist" "$BASE_URL/api/supabase-watchlist?action=list" GET 200

echo ""
echo "=== Configuration APIs ==="
test_endpoint "Gemini Key Status" "$BASE_URL/api/gemini-key" GET 200
test_endpoint "LLM Models" "$BASE_URL/api/llm-models" GET 200

# Finalize JSON
echo "{}]}" >> $RESULTS_FILE

# Summary
echo ""
echo "======================================"
echo "📊 Test Summary"
echo "======================================"
echo "Total tests: $total"
echo "Passed: $passed ($(awk "BEGIN {printf \"%.1f\", ($passed/$total)*100}")%)"
echo "Failed: $failed ($(awk "BEGIN {printf \"%.1f\", ($failed/$total)*100}")%)"
echo ""
echo "Full results saved to: $RESULTS_FILE"

# Exit with error if any test failed
if [ $failed -gt 0 ]; then
    exit 1
fi
```

**Usage:**
```bash
chmod +x test-all-apis.sh
./test-all-apis.sh https://gobapps.com
```

---

## Tests Manuels Recommandés

### Test 1: Dashboard Principal

1. Ouvrir `https://gobapps.com/beta-combined-dashboard.html`
2. Vérifier que les données se chargent dans chaque onglet:
   - [ ] IntelliStocks (données de marché)
   - [ ] Dans Watchlist (watchlist Supabase)
   - [ ] Markets & Economy (TradingView widgets)
   - [ ] Finance Pro (snapshots)
   - [ ] Ask Emma (chat fonctionnel)

### Test 2: Emma Agent

```bash
curl -X POST https://gobapps.com/api/emma-agent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Quelle est la capitalisation boursière d Apple?",
    "conversationId": "test-audit-001",
    "useStreaming": false
  }'
```

**Attendu:** Réponse structurée avec la capitalisation d'Apple

### Test 3: Briefing Complet

```bash
curl "https://gobapps.com/api/briefing?type=morning" > briefing-test.html
open briefing-test.html
```

**Vérifier:**
- [ ] HTML bien formaté
- [ ] Données de marché présentes
- [ ] Pas d'erreurs de template

### Test 4: Watchlist CRUD

```bash
# List
curl "https://gobapps.com/api/supabase-watchlist?action=list"

# Add (nécessite authentification)
curl -X POST https://gobapps.com/api/supabase-watchlist \
  -H "Content-Type: application/json" \
  -d '{"action":"add","ticker":"AAPL"}'

# Remove
curl -X POST https://gobapps.com/api/supabase-watchlist \
  -H "Content-Type: application/json" \
  -d '{"action":"remove","ticker":"AAPL"}'
```

---

## Problèmes Identifiés

### 1. Accès Bloqué (Erreur 403)

**Symptôme:**
```
curl -I https://gobapps.com
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
```

**Causes possibles:**
1. Protection de déploiement Vercel activée
2. Configuration DNS incorrecte pour gobapps.com
3. Firewall/WAF bloquant certaines IPs

**Action requise:**
- Vérifier la configuration du domaine dans Vercel Dashboard
- Désactiver "Deployment Protection" si activée
- Vérifier les DNS records pour gobapps.com

### 2. Variables d'Environnement

**À vérifier dans Vercel Dashboard:**
- [ ] Toutes les API keys sont configurées
- [ ] SUPABASE_URL et SUPABASE_SERVICE_KEY sont présents
- [ ] Les variables sont disponibles dans l'environnement Production

---

## Endpoints Non Configurés dans vercel.json

Certains fichiers API n'ont **pas** de timeout spécifique dans `vercel.json` et utilisent donc le défaut (10s).

**Endpoints sans timeout configuré:** (potentiellement problématiques si >10s)

- `/api/auth.js`
- `/api/chat.js`
- `/api/orchestrator.js`
- `/api/orchestrator-stream.js`
- `/api/scrape-seeking-alpha.js`
- `/api/seeking-alpha-batch.js`
- `/api/seeking-alpha-scraping.js`

**Recommandation:** Ajouter des timeouts explicites pour ces endpoints s'ils font des opérations longues.

---

## Checklist de Validation Post-Déploiement

### Étape 1: Accès de Base
- [ ] `https://gobapps.com` accessible (pas de 403)
- [ ] Dashboard charge correctement
- [ ] Pas d'erreur dans la console du navigateur

### Étape 2: APIs Critiques
- [ ] `/api/fmp?endpoint=quote&symbol=AAPL` retourne des données
- [ ] `/api/marketdata/batch?symbols=AAPL,GOOGL` fonctionne
- [ ] `/api/supabase-watchlist?action=list` retourne la watchlist

### Étape 3: Emma/AI
- [ ] `/api/emma-agent` répond aux questions
- [ ] `/api/gemini/chat` fonctionne
- [ ] Pas de timeout (vérifier les logs Vercel)

### Étape 4: Briefings
- [ ] `/api/briefing?type=morning` génère un briefing
- [ ] Le HTML est bien formaté
- [ ] Les données sont à jour

### Étape 5: Performance
- [ ] Temps de réponse < 2s pour les endpoints simples
- [ ] Pas d'erreurs 5xx dans les logs Vercel
- [ ] Monitoring Vercel montre un taux de succès >99%

---

## Recommandations

### Priorité HAUTE

1. **Résoudre le problème 403**
   - Vérifier la configuration du domaine gobapps.com
   - Tester avec l'URL vercel.app directe

2. **Ajouter monitoring**
   - Configurer des alertes Vercel pour les erreurs 5xx
   - Monitorer les timeouts API

3. **Tester les endpoints critiques**
   - Exécuter le script de test automatisé
   - Valider que les APIs retournent des données correctes

### Priorité MOYENNE

4. **Documenter les authentifications**
   - Quels endpoints nécessitent une auth?
   - Comment l'auth est-elle gérée?

5. **Configurer les timeouts manquants**
   - Ajouter timeouts pour les endpoints sans configuration

6. **Rate limiting**
   - Implémenter un rate limiting pour les APIs publiques

### Priorité BASSE

7. **Tests d'intégration**
   - Créer des tests automatisés pour les flows critiques
   - Ajouter des tests E2E avec Playwright

---

## Conclusion

**Total d'endpoints:** 101
**Configuration Vercel:** ✅ Bonne (timeouts, CORS)
**Problème bloquant:** ❌ Accès 403 (à résoudre)
**Next steps:** Résoudre le 403, puis tester les APIs critiques

---

**Rapport généré par:** Claude Code (Anthropic)
**Pour tester:** Une fois le problème 403 résolu, exécuter `test-all-apis.sh`
