# 🔍 Vérifier Pourquoi Emma Retourne "Réponse Emma reçue"

**Date**: 18 Novembre 2025  
**Problème**: Réponse générique "Réponse Emma reçue" au lieu d'une vraie analyse

---

## 🎯 Diagnostic en 3 Étapes

### Étape 1 : Vérifier que le Serveur Test Utilise la Nouvelle Version

**Sur Render** :
1. Aller sur https://dashboard.render.com
2. Ouvrir le service `gob-kmay` (ou le service qui héberge `test-sms-server.js`)
3. Vérifier la dernière version déployée :
   - **Deployments** → Vérifier que le dernier commit est `b230c9e` ou plus récent
   - Si pas à jour : **Manual Deploy** → **Deploy latest commit**

**Ou vérifier localement** :
```bash
# Dans le terminal où tourne test-sms-server.js
# Vérifier que les logs incluent :
# - 📤 [relayToEmma] Appel webhook n8n
# - 🔍 [extractMessage] Type: ...
```

---

### Étape 2 : Tester Directement l'API Emma (Bypass n8n)

**Test direct de l'API Emma** :
```bash
curl -X POST https://gobapps.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "ANALYSE AAPL",
    "userId": "test-user",
    "channel": "sms",
    "context": {
      "user_channel": "sms",
      "user_id": "test-user"
    }
  }'
```

**Résultat attendu** :
```json
{
  "success": true,
  "response": "📊 AAPL - Analyse\n\nPrix: 245,67$ (+2,36%)\n...",
  "metadata": { ... }
}
```

**Si vous obtenez** :
- ✅ Une vraie réponse → Emma fonctionne, problème dans n8n ou extraction
- ❌ Erreur ou réponse générique → Problème dans Emma elle-même

---

### Étape 3 : Vérifier les Logs du Serveur Test

**Sur Render** :
1. Dashboard → Service → **Logs**
2. Filtrer par "relayToEmma" ou "extractMessage"
3. Chercher les logs récents après un test SMS

**Logs attendus** :
```
📤 [relayToEmma] Appel webhook n8n: https://projetsjsl.app.n8n.cloud/webhook/gob-sms-webhook-test
📤 [relayToEmma] Message: "ANALYSE AAPL"
📥 [relayToEmma] Réponse reçue: Status 200
📥 [relayToEmma] Content-Type: text/xml
📥 [relayToEmma] Data preview: <?xml version="1.0"?><Response><Message>...
🔍 [extractMessage] Type: string, Longueur: 234
✅ [extractMessage] Message extrait du TwiML: 📊 AAPL - Analyse...
✅ [relayToEmma] Message extrait: 📊 AAPL - Analyse... (234 chars)
```

**Si vous voyez** :
- ❌ `⚠️ [extractMessage] Impossible d'extraire` → Problème de format réponse n8n
- ❌ `❌ [relayToEmma] Erreur appel webhook` → n8n ne répond pas
- ❌ Pas de logs `📤 [relayToEmma]` → Serveur test n'utilise pas la nouvelle version

---

## 🔧 Solutions Rapides

### Solution 1 : Redéployer le Serveur Test sur Render

```bash
# Sur Render Dashboard
1. Service → Deployments
2. Manual Deploy → Deploy latest commit
3. Attendre le déploiement (2-3 min)
4. Tester à nouveau
```

### Solution 2 : Vérifier le Workflow n8n

**Dans n8n** :
1. https://projetsjsl.app.n8n.cloud
2. Workflows → "GOB Emma - SMS via Twilio"
3. Vérifier que le nœud "Call SMS Adapter" pointe vers :
   - `https://gobapps.com/api/adapters/sms` (pas Render)
4. Vérifier les dernières exécutions :
   - Status = Success ?
   - Réponse contient du TwiML ?

### Solution 3 : Tester le Webhook n8n Directement

```bash
curl -X POST https://projetsjsl.app.n8n.cloud/webhook/gob-sms-webhook-test \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=+15551234567&To=+15559876543&Body=ANALYSE+AAPL&MessageSid=test123"
```

**Résultat attendu** :
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>📊 AAPL - Analyse...</Message>
</Response>
```

**Si vous obtenez** :
- ✅ TwiML avec vraie réponse → n8n fonctionne, problème extraction
- ❌ "Réponse Emma reçue" → n8n retourne mauvais format
- ❌ Erreur 404 → Workflow n8n non activé

---

## 📊 Checklist Complète

- [ ] **Serveur test** : Dernier commit = `b230c9e` ou plus récent
- [ ] **Serveur test** : Logs montrent `📤 [relayToEmma] Appel webhook n8n`
- [ ] **n8n** : Workflow activé et exécution visible
- [ ] **n8n** : Nœud "Call SMS Adapter" = `https://gobapps.com/api/adapters/sms`
- [ ] **n8n** : Réponse contient du TwiML avec message Emma
- [ ] **Emma API** : Test direct retourne vraie réponse
- [ ] **Extraction** : Logs `✅ [extractMessage] Message extrait` avec vraie réponse

---

## 🚨 Causes Probables

### 1. Serveur Test Non Redéployé (Le Plus Probable)
**Symptôme**: Pas de logs `📤 [relayToEmma]` ou logs anciens
**Solution**: Redéployer sur Render

### 2. n8n Retourne Mauvais Format
**Symptôme**: Logs `⚠️ [extractMessage] Impossible d'extraire`
**Solution**: Vérifier format réponse n8n, ajuster extraction si besoin

### 3. Emma Ne Génère Pas de Réponse
**Symptôme**: Test direct API Emma retourne réponse générique
**Solution**: Vérifier prompts Emma, logs Vercel

### 4. n8n N'Appelle Pas Emma
**Symptôme**: n8n retourne "Réponse Emma reçue" directement
**Solution**: Vérifier workflow n8n, URL API adapters/sms

---

## 🎯 Action Immédiate

**Pour diagnostiquer rapidement** :

1. **Tester Emma directement** :
```bash
curl -X POST https://gobapps.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "ANALYSE AAPL", "channel": "sms"}'
```

2. **Si Emma répond bien** → Problème dans n8n ou extraction
3. **Si Emma ne répond pas bien** → Problème dans Emma (prompts, API keys)

4. **Vérifier logs Render** après un test SMS pour voir où ça bloque

