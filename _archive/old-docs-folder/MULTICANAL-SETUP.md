# 📡 GOB MULTICANAL - Guide d'Installation et Configuration

Ce guide vous accompagne pas à pas dans la mise en place du système multicanal Emma IA pour GOB.

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Configuration Supabase](#configuration-supabase)
4. [Configuration Twilio (SMS)](#configuration-twilio-sms)
5. [Configuration Resend (Email)](#configuration-resend-email)
6. [Configuration Facebook Messenger](#configuration-facebook-messenger)
7. [Configuration n8n (Optionnel)](#configuration-n8n-optionnel)
8. [Variables d'Environnement Vercel](#variables-denvironnement-vercel)
9. [Tests](#tests)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

Le système multicanal permet à Emma IA de communiquer via :

- **Web** : Chatbot existant dans le dashboard
- **SMS** : Envoi/réception via Twilio
- **Email** : Réception via ImprovMX, envoi via Resend
- **Facebook Messenger** : Communication directe avec Messenger

**Architecture** :
```
Canal → Adaptateur → /api/chat → emma-agent → Réponse → Canal
```

---

## ✅ Prérequis

### Services Requis

| Service | Utilisation | Coût |
|---------|-------------|------|
| **Supabase** | Base de données | Gratuit (500 MB) |
| **Twilio** | SMS | $0.0075/SMS (USA) |
| **Resend** | Email sortant | Gratuit (100 emails/jour) |
| **ImprovMX** | Email entrant | Gratuit (avec forward) |
| **Facebook** | Messenger | Gratuit |
| **Vercel** | Hosting | Gratuit (Hobby plan) |
| **n8n** (opt.) | Automation | Gratuit (self-hosted) |

### Dépendances npm

```bash
npm install @supabase/supabase-js twilio resend
```

Ajoutez ces lignes à votre `package.json` :
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0",
    "twilio": "^4.19.0",
    "resend": "^3.0.0"
  }
}
```

---

## 🗄️ Configuration Supabase

### Étape 1 : Exécuter le script SQL

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet GOB
3. Menu **SQL Editor**
4. Ouvrez `/supabase-multichannel-setup.sql` et copiez tout le contenu
5. Collez dans l'éditeur SQL et cliquez **Run**

Cela créera :
- Table `user_profiles` (profils unifiés)
- Extensions sur `conversation_history` (colonnes channel, channel_identifier, status)
- Table `multichannel_messages` (optionnel, alternative au JSONB)
- Table `channel_logs` (debugging)
- Table `channel_preferences` (préférences utilisateur)
- Vues `channel_statistics` et `recent_multichannel_activity`

### Étape 2 : Vérifier les tables

Exécutez cette requête SQL pour vérifier :

```sql
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'user_profiles',
    'conversation_history',
    'multichannel_messages',
    'channel_logs',
    'channel_preferences'
  );
```

Vous devriez voir 5 tables.

### Étape 3 : Récupérer les credentials Supabase

1. Menu **Settings** → **API**
2. Copiez :
   - **URL** : `https://xxxxx.supabase.co`
   - **Service Role Key** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

⚠️ **Sécurité** : Ne partagez JAMAIS la Service Role Key publiquement.

---

## 📱 Configuration Twilio (SMS)

### Étape 1 : Créer un compte Twilio

1. Allez sur [twilio.com](https://www.twilio.com)
2. Créez un compte (gratuit avec $15 de crédit)
3. Vérifiez votre email et numéro de téléphone

### Étape 2 : Acheter un numéro Twilio

1. Menu **Phone Numbers** → **Buy a Number**
2. Sélectionnez un numéro avec capacité **SMS**
3. Achetez (environ $1/mois)

**Votre configuration** :
- Notez le numéro Twilio acheté (format : `+1234567890`)

### Étape 3 : Configurer le webhook

1. Menu **Phone Numbers** → **Manage** → **Active numbers**
2. Cliquez sur votre numéro
3. Section **Messaging Configuration**
4. **Webhook URL** : `https://your-app.vercel.app/api/adapters/sms`
5. **HTTP Method** : POST
6. **Save**

### Étape 4 : Récupérer les credentials

1. Menu **Account** → **API keys & tokens**
2. Copiez :
   - **Account SID** : `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token** : Votre token Twilio (gardez-le secret)

### Étape 5 : Test manuel

```bash
curl -X POST https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json \
  -u YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN \
  -d "From=YOUR_TWILIO_NUMBER" \
  -d "To=+1234567890" \
  -d "Body=Test Emma IA"
```

---

## 📧 Configuration Resend (Email)

### Étape 1 : Créer un compte Resend

1. Allez sur [resend.com](https://resend.com)
2. Créez un compte (gratuit, 100 emails/jour)
3. Vérifiez votre email

### Étape 2 : Ajouter votre domaine

1. Menu **Domains** → **Add Domain**
2. Entrez votre domaine : `yourdomain.com`
3. Ajoutez les records DNS (SPF, DKIM, DMARC)
4. Attendez la vérification (5-10 min)

**Temporaire (développement)** :
Vous pouvez utiliser l'email par défaut de Resend (`onboarding@resend.dev`) pour les tests.

### Étape 3 : Générer une API Key

1. Menu **API Keys** → **Create API Key**
2. Nom : `GOB Emma IA`
3. Permissions : **Full Access**
4. Copiez la clé : `re_xxxxxxxxxxxxx`

---

## 📬 Configuration ImprovMX (Email Entrant)

### Étape 1 : Créer un compte ImprovMX

1. Allez sur [improvmx.com](https://improvmx.com)
2. Créez un compte gratuit
3. Ajoutez votre domaine

### Étape 2 : Configurer le DNS

Ajoutez ces records MX à votre DNS :

```
Priority 10: mx1.improvmx.com
Priority 20: mx2.improvmx.com
```

### Étape 3 : Créer l'alias email

1. Menu **Aliases** → **Add Alias**
2. **From** : `emma@gobapps.com`
3. **To** : Votre email personnel ou webhook n8n

### Étape 4 : Configuration du forward

**Option A : Forward vers n8n webhook**
- Forward URL : `https://n8n.yourdomain.com/webhook/gob-email-webhook`

**Option B : Forward vers Gmail puis n8n**
- Forward vers : `votre-email@gmail.com`
- Configurez Gmail Filters pour rediriger vers n8n

---

## 💬 Configuration Facebook Messenger

### Étape 1 : Créer une Page Facebook

1. Allez sur [facebook.com/pages/create](https://www.facebook.com/pages/create)
2. Créez une page Business : **GOB Emma IA**
3. Complétez les informations de la page

### Étape 2 : Créer une App Facebook

1. Allez sur [developers.facebook.com](https://developers.facebook.com)
2. **My Apps** → **Create App**
3. Type : **Business**
4. Nom : `GOB Emma Assistant`

### Étape 3 : Ajouter Messenger

1. Dans votre app, cliquez **Add Product**
2. Sélectionnez **Messenger**
3. **Set Up**

### Étape 4 : Générer un Page Access Token

1. Section **Access Tokens**
2. Sélectionnez votre Page Facebook
3. Cliquez **Generate Token**
4. Copiez le token : `EAAxxxxxxxxxxxxxxxxxxxxx`

⚠️ **Sécurité** : Ce token ne doit JAMAIS être partagé.

### Étape 5 : Configurer le Webhook

1. Section **Webhooks**
2. **Callback URL** : `https://your-app.vercel.app/api/adapters/messenger`
3. **Verify Token** : `gob_emma_verify_token_2025` (ou custom)
4. **Subscription Fields** :
   - ✅ `messages`
   - ✅ `messaging_postbacks`
5. **Verify and Save**

### Étape 6 : Souscrire la Page au Webhook

1. Section **Webhooks**
2. Cliquez **Add Page Subscription**
3. Sélectionnez votre Page
4. **Subscribe**

### Étape 7 : Test

1. Allez sur votre Page Facebook
2. Cliquez **Send Message**
3. Envoyez : `Test Emma`
4. Emma devrait répondre via /api/adapters/messenger

---

## 🤖 Configuration n8n (Optionnel)

n8n est optionnel mais recommandé pour gérer les workflows Email et faciliter le debugging.

### Installation n8n (Self-Hosted)

```bash
# Via Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Via npm
npm install -g n8n
n8n start
```

Accédez à : `http://localhost:5678`

### Importer les Workflows

1. Menu **Workflows** → **Import from File**
2. Importez dans cet ordre :
   - `/n8n-workflows/sms-workflow.json`
   - `/n8n-workflows/email-workflow.json`
   - `/n8n-workflows/messenger-workflow.json`

### Configurer les Credentials

**Pour Email (IMAP)** :
- Host : `imap.improvmx.com` (ou `imap.gmail.com`)
- Port : 993
- SSL : true
- User : `emma@gobapps.com`
- Password : Votre mot de passe IMAP

**Pour Twilio** :
- Account SID : Votre Account SID Twilio
- Auth Token : Votre Auth Token Twilio

### Activer les Workflows

1. Cliquez sur chaque workflow
2. Activez le toggle **Active**
3. Les webhooks sont maintenant en écoute

---

## ⚙️ Variables d'Environnement Vercel

### Étape 1 : Accéder aux Environment Variables

1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet GOB
3. **Settings** → **Environment Variables**

### Étape 2 : Ajouter les variables

Ajoutez ces variables (cliquez **Add** pour chacune) :

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=emma@gobapps.com

# Facebook Messenger
MESSENGER_PAGE_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxx
MESSENGER_VERIFY_TOKEN=gob_emma_verify_token_2025

# n8n (optionnel)
N8N_WEBHOOK_BASE_URL=https://n8n.yourdomain.com
```

### Étape 3 : Redéployer

Après avoir ajouté les variables :

```bash
git push origin main
```

Ou via CLI :
```bash
vercel --prod
```

---

## 🧪 Tests

### Test 1 : SMS (Twilio)

Envoyez un SMS à `+14385443662` :
```
Test Emma
```

Emma devrait répondre dans les 5 secondes.

**Debug** :
- Vérifiez les logs Vercel : `vercel logs --follow`
- Vérifiez les logs Twilio : Console → Monitor → Logs

### Test 2 : Email

Envoyez un email à `emma@gobapps.com` :
```
Subject: Test Emma IA
Body: Analyse AAPL
```

Emma devrait répondre par email.

**Debug** :
- Vérifiez n8n Executions
- Vérifiez les logs Vercel

### Test 3 : Messenger

Sur votre Page Facebook, envoyez un message :
```
Bonjour Emma
```

Emma devrait répondre immédiatement.

**Debug** :
- Vérifiez Facebook Webhooks : App → Messenger → Webhooks → Test Events
- Vérifiez les logs Vercel

### Test 4 : API Directe

Test via curl :

```bash
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analyse AAPL",
    "userId": "test-user",
    "channel": "web"
  }'
```

Réponse attendue :
```json
{
  "success": true,
  "response": "Apple (AAPL) se négocie à...",
  "conversationId": "uuid-1234",
  "metadata": {
    "llmUsed": "perplexity",
    "toolsUsed": ["fmp-quote"],
    "executionTimeMs": 2341
  }
}
```

---

## 🐛 Troubleshooting

### Problème : SMS non reçus

**Solutions** :
1. Vérifiez que le webhook Twilio pointe vers : `https://your-app.vercel.app/api/adapters/sms`
2. Vérifiez les logs Twilio (Console → Monitor → Logs)
3. Testez le endpoint directement :
   ```bash
   curl -X POST https://your-app.vercel.app/api/adapters/sms \
     -d "From=+1234567890" \
     -d "Body=Test"
   ```

### Problème : Emails non envoyés

**Solutions** :
1. Vérifiez que Resend API Key est valide
2. Vérifiez que le domaine est vérifié dans Resend
3. Testez l'envoi manuel :
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer re_xxxxx" \
     -H "Content-Type: application/json" \
     -d '{"from":"emma@gobapps.com","to":"test@example.com","subject":"Test","html":"Test"}'
   ```

### Problème : Messenger ne répond pas

**Solutions** :
1. Vérifiez que le webhook est vérifié (icône verte dans Facebook App)
2. Testez le webhook Facebook : App → Messenger → Webhooks → Test Button
3. Vérifiez les logs Vercel pour voir si les événements arrivent
4. Assurez-vous que MESSENGER_PAGE_ACCESS_TOKEN est valide

### Problème : /api/chat retourne 500

**Solutions** :
1. Vérifiez que Supabase est configuré (`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`)
2. Vérifiez que les tables Supabase existent (exécutez `supabase-multichannel-setup.sql`)
3. Vérifiez les logs Vercel :
   ```bash
   vercel logs --follow
   ```
4. Testez emma-agent directement :
   ```bash
   curl -X POST https://your-app.vercel.app/api/emma-agent \
     -H "Content-Type: application/json" \
     -d '{"message":"Test","context":{}}'
   ```

### Problème : Conversations non sauvegardées

**Solutions** :
1. Vérifiez que `conversation_history` a les colonnes `channel`, `channel_identifier`, `status`
2. Exécutez :
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'conversation_history';
   ```
3. Si colonnes manquantes, réexécutez `supabase-multichannel-setup.sql`

### Logs Utiles

**Vercel** :
```bash
vercel logs --follow
vercel logs --since 1h
```

**Supabase** :
Menu **Logs** → Query logs

**Twilio** :
Console → Monitor → Logs → Errors & Warnings

**Facebook** :
App Dashboard → Webhooks → Recent Deliveries

---

## 📚 Ressources Supplémentaires

### Documentation Officielle

- [Twilio SMS API](https://www.twilio.com/docs/sms)
- [Resend API](https://resend.com/docs)
- [Facebook Messenger Platform](https://developers.facebook.com/docs/messenger-platform)
- [Supabase Documentation](https://supabase.com/docs)
- [n8n Workflows](https://docs.n8n.io)

### Fichiers de Référence

- `/docs/ARCHITECTURE-MULTICANAL.md` - Architecture détaillée
- `/api/chat.js` - API centralisée
- `/lib/user-manager.js` - Gestion utilisateurs
- `/lib/channel-adapter.js` - Adaptation canaux
- `/lib/conversation-manager.js` - Gestion conversations

### Support

Pour toute question :
1. Consultez les logs Vercel
2. Vérifiez la documentation officielle des services
3. Contactez le support GOB

---

✅ **Installation terminée !** Emma IA est maintenant accessible via Web, SMS, Email et Messenger.
