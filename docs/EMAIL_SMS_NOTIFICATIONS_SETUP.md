# Configuration: Notifications Email pour SMS Emma

## 🎯 Objectif

Recevoir une notification email à **chaque conversation SMS** avec Emma, et pouvoir **répondre par email** pour envoyer un SMS via Emma.

---

## 📧 Flux Complet

```
┌──────────────────────────────────────────────┐
│  FLUX 1: SMS → Email Notification            │
└──────────────────────────────────────────────┘

SMS de J-S
    ↓
Emma répond
    ↓
📧 Email à projetsjsl@gmail.com
Subject: [JSLAI SMS] 📱 J-S - "Prix AAPL?"
Reply-To: emma-reply+cc583758@gobapps.com


┌──────────────────────────────────────────────┐
│  FLUX 2: Réponse Email → SMS                 │
└──────────────────────────────────────────────┘

Tu cliques "Répondre" dans Gmail
    ↓
Écris ton message
    ↓
Envoie l'email
    ↓
Resend reçoit l'email
    ↓
Webhook → /api/admin/email-to-sms
    ↓
Parse email + extrait user ID
    ↓
Twilio envoie SMS à J-S
```

---

## ⚙️ Configuration Vercel

### Variables d'Environnement

Ajouter dans Vercel → Settings → Environment Variables:

```bash
ADMIN_EMAIL=projetsjsl@gmail.com
```

Vérifier que ces variables existent déjà:
```bash
RESEND_API_KEY=re_xxxxx
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

---

## 📨 Configuration Resend (Pour Répondre par Email)

### Étape 1: Configurer le Domaine

1. Aller sur https://resend.com/domains
2. Vérifier que `gobapps.com` est configuré
3. S'assurer que les DNS sont validés (MX, SPF, DKIM)

### Étape 2: Configurer Email Routing (Inbound)

⚠️ **IMPORTANT**: Resend ne supporte PAS encore les emails entrants (inbound) nativement.

**Solutions alternatives:**

#### Option A: Utiliser ImprovMX (Recommandé ⭐)

ImprovMX peut forwarder les emails vers un webhook.

1. Aller sur https://improvmx.com
2. Ajouter domaine `gobapps.com`
3. Créer un alias:
   ```
   emma-reply+*@gobapps.com → Webhook
   ```
4. Configurer le webhook:
   ```
   URL: https://gobapps.com/api/admin/email-to-sms
   Method: POST
   ```

#### Option B: Utiliser Mailgun

1. Créer compte sur https://mailgun.com
2. Ajouter domaine `gobapps.com`
3. Configurer route:
   ```
   Match: emma-reply+*@gobapps.com
   Action: Forward to webhook
   URL: https://gobapps.com/api/admin/email-to-sms
   ```

#### Option C: Utiliser Sendgrid Inbound Parse

1. Aller sur https://sendgrid.com
2. Settings → Inbound Parse
3. Ajouter hostname: `reply.gobapps.com`
4. URL: `https://gobapps.com/api/admin/email-to-sms`
5. Configurer MX record:
   ```
   reply.gobapps.com MX 10 mx.sendgrid.net
   ```

---

## 🧪 Test de la Configuration

### Test 1: Notification Email (SMS → Email)

1. Envoie un SMS à Emma depuis ton téléphone:
   ```
   Prix de Tesla?
   ```

2. Vérifie dans `projetsjsl@gmail.com`:
   - Tu devrais recevoir un email avec:
   - Subject: `[JSLAI SMS] 📱 J-S - "Prix de Tesla?"`
   - Reply-To: `emma-reply+cc583758@gobapps.com`
   - Contenu complet avec métadonnées

### Test 2: Réponse par Email (Email → SMS)

1. Clique "Répondre" sur l'email reçu

2. Écris un message:
   ```
   Test de réponse par email
   ```

3. Envoie l'email

4. Vérifie sur ton téléphone:
   - Tu devrais recevoir un SMS d'Emma avec:
   - "Test de réponse par email"

---

## 📊 Vérification des Logs

### Logs Vercel

```bash
# Voir les logs de notification email
https://vercel.com/projetsjsl/gob/logs

Filtrer par: "[Email Notifier]"
```

### Logs Twilio

```bash
https://console.twilio.com/us1/monitor/logs/sms

Chercher les SMS envoyés depuis ton numéro Twilio
```

### Logs Resend

```bash
https://resend.com/emails

Voir les emails envoyés à projetsjsl@gmail.com
```

---

## 🔍 Troubleshooting

### Problème: Pas d'email reçu

**Vérifications:**
1. Variable `ADMIN_EMAIL` configurée dans Vercel
2. Vercel logs montrent `[Email Notifier] Email envoyé`
3. Resend dashboard montre email envoyé
4. Check spam dans Gmail

**Solution:**
```bash
# Dans Gmail, créer un filtre
From: emma@gobapps.com
Action: Ne jamais envoyer dans Spam
```

### Problème: Réponse email ne fonctionne pas

**Vérifications:**
1. Service d'inbound email configuré (ImprovMX/Mailgun/Sendgrid)
2. Webhook URL correcte: `https://gobapps.com/api/admin/email-to-sms`
3. DNS MX records configurés
4. Logs du service inbound

**Test manuel:**
```bash
curl -X POST https://gobapps.com/api/admin/email-to-sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "emma-reply+cc583758-a6d2-43d3-83bc-76aa636900b3@gobapps.com",
    "from": "projetsjsl@gmail.com",
    "text": "Test message",
    "subject": "Re: [JSLAI SMS]"
  }'
```

### Problème: User ID invalide

**Erreur:** `User not found`

**Cause:** L'email Reply-To ne contient pas le bon user ID

**Solution:**
1. Vérifier format Reply-To: `emma-reply+{UUID}@gobapps.com`
2. Vérifier que l'UUID existe dans `user_profiles`

---

## 📁 Filtres Gmail Recommandés

### Filtre 1: Dossier "Emma SMS"

```
Condition: Sujet contient "[JSLAI SMS]"
Actions:
  - Appliquer le libellé: "Emma SMS"
  - Ne jamais envoyer dans Spam
  - Marquer comme important
```

### Filtre 2: Notifications

```
Condition: De emma@gobapps.com
Actions:
  - Appliquer le libellé: "JSLAI"
  - Catégorie: Principal
```

---

## 📈 Analytics

### Statistiques dans Resend

Les emails sont taggés automatiquement:
- `type: sms_conversation`
- `user: J-S`
- `channel: sms`
- `user_id: cc583758-...`

Tu peux voir les stats dans Resend Dashboard:
```
https://resend.com/analytics
```

---

## 🚀 Déploiement

1. **Commit et push les changements:**
   ```bash
   git add .
   git commit -m "feat: Email notifications for SMS conversations"
   git push
   ```

2. **Configurer ADMIN_EMAIL dans Vercel:**
   ```bash
   vercel env add ADMIN_EMAIL
   # Entrer: projetsjsl@gmail.com
   ```

3. **Configurer service inbound email** (ImprovMX/Mailgun/Sendgrid)

4. **Tester** en envoyant un SMS à Emma

---

## 📝 Notes

### Tag Email: [JSLAI SMS]

Le tag `[JSLAI SMS]` au lieu de `[Emma SMS]` permet d'éviter de déclencher les triggers n8n existants qui cherchent le mot "Emma".

### Reply-To Format

Format: `emma-reply+{userId}@gobapps.com`

Le `{userId}` est l'UUID Supabase de l'utilisateur (table `user_profiles`).

### Sécurité

- ❌ Pas d'authentification sur le webhook (confiance dans Resend/ImprovMX)
- ✅ Validation du format Reply-To
- ✅ Validation que l'user existe en DB
- ⚠️ À améliorer: Vérifier que l'email vient bien de `projetsjsl@gmail.com`

### Performance

- Email envoyé de manière **non-bloquante** (ne ralentit pas la réponse SMS)
- Si l'envoi email échoue, le SMS fonctionne quand même
- Logs détaillés pour debugging

---

## ✅ Checklist de Déploiement

- [ ] Variable `ADMIN_EMAIL` ajoutée dans Vercel
- [ ] Code déployé sur Vercel
- [ ] Service inbound email configuré (ImprovMX/Mailgun)
- [ ] Webhook testé manuellement
- [ ] Test SMS → Email fonctionnel
- [ ] Test Email → SMS fonctionnel
- [ ] Filtres Gmail configurés
- [ ] Documentation partagée avec l'équipe

---

**Support:** Si problème, vérifier les logs Vercel et ouvrir un issue sur GitHub.

Emma IA propulsée par JSLAI 🚀
