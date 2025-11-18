# 🔍 Diagnostic - Emma est-elle réellement appelée ?

**Date**: 18 Novembre 2025  
**Problème**: Réponse générique "Réponse Emma reçue" au lieu d'une vraie réponse d'Emma

---

## 🐛 Symptôme

Dans l'interface admin, la réponse affichée est :
```
Réponse Emma reçue
```

Au lieu d'une vraie réponse d'Emma comme :
```
📊 AAPL - Analyse

Prix: 245,67$ (+2,36%)
P/E: 28,5x vs secteur 22,3x
...
```

---

## 🔍 Diagnostic en 3 Étapes

### Étape 1 : Vérifier les Logs du Serveur Test

**Où** : Terminal où `test-sms-server.js` tourne

**Chercher** :
```
📤 [relayToEmma] Appel webhook n8n: https://projetsjsl.app.n8n.cloud/webhook/gob-sms-webhook-test
📤 [relayToEmma] Message: "ANALYSE AAPL"
📥 [relayToEmma] Réponse reçue: Status 200
📥 [relayToEmma] Data preview: <?xml version="1.0"?><Response><Message>...
✅ [relayToEmma] Message extrait: ...
```

**Si vous voyez** :
- ✅ `📤 [relayToEmma] Appel webhook n8n` → Le serveur appelle bien n8n
- ✅ `📥 [relayToEmma] Réponse reçue: Status 200` → n8n répond
- ❌ `⚠️ [extractMessage] Impossible d'extraire` → Problème de parsing (corrigé maintenant)
- ❌ `❌ [relayToEmma] Erreur appel webhook` → n8n ne répond pas ou erreur

### Étape 2 : Vérifier les Logs n8n

**Où** : https://projetsjsl.app.n8n.cloud → Workflows → "GOB Emma - SMS via Twilio" → Executions

**Chercher** :
1. **Exécution récente** avec votre message "ANALYSE AAPL"
2. **Nœud "Call SMS Adapter"** :
   - ✅ Status: Success → Emma a été appelée
   - ❌ Status: Error → Emma n'a pas été appelée (vérifier l'erreur)

3. **Données retournées** :
   - Cliquer sur le nœud "Call SMS Adapter"
   - Vérifier le champ `body` dans la réponse
   - Devrait contenir du TwiML XML : `<Response><Message>...</Message></Response>`

### Étape 3 : Vérifier les Logs Vercel (Emma API)

**Où** : Vercel Dashboard → Project → Deployments → Latest → Functions → `/api/adapters/sms`

**Chercher** :
```
[SMS Adapter] SMS de +15559944415: "ANALYSE AAPL"
[SMS Adapter] Appel /api/chat...
[Chat API] Appel emma-agent...
[Emma Agent] Processing request...
```

**Si vous voyez** :
- ✅ `[SMS Adapter] Appel /api/chat` → Emma est appelée
- ✅ `[Emma Agent] Processing request` → Emma traite la requête
- ❌ Pas de logs → Emma n'est pas appelée (problème n8n ou webhook)

---

## 🔧 Corrections Appliquées

### 1. Amélioration de `extractMessageFromResponse`

**Fichier**: `test-sms-server.js`

**Problème**: La fonction ne parsaient pas correctement les différents formats de réponse (TwiML, JSON, objets).

**Solution**: Support de 5 patterns différents :
1. TwiML XML : `<Message>...</Message>`
2. CDATA : `<![[CDATA[...]]>`
3. JSON stringifié
4. Objets avec `response`, `message`, `body`
5. Texte brut

### 2. Logs de Diagnostic

**Ajouté** :
- Logs avant appel n8n (URL, message, numéros)
- Logs après réponse (status, content-type, preview)
- Logs d'extraction (pattern utilisé, message extrait)
- Logs d'erreur détaillés

---

## 🚀 Test Rapide

### Test 1 : Vérifier que n8n appelle Emma

```bash
# Dans le terminal du serveur test
# Envoyer un SMS test "ANALYSE AAPL"
# Vérifier les logs :

📤 [relayToEmma] Appel webhook n8n: https://projetsjsl.app.n8n.cloud/webhook/gob-sms-webhook-test
📤 [relayToEmma] Message: "ANALYSE AAPL"
📥 [relayToEmma] Réponse reçue: Status 200
✅ [relayToEmma] Message extrait: 📊 AAPL - Analyse...
```

### Test 2 : Vérifier directement l'API Emma

```bash
curl -X POST https://gobapps.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "ANALYSE AAPL",
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
  "response": "📊 AAPL - Analyse\n\nPrix: 245,67$...",
  "metadata": { ... }
}
```

### Test 3 : Vérifier le Webhook n8n Directement

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

---

## 📊 Checklist de Diagnostic

- [ ] **Serveur test** : Logs montrent `📤 [relayToEmma] Appel webhook n8n`
- [ ] **n8n** : Workflow activé et exécution visible
- [ ] **n8n** : Nœud "Call SMS Adapter" = Success
- [ ] **n8n** : Réponse contient du TwiML avec message Emma
- [ ] **Vercel** : Logs `/api/adapters/sms` montrent appel Emma
- [ ] **Vercel** : Logs `/api/chat` montrent traitement
- [ ] **Vercel** : Logs `emma-agent` montrent génération réponse
- [ ] **Extraction** : Logs `✅ [extractMessage] Message extrait` avec vraie réponse

---

## 🎯 Causes Possibles

### 1. Webhook n8n Non Activé (404)
**Symptôme**: `❌ [relayToEmma] Erreur appel webhook: 404`
**Solution**: Activer le workflow dans n8n

### 2. Emma API Non Accessible
**Symptôme**: `[SMS Adapter] Erreur appel /api/chat: timeout`
**Solution**: Vérifier que Vercel est déployé et accessible

### 3. Problème de Parsing (Corrigé)
**Symptôme**: `⚠️ [extractMessage] Impossible d'extraire`
**Solution**: Fonction améliorée, devrait maintenant fonctionner

### 4. Emma Retourne Réponse Générique
**Symptôme**: Logs montrent appel Emma mais réponse = "Réponse Emma reçue"
**Solution**: Vérifier les prompts d'Emma (interface admin)

---

## 📝 Prochaines Actions

1. **Redémarrer le serveur test** pour avoir les nouveaux logs
2. **Envoyer un SMS test** "ANALYSE AAPL"
3. **Vérifier les logs** dans l'ordre :
   - Terminal serveur test
   - n8n Executions
   - Vercel Functions logs
4. **Identifier où ça bloque** :
   - Si pas de logs `📤 [relayToEmma]` → Problème serveur test
   - Si erreur 404 → Problème n8n (workflow non activé)
   - Si erreur timeout → Problème Emma API
   - Si extraction échoue → Vérifier format réponse n8n

---

## 🔄 Workflow Complet Attendu

```
1. test-sms-server.js
   └─> POST n8n webhook (gob-sms-webhook-test)
       └─> n8n workflow
           └─> POST /api/adapters/sms
               └─> POST /api/chat
                   └─> emma-agent.processRequest()
                       └─> Perplexity/APIs
                           └─> Réponse générée
                               └─> Retour TwiML
                                   └─> n8n retourne TwiML
                                       └─> test-sms-server extrait message
                                           └─> Affichage dans dashboard
```

**Chaque étape doit avoir des logs pour diagnostiquer où ça bloque.**

