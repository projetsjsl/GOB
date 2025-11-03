# 🏗️ ARCHITECTURE MULTICANAL - GOB Emma IA

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    CANAUX D'ENTRÉE                          │
└─────────────────────────────────────────────────────────────┘
         │              │              │              │
       [Web]          [SMS]         [Email]      [Messenger]
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                            │
                ┌───────────▼───────────┐
                │    /api/chat.js       │ ◄── API Centralisée
                │  (Point d'entrée)     │
                └───────────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐ ┌────────▼────────┐ ┌───────▼────────┐
│ User Manager   │ │ Conversation    │ │ Channel        │
│ (user-manager) │ │ Manager         │ │ Adapter        │
└───────┬────────┘ └────────┬────────┘ └───────┬────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                ┌───────────▼───────────┐
                │   /api/emma-agent.js  │ ◄── Router IA existant
                │  (Function Calling)   │
                └───────────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐ ┌────────▼────────┐ ┌───────▼────────┐
│  Perplexity    │ │    Gemini       │ │    Claude      │
│  (sonar-pro)   │ │  (2.0 Flash)    │ │  (3.5 Sonnet)  │
└───────┬────────┘ └────────┬────────┘ └───────┬────────┘
        └───────────────────┼───────────────────┘
                            │
                ┌───────────▼───────────┐
                │  17 Outils Financiers │
                │  (FMP, Polygon, etc.) │
                └───────────┬───────────┘
                            │
                ┌───────────▼───────────┐
                │   Réponse générée     │
                └───────────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐ ┌────────▼────────┐ ┌───────▼────────┐
│ Channel        │ │ Supabase        │ │ Logs           │
│ Adapter        │ │ (Sauvegarde)    │ │ (Monitoring)   │
│ (Format)       │ └─────────────────┘ └────────────────┘
└───────┬────────┘
        │
┌───────▼────────────────────────────────────────────────┐
│              CANAUX DE SORTIE                          │
│  [Web] [SMS Twilio] [Email Resend] [Messenger Meta]   │
└────────────────────────────────────────────────────────┘
```

---

## Flux de Données Détaillé

### 1. Réception Message (Exemple SMS)

```javascript
User envoie SMS → Twilio Webhook → /api/adapters/sms.js
                                    │
                    ┌───────────────▼──────────────┐
                    │ Parse Twilio webhook         │
                    │ - From: +14385443662         │
                    │ - Body: "Analyse AAPL"       │
                    └───────────────┬──────────────┘
                                    │
                    ┌───────────────▼──────────────┐
                    │ Appelle /api/chat.js         │
                    │ {                            │
                    │   message: "Analyse AAPL",   │
                    │   userId: "+14385443662",    │
                    │   channel: "sms"             │
                    │ }                            │
                    └───────────────┬──────────────┘
```

### 2. Traitement Central (/api/chat.js)

```javascript
┌────────────────────────────────────────────────────┐
│ 1. User Manager                                    │
│    getOrCreateUserProfile("+14385443662", "sms")   │
│    → Crée/récupère profil utilisateur Supabase    │
└────────────────┬───────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────┐
│ 2. Conversation Manager                            │
│    getOrCreateConversation(userId, "sms")          │
│    → Récupère/crée conversation active            │
│    → Récupère historique (10 derniers messages)   │
└────────────────┬───────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────┐
│ 3. Appel Emma Agent                                │
│    POST /api/emma-agent                            │
│    {                                               │
│      message: "Analyse AAPL",                      │
│      context: {                                    │
│        output_mode: "chat",                        │
│        tickers: ["AAPL"],                          │
│        conversationHistory: [...]                  │
│      }                                             │
│    }                                               │
└────────────────┬───────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────┐
│ 4. Emma Agent (Function Calling)                   │
│    - Intent Analysis (Perplexity)                  │
│    - Tool Selection (Scoring)                      │
│    - Tool Execution (Parallel)                     │
│      → fmp-quote, fmp-fundamentals, etc.           │
│    - Response Generation (Perplexity/Gemini)       │
└────────────────┬───────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────┐
│ 5. Channel Adapter                                 │
│    adaptForChannel(response, "sms")                │
│    → SMS: Truncate à 1600 chars                    │
│    → Email: Format HTML                            │
│    → Messenger: Limit 2000 chars                   │
│    → Web: Pas de modification                      │
└────────────────┬───────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────┐
│ 6. Sauvegarde Conversation                         │
│    saveConversationTurn(conversationId, ...)       │
│    → Stocke dans Supabase conversation_history    │
└────────────────┬───────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────┐
│ 7. Réponse au Canal                                │
│    return {                                        │
│      success: true,                                │
│      response: "Apple (AAPL) se négocie à...",    │
│      conversationId: "uuid-1234",                  │
│      metadata: { llmUsed, toolsUsed, ... }         │
│    }                                               │
└────────────────────────────────────────────────────┘
```

### 3. Envoi Réponse (Retour SMS)

```javascript
/api/adapters/sms.js reçoit réponse
                │
┌───────────────▼──────────────┐
│ Envoie via Twilio            │
│ client.messages.create({     │
│   from: "+14385443662",      │
│   to: "+1234567890",         │
│   body: response             │
│ })                           │
└───────────────┬──────────────┘
                │
User reçoit SMS ◄───────────────┘
```

---

## Tables Supabase

### user_profiles
```sql
id (uuid, PK)
email (text, unique)        -- Canal: email, web
phone (text, unique)        -- Canal: sms
messenger_id (text, unique) -- Canal: messenger
name (text)
metadata (jsonb)
created_at, updated_at
```

### conversation_history (étendue)
```sql
id (uuid, PK)
user_id (text) → user_profiles.id
session_id (uuid)
messages (jsonb[])          -- Array de {role, content, timestamp}
channel (text)              -- 'web', 'email', 'sms', 'messenger'
channel_identifier (text)   -- email, phone, messenger_id
status (text)               -- 'active', 'closed'
created_at, updated_at
```

### channel_logs (debugging)
```sql
id (uuid, PK)
channel (text)
event_type (text)           -- 'message_received', 'message_sent', 'error'
user_profile_id (uuid)
conversation_id (uuid)
payload (jsonb)
error (text)
created_at
```

---

## Adaptateurs de Canaux

### SMS (/api/adapters/sms.js)
- **Input** : Twilio webhook (application/x-www-form-urlencoded)
- **Process** : Parse From/Body → Appelle /api/chat → Envoie réponse via Twilio SDK
- **Output** : TwiML vide (`<Response></Response>`)
- **Limite** : 1600 chars/SMS, pagination automatique

### Email (/api/adapters/email.js)
- **Input** : n8n webhook (JSON parsé depuis IMAP)
- **Process** : Parse from/subject/text → Appelle /api/chat → Envoie via Resend
- **Output** : JSON `{success, conversationId}`
- **Limite** : Pas de limite, format HTML

### Messenger (/api/adapters/messenger.js)
- **Input** : Facebook Messenger webhook (JSON)
- **Process** : Parse sender.id/message.text → Appelle /api/chat → Envoie via Graph API
- **Output** : `EVENT_RECEIVED` (acknowledgment)
- **Limite** : 2000 chars, découpage automatique

---

## Utilities (/lib/)

### user-manager.js
```javascript
getOrCreateUserProfile(identifier, channel, metadata)
updateUserProfile(userId, updates)
getUserById(userId)
getUserByChannelIdentifier(identifier, channel)
linkChannelToUser(userId, channel, identifier)
```

### channel-adapter.js
```javascript
adaptForChannel(response, channel)
adaptForSMS(text)           // Truncate 1600 chars
adaptForEmail(text)         // Convert to HTML
adaptForMessenger(text)     // Truncate 2000 chars
chunkTextForSMS(text, size)
extractSummary(text, maxLength)
```

### conversation-manager.js
```javascript
getOrCreateConversation(userProfileId, channel, channelIdentifier)
addMessageToConversation(conversationId, message)
saveConversationTurn(conversationId, userMsg, assistantResp, metadata)
getConversationHistory(conversationId, limit)
getUserConversations(userProfileId, channel)
closeConversation(conversationId)
formatHistoryForEmma(messages, maxMessages)
```

---

## Performances & Quotas

### Vercel Functions
- Timeout : 300s (5 min) pour /api/chat et /api/emma-agent
- Concurrent executions : Illimité (Hobby plan)
- Bandwidth : 100 GB/mois

### Supabase
- Database size : 500 MB (gratuit)
- Requests : Illimité (avec rate limiting)
- Storage : 1 GB (gratuit)

### Twilio
- SMS US/Canada : $0.0075/message
- SMS International : $0.10-0.50/message
- Rate limit : 1 msg/sec (ajustable)

### Resend
- Free tier : 100 emails/jour
- Pro : $20/mois → 50,000 emails/mois

### Facebook Messenger
- Gratuit
- Rate limit : 200 req/min

---

## Sécurité

### Authentification
- **Twilio** : Webhook signature verification (optionnel)
- **Facebook** : Verify token + App Secret validation
- **Resend** : API key (Bearer token)

### Données Sensibles
- Tous les credentials dans Vercel Environment Variables
- Supabase Row Level Security (RLS) activé
- Service Role Key pour backend uniquement

### CORS
- /api/chat : Origin * (public)
- Adaptateurs : Origin * (webhooks publics)

---

## Monitoring

### Logs Vercel
```bash
vercel logs --follow
vercel logs --since 1h
```

### Métriques Supabase
- Dashboard → Database → Query Performance
- Table Stats : `SELECT * FROM channel_statistics;`

### Alertes Recommandées
1. Taux d'erreur > 5% sur /api/chat
2. Latence > 5s sur emma-agent
3. Quota SMS Twilio < 10%

---

## Évolutions Futures

### Améliorations Possibles
- ✅ Rate limiting par utilisateur
- ✅ Cache Redis pour réponses fréquentes
- ✅ Queue système (Bull/BullMQ) pour haute charge
- ✅ Webhooks n8n → API directe (bypass n8n)
- ✅ Analytics dashboard (nombre de messages/canal)
- ✅ A/B testing de prompts
- ✅ Multi-langue (détection automatique)

### Canaux Additionnels
- Slack
- Discord
- WhatsApp (via Twilio)
- Telegram
- Microsoft Teams

---

**Architecture validée et opérationnelle. Tous les fichiers sont en place.**
