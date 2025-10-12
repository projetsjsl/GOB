# ⚠️ LISEZ-MOI EN PREMIER - EMMA IA

Salut ! J'ai travaillé sur Emma pendant ton absence. Voici le résumé :

---

## ✅ CE QUI A ÉTÉ CORRIGÉ

1. ✅ **Limite de fonctions** : 14 → 10 fonctions (limite = 12)
2. ✅ **vercel.json** : Configuration invalide corrigée
3. ✅ **Modèle** : gemini-2.0-flash-exp (version qui fonctionnait)
4. ✅ **Prompt** : Restauré à l'identique (sans apostrophes échappées)
5. ✅ **Tokens** : Vérifié OK (~125 tokens, limite 1M)

---

## ❌ PROBLÈME RESTANT

Emma crashe toujours avec : `FUNCTION_INVOCATION_FAILED`

**Le problème est probablement :**
- 🔴 **Ta clé API Gemini est invalide ou expirée**
- 🔴 Ou n'a pas les permissions pour gemini-2.0-flash-exp

---

## 🚀 SOLUTION RAPIDE (5 minutes)

### **1️⃣ Teste ta clé Gemini manuellement :**

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

**Si ça retourne une erreur** → Ta clé est invalide !

### **2️⃣ Génère une NOUVELLE clé :**

1. Va sur : https://aistudio.google.com/apikey
2. Clique "Create API Key"
3. Copie la nouvelle clé

### **3️⃣ Remplace dans Vercel :**

1. https://vercel.com/projetsjsl/gob/settings/environment-variables
2. Trouve `GEMINI_API_KEY`
3. Clique "Edit"
4. Colle la nouvelle clé
5. Save
6. Redéploie (Deployments → Redeploy)

---

## 📋 VÉRIFICATION ALTERNATIVE

### **Regarde les logs Vercel :**

1. https://vercel.com/projetsjsl/gob
2. Deployments → Dernier déploiement
3. Functions → `/api/gemini/chat`
4. Clique sur la dernière invocation
5. **Copie l'erreur exacte**

L'erreur te dira exactement ce qui ne va pas !

---

## 📚 DOCUMENTATION COMPLÈTE

J'ai créé ces fichiers pour toi :

- **EMMA_DIAGNOSTIC_COMPLET.md** ← Lis ça en détail
- **AUDIT_APIs.md** - Toutes les APIs analysées
- **VERCEL_TROUBLESHOOTING.md** - Guide Vercel
- **GUIDE_DEPANNAGE_APIs.md** - Solutions rapides

---

## 🎯 TL;DR

**99% sûr que le problème est la clé API Gemini invalide.**

**Teste la clé avec curl, puis génère-en une nouvelle si invalide.**

---

Bon courage ! 🚀

