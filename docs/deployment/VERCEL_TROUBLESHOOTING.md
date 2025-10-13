# 🚨 DÉPANNAGE VERCEL - APIs 404

**Problème :** Toutes les APIs retournent 404 "The page could not be found"  
**Cause :** Les fonctions serverless ne sont pas déployées  
**URL correcte :** https://gob.vercel.app (PAS gob-apps)

---

## 🔍 DIAGNOSTIC COMPLET

### ✅ Ce qui fonctionne
- Site principal : https://gob.vercel.app → 200 OK
- DNS résolu correctement
- GEMINI_API_KEY configurée dans Vercel

### ❌ Ce qui ne fonctionne PAS
- `/api/gemini/chat` → 404
- `/api/fmp` → 404  
- `/api/status` → 404
- Toutes les APIs → 404

**Conclusion :** Les fonctions serverless dans `/api/` ne sont pas déployées.

---

## 🛠️ SOLUTION EN 6 ÉTAPES

### **ÉTAPE 1 : Vérifier les Settings Vercel**

1. Va sur : **https://vercel.com/projetsjsl/gob/settings/general**

2. Vérifie ces paramètres :

   **Root Directory :**
   ```
   ./
   ```
   (Doit pointer vers la racine, PAS vers /public)

   **Framework Preset :**
   ```
   Other (ou Vite si disponible)
   ```

   **Build Command :**
   ```
   npm run build
   ```
   (Ou laisse vide pour auto-détection)

   **Output Directory :**
   ```
   dist
   ```
   (Pour Vite, ou laisse vide)

   **Install Command :**
   ```
   npm install
   ```

3. **IMPORTANT :** Si tu changes quelque chose, clique "Save" puis redéploie !

---

### **ÉTAPE 2 : Vérifier les Environment Variables**

1. Va sur : **https://vercel.com/projetsjsl/gob/settings/environment-variables**

2. Vérifie que **GEMINI_API_KEY** existe et est cochée sur **Production**

3. **Autres clés requises** :
   - `FMP_API_KEY` ✅ (tu l'as)
   - `FINNHUB_API_KEY` ✅ (tu l'as)
   - `ALPHA_VANTAGE_API_KEY` ✅ (tu l'as)
   - `GEMINI_API_KEY` ⚠️ (vérifie qu'elle est sur Production)

4. Si tu viens d'ajouter/modifier une clé : **tu DOIS redéployer !**

---

### **ÉTAPE 3 : Vérifier le dernier déploiement**

1. Va sur : **https://vercel.com/projetsjsl/gob**

2. Clique sur l'onglet **"Deployments"**

3. Clique sur le **premier déploiement** (le plus récent)

4. Vérifie le **Status** :
   - ✅ **Ready** → Bon
   - 🔄 **Building** → Attends qu'il finisse
   - ❌ **Error** → Lis les logs (étape 4)

5. Regarde la section **"Functions"** :
   - Tu devrais voir : `api/gemini/chat.js`, `api/fmp.js`, etc.
   - Si VIDE ou ABSENT → Problème de détection (étape 5)

---

### **ÉTAPE 4 : Lire les Logs de Build**

Si le déploiement a échoué :

1. Dans le déploiement, clique sur **"Building"** ou **"Build Logs"**

2. Cherche les erreurs :
   ```
   ❌ Error: ...
   ❌ Module not found: ...
   ❌ Cannot find module ...
   ```

3. **Erreurs communes** :
   - `Module not found`: Dépendances manquantes → Vérifie package.json
   - `Syntax error`: Erreur de code → Vérifie le fichier mentionné
   - `Build failed`: Problème de configuration → Vérifie vercel.json

---

### **ÉTAPE 5 : Forcer un Redéploiement Complet**

Parfois Vercel a juste besoin d'un coup de pied :

**Option A - Via Interface Vercel :**
1. Va dans **Deployments**
2. Clique sur le dernier déploiement
3. Clique **"Redeploy"**
4. **IMPORTANT :** Décoche "Use existing Build Cache"
5. Clique "Redeploy"

**Option B - Via Git (recommandé) :**
```bash
cd GOB
git pull origin main
git add vercel.json
git commit -m "Fix: Configure Vercel serverless functions"
git push origin main
```

Vercel va automatiquement redéployer.

---

### **ÉTAPE 6 : Vérifier que ça marche**

Après le redéploiement (attends 2-3 minutes) :

**Test 1 : Vérifier les fonctions**
```bash
curl https://gob.vercel.app/api/status
```
**Attendu :** JSON avec statut des APIs

**Test 2 : Tester Gemini**
```bash
curl -X POST https://gob.vercel.app/api/gemini/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Bonjour Emma"}]}'
```
**Attendu :** Réponse JSON d'Emma

**Test 3 : Tester FMP**
```bash
curl "https://gob.vercel.app/api/fmp?endpoint=quote&symbol=AAPL"
```
**Attendu :** Données boursières d'Apple

---

## 🔧 FIXES SPÉCIFIQUES

### Fix 1 : vercel.json mis à jour

J'ai ajouté une configuration explicite pour les fonctions serverless :

```json
{
  "functions": {
    "api/**/*.js": {
      "runtime": "@vercel/node@latest"
    }
  }
}
```

Cela force Vercel à traiter tous les fichiers `.js` dans `/api/` comme des fonctions serverless Node.js.

---

### Fix 2 : Structure du projet

Assure-toi que la structure est correcte :

```
GOB/
├── api/                    ← Fonctions serverless
│   ├── gemini/
│   │   ├── chat.js        ← export default function
│   │   └── chat-validated.js
│   ├── fmp.js
│   ├── news.js
│   └── ...
├── public/                 ← Fichiers statiques
│   ├── beta-combined-dashboard.html
│   └── ...
├── package.json           ← Dépendances
├── vercel.json            ← Configuration Vercel
└── ...
```

---

### Fix 3 : package.json dépendances

Vérifie que toutes les dépendances des APIs sont dans `package.json` :

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "@anthropic-ai/sdk": "^0.65.0"
  }
}
```

---

## 🧪 SCRIPT DE TEST COMPLET

Après avoir fixé, lance :

```bash
cd GOB
./test-apis-production.sh
```

Cela testera automatiquement toutes les APIs.

---

## 📊 VÉRIFICATION DES FONCTIONS DÉPLOYÉES

Dans Vercel, après un déploiement réussi :

1. Va dans **Deployments** → Dernier déploiement
2. Cherche la section **"Functions"**
3. Tu devrais voir :
   ```
   ✅ api/claude.js
   ✅ api/fallback.js
   ✅ api/fmp.js
   ✅ api/gemini-key.js
   ✅ api/gemini/chat.js
   ✅ api/gemini/chat-validated.js
   ✅ api/github-update.js
   ✅ api/marketaux.js
   ✅ api/marketdata.js
   ✅ api/news.js
   ✅ api/save-tickers.js
   ✅ api/status.js
   ```

Si c'est VIDE → Les fonctions ne sont pas détectées (problème de config)

---

## ❓ QUESTIONS FRÉQUENTES

### Q: Pourquoi les APIs retournent 404 ?
**R:** Vercel ne détecte pas les fonctions serverless. Vérifie Root Directory et redéploie.

### Q: GEMINI_API_KEY est configurée mais Emma ne marche pas
**R:** Le vrai problème n'est pas la clé, mais que l'API n'est pas déployée (404).

### Q: Où sont les logs d'erreur ?
**R:** Vercel → Deployments → Clique sur le déploiement → "Building" ou "Runtime Logs"

### Q: Dois-je redéployer après avoir changé une variable d'env ?
**R:** **OUI, ABSOLUMENT !** Les changements de variables ne s'appliquent qu'au prochain déploiement.

### Q: Combien de temps prend un déploiement ?
**R:** 1-3 minutes en moyenne.

### Q: L'URL gob-apps.vercel.app ne marche pas
**R:** L'URL correcte est **gob.vercel.app** (sans "apps").

---

## 🆘 SI RIEN NE MARCHE

1. **Supprime et re-crée le projet Vercel** :
   - Settings → Delete Project
   - Re-importe depuis GitHub
   - Reconfigure les variables d'env
   - Redéploie

2. **Contacte le support Vercel** :
   - https://vercel.com/support
   - Explique que les fonctions serverless ne se déploient pas

3. **Vérifie les limitations** :
   - Plan gratuit : 100 GB-heures de compute/mois
   - 10 secondes d'exécution max par fonction (sauf config)
   - Si dépassé, les fonctions ne se déploient pas

---

## ✅ CHECKLIST FINALE

Avant de dire que ça ne marche pas, vérifie :

- [ ] Root Directory = `./` (racine)
- [ ] `GEMINI_API_KEY` configurée sur **Production**
- [ ] Redéployé après avoir ajouté la clé
- [ ] Dernier déploiement en status **"Ready"**
- [ ] Section **"Functions"** contient des fichiers
- [ ] Attendre 2-3 minutes après redéploiement
- [ ] Tester avec l'URL correcte : `https://gob.vercel.app`
- [ ] Cache browser vidé (Ctrl+Shift+R)

---

## 📚 LIENS UTILES

- **Dashboard Vercel :** https://vercel.com/projetsjsl/gob
- **Settings :** https://vercel.com/projetsjsl/gob/settings/general
- **Environment Variables :** https://vercel.com/projetsjsl/gob/settings/environment-variables
- **Deployments :** https://vercel.com/projetsjsl/gob
- **Vercel Docs - Serverless Functions :** https://vercel.com/docs/functions/serverless-functions

---

**🎯 PROCHAINE ÉTAPE :**

1. ✅ Commit le vercel.json modifié
2. ✅ Push vers GitHub
3. ⏳ Attends le redéploiement automatique (2-3 min)
4. 🧪 Teste les APIs
5. 🎉 Emma devrait fonctionner !

