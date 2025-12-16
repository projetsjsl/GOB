# 🔍 Diagnostic Perplexity - Pourquoi ça ne fonctionne pas?

## Problèmes courants et solutions

### 1. ❌ Clé API non configurée dans Vercel

**Symptôme:**
- Erreur: `PERPLEXITY_API_KEY not configured`
- Fallback automatique vers Gemini
- Logs: `❌ PERPLEXITY_API_KEY not configured - falling back to Gemini`

**Solution:**
1. Allez dans Vercel Dashboard → Votre projet → Settings → Environment Variables
2. Ajoutez `PERPLEXITY_API_KEY` avec votre clé (format: `pplx-...`)
3. Redéployez l'application

**Vérification:**
```bash
# Dans Vercel CLI
vercel env ls
```

---

### 2. ⏱️ Timeout trop court

**Symptôme:**
- Erreur: `Perplexity API timeout after Xs`
- Fallback vers Gemini après timeout
- Logs: `⏱️ Perplexity API timeout after 30s`

**Causes:**
- Timeout SMS: 30s (trop court pour analyses complètes)
- Timeout standard: 60s
- Comprehensive Analysis: 90s

**Solution:**
Le code ajuste automatiquement les timeouts:
- **Comprehensive Analysis**: 90s (prioritaire, même pour SMS)
- **SMS standard**: 30s
- **Web/Email**: 60s

Si vous avez toujours des timeouts, augmentez dans `api/emma-agent.js` ligne ~2422:
```javascript
if (isComprehensiveAnalysis) {
    timeoutDuration = 120000;  // Augmenter à 120s
}
```

---

### 3. 🔑 Clé API invalide ou expirée

**Symptôme:**
- Erreur HTTP 401: Unauthorized
- Logs: `Perplexity API error: 401`

**Solution:**
1. Vérifiez votre clé dans [Perplexity Dashboard](https://www.perplexity.ai/settings/api)
2. Régénérez une nouvelle clé si nécessaire
3. Mettez à jour dans Vercel

**Test de la clé:**
```bash
curl https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer pplx-VOTRE_CLE" \
  -H "Content-Type: application/json" \
  -d '{"model":"sonar-pro","messages":[{"role":"user","content":"test"}]}'
```

---

### 4. 📊 Quota/limite dépassée

**Symptôme:**
- Erreur HTTP 429: Too Many Requests
- Logs: `Perplexity API error: 429`

**Solution:**
1. Vérifiez votre plan Perplexity et les limites
2. Attendez quelques minutes avant de réessayer
3. Considérez upgrade de plan si nécessaire

**Vérification:**
- [Perplexity Pricing](https://www.perplexity.ai/pricing)
- Vérifiez les quotas dans votre dashboard

---

### 5. 🔧 Modèle "sonar-pro" indisponible

**Symptôme:**
- Erreur HTTP 400: Bad Request
- Message: "Model not found" ou similaire

**Solution:**
Le code utilise `sonar-pro` (modèle premium). Si ce modèle n'est plus disponible:
1. Vérifiez les modèles disponibles: [Perplexity Models](https://docs.perplexity.ai/docs/model-cards)
2. Modifiez dans `api/emma-agent.js` ligne ~2044:
```javascript
model: 'sonar',  // ou 'sonar-online', 'llama-3.1-sonar-large-128k-online'
```

**Modèles disponibles (2025):**
- `sonar-pro` - Premium (recommandé)
- `sonar` - Standard
- `sonar-online` - Online search
- `llama-3.1-sonar-large-128k-online` - Long context

---

### 6. 🌐 Problème de réseau/DNS

**Symptôme:**
- Erreur: `fetch failed` ou `ECONNREFUSED`
- Timeout réseau

**Solution:**
1. Vérifiez que Vercel peut accéder à `api.perplexity.ai`
2. Vérifiez les firewall/règles réseau
3. Testez depuis un autre environnement

---

### 7. 📝 Format de requête incorrect

**Symptôme:**
- Erreur HTTP 400 avec détails sur le format
- Réponse vide ou malformée

**Solution:**
Le code construit automatiquement la requête. Si problème:
1. Vérifiez les logs Vercel pour voir la requête exacte
2. Vérifiez que `max_tokens` n'est pas trop élevé
3. Vérifiez le format des messages

---

## 🔍 Diagnostic étape par étape

### Étape 1: Vérifier la configuration

```bash
# Dans Vercel CLI
vercel env ls | grep PERPLEXITY
```

Doit afficher: `PERPLEXITY_API_KEY`

### Étape 2: Tester l'API directement

Utilisez le script de diagnostic:
```bash
node test-perplexity-diagnostic.js
```

### Étape 3: Vérifier les logs Vercel

1. Allez dans Vercel Dashboard → Votre projet → Logs
2. Cherchez les erreurs Perplexity
3. Identifiez le type d'erreur (401, 429, timeout, etc.)

### Étape 4: Tester avec curl

```bash
curl -X POST https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sonar-pro",
    "messages": [
      {"role": "user", "content": "Test"}
    ],
    "max_tokens": 100
  }'
```

---

## 📊 Comportement actuel du code

### Fallback automatique

Si Perplexity échoue, le code fait automatiquement:
1. **Catch l'erreur** dans `_call_perplexity()`
2. **Log l'erreur** avec détails
3. **Fallback vers Gemini** (gratuit, toujours disponible)
4. **Génère une réponse** avec Gemini basée sur les données disponibles

C'est pourquoi vous voyez parfois des réponses de Gemini au lieu de Perplexity.

### Logs à surveiller

```
✅ Perplexity API responded          → Ça fonctionne!
❌ PERPLEXITY_API_KEY not configured  → Clé manquante
⏱️ Perplexity API timeout            → Trop lent
❌ Perplexity API error: 401          → Clé invalide
❌ Perplexity API error: 429          → Quota dépassé
🔄 Falling back to Gemini            → Fallback activé
```

---

## ✅ Solutions rapides

### Si Perplexity ne fonctionne jamais:

1. **Vérifiez la clé dans Vercel:**
   ```bash
   vercel env add PERPLEXITY_API_KEY
   ```

2. **Vérifiez le format de la clé:**
   - Doit commencer par `pplx-`
   - Longueur typique: ~50 caractères

3. **Testez avec le script:**
   ```bash
   PERPLEXITY_API_KEY=pplx-... node test-perplexity-diagnostic.js
   ```

### Si Perplexity fonctionne parfois:

1. **Vérifiez les quotas** dans votre compte Perplexity
2. **Augmentez les timeouts** pour les analyses longues
3. **Vérifiez les logs** pour identifier le pattern d'erreur

---

## 🎯 Recommandations

1. **Toujours avoir un fallback** (Gemini) - ✅ Déjà implémenté
2. **Logger toutes les erreurs** - ✅ Déjà implémenté
3. **Timeouts adaptatifs** - ✅ Déjà implémenté
4. **Monitoring des quotas** - À ajouter si nécessaire

---

## 📞 Support

Si le problème persiste:
1. Vérifiez [Perplexity Status](https://status.perplexity.ai/)
2. Consultez [Perplexity Docs](https://docs.perplexity.ai/)
3. Contactez le support Perplexity si nécessaire
