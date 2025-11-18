# 🔧 Fix - n8n Retourne Réponse Vide

**Date**: 18 Novembre 2025  
**Problème**: n8n retourne une réponse vide (Length: 0) au lieu du TwiML

---

## 🐛 Symptôme

**Logs Render** :
```
📥 [relayToEmma] Réponse reçue: Status 200
📥 [relayToEmma] Content-Type: application/json; charset=utf-8
📥 [relayToEmma] Data type: string, Length: 0
📥 [relayToEmma] Data preview: ...
⚠️ [extractMessage] Aucune donnée reçue
```

**Cause** : Le workflow n8n retourne `$json.body` mais l'API `/api/adapters/sms` retourne du TwiML XML qui n'est pas correctement extrait par n8n.

---

## ✅ Solution

### Option 1 : Modifier le Workflow n8n (Recommandé)

**Dans n8n** :
1. Ouvrir le workflow "GOB Emma - SMS via Twilio"
2. Nœud "Call SMS Adapter" :
   - Options → Response → Full Response = `true`
   - Cela permet d'accéder à `$json.body` correctement
3. Nœud "Response" :
   - Changer `responseBody` de `={{ $json.body }}` à `={{ $json.body || $json.data || $json }}`
   - Cela gère différents formats de réponse

**OU utiliser le fichier corrigé** :
Le fichier `n8n-workflows/sms-workflow.json` a été mis à jour avec ces corrections.

**Pour appliquer** :
1. Dans n8n : Workflows → Import
2. Sélectionner `n8n-workflows/sms-workflow.json`
3. Remplacer le workflow existant

---

### Option 2 : Modifier l'API pour Retourner JSON (Alternative)

Si le TwiML pose problème, on peut modifier `/api/adapters/sms` pour retourner JSON quand appelé depuis n8n :

```javascript
// Dans api/adapters/sms.js
// Détecter si appelé depuis n8n (via header ou paramètre)
const isN8nCall = req.headers['user-agent']?.includes('n8n') || req.query.n8n === 'true';

if (isN8nCall) {
  // Retourner JSON au lieu de TwiML
  return res.status(200).json({
    success: true,
    response: response, // Le message texte
    twiml: `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(response)}</Message></Response>`
  });
}
```

**Mais Option 1 est préférable** car n8n peut gérer le TwiML directement.

---

## 🧪 Test

Après correction du workflow n8n :

1. **Tester le webhook n8n directement** :
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

2. **Vérifier les logs Render** :
```
📥 [relayToEmma] Data type: string, Length: 234
📥 [relayToEmma] Data preview: <?xml version="1.0"?><Response><Message>...
✅ [extractMessage] Message extrait du TwiML: 📊 AAPL - Analyse...
```

---

## 📝 Notes

- Le workflow n8n original utilisait `responseFormat: "string"` mais n'extrayait pas correctement `$json.body`
- Avec `fullResponse: true`, n8n retourne l'objet complet avec `body`, `headers`, etc.
- Le fallback `$json.body || $json.data || $json` gère différents formats de réponse

---

## 🔄 Prochaines Étapes

1. ✅ Workflow n8n corrigé dans `n8n-workflows/sms-workflow.json`
2. ⏳ Importer le workflow corrigé dans n8n
3. ⏳ Tester avec un SMS "ANALYSE AAPL"
4. ⏳ Vérifier que les logs Render montrent une réponse non-vide

