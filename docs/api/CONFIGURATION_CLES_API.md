# 🔑 Configuration des Clés API - Guide Rapide

## ⚠️ **PROBLÈMES ACTUELS**

### 1. Emma IA ne fonctionne pas
**Erreur** : `Erreur API: 500`  
**Cause** : `GEMINI_API_KEY` non configurée  
**Impact** : Emma ne peut pas générer d'analyses

### 2. Données manquantes dans JLab™
**Cause** : `FMP_API_KEY` non configurée  
**Impact** : 
- Ratios financiers (P/E, ROE, D/E) manquants
- Score JSLAI™ incomplet
- Profils d'entreprise limités

---

## 🚀 **SOLUTION RAPIDE (5 minutes)**

### **Étape 1 : Obtenir les clés API**

#### A. **Gemini API** (PRIORITAIRE - Pour Emma)
1. Allez sur : https://ai.google.dev/
2. Cliquez sur "Get API Key"
3. Créez un projet (si nécessaire)
4. Copiez votre clé API

#### B. **Financial Modeling Prep** (PRIORITAIRE - Pour les données)
1. Allez sur : https://site.financialmodelingprep.com/developer/docs
2. Créez un compte (gratuit)
3. Allez dans "Dashboard" → "API Key"
4. Copiez votre clé API

#### C. **Marketaux** (OPTIONNEL - Pour les news avancées)
1. Allez sur : https://www.marketaux.com/
2. Créez un compte
3. Copiez votre clé API

---

### **Étape 2 : Configurer sur Vercel**

1. **Allez sur Vercel Dashboard** : https://vercel.com/projetsjsl/gob/settings/environment-variables

2. **Ajoutez ces 2 variables** (minimum requis) :

   ```
   Nom : GEMINI_API_KEY
   Valeur : [votre_clé_gemini]
   Environment : Production, Preview, Development
   ```

   ```
   Nom : FMP_API_KEY
   Valeur : [votre_clé_fmp]
   Environment : Production, Preview, Development
   ```

3. **Optionnel mais recommandé** :

   ```
   Nom : MARKETAUX_API_KEY
   Valeur : [votre_clé_marketaux]
   Environment : Production, Preview, Development
   ```

4. **Cliquez sur "Save"** pour chaque variable

---

### **Étape 3 : Redéployer**

**Option A - Automatique** (Recommandé) :
1. Sur la page Vercel de votre projet
2. Allez dans l'onglet "Deployments"
3. Cliquez sur les 3 points (...) du dernier déploiement
4. Cliquez sur "Redeploy"
5. Attendez 30-60 secondes

**Option B - Via Git** :
```bash
cd /Users/projetsjsl/Documents/GitHub/GOB
git commit --allow-empty -m "chore: Trigger redeploy after API keys config"
git push origin main
```

---

## ✅ **VÉRIFICATION**

Après le redéploiement, testez :

### 1. **Emma IA** (Gemini)
- Allez dans l'onglet "💬 Emma IA™"
- Tapez : "Analyse AAPL"
- ✅ Devrait répondre avec une analyse détaillée
- ❌ Ne devrait plus afficher "Erreur API: 500"

### 2. **Score JSLAI™** (FMP)
- Allez dans l'onglet "📈 JLab™"
- Sélectionnez une action (ex: AAPL)
- ✅ Le score devrait être entre 0-100 (pas 50-60 neutre)
- ✅ Les ratios P/E, ROE, D/E devraient s'afficher

### 3. **Actualités** (Marketaux)
- ✅ Les actualités devraient s'afficher avec analyse de sentiment
- ✅ Indicateurs de sentiment positif/négatif

---

## 📊 **CLÉS API - RÉCAPITULATIF**

| API | Priorité | Coût | Impact si manquante |
|-----|----------|------|-------------------|
| **GEMINI_API_KEY** | ⭐⭐⭐⭐⭐ | Gratuit (jusqu'à 60 req/min) | Emma ne fonctionne pas |
| **FMP_API_KEY** | ⭐⭐⭐⭐⭐ | Gratuit (250 req/jour) | Données financières limitées |
| **MARKETAUX_API_KEY** | ⭐⭐⭐ | Gratuit (100 req/jour) | News basiques seulement |
| FINNHUB_API_KEY | ⭐⭐ | Gratuit (60 req/min) | Fallback si besoin |
| ALPHA_VANTAGE_API_KEY | ⭐⭐ | Gratuit (5 req/min) | Fallback si besoin |

---

## 🐛 **DÉPANNAGE**

### **Erreur persiste après config**
1. Vérifiez que vous avez bien cliqué "Save" sur Vercel
2. Assurez-vous d'avoir redéployé
3. Videz le cache du navigateur (Ctrl+Shift+R)
4. Attendez 2-3 minutes (propagation des variables)

### **Limites de l'API gratuite atteintes**
- **Gemini** : 60 requêtes/minute (très généreux)
- **FMP** : 250 requêtes/jour (suffit pour usage normal)
- **Solution** : Attendez 24h ou créez un nouveau compte

### **Clé API invalide**
1. Vérifiez qu'il n'y a pas d'espace avant/après la clé
2. Régénérez une nouvelle clé sur le site du provider
3. Remplacez dans Vercel

---

## 💡 **BONUS - Variables Locales (Développement)**

Si vous testez en local :

1. Créez un fichier `.env` à la racine :
```bash
GEMINI_API_KEY=your_gemini_key_here
FMP_API_KEY=your_fmp_key_here
MARKETAUX_API_KEY=your_marketaux_key_here
```

2. Le fichier `.env` est déjà dans `.gitignore` (sécurité)

---

## 📞 **BESOIN D'AIDE ?**

Si vous rencontrez des problèmes :
1. Consultez la console du navigateur (F12)
2. Cherchez les erreurs en rouge
3. Vérifiez les status codes :
   - `500` = Clé manquante/invalide
   - `503` = Service temporairement indisponible
   - `429` = Limite de requêtes atteinte

---

**Date de création** : 12 octobre 2025  
**Dernière mise à jour** : 12 octobre 2025  
**Status** : ✅ Guide prêt à utiliser

