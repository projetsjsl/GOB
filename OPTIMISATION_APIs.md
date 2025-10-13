# 🚀 Optimisation du Nombre de Requêtes API

## ⚠️ **PROBLÈME**

Les APIs gratuites ont des limites strictes :
- **FMP** : 250 requêtes/jour
- **Marketaux** : 100 requêtes/jour
- **Gemini** : 60 requêtes/minute

**Sans optimisation**, vous pouvez atteindre ces limites en quelques heures d'utilisation.

---

## ✅ **SOLUTIONS IMPLÉMENTÉES**

### **1. Système de Cache Intelligent** 💾

**Fichier créé** : `public/api-cache-manager.js`

**Fonctionnalités** :
- ✅ Cache localStorage avec expiration automatique
- ✅ Durées adaptées par type de données :
  - Quotes (prix) : 2 minutes
  - Profils : 24 heures
  - Ratios : 6 heures
  - News : 15 minutes
  - Intraday : 5 minutes
- ✅ Nettoyage automatique du cache expiré
- ✅ Gestion des erreurs QuotaExceeded

**Réduction estimée** : **-70% de requêtes**

---

### **2. Compteur de Requêtes Visible** 📊

**À intégrer dans le dashboard** :

```javascript
// Afficher le compteur en temps réel
const stats = window.apiCache.getStats();

console.log(`📊 Requêtes aujourd'hui: ${stats.requestsToday}/250 FMP`);
console.log(`💾 Cache: ${stats.entries} entrées (${stats.totalSize})`);
```

**Avertissement automatique** si > 200 requêtes/jour

---

### **3. Optimisations du Code** 🔧

#### **A. Désactiver le rafraîchissement automatique**

**Dans `beta-combined-dashboard.html`**, ligne ~6932 :

```javascript
// AVANT (❌ Rafraîchit toutes les 60 secondes)
const interval = setInterval(fetchData, 60000);

// APRÈS (✅ Rafraîchissement MANUEL uniquement)
// const interval = setInterval(fetchData, 60000); // Commenté
// Utilisez le bouton de rafraîchissement à la place
```

**Économie** : -95% de requêtes automatiques

---

#### **B. Utiliser le cache pour toutes les requêtes**

**Exemple d'intégration** :

```javascript
// AVANT (❌ Pas de cache)
const response = await fetch(`/api/fmp?endpoint=profile&symbol=${symbol}`);
const data = await response.json();

// APRÈS (✅ Avec cache automatique)
const data = await window.apiCache.fetchWithCache(
    `/api/fmp?endpoint=profile&symbol=${symbol}`,
    {},
    'profile' // Type de cache (24h)
);
```

---

#### **C. Limiter les appels parallèles**

**Dans `fetchRealStockData`**, réduire les appels :

```javascript
// AVANT (❌ 7 appels parallèles)
const [quote, profile, ratios, news, intraday, historicalRatios, sma] = await Promise.allSettled([...]);

// APRÈS (✅ 4 appels essentiels seulement)
const [quote, profile, ratios, news] = await Promise.allSettled([
    fetch(`/api/marketdata?endpoint=quote&symbol=${symbol}`),
    fetch(`/api/fmp?endpoint=profile&symbol=${symbol}`),
    fetch(`/api/fmp?endpoint=ratios&symbol=${symbol}`),
    fetch(`/api/marketaux?endpoint=ticker-sentiment&symbol=${symbol}&limit=5`)
]);
```

**Économie** : -43% de requêtes par chargement

---

### **4. Mode Économique** 🌿

**Option à ajouter dans Admin** :

```javascript
const [economyMode, setEconomyMode] = useState(() => {
    return localStorage.getItem('economyMode') === 'true';
});

// En mode économique :
// - Pas de rafraîchissement auto
// - Cache longue durée (2x)
// - Chargement lazy des news
// - Limite 5 actions max en watchlist
```

---

## 📊 **ESTIMATION DES ÉCONOMIES**

### **Sans optimisation** (utilisation normale) :

| Action | Requêtes | Fréquence | Total/jour |
|--------|----------|-----------|------------|
| Chargement JLab | 7 | 1x/min | 10 080 ❌ |
| Actualisation auto | 7 | 1x/60s | 672 ❌ |
| Changer d'action | 7 | 10x | 70 |
| Emma IA | 1 | 5x | 5 |
| **TOTAL** | | | **10 827** ❌ |

→ **Limite atteinte en 30 minutes !**

---

### **Avec optimisations** :

| Action | Requêtes | Cache | Total/jour |
|--------|----------|-------|------------|
| Chargement JLab | 4 | 2 min | 80 ✅ |
| Actualisation manuelle | 4 | 2 min | 40 ✅ |
| Changer d'action | 4 | Cache hit | 20 ✅ |
| Emma IA | 1 | N/A | 5 ✅ |
| **TOTAL** | | | **145** ✅ |

→ **Reste dans les limites toute la journée ! 🎉**

---

## 🔧 **INTÉGRATION RAPIDE**

### **Étape 1 : Ajouter le cache manager**

Dans `public/beta-combined-dashboard.html`, ajoutez **AVANT** le tag `</head>` :

```html
<script src="/api-cache-manager.js"></script>
```

---

### **Étape 2 : Modifier fetchRealStockData**

Remplacez les `fetch()` par `apiCache.fetchWithCache()` :

```javascript
const quote = await window.apiCache.fetchWithCache(
    `/api/marketdata?endpoint=quote&symbol=${symbol}`,
    {},
    'quote' // Cache 2 minutes
);
```

---

### **Étape 3 : Désactiver auto-refresh**

Commentez la ligne ~6932 :

```javascript
// const interval = setInterval(fetchData, 60000); // ✅ Désactivé
```

---

### **Étape 4 : Ajouter le compteur UI**

Dans le header du dashboard :

```javascript
<div className="text-xs text-gray-500">
    📊 Requêtes: {window.apiCache?.getRequestCount() || 0}/250
</div>
```

---

## 🎯 **CHECKLIST D'OPTIMISATION**

- [ ] Fichier `api-cache-manager.js` ajouté dans `/public`
- [ ] Script chargé dans `<head>` du dashboard
- [ ] Rafraîchissement automatique désactivé
- [ ] `fetchWithCache()` utilisé pour toutes les requêtes
- [ ] Compteur de requêtes visible dans l'UI
- [ ] Cache testé (vérifier console pour "Cache HIT")
- [ ] Limites surveillées quotidiennement

---

## 📈 **MONITORING**

### **Vérifier le cache en temps réel**

Ouvrez la console (F12) et tapez :

```javascript
// Voir les stats
window.apiCache.getStats()

// Voir le nombre de requêtes aujourd'hui
window.apiCache.getRequestCount()

// Vider le cache si besoin
window.apiCache.clearAll()
```

---

## 💡 **BONNES PRATIQUES**

1. **Rafraîchir manuellement** seulement quand nécessaire
2. **Fermer les onglets** inutilisés du dashboard
3. **Utiliser le cache** - Ne pas vider localStorage
4. **Surveiller le compteur** - S'il dépasse 200, limitez l'usage
5. **Mode économique** pour usage intensif

---

## 🆘 **SI LIMITE ATTEINTE**

### **Solution immédiate** :
- Attendez 24h (reset à minuit UTC)
- Utilisez les données en cache (valides plusieurs heures)
- Mode offline : Le dashboard continue de fonctionner avec le cache

### **Solution long terme** :
- Upgradez FMP ($14/mois = 100 000 req/mois)
- Ou contactez-les pour plan étudiant/startup gratuit

---

## 📞 **SUPPORT**

**FMP** : https://site.financialmodelingprep.com/pricing  
**Marketaux** : https://www.marketaux.com/pricing

---

**Date** : 12 octobre 2025  
**Objectif** : Réduire de 70-90% le nombre de requêtes API  
**Status** : ✅ Prêt à déployer

