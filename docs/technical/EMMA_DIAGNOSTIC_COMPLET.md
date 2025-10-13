# 🔍 DIAGNOSTIC COMPLET - EMMA IA

**Date :** 12 octobre 2025, 13:30 EDT  
**Statut :** ⚠️ Emma crashe toujours (FUNCTION_INVOCATION_FAILED)

---

## ✅ CORRECTIONS APPLIQUÉES

### **1. Limite de fonctions Vercel (RÉSOLU ✅)**
- **Problème :** 14 fonctions > 12 (limite Hobby)
- **Solution :** Suppression de 4 fonctions non essentielles
- **Résultat :** 10 fonctions (marge de 2)

**Fonctions supprimées :**
- ❌ `api/gemini/test-simple.js` (debug)
- ❌ `api/gemini/minimal.js` (debug)
- ❌ `api/gemini/chat-validated.js` (jamais utilisé)
- ❌ `api/fallback.js` (jamais appelé)

### **2. Configuration vercel.json (RÉSOLU ✅)**
- **Problème :** `runtime: "@vercel/node@latest"` invalide
- **Solution :** Suppression de la config runtime
- **Résultat :** Build réussit maintenant

### **3. Modèle Gemini (RÉSOLU ✅)**
- **Modèle actuel :** `gemini-2.0-flash-exp`
- **Vérifié :** C'était le modèle qui fonctionnait (commit df371e6)
- **Status :** ✅ Correct

### **4. Apostrophes dans le prompt (RÉSOLU ✅)**
- **Problème :** `L\'utilisateur` dans template string
- **Solution :** Restauration fichier original sans échappement
- **Résultat :** `L'utilisateur` (correct dans template string)

### **5. Longueur du prompt (VÉRIFIÉ ✅)**
- **Prompt Emma :** ~500 caractères
- **Tokens estimés :** ~125 tokens
- **Limite Gemini :** 1 million de tokens
- **Résultat :** ✅ Largement en dessous de la limite

---

## ❌ PROBLÈME PERSISTANT

### **Erreur actuelle :**
```
A server error has occurred
FUNCTION_INVOCATION_FAILED
iad1::n4qbb-1760302170625-ac7cdfa86a2a
```

### **Ce qui a été vérifié :**
✅ Build Vercel réussit  
✅ 10 fonctions (< 12 limite)  
✅ vercel.json valide  
✅ Modèle gemini-2.0-flash-exp correct  
✅ Prompt restauré à l'identique  
✅ Apostrophes correctes  
✅ Limite tokens OK  
✅ SDK version 0.21.0  

### **Ce qui crashe :**
❌ La fonction crashe **AU RUNTIME** (pas au build)  
❌ FUNCTION_INVOCATION_FAILED = erreur d'exécution JavaScript

---

## 🔍 HYPOTHÈSES RESTANTES

### **Hypothèse #1 : Clé API Gemini invalide**

**Symptômes concordants :**
- La clé est détectée (`/api/gemini-key` retourne la clé)
- MAIS peut-être que la clé est invalide/expirée
- Ou n'a pas les permissions pour gemini-2.0-flash-exp

**Test à faire :**
1. Va sur https://ai.google.dev/
2. Vérifie que ta clé API est active
3. Teste la clé manuellement avec curl :
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=TA_CLE" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

**Si erreur 403/401 :** La clé est invalide  
**Si erreur 404 :** Le modèle n'existe pas  
**Si ça marche :** Le problème est ailleurs

### **Hypothèse #2 : Dépendance @google/generative-ai corrompue**

**Test à faire :**
Dans Vercel, redéploie sans cache :
1. Deployments → Dernier déploiement
2. "..." → Redeploy
3. **DÉCOCHE** "Use existing Build Cache"
4. Redeploy

Cela va forcer npm à réinstaller toutes les dépendances.

### **Hypothèse #3 : lib/gemini/functions.js a un problème**

**Test :**
```bash
grep -n "export" lib/gemini/functions.js | head -5
```

Vérifie que le fichier exporte correctement `functionDeclarations`.

### **Hypothèse #4 : Timeout de fonction**

La fonction prend peut-être trop de temps (> 10s sur Hobby plan).

**Solution :** Vérifier dans `vercel.json` que `maxDuration: 30` est bien configuré pour `/api/gemini/chat`.

---

## 📊 CONFIGURATION ACTUELLE

### **API Functions (10/12) :**
1. ✅ `api/claude.js` - IA alternative
2. ✅ `api/fmp.js` - Données financières
3. ✅ `api/gemini-key.js` - Vérification clé
4. ✅ `api/gemini/chat.js` - **Emma IA** (crashe)
5. ✅ `api/github-update.js` - GitHub
6. ✅ `api/marketaux.js` - Actualités
7. ✅ `api/marketdata.js` - Données marché
8. ✅ `api/news.js` - Actualités
9. ✅ `api/save-tickers.js` - Tickers
10. ✅ `api/status.js` - Status

### **vercel.json :**
```json
{
  "version": 2,
  "functions": {
    "api/gemini/chat.js": {
      "maxDuration": 30
    }
  }
}
```

### **package.json :**
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.21.0"
  }
}
```

---

## 🛠️ PROCHAINES ÉTAPES RECOMMANDÉES

### **ÉTAPE 1 : Vérifier la clé Gemini API**

**Test manuel de la clé :**
```bash
# Remplace TA_CLE par ta vraie clé
curl "https://generativelanguage.googleapis.com/v1beta/models?key=TA_CLE"
```

**Résultat attendu :** Liste des modèles disponibles  
**Si erreur :** La clé est invalide → En générer une nouvelle

### **ÉTAPE 2 : Vérifier les logs Vercel DÉTAILLÉS**

1. Va dans Vercel → Deployments → Dernier déploiement
2. Clique sur "Functions" → `/api/gemini/chat`
3. Clique sur la dernière invocation (celle qui a échoué)
4. Lis l'**erreur EXACTE** dans les logs

**Cherche :**
- `Error: ...`
- `TypeError: ...`
- `ReferenceError: ...`
- Stack trace complet

### **ÉTAPE 3 : Si la clé est invalide**

**Générer une nouvelle clé :**
1. Va sur https://aistudio.google.com/apikey
2. Crée une nouvelle clé API
3. Remplace dans Vercel :
   - Settings → Environment Variables
   - GEMINI_API_KEY → Edit → Nouvelle valeur
   - Save
4. Redéploie (Deployments → Redeploy)

### **ÉTAPE 4 : Test avec modèle stable**

Si gemini-2.0-flash-exp a un problème, essaye `gemini-1.5-flash` (stable) :

```javascript
// Dans api/gemini/chat.js ligne 88
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',  // Au lieu de gemini-2.0-flash-exp
  tools: { functionDeclarations } 
});
```

---

## 📝 LOGS À VÉRIFIER

### **Dans Vercel → Functions → /api/gemini/chat → Runtime Logs**

Cherche ces patterns d'erreur :

**1. Erreur de clé API :**
```
Error: API key not valid
Error: 403 Forbidden
Error: PERMISSION_DENIED
```
→ Solution : Nouvelle clé API

**2. Erreur de modèle :**
```
Error: 404 Not Found
Error: Model gemini-2.0-flash-exp not found
```
→ Solution : Changer vers gemini-1.5-flash

**3. Erreur de dépendance :**
```
Error: Cannot find module '@google/generative-ai'
Error: Module not found
```
→ Solution : Redéployer sans cache

**4. Erreur de timeout :**
```
Error: Function timeout
Error: Execution timed out
```
→ Solution : Augmenter maxDuration dans vercel.json

**5. Erreur de code :**
```
SyntaxError: ...
TypeError: Cannot read property '...' of undefined
ReferenceError: ... is not defined
```
→ Solution : Bug dans le code

---

## ✅ CE QUI FONCTIONNE DÉJÀ

✅ Site accessible : https://gobapps.com  
✅ Build Vercel réussit  
✅ 10 fonctions déployées  
✅ `/api/gemini-key` retourne la clé  
✅ `/api/status` fonctionne  
✅ `/api/fmp` fonctionne (avec erreurs API mais fonctionne)  
✅ `/api/marketdata` fonctionne  
✅ Dashboard se charge  

---

## 🎯 ACTION IMMÉDIATE

**PRIORITÉ #1 : Regarde les logs Vercel détaillés**

1. Vercel → Deployments → Dernier
2. Functions → `/api/gemini/chat`
3. Clique sur la dernière invocation échouée
4. **Copie l'erreur EXACTE**
5. Envoie-moi l'erreur complète

**PRIORITÉ #2 : Test manuel de la clé Gemini**

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIzaSyAOq1TDYpJmDgKfN7j_Mym4y2tUjgevNIU" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  2>&1 | head -20
```

Si ça retourne une erreur, la clé est le problème.

---

## 📚 FICHIERS CRÉÉS POUR TOI

- **EMMA_DIAGNOSTIC_COMPLET.md** (ce fichier)
- **AUDIT_APIs.md** - Audit complet des APIs
- **VERCEL_TROUBLESHOOTING.md** - Guide de dépannage Vercel
- **GUIDE_DEPANNAGE_APIs.md** - Solutions rapides
- **OPTIMISATION_APIs.md** - Optimisation des requêtes
- **find-vercel-url.sh** - Script pour trouver l'URL correcte
- **test-emma-rapide.sh** - Script de test Emma

---

## 🔗 LIENS UTILES

- **Vercel Dashboard :** https://vercel.com/projetsjsl/gob
- **Logs Functions :** https://vercel.com/projetsjsl/gob/logs
- **Env Variables :** https://vercel.com/projetsjsl/gob/settings/environment-variables
- **Google AI Studio :** https://aistudio.google.com/apikey
- **Gemini API Docs :** https://ai.google.dev/gemini-api/docs

---

**💡 Conseil final :** Le problème est très probablement une **clé API invalide ou sans permissions**. Commence par tester la clé manuellement avec curl !

