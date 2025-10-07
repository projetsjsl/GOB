# Configuration Finnhub API - GOB Apps

## 📊 API de Données Boursières en Temps Réel

GOB Apps utilise l'API Finnhub pour afficher des données boursières en temps réel dans le bandeau défilant.

---

## 🚀 Configuration Rapide

### 1. **Obtenir une Clé API Finnhub (Gratuite)**

1. Allez sur [https://finnhub.io/](https://finnhub.io/)
2. Cliquez sur **"Get free API key"**
3. Créez un compte (gratuit)
4. Copiez votre clé API depuis le dashboard

### 2. **Configurer dans Vercel**

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet **GOB**
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez une nouvelle variable :
   - **Name** : `FINNHUB_API_KEY`
   - **Value** : `votre_clé_api_finnhub`
   - **Environment** : Production (et Preview si souhaité)
5. Cliquez sur **Save**

### 3. **Redéployer l'Application**

```bash
git push origin main
```

Vercel redéploiera automatiquement avec la nouvelle configuration.

---

## 🧪 Tester la Connexion

### **Option 1 : Via l'Interface Web**

Après le redéploiement, le bandeau boursier affichera :
- ✅ **"Données en temps réel"** si Finnhub est connecté
- ⚠️ **"Données fictives"** si la clé API n'est pas configurée

### **Option 2 : Via le Script de Test**

Exécutez le script de test en local :

```bash
# Définir votre clé API
set FINNHUB_API_KEY=votre_clé_api

# Exécuter le test
node test-finnhub-connection.js
```

Le script testera différents symboles et vous indiquera :
- ✅ Quels symboles fonctionnent
- ❌ Quels symboles ne fonctionnent pas
- 📊 Les données reçues pour chaque symbole

---

## 📋 Symboles Supportés

### **Plan Gratuit Finnhub**

Le plan gratuit de Finnhub supporte :
- ✅ **Actions individuelles** (ex: AAPL, MSFT, TSLA)
- ✅ **Cryptomonnaies** (ex: BINANCE:BTCUSDT)
- ⚠️ **Indices** (limité ou non disponible)
- ⚠️ **Forex** (nécessite un plan payant)

### **Symboles Utilisés dans GOB Apps**

| Symbole GOB | Symbole Finnhub | Type | Support Gratuit |
|-------------|-----------------|------|-----------------|
| SPX | ^GSPC | Indice S&P 500 | ⚠️ Limité |
| IXIC | ^IXIC | Indice NASDAQ | ⚠️ Limité |
| DJI | ^DJI | Indice Dow Jones | ⚠️ Limité |
| TSX | ^GSPTSE | Indice TSX | ⚠️ Limité |
| EURUSD | OANDA:EUR_USD | Forex | ❌ Payant |
| GOLD | OANDA:XAU_USD | Forex | ❌ Payant |
| OIL | OANDA:WTI_USD | Forex | ❌ Payant |
| BTCUSD | BINANCE:BTCUSDT | Crypto | ✅ Gratuit |

---

## 🔧 Solutions Alternatives

Si certains symboles ne fonctionnent pas avec le plan gratuit de Finnhub :

### **Option 1 : Utiliser des ETF au Lieu d'Indices**

Modifiez `/api/finnhub-market-data.js` pour utiliser des ETF :

```javascript
const symbolMapping = {
    'SPX': 'SPY',      // S&P 500 ETF (au lieu de ^GSPC)
    'IXIC': 'QQQ',     // NASDAQ ETF (au lieu de ^IXIC)
    'DJI': 'DIA',      // Dow Jones ETF (au lieu de ^DJI)
    'TSX': 'EWC',      // Canada ETF (au lieu de ^GSPTSE)
    // ...
};
```

### **Option 2 : Combiner Finnhub et Alpha Vantage**

- **Finnhub** : Actions et cryptos
- **Alpha Vantage** : Indices et forex

### **Option 3 : Passer au Plan Payant**

Plans Finnhub : [https://finnhub.io/pricing](https://finnhub.io/pricing)

---

## 🐛 Dépannage

### **Problème : "Données fictives" s'affiche toujours**

**Solutions** :
1. Vérifiez que `FINNHUB_API_KEY` est bien configurée dans Vercel
2. Vérifiez que l'application a été redéployée après l'ajout de la variable
3. Videz le cache du navigateur et rechargez la page
4. Vérifiez les logs Vercel pour voir si l'API est appelée

### **Problème : Erreur "Invalid API key"**

**Solutions** :
1. Vérifiez que votre clé API est valide sur [finnhub.io/dashboard](https://finnhub.io/dashboard)
2. Assurez-vous de ne pas avoir dépassé les limites du plan gratuit (60 requêtes/minute)
3. Régénérez une nouvelle clé API si nécessaire

### **Problème : Certains symboles retournent des erreurs**

**Solutions** :
1. Vérifiez que les symboles sont supportés par votre plan Finnhub
2. Utilisez des ETF au lieu d'indices (voir Option 1 ci-dessus)
3. Consultez la documentation Finnhub pour les symboles corrects

---

## 📊 Limites du Plan Gratuit

| Fonctionnalité | Limite Gratuite |
|----------------|-----------------|
| Requêtes/minute | 60 |
| Requêtes/jour | Illimité |
| Symboles d'actions | ✅ Tous |
| Indices | ⚠️ Limité |
| Forex | ❌ Non |
| Cryptomonnaies | ✅ Tous |
| Données historiques | ✅ Limité |

---

## 📚 Documentation Officielle

- **API Quote** : [https://finnhub.io/docs/api/quote](https://finnhub.io/docs/api/quote)
- **Symboles** : [https://finnhub.io/docs/api/symbol-search](https://finnhub.io/docs/api/symbol-search)
- **Limites** : [https://finnhub.io/pricing](https://finnhub.io/pricing)

---

## 💡 Recommandations

1. **Pour commencer** : Utilisez le plan gratuit avec des ETF
2. **Pour production** : Considérez Alpha Vantage (gratuit, 25 req/jour) ou un plan Finnhub payant
3. **Pour performance** : Combinez plusieurs APIs pour diversifier les sources

---

## ✅ Checklist de Configuration

- [ ] Compte Finnhub créé
- [ ] Clé API obtenue
- [ ] Variable `FINNHUB_API_KEY` ajoutée dans Vercel
- [ ] Application redéployée
- [ ] Test de connexion réussi
- [ ] Bandeau affiche "✅ Données en temps réel"

---

**Note** : Si vous voyez "⚠️ Données fictives", c'est normal tant que la clé API n'est pas configurée. Les données affichées sont réalistes et générées automatiquement pour une meilleure expérience utilisateur.

