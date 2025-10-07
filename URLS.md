# 🌐 URLs du Projet GOB Apps

## 📍 **URLs Principales (Production)**

### **Domaine Principal**
```
https://gobapps.com
```

### **Pages Disponibles**

1. **Dashboard Financier Beta (Principal)**
   ```
   https://gobapps.com/beta-combined-dashboard.html
   ```
   - Dashboard financier complet avec React
   - Tickers: CVS, MSFT, MGA, GOOG, MU, BRK.B, UNH, PFE, BCE, T
   - Onglets: Seeking Alpha + Stocks & News
   - APIs: Finnhub, NewsAPI, Seeking Alpha

2. **Page de Test Simple**
   ```
   https://gobapps.com/test-simple.html
   ```
   - Page de test pour vérifier le déploiement
   - Statut du serveur
   - Liens vers le dashboard principal

3. **Page d'Accueil (React App)**
   ```
   https://gobapps.com/
   ```
   - Application React principale (compilée avec Vite)
   - Interface JSL AI

## 🔌 **APIs Disponibles**

### **API Finnhub**
```
https://gobapps.com/api/finnhub?endpoint=quote&symbol=MSFT
```
**Endpoints disponibles:**
- `quote` - Prix en temps réel
- `profile` - Profil de l'entreprise
- `news` - Actualités
- `recommendation` - Recommandations d'analystes
- `peers` - Pairs de l'industrie
- `earnings` - Résultats financiers
- `insider-transactions` - Transactions d'initiés
- `financials` - États financiers
- `candles` - Données de chandelier
- `search` - Recherche de symboles

### **API News**
```
https://gobapps.com/api/news?q=MSFT+OR+AAPL&limit=20
```
**Paramètres:**
- `q` - Requête de recherche (tickers séparés par OR)
- `limit` - Nombre d'articles (défaut: 10)

### **API Fallback**
```
https://gobapps.com/api/fallback?endpoint=quote&symbol=MSFT
```
**Note:** Données de démonstration si les APIs principales échouent

### **API Status**
```
https://gobapps.com/api/status?test=true
```
**Note:** Vérification de l'état de toutes les APIs

## 📂 **Fichiers JSON Statiques**

### **Analyse Seeking Alpha**
```
https://gobapps.com/seeking-alpha/stock_analysis.json
```

### **Données Stock Seeking Alpha**
```
https://gobapps.com/seeking-alpha/stock_data.json
```

## ⚙️ **Configuration Vercel**

**Nom du projet:** `gob-apps`

**Domaine personnalisé:** `gobapps.com`

**Ancienne URL (OBSOLÈTE):** ~~mygob.vercel.app~~ ❌

## 🚀 **Déploiement**

**Automatique via GitHub:**
- Push sur `main` → Déploiement automatique
- Temps de déploiement: ~30-60 secondes
- Cache: `public, max-age=0, must-revalidate`

## 🔍 **Test des URLs**

Pour tester si une page fonctionne:

1. **Mode Incognito** (Ctrl+Shift+N)
2. **Hard Refresh** (Ctrl+Shift+R)
3. **Vider le cache** puis recharger

## 📊 **Tickers Configurés**

```
CVS, MSFT, MGA, GOOG, MU, BRK.B, UNH, PFE, BCE, T
```

## 🎯 **URL Recommandée pour Accès Direct**

**Pour utiliser le dashboard financier:**
```
https://gobapps.com/beta-combined-dashboard.html
```

**Pour tester rapidement:**
```
https://gobapps.com/test-simple.html
```

---

**Dernière mise à jour:** 2025-01-07
**Status:** ✅ Opérationnel
**Domaine:** gobapps.com

