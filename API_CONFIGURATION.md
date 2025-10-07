# Configuration des APIs - GOB Apps

## 🎯 Vue d'Ensemble

GOB Apps supporte **3 APIs** de données financières en temps réel. Vous pouvez configurer une ou plusieurs APIs pour maximiser la fiabilité et la couverture des données.

### **Système de Fallback Intelligent**

L'application essaie les APIs dans cet ordre :
1. **Twelve Data** (meilleure couverture globale)
2. **Finnhub** (excellent pour actions et crypto)
3. **Alpha Vantage** (bon pour ETF)
4. **Données fictives** (si aucune API configurée)

---

## 📊 Comparaison des APIs

| Fonctionnalité | Twelve Data | Finnhub | Alpha Vantage |
|----------------|-------------|---------|---------------|
| **Plan Gratuit** | ✅ 800 req/jour | ✅ 60 req/min | ✅ 25 req/jour |
| **Actions US** | ✅ Tous | ✅ Tous | ✅ Tous |
| **Indices** | ✅ Directs | ⚠️ Limités | ✅ Via ETF |
| **Forex** | ✅ Tous | ⚠️ Payant | ✅ Majeurs |
| **Crypto** | ✅ Tous | ✅ Tous | ✅ Bitcoin |
| **Latence** | ~1-2s | ~0.5s | ~2-3s |
| **Fiabilité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Recommandation** | **1er choix** | 2ème choix | 3ème choix |

---

## 🚀 Configuration Rapide

### **Option 1 : Configuration Minimale (1 API)**

Configurez **Twelve Data** uniquement (recommandé pour démarrer) :

```bash
TWELVE_DATA_API_KEY=votre_clé_twelve_data
```

### **Option 2 : Configuration Optimale (2 APIs)**

Configurez **Twelve Data + Finnhub** (meilleure couverture) :

```bash
TWELVE_DATA_API_KEY=votre_clé_twelve_data
FINNHUB_API_KEY=votre_clé_finnhub
```

### **Option 3 : Configuration Maximale (3 APIs)**

Configurez toutes les APIs (redondance maximale) :

```bash
TWELVE_DATA_API_KEY=votre_clé_twelve_data
FINNHUB_API_KEY=votre_clé_finnhub
ALPHA_VANTAGE_API_KEY=votre_clé_alpha_vantage
```

---

## 🔧 Configuration Détaillée

### 1️⃣ **Twelve Data** (RECOMMANDÉ)

#### **Avantages**
- ✅ 800 requêtes/jour gratuit (le plus généreux)
- ✅ Support direct des indices (^SPX, ^DJI, etc.)
- ✅ Forex complet (EUR/USD, etc.)
- ✅ Crypto complet (BTC/USD, etc.)
- ✅ Données en temps réel de qualité

#### **Inscription**
1. Allez sur [https://twelvedata.com/](https://twelvedata.com/)
2. Créez un compte gratuit
3. Allez dans **API** → **API Key**
4. Copiez votre clé API

#### **Configuration Vercel**
```
Name: TWELVE_DATA_API_KEY
Value: votre_clé_twelve_data
Environment: Production + Preview
```

#### **Symboles Twelve Data**
```javascript
'SPX' → 'SPX'           // S&P 500 Index
'IXIC' → 'IXIC'         // NASDAQ Composite
'DJI' → 'DJI'           // Dow Jones
'TSX' → 'TSX'           // TSX Composite
'EURUSD' → 'EUR/USD'    // EUR/USD
'GOLD' → 'XAU/USD'      // Gold
'OIL' → 'WTI/USD'       // WTI Crude Oil
'BTCUSD' → 'BTC/USD'    // Bitcoin
```

---

### 2️⃣ **Finnhub**

#### **Avantages**
- ✅ 60 requêtes/minute (excellente limite)
- ✅ Actions US complètes
- ✅ Crypto complètes
- ✅ Latence très faible (~0.5s)
- ✅ API simple et fiable

#### **Limitations**
- ⚠️ Indices limités sur plan gratuit
- ⚠️ Forex nécessite plan payant

#### **Inscription**
1. Allez sur [https://finnhub.io/](https://finnhub.io/)
2. Créez un compte gratuit
3. Copiez votre clé API depuis le dashboard

#### **Configuration Vercel**
```
Name: FINNHUB_API_KEY
Value: votre_clé_finnhub
Environment: Production + Preview
```

#### **Symboles Finnhub**
```javascript
'SPX' → '^GSPC'              // S&P 500 (limité)
'IXIC' → '^IXIC'             // NASDAQ (limité)
'DJI' → '^DJI'               // Dow Jones (limité)
'EURUSD' → 'OANDA:EUR_USD'   // EUR/USD (payant)
'GOLD' → 'OANDA:XAU_USD'     // Gold (payant)
'BTCUSD' → 'BINANCE:BTCUSDT' // Bitcoin (gratuit)
```

---

### 3️⃣ **Alpha Vantage**

#### **Avantages**
- ✅ Gratuit à vie
- ✅ Support des indices via ETF
- ✅ Forex majeurs gratuits
- ✅ Bitcoin gratuit
- ✅ Très fiable

#### **Limitations**
- ⚠️ Seulement 25 requêtes/jour (très limité)
- ⚠️ Latence plus élevée (~2-3s)

#### **Inscription**
1. Allez sur [https://www.alphavantage.co/](https://www.alphavantage.co/)
2. Cliquez sur **Get Your Free API Key**
3. Remplissez le formulaire
4. Copiez votre clé API

#### **Configuration Vercel**
```
Name: ALPHA_VANTAGE_API_KEY
Value: votre_clé_alpha_vantage
Environment: Production + Preview
```

#### **Symboles Alpha Vantage**
```javascript
'SPX' → 'SPY'      // S&P 500 ETF (au lieu de l'indice)
'IXIC' → 'QQQ'     // NASDAQ ETF (au lieu de l'indice)
'DJI' → 'DIA'      // Dow Jones ETF (au lieu de l'indice)
'TSX' → 'EWC'      // Canada ETF (proxy TSX)
'EURUSD' → EUR/USD // Forex direct
'GOLD' → 'GLD'     // Gold ETF
'OIL' → 'USO'      // Oil ETF
'BTCUSD' → BTC/USD // Bitcoin direct
```

---

## 🧪 Tester les Connexions

### **Via l'Interface Web**

Après configuration, le bandeau boursier affichera :
- ✅ **"X/Y API(s) fonctionnelle(s)"** si des APIs sont configurées
- ✅ **"Données réelles (api_name)"** si les données sont vraies
- ⚠️ **"Aucune API configurée"** si aucune clé n'est présente
- ⚠️ **"Données fictives"** si fallback activé

### **Via la Console**

Ouvrez la console du navigateur (F12) pour voir :
```
✅ Test APIs réussi: {
  apis: {
    twelve_data: { success: true, message: "✅ Connecté" },
    finnhub: { success: false, message: "Clé API non configurée" },
    alpha_vantage: { success: true, message: "✅ Connecté" }
  }
}
```

---

## 📈 Recommandations par Usage

### **Pour Développement/Test**
```bash
# Gratuit, rapide, fiable
TWELVE_DATA_API_KEY=votre_clé
```

### **Pour Production (Traffic Faible)**
```bash
# Twelve Data suffit largement
TWELVE_DATA_API_KEY=votre_clé
```

### **Pour Production (Traffic Moyen)**
```bash
# Twelve Data + Finnhub pour redondance
TWELVE_DATA_API_KEY=votre_clé
FINNHUB_API_KEY=votre_clé
```

### **Pour Production (Traffic Élevé)**
```bash
# Toutes les APIs pour maximum de fiabilité
TWELVE_DATA_API_KEY=votre_clé
FINNHUB_API_KEY=votre_clé
ALPHA_VANTAGE_API_KEY=votre_clé
```

---

## 🐛 Dépannage

### **"Aucune API configurée"**

**Solutions** :
1. Vérifiez que les variables d'environnement sont ajoutées dans Vercel
2. Redéployez l'application après ajout des variables
3. Vérifiez les noms exacts : `TWELVE_DATA_API_KEY`, `FINNHUB_API_KEY`, `ALPHA_VANTAGE_API_KEY`

### **"Données fictives" s'affiche**

**Solutions** :
1. Vérifiez que vos clés API sont valides
2. Vérifiez que vous n'avez pas dépassé les limites du plan gratuit
3. Consultez les logs Vercel pour voir les erreurs API
4. Testez manuellement l'API avec un outil comme Postman

### **"Limite de requêtes atteinte"**

**Solutions** :
1. **Alpha Vantage** : 25 req/jour → Ajoutez Twelve Data ou Finnhub
2. **Twelve Data** : 800 req/jour → Devrait suffire, sinon passez au plan payant
3. **Finnhub** : 60 req/min → Largement suffisant

---

## 💡 Conseils Pro

1. **Commencez avec Twelve Data** : Le meilleur rapport qualité/gratuit
2. **Ajoutez Finnhub en backup** : Pour la redondance
3. **Alpha Vantage en dernier** : Utilisez-le si les limites des autres APIs sont atteintes
4. **Monitoring** : Surveillez les logs pour voir quelle API est utilisée
5. **Plan Payant** : Si vous dépassez les limites gratuites, Twelve Data offre le meilleur plan payant

---

## 📚 Documentation Officielle

- **Twelve Data** : [https://twelvedata.com/docs](https://twelvedata.com/docs)
- **Finnhub** : [https://finnhub.io/docs/api](https://finnhub.io/docs/api)
- **Alpha Vantage** : [https://www.alphavantage.co/documentation/](https://www.alphavantage.co/documentation/)

---

## ✅ Checklist Finale

- [ ] Au moins une API configurée dans Vercel
- [ ] Variables d'environnement correctement nommées
- [ ] Application redéployée après configuration
- [ ] Test de connexion réussi (voir bandeau)
- [ ] Données affichées correctement
- [ ] Logs consultés pour vérifier quelle API est utilisée

---

**🎉 Félicitations !** Votre plateforme GOB Apps affiche maintenant des données financières en temps réel !

