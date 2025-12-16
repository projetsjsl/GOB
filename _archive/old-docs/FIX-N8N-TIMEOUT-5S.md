# 🔧 Fix - n8n Timeout 5 Secondes

**Date**: 18 Novembre 2025  
**Problème**: n8n webhook timeout après 5s alors que l'API Emma prend 30-90s

---

## 🐛 Symptôme

**Erreur n8n** :
```
ERROR
Timeout - Le webhook n'a pas répondu dans les 5 secondes. Vérifiez que n8n est accessible.
```

**Cause** : n8n a un timeout de 5 secondes par défaut pour les webhooks, mais l'API Emma peut prendre :
- 30s pour SMS standard
- 60s pour analyses normales
- 90s pour analyses complètes (comprehensive_analysis)

---

## ✅ Solutions

### Solution 1 : Webhook Asynchrone (Recommandé)

**Dans n8n** :
1. Ouvrir le workflow "GOB Emma - SMS via Twilio"
2. Nœud "Webhook SMS Test" :
   - Options → **Response Mode** → Changer de "When Last Node Finishes" à **"Immediately"**
   - Cela répond immédiatement au webhook avec un 200 OK
   - Le traitement continue en arrière-plan

3. Nœud "Response" :
   - **SUPPRIMER** ce nœud (pas nécessaire avec mode asynchrone)
   - OU le garder mais il ne sera pas utilisé

4. **Nouveau nœud** : Ajouter un nœud "HTTP Request" après "Call SMS Adapter" :
   - Method: POST
   - URL: URL de callback (si vous avez un endpoint pour recevoir la réponse)
   - OU utiliser un nœud "Webhook Response" pour répondre au webhook original

**Limitation** : Cette solution répond immédiatement mais ne retourne pas la réponse directement. Il faut un mécanisme de callback.

---

### Solution 2 : Augmenter Timeout n8n (Si Possible)

**Dans n8n** :
1. Workflow Settings → **Execution Settings**
2. Chercher "Webhook Timeout" ou "Response Timeout"
3. Augmenter à **120 secondes** (2 minutes)

**Note** : Cette option peut ne pas être disponible selon votre plan n8n.

---

### Solution 3 : Réponse Immédiate + Traitement Asynchrone (Meilleure UX)

**Modifier le workflow n8n** :

1. **Nœud "Call SMS Adapter"** :
   - Ajouter un nœud "Set" avant pour préparer la réponse immédiate
   - Répondre immédiatement avec : "⏳ Analyse en cours, réponse dans quelques instants..."

2. **Nœud "Call SMS Adapter"** :
   - Continuer le traitement normal
   - Après traitement, utiliser un webhook callback ou envoyer directement via Twilio API

3. **Nœud "Response"** :
   - Retourner la réponse immédiate d'abord
   - Le traitement continue en arrière-plan

**Avantage** : L'utilisateur reçoit une confirmation immédiate, puis la vraie réponse arrive via SMS.

---

### Solution 4 : Utiliser Twilio API Directement (Bypass n8n Response)

**Modifier `/api/adapters/sms.js`** :

Au lieu de retourner TwiML, envoyer directement via Twilio API :

```javascript
// Dans api/adapters/sms.js
// Au lieu de retourner TwiML, envoyer directement
await sendSMS(senderPhone, response);

// Retourner TwiML vide pour confirmer à Twilio immédiatement
res.setHeader('Content-Type', 'text/xml');
return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>⏳ Analyse en cours...</Message>
</Response>`);

// Ensuite, envoyer la vraie réponse via Twilio API (déjà fait dans sendSMS)
```

**Avantage** : n8n reçoit une réponse immédiate (< 5s), et la vraie réponse est envoyée directement via Twilio API.

---

## 🎯 Solution Recommandée : Solution 4

**Pourquoi** :
- ✅ Répond immédiatement à n8n (< 5s)
- ✅ Envoie la vraie réponse via Twilio API (déjà implémenté)
- ✅ Pas de modification du workflow n8n nécessaire
- ✅ Meilleure UX (confirmation immédiate + vraie réponse)

**Modification nécessaire** :
- Modifier `/api/adapters/sms.js` pour retourner une réponse immédiate
- La vraie réponse est déjà envoyée via `sendSMS()` pour les messages > 800 chars

---

## 📝 Implémentation Solution 4

**Dans `/api/adapters/sms.js`** :

```javascript
// Après avoir appelé /api/chat
const chatResponse = await fetch(...);

// Si réponse longue (> 800 chars), elle est déjà envoyée via sendSMS()
// Retourner TwiML de confirmation immédiatement
if (chatResponse.response.length > 800) {
  // Déjà envoyé via sendSMS(), retourner confirmation
  res.setHeader('Content-Type', 'text/xml');
  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>⏳ Analyse en cours, réponse dans quelques instants...</Message>
</Response>`);
} else {
  // Message court: TwiML direct (rapide, < 5s)
  res.setHeader('Content-Type', 'text/xml');
  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(chatResponse.response)}</Message>
</Response>`);
}
```

**Résultat** :
- n8n reçoit toujours une réponse < 5s
- L'utilisateur reçoit la vraie réponse via SMS (via Twilio API)

