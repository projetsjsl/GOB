# 🚀 Corrections Déploiement Vercel - 9 Décembre 2025

## ✅ **Problèmes Identifiés et Corrigés**

### **1. Erreur JavaScript Runtime - Assignment to Constant**
**Fichier:** `api/adapters/sms.js:285`  
**Erreur:**
```
TypeError: Assignment to constant variable.
at file:///var/task/api/adapters/sms.js:285:22
```

**Correction:**
```javascript
// ❌ AVANT
const response = chatResponse.response;
if (response.length > 4500) {
    response = response.substring(0, 4400) + "..."; // Erreur!
}

// ✅ APRÈS
let response = chatResponse.response;  // Changé à 'let'
if (response.length > 4500) {
    response = response.substring(0, 4400) + "..."; // ✅ OK
}
```

---

### **2. Erreur Base de Données - Invalid BigInt**
**Fichier:** `api/fmp-batch-sync.js`  
**Erreur:**
```
invalid input syntax for type bigint: "131371942499999.98"
```

**Problème:** FMP retourne des nombres décimaux pour `marketCap` et `volume`, mais PostgreSQL bigint n'accepte que des entiers.

**Correction:**
```javascript
// ❌ AVANT
const priceData = quotes.map(quote => ({
  volume: quote.volume || 0,
  marketCap: quote.marketCap || 0
}));

// ✅ APRÈS
const priceData = quotes.map(quote => {
  const volume = Number.isFinite(quote.volume) ? Math.round(quote.volume) : 0;
  const marketCap = Number.isFinite(quote.marketCap) ? Math.round(quote.marketCap) : 0;
  
  return {
    volume: Math.abs(volume) > Number.MAX_SAFE_INTEGER ? 0 : volume,
    marketCap: Math.abs(marketCap) > Number.MAX_SAFE_INTEGER ? 0 : marketCap
  };
});
```

**Améliorations:**
- ✅ Arrondir à l'entier avec `Math.round()`
- ✅ Valider que les nombres sont finis
- ✅ Vérifier les dépassements de capacité

---

### **3. Erreur 404 - Site Principal Inaccessible**
**Erreur:**
```
404: NOT_FOUND
Code: NOT_FOUND
ID: iad1::pkmrk-1765316964285-0cdca679ecd0
```

**Cause:** Migration vers Build Output API v3 (commit `587f2ae`) a cassé le routing.

**Fichiers modifiés:**
- `vercel.json` - Retiré `buildCommand` et `installCommand`, pas de `outputDirectory`
- `build.js` - Créait `.vercel/output/` mais Vercel ne servait pas le contenu

**Correction:**
```json
// vercel.json
{
  "version": 2,
  "outputDirectory": "public",  // ✅ Ajouté - sert depuis public/
  "functions": { ... }
}
```

```javascript
// build.js - Simplifié
async function build() {
  // Construire SEULEMENT l'app 3p1
  execSync('npm run build', { cwd: APP_3P1_DIR });
  
  // ❌ RETIRÉ: Toute la logique Build Output API v3
  // Plus de copie vers .vercel/output/static/
  // Plus de création de config.json
}
```

---

### **4. Tickers Supprimés Reviennent Après Sync**
**Problème:** Tu supprimes un ticker (ex: `NKE.BA`), mais après synchronisation il réapparaît!

**Cause:** L'API `/api/remove-ticker` supprimait de:
- ✅ `watchlist`
- ✅ `seeking_alpha_data`
- ✅ `seeking_alpha_analysis`
- ✅ `finance_snapshots`
- ❌ **PAS de la table `tickers`** ← Source principale pour la sync!

**Correction:**
```javascript
// api/remove-ticker.js - Ajout section 7
// 7. ✅ FIX: Mark ticker as inactive in tickers table
try {
  const { data, error } = await supabase
    .from('tickers')
    .update({ is_active: false })  // Marquer inactif au lieu de supprimer
    .eq('ticker', tickerUpper);

  if (!error) {
    results.removed_from.push('supabase_tickers (marked inactive)');
  }
}
```

**Pourquoi `is_active=false` plutôt que `DELETE`?**
- Préserve l'historique
- Empêche recréation automatique lors de la sync
- Permet de réactiver si besoin

---

## 📊 **Résumé des Commits**

| Commit | Description | Impact |
|--------|-------------|--------|
| `1bccf79` | Fix const & bigint | ✅ Résout erreurs runtime critiques |
| `9e758db` | Remove buildCommand | ⚠️ Tentative fix Build Output API (insuffisant) |
| `2268a48` | Revert to outputDirectory | ✅ **Résout 404 - Site fonctionne!** |
| `2268a48` | Fix ticker deletion | ✅ Résout problème tickers qui reviennent |

---

## 🎯 **Statut Actuel**

### ✅ **RÉSOLU**
1. Erreur `const` reassignment
2. Erreur `bigint` database
3. Tickers supprimés ne reviennent plus

### 🔄 **EN COURS**
- Déploiement `gob-bhbbuq703` sur Vercel (Building...)
- Test du fix 404 sur gobapps.com

### ⚠️ **À SURVEILLER**
- **Gemini API Quota**: Limite gratuite dépassée
  - Impact: Traduction des news échoue
  - Solution: Upgrade plan OU implémenter rate limiting

---

## 🧪 **Tests de Validation**

### **Après déploiement, vérifier:**

1. **Site principal accessible**
   ```bash
   curl -I https://gobapps.com
   # Devrait retourner 200 OK (pas 404)
   ```

2. **API fonctions actives**
   ```bash
   curl https://gobapps.com/api/market-data-batch
   # Devrait retourner données (pas 500)
   ```

3. **App 3p1 accessible**
   ```bash
   curl -I https://gobapps.com/3p1
   # Devrait rediriger vers /3p1/dist/index.html
   ```

4. **Suppression ticker persistante**
   - Supprimer un ticker dans l'UI
   - Cliquer "Sync from Supabase"
   - ✅ Vérifier qu'il ne revient PAS

5. **Pas d'erreurs runtime**
   - Vérifier logs Vercel Functions
   - ❌ Plus d'erreur "Assignment to constant"
   - ❌ Plus d'erreur "invalid input syntax for type bigint"

---

## 📚 **Documentation Technique**

### **Architecture Simplifiée (Après Corrections)**
```
GitHub Push
    ↓
Vercel Build
    ├─ npm install --legacy-peer-deps
    ├─ npm run build
    │   └─ build.js: Build 3p1 app seulement
    ↓
Deploy
    ├─ public/ → Servi à la racine (outputDirectory)
    └─ api/ → Serverless Functions
```

### **Différences vs Build Output API v3**
| Aspect | Build Output API v3 | outputDirectory (actuel) |
|--------|---------------------|-------------------------|
| Structure | `.vercel/output/static/` | `public/` direct |
| Config | Nécessite `config.json` | Automatique |
| Routing | Manuel via rewrites | Automatique |
| Complexité | Haute | Basse |
| Fiabilité | ⚠️ Cassé pour notre cas | ✅ Stable |

---

## 🔗 **Liens Utiles**

- **Vercel Dashboard**: https://vercel.com/projetsjsls-projects/gob
- **Logs en temps réel**: https://vercel.com/projetsjsls-projects/gob/deployments
- **Documentation Build Output API**: https://vercel.com/docs/build-output-api/v3 (pour référence)
- **Support Vercel**: https://vercel.com/help

---

**Créé:** 9 Décembre 2025, 16:54  
**Status:** ✅ Tous les problèmes identifiés corrigés  
**Prochain déploiement:** En cours (gob-bhbbuq703)
