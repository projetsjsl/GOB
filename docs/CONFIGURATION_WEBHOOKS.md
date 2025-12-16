# 🔌 Configuration des Webhooks

Guide complet pour configurer les webhooks Twilio et n8n pour les adapters GOB Apps.

## 📋 Table des matières

1. [Webhook Twilio (SMS Adapter)](#webhook-twilio-sms-adapter)
2. [Webhook n8n (Email Adapter)](#webhook-n8n-email-adapter)
3. [Vérification et Tests](#vérification-et-tests)
4. [Dépannage](#dépannage)

---

## 📱 Webhook Twilio (SMS Adapter)

### Prérequis

- Compte Twilio actif
- Numéro de téléphone Twilio
- Variables d'environnement configurées :
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`

### Configuration

#### 1. Obtenir les identifiants Twilio

1. Connectez-vous à [Twilio Console](https://console.twilio.com/)
2. Récupérez votre **Account SID** et **Auth Token** depuis le dashboard
3. Notez votre numéro de téléphone Twilio

#### 2. Configurer le webhook dans Twilio

1. Allez sur [Phone Numbers → Manage → Active Numbers](https://console.twilio.com/us1/develop/phone-numbers/manage/incoming)
2. Cliquez sur votre numéro de téléphone
3. Dans la section **Messaging**, configurez :
   - **A MESSAGE COMES IN**: 
     - Méthode: `HTTP POST`
     - URL: `https://gobapps.com/api/adapters/sms`
   - **STATUS CALLBACK URL** (optionnel):
     - URL: `https://gobapps.com/api/adapters/sms/status`

#### 3. Configurer les variables d'environnement dans Vercel

```bash
# Dans Vercel Dashboard → Settings → Environment Variables
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

#### 4. Tester le webhook

Envoyez un SMS à votre numéro Twilio avec le message "Test". Vous devriez recevoir une réponse automatique.

**Format attendu par le webhook :**
```json
{
  "From": "+1234567890",
  "To": "+1234567891",
  "Body": "Analyse AAPL",
  "MessageSid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

### Endpoint: `/api/adapters/sms`

**Méthode:** `POST`

**Body (format Twilio):**
```
From=+1234567890&To=+1234567891&Body=Test&MessageSid=SMxxx
```

**Réponse (200 OK):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>Réponse générée par Emma IA</Message>
</Response>
```

---

## 📧 Webhook n8n (Email Adapter)

### Prérequis

- Compte n8n actif
- ImprovMX configuré (ou autre service de forwarding email)
- Variables d'environnement configurées :
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`

### Configuration

#### 1. Configurer ImprovMX (ou service équivalent)

1. Créez un compte sur [ImprovMX](https://improvmx.com/)
2. Ajoutez votre domaine (ex: `gobapps.com`)
3. Créez une adresse email de forwarding :
   - Email: `emma@gobapps.com`
   - Forward to: `votre-webhook-n8n-url`

#### 2. Créer le workflow n8n

1. Connectez-vous à votre instance n8n
2. Créez un nouveau workflow
3. Ajoutez un trigger **Email Trigger (IMAP)** ou **Webhook**

**Option A: Webhook (recommandé)**
```json
{
  "name": "Email Webhook",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "email-incoming",
    "httpMethod": "POST"
  }
}
```

**Option B: IMAP (si ImprovMX n'est pas utilisé)**
- Configurez IMAP pour surveiller `emma@gobapps.com`

#### 3. Parser l'email dans n8n

Ajoutez un node **Code** pour parser l'email :

```javascript
// Parser l'email reçu
const email = $input.item.json;

return [{
  json: {
    from: email.from || email.from_email || email.sender,
    to: email.to || email.to_email || 'emma@gobapps.com',
    subject: email.subject || email.title || '',
    text: email.text || email.body_text || email.body || '',
    html: email.html || email.body_html || ''
  }
}];
```

#### 4. Appeler l'API GOB Apps

Ajoutez un node **HTTP Request** :

- **Method:** `POST`
- **URL:** `https://gobapps.com/api/adapters/email`
- **Body:**
```json
{
  "from": "{{ $json.from }}",
  "to": "{{ $json.to }}",
  "subject": "{{ $json.subject }}",
  "text": "{{ $json.text }}",
  "html": "{{ $json.html }}"
}
```

#### 5. Configurer Resend dans Vercel

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=emma@gobapps.com
```

**Important:** Le domaine `gobapps.com` doit être vérifié dans Resend :
1. Allez sur [Resend Domains](https://resend.com/domains)
2. Ajoutez votre domaine
3. Configurez les enregistrements DNS requis

### Endpoint: `/api/adapters/email`

**Méthode:** `POST`

**Body:**
```json
{
  "from": "user@example.com",
  "to": "emma@gobapps.com",
  "subject": "Question sur AAPL",
  "text": "Peux-tu analyser Apple ?",
  "html": "<p>Peux-tu analyser Apple ?</p>"
}
```

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "emailId": "re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

---

## ✅ Vérification et Tests

### Tester Twilio Webhook

```bash
# Simuler un webhook Twilio
curl -X POST https://gobapps.com/api/adapters/sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=+1234567890&To=+1234567891&Body=Test&MessageSid=SMtest123"
```

**Réponse attendue:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>Réponse générée par Emma IA</Message>
</Response>
```

### Tester Email Adapter

```bash
# Simuler un webhook email
curl -X POST https://gobapps.com/api/adapters/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "to": "emma@gobapps.com",
    "subject": "Test",
    "text": "Message de test"
  }'
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

### Vérifier les logs

1. **Vercel Logs:**
   - Allez sur [Vercel Dashboard → Deployments → Functions](https://vercel.com/dashboard)
   - Sélectionnez votre déploiement
   - Consultez les logs en temps réel

2. **n8n Logs:**
   - Dans n8n, allez sur **Executions**
   - Vérifiez les exécutions récentes
   - Consultez les erreurs éventuelles

---

## 🔧 Dépannage

### Problème: Twilio webhook ne répond pas

**Solutions:**
1. Vérifiez que l'URL du webhook est correcte dans Twilio
2. Vérifiez que `TWILIO_ACCOUNT_SID` et `TWILIO_AUTH_TOKEN` sont configurés
3. Vérifiez les logs Vercel pour les erreurs
4. Testez l'endpoint directement avec curl

### Problème: Email Adapter ne fonctionne pas

**Solutions:**
1. Vérifiez que `RESEND_API_KEY` est configuré
2. Vérifiez que le domaine est vérifié dans Resend
3. Vérifiez que `RESEND_FROM_EMAIL` correspond au domaine vérifié
4. Vérifiez les logs n8n pour les erreurs de parsing

### Problème: Rate limiting

**Solutions:**
1. **Resend:** Limite de 100 emails/jour (plan gratuit)
   - Vérifiez votre quota sur [Resend Dashboard](https://resend.com/emails)
   - L'endpoint retourne un 429 avec `retryAfter` si limite atteinte

2. **Twilio:** Limite selon votre plan
   - Vérifiez votre quota sur [Twilio Console](https://console.twilio.com/)

### Problème: Validation des paramètres

Les endpoints retournent maintenant des messages d'erreur détaillés :

**Exemple d'erreur SMS Adapter:**
```json
{
  "success": false,
  "error": "Missing From or Body parameters",
  "received": {
    "hasFrom": false,
    "hasBody": true,
    "keys": ["Body"]
  },
  "expected": {
    "From": "+1234567890 (numéro expéditeur)",
    "Body": "Message texte du SMS"
  }
}
```

---

## 📚 Ressources

- [Twilio Webhook Documentation](https://www.twilio.com/docs/messaging/guides/webhook-request)
- [Resend API Documentation](https://resend.com/docs/api-reference/emails/send-email)
- [n8n Documentation](https://docs.n8n.io/)
- [ImprovMX Documentation](https://improvmx.com/help/)

---

## 🔒 Sécurité

### Bonnes pratiques

1. **Ne jamais exposer les clés API côté client**
2. **Utiliser HTTPS pour tous les webhooks**
3. **Valider les signatures Twilio** (optionnel mais recommandé)
4. **Limiter les IPs autorisées** pour les webhooks n8n
5. **Utiliser des variables d'environnement** pour toutes les clés

### Validation des webhooks

Les endpoints valident automatiquement :
- ✅ Format des paramètres
- ✅ Présence des champs requis
- ✅ Type des données
- ✅ Rate limiting

---

**Dernière mise à jour:** 16 décembre 2025

