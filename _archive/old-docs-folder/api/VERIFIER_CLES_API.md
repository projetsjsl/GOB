# 🔍 Vérification et Test des Clés API

## 📊 **État Actuel de vos Clés (Vercel)**

✅ Configurées :
- FMP_API_KEY
- MARKETAUX_API_KEY  
- FINNHUB_API_KEY
- ALPHA_VANTAGE_API_KEY
- TWELVE_DATA_API_KEY
- ANTHROPIC_API_KEY

❌ Manquante :
- **GEMINI_API_KEY** ← À ajouter pour Emma IA

---

## 🧪 **Tests de Validation des Clés**

### **Test 1 : FMP API (Financial Modeling Prep)**

**Ouvrez cette URL dans votre navigateur** :
```
https://gob-apps.vercel.app/api/fmp?endpoint=profile&symbol=AAPL
```

**Résultats attendus** :

✅ **Si ça marche** :
```json
{
  "data": [{
    "symbol": "AAPL",
    "companyName": "Apple Inc.",
    "price": 178.50,
    ...
  }]
}
```

❌ **Si la clé est invalide/limite atteinte** :
```json
{
  "error": "...",
  "data": []
}
```

---

### **Test 2 : Marketaux API (News)**

**Ouvrez cette URL** :
```
https://gob-apps.vercel.app/api/marketaux?endpoint=ticker-sentiment&symbol=AAPL&limit=5
```

**Résultats attendus** :

✅ **Si ça marche** :
```json
{
  "news": [...],
  "sentimentAnalysis": {...}
}
```

---

### **Test 3 : Gemini API (Emma IA)**

**Après avoir ajouté GEMINI_API_KEY, ouvrez** :
```
https://gob-apps.vercel.app/api/gemini-key
```

**Résultats attendus** :

✅ **Si ça marche** :
```json
{
  "apiKey": "AIza...",
  "source": "vercel-env",
  "status": "success"
}
```

❌ **Si pas configurée** :
```json
{
  "error": "Clé API Gemini non configurée",
  ...
}
```

---

## 📈 **Limites des APIs Gratuites**

### **Financial Modeling Prep (FMP)**
- 📊 Limite : **250 requêtes/jour**
- 🔄 Reset : Tous les jours à minuit UTC
- 💡 Conseil : Utilisez avec parcimonie

**Comment vérifier votre quota** :
1. Allez sur : https://site.financialmodelingprep.com/
2. Connectez-vous
3. Dashboard → Usage

### **Marketaux**
- 📊 Limite : **100 requêtes/jour**
- 🔄 Reset : Tous les jours
- 💡 Conseil : Limitez les actualités à 5-10 par recherche

### **Gemini (Google AI)**
- 📊 Limite : **60 requêtes/minute** (très généreux !)
- 🔄 Reset : Par minute
- 💡 Conseil : Parfait pour Emma IA

---

## 🛠️ **Diagnostic Rapide**

### **Scénario 1 : Erreur 500 sur Emma**
**Cause** : GEMINI_API_KEY manquante  
**Solution** : Ajoutez la clé + Redéployez

### **Scénario 2 : Données financières vides**
**Causes possibles** :
1. Pas redéployé après ajout de FMP_API_KEY
2. Limite de 250 req/jour atteinte
3. Clé FMP invalide

**Solutions** :
1. Redéployez sur Vercel
2. Attendez 24h ou upgradez FMP
3. Régénérez une nouvelle clé sur FMP

### **Scénario 3 : Score JSLAI™ reste neutre (50-60)**
**Cause** : FMP API ne retourne pas de données  
**Solution** : Vérifiez le Test 1 ci-dessus

### **Scénario 4 : Actualités ne s'affichent pas**
**Cause** : MARKETAUX_API_KEY limite atteinte  
**Solution** : Attendez 24h (vous avez 100 req/jour)

---

## ✅ **Checklist de Validation Complète**

Après avoir ajouté GEMINI_API_KEY et redéployé :

- [ ] Test 1 (FMP) : Retourne des données AAPL
- [ ] Test 2 (Marketaux) : Retourne des news
- [ ] Test 3 (Gemini) : Retourne la clé API
- [ ] Emma IA répond sans erreur 500
- [ ] Score JSLAI™ affiche un score précis (pas juste 50-60)
- [ ] Ratios P/E, ROE, D/E s'affichent
- [ ] Profil d'entreprise complet

---

## 📞 **Support Providers**

Si problème persiste :

**FMP Support** : https://site.financialmodelingprep.com/contact  
**Marketaux Support** : https://www.marketaux.com/contact  
**Gemini Support** : https://ai.google.dev/support

---

**Créé le** : 12 octobre 2025  
**Pour** : Diagnostic problèmes de données manquantes

