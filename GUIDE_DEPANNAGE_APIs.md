# 🆘 GUIDE DE DÉPANNAGE RAPIDE - APIs GOB

**Version :** 1.0  
**Date :** 12 octobre 2025

---

## 🚨 PROBLÈME #1 : Emma IA ne répond pas

### Symptômes
- Message d'erreur : "Erreur de connexion à l'API Gemini"
- Console : `❌ Erreur API: 500`
- Emma affiche : "Diagnostic : Erreur API: 500"

### Cause
`GEMINI_API_KEY` n'est pas configurée dans Vercel

### Solution (5 minutes)

1. **Obtenir une clé Gemini (GRATUIT)**
   - Va sur : https://ai.google.dev/
   - Clique sur "Get API Key" (bouton bleu)
   - Connecte-toi avec ton compte Google
   - Clique sur "Create API Key in new project"
   - Copie la clé (commence par `AIza...`)

2. **Ajouter la clé dans Vercel**
   - Va sur : https://vercel.com/projetsjsl/gob/settings/environment-variables
   - Clique "Add New"
   - **Name :** `GEMINI_API_KEY`
   - **Value :** Colle ta clé `AIza...`
   - **Environments :** Coche les 3 (Production, Preview, Development)
   - Clique "Save"

3. **Redéployer**
   - Va dans l'onglet "Deployments"
   - Clique sur le dernier déploiement
   - Clique "Redeploy"
   - Attends 1-2 minutes

4. **Vérifier**
   ```bash
   curl https://gob-apps.vercel.app/api/gemini-key
   ```
   Tu devrais voir `"hasKey": true`

---

## 🚨 PROBLÈME #2 : Données financières ne se chargent pas

### Symptômes
- Prix des actions affichent "N/A"
- Message : "Mode démonstration"
- Console : `Failed to load resource: 500`

### Cause
`FMP_API_KEY` invalide ou quota dépassé

### Solution

1. **Vérifier la clé FMP**
   - Test direct : https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=TACLÉ
   - Si erreur "Invalid API key", la clé est incorrecte

2. **Obtenir une nouvelle clé**
   - Va sur : https://site.financialmodelingprep.com/register
   - Inscris-toi (gratuit)
   - Copie ta nouvelle clé API
   - Remplace dans Vercel : https://vercel.com/projetsjsl/gob/settings/environment-variables

3. **Vérifier le quota**
   - Gratuit : 250 requêtes/jour
   - Si dépassé, attends le lendemain ou upgrade
   - Avec l'optimisation actuelle, tu devrais être bien en dessous

4. **Vérifier dans le dashboard**
   - Ouvre : https://gob-apps.vercel.app
   - Ouvre la console (F12)
   - Cherche : `api/fmp`
   - Status 200 = OK, 500 = problème

---

## 🚨 PROBLÈME #3 : Actualités ne s'affichent pas

### Symptômes
- Section "News" vide
- Console : `Failed to load resource: 503`

### Cause
Plusieurs sources d'actualités possibles, vérifier chacune

### Solution

1. **Finnhub** (priorité 1)
   - Vérifier : `FINNHUB_API_KEY` dans Vercel
   - Obtenir : https://finnhub.io/register
   - Quota : 60 appels/minute

2. **NewsAPI** (optionnel)
   - Vérifier : `NEWSAPI_KEY` dans Vercel
   - Obtenir : https://newsapi.org/register
   - Quota : 100 requêtes/jour

3. **MarketAux** (optionnel)
   - Vérifier : `MARKETAUX_API_KEY` dans Vercel
   - Obtenir : https://www.marketaux.com/

---

## 🚨 PROBLÈME #4 : Trop de requêtes API

### Symptômes
- Message "Rate limit exceeded"
- Certaines données ne se chargent plus
- Emails des providers d'APIs

### Cause
Trop d'utilisations ou auto-refresh encore actif

### Solution

1. **Vérifier l'optimisation**
   - Ouvre la console (F12)
   - Cherche : `🔄 Auto-refresh`
   - Si présent, l'optimisation n'est PAS déployée
   - Redéploie : `git pull && git push`

2. **Quotas à respecter**
   - FMP : 250/jour (8 sessions max)
   - Finnhub : 60/minute (largement suffisant)
   - Alpha Vantage : 25/jour (fallback seulement)
   - Gemini : 1500/jour (50+ conversations)

3. **Mode économique manuel**
   - N'ouvre le dashboard que quand nécessaire
   - Utilise les boutons refresh plutôt que recharger la page
   - Cache les données localement (automatique)

---

## 🚨 PROBLÈME #5 : Site inaccessible (404)

### Symptômes
- `gob-apps.vercel.app` affiche "404 Not Found"
- Message "Deployment could not be found"

### Cause
Déploiement en cours ou échec du build

### Solution

1. **Vérifier le statut Vercel**
   - Va sur : https://vercel.com/projetsjsl/gob
   - Regarde l'onglet "Deployments"
   - Status : "Building", "Ready", ou "Error"

2. **Si "Building"**
   - Attends 2-3 minutes
   - Rafraîchis la page

3. **Si "Error"**
   - Clique sur le déploiement
   - Lis les logs d'erreur
   - Cherche les erreurs de build
   - Corrige le code et push

4. **Forcer un nouveau déploiement**
   ```bash
   cd GOB
   git commit --allow-empty -m "Force redeploy"
   git push
   ```

---

## 🚨 PROBLÈME #6 : Erreurs CORS

### Symptômes
- Console : `CORS policy: No 'Access-Control-Allow-Origin'`
- Requêtes API bloquées

### Cause
Headers CORS non configurés

### Solution

1. **Vérifier vercel.json**
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

2. **Si manquant, redéployer**
   ```bash
   git add vercel.json
   git commit -m "Fix CORS headers"
   git push
   ```

---

## 🧪 TESTER LES APIs AUTOMATIQUEMENT

### Script de test complet

```bash
cd GOB
./test-apis-production.sh
```

Ce script teste :
- ✅ Accessibilité du site
- ✅ Gemini API (Emma)
- ✅ FMP (données financières)
- ✅ Market Data (Finnhub, etc.)
- ✅ News APIs
- ✅ Status général

### Résultat attendu
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RÉSUMÉ DES TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total des tests: 10
Tests réussis: 8
Tests échoués: 2

Taux de réussite: 80%
```

---

## 📞 COMMANDES DE DIAGNOSTIC RAPIDE

### Vérifier Gemini
```bash
curl https://gob-apps.vercel.app/api/gemini-key
```
**Attendu :** `{"hasKey": true}`

### Vérifier FMP
```bash
curl "https://gob-apps.vercel.app/api/fmp?endpoint=quote&symbol=AAPL"
```
**Attendu :** Prix et données d'Apple

### Vérifier News
```bash
curl "https://gob-apps.vercel.app/api/news?q=finance&limit=5"
```
**Attendu :** Liste de 5 actualités

### Vérifier Status général
```bash
curl https://gob-apps.vercel.app/api/status
```
**Attendu :** État de toutes les APIs

---

## 🔍 LOGS VERCEL

Pour voir les logs en temps réel :

1. Va sur : https://vercel.com/projetsjsl/gob
2. Clique sur "Deployments"
3. Clique sur le dernier déploiement
4. Onglet "Functions"
5. Clique sur une fonction (ex: `api/gemini/chat.js`)
6. Lis les logs

Cherche :
- ❌ Erreurs rouges
- ⚠️ Warnings jaunes
- ✅ Succès verts

---

## 📚 DOCUMENTATION COMPLÈTE

Pour plus de détails :
- **Audit complet :** `AUDIT_APIs.md`
- **Configuration clés :** `CONFIGURATION_CLES_API.md`
- **Démarrage rapide :** `DEMARRAGE_RAPIDE.md`
- **Vérification :** `VERIFIER_CLES_API.md`
- **Optimisation :** `OPTIMISATION_APIs.md`

---

## 🆘 AIDE URGENTE

Si tu es bloqué :

1. **Vérifie l'audit** : `cat AUDIT_APIs.md`
2. **Lance les tests** : `./test-apis-production.sh`
3. **Consulte les logs Vercel**
4. **Vérifie les variables d'env** : https://vercel.com/projetsjsl/gob/settings/environment-variables

---

## ✅ CHECKLIST RAPIDE

Avant de paniquer, vérifie :

- [ ] Le site est accessible : `curl https://gob-apps.vercel.app`
- [ ] `GEMINI_API_KEY` configurée dans Vercel
- [ ] `FMP_API_KEY` configurée et valide
- [ ] Déploiement Vercel en status "Ready"
- [ ] Console browser sans erreurs 500
- [ ] Cache browser vidé (Ctrl+Shift+R)
- [ ] Quotas API non dépassés

---

**💡 Astuce :** La plupart des problèmes sont résolus en configurant `GEMINI_API_KEY` et en redéployant !

