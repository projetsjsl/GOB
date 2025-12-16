# 📊 ANALYSE SETUP EMMA EXISTANT

**Date**: 11 Novembre 2025
**Objectif**: Documenter le setup Emma existant avant d'implémenter le serveur de test SMS local

---

## 1. Workflows n8n Identifiés

### Workflow Principal: Emma Newsletter (ID: 03lgcA4e9uRTtli1)
**Fichier**: `n8n-workflow-03lgcA4e9uRTtli1.json`
**Nom complet**: "Emma Newsletter - Automated Multi-API Financial News Distribution"

#### Triggers identifiés:
1. **Schedule Trigger** (Cron: 7h/12h/16h30 EST)
   - Briefings automatisés matin/midi/soir

2. **Webhook Trigger**
   - Path: `/emma-newsletter/send`
   - Method: POST
   - Webhook ID: `dad887b9-1a62-482a-9174-3b79f52a2bb5`

3. **Manual Trigger**
   - Pour tests avec prompt custom
   - Permet d'override les paramètres

#### Workflow Structure:
```
Trigger → Manual Briefing Selector → Prepare API Request →
Call Emma Agent → Parse API Response → Generate HTML Newsletter →
Fetch Email Recipients → Process Recipients → Send Email via Resend
```

#### Nodes clés:
- **Prepare API Request**: Construit le message pour Emma avec prompt + tickers
- **Parse API Response**: Extrait le contenu de la réponse Emma
- **Generate HTML Newsletter**: Génère le HTML Bloomberg-style avec TL;DR, Emma's Take, Action Items
- **Process Recipients**: Prépare les emails pour envoi

### URLs Webhook n8n (Production):
```
Base URL: https://projetsjsl.app.n8n.cloud
Workflow Newsletter: /workflow/03lgcA4e9uRTtli1
API Endpoint: /api/v1/workflows/03lgcA4e9uRTtli1
```

**Note**: Les workflows n8n sont pour les newsletters, **PAS pour les SMS**. Les SMS utilisent une architecture différente (voir section 2).

---

## 2. Intégrations SMS Actuelles

### Architecture SMS Emma
```
Twilio Webhook → /api/adapters/sms → /api/chat → emma-agent → Response → Twilio SMS
```

### Endpoint SMS Principal
**Fichier**: `api/adapters/sms.js`
**URL**: `https://your-app.vercel.app/api/adapters/sms`
**Method**: POST
**Content-Type**: `application/x-www-form-urlencoded` (format Twilio)

### Format Payload Twilio (Entrant)
```javascript
{
  From: '+14385443662',          // Numéro expéditeur (user)
  To: '+1234567890',             // Numéro Twilio (Emma)
  Body: 'Analyse AAPL',          // Message texte
  MessageSid: 'SM1234567890'     // ID unique du message Twilio
}
```

### Flux de Traitement SMS
1. **Réception**: Twilio POST vers `/api/adapters/sms`
2. **Parsing**: Extraction From, Body, MessageSid
3. **Validation**: Vérification données non vides
4. **Commandes spéciales**: Détection commandes d'invitation (admin seulement)
5. **Confirmation immédiate**: SMS "👩🏻 Message reçu! J'analyse ta demande..."
6. **Appel /api/chat**:
   ```javascript
   {
     message: Body,
     userId: From,  // Numéro de téléphone comme userId
     channel: 'sms',
     metadata: { messageSid, twilioFrom }
   }
   ```
7. **Réponse Emma**: Récupération de chatResponse.response
8. **Envoi SMS**:
   - Si < 800 chars: TwiML direct (réponse dans XML)
   - Si > 800 chars: Découpage via sendSMS() (plusieurs SMS avec préfixe "👩🏻 Partie X/Y")
   - Si > 4500 chars: REFUSÉ (protection anti-spam)
9. **Notification email**: Email envoyé en arrière-plan à l'admin avec conversation

### Fonction sendSMS()
**Fichier**: `api/adapters/sms.js` (ligne 365)
**Signature**: `async function sendSMS(to, message, simulate = false)`

**Fonctionnalités**:
- Support découpage automatique si > 1600 chars (limite Twilio)
- Envoi dans l'ordre inverse pour affichage correct (3/3, 2/3, 1/3 → affiche 1/3, 2/3, 3/3)
- Délai 5 secondes entre SMS pour garantir l'ordre
- Ajout automatique emoji 👩🏻 au début
- Mode simulation pour tests (simulate=true)

### Format Réponse TwiML (Sortant)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>👩🏻 Voici l'analyse d'AAPL...</Message>
</Response>
```

---

## 3. Endpoint API Chat Centralisé

### Endpoint Principal
**Fichier**: `api/chat.js`
**URL**: `/api/chat`
**Method**: POST

### Format Request
```javascript
{
  message: string,              // Le message utilisateur
  userId: string,               // ID unique (numéro tel pour SMS)
  channel: 'web' | 'email' | 'sms' | 'messenger',
  conversationId?: string,      // Optionnel
  metadata?: {
    messageSid?: string,
    twilioFrom?: string,
    // ... autres metadata
  }
}
```

### Format Response
```javascript
{
  success: boolean,
  response: string,              // Texte réponse Emma
  conversationId: string,
  metadata: {
    user_id: string,
    conversation_id: string,
    name?: string,               // Nom si contact connu
    model: string,               // 'gemini-2.0-flash'
    tools_used: string[],        // ['fetchStockData', 'analyzeMarket']
    execution_time_ms: number,
    intent: {
      intent: string,            // 'comprehensive_analysis', 'stock_price', etc.
      confidence: number,
      tickers?: string[]
    }
  }
}
```

### Chaîne de Traitement /api/chat
```
/api/chat → User Manager → Conversation Manager → emma-agent → Response Formatter
```

#### Étapes détaillées:
1. **Validation paramètres**: message, userId, channel
2. **User Profile**: `getOrCreateUserProfile()` - recherche par userId
3. **Conversation**: `getOrCreateConversation()` - historique de conversation
4. **Emma Agent**: Appel à `emma-agent.js` avec historique
5. **Validation réponse**: Vérifie complétude (sections, longueur)
6. **Adaptation canal**: `adaptForChannel()` - formatte selon canal
7. **Sauvegarde**: `saveConversationTurn()` - enregistre dans Supabase
8. **Cache**: `setCachedResponse()` - cache pour requêtes similaires

---

## 4. Commandes Emma Reconnues

Emma **n'a pas de commandes prédéfinies** type "MARCHE", "ANALYSE", etc.

### Système d'Intention (Intent Detection)
**Fichier**: `lib/intent-analyzer.js`

Emma utilise un système d'analyse d'intention qui détecte automatiquement ce que l'utilisateur veut:

#### Intentions Supportées:
1. **`comprehensive_analysis`**
   - Déclencheurs: "analyse complète", "tout sur", "deep dive"
   - Tickers: Extrait automatiquement (AAPL, MSFT, etc.)
   - Réponse: Analyse exhaustive multi-sections (1500+ mots)

2. **`stock_price`**
   - Déclencheurs: "prix", "quote", "cotation"
   - Réponse rapide: Prix + variation + volume

3. **`fundamentals`**
   - Déclencheurs: "fondamentaux", "P/E", "valorisation"
   - Métriques: P/E, ROE, dette, marges

4. **`technical_analysis`**
   - Déclencheurs: "technique", "RSI", "support/résistance"
   - Indicateurs techniques

5. **`news`**
   - Déclencheurs: "actualités", "news", "dernières nouvelles"
   - News récentes + sentiment

6. **`portfolio`**
   - Déclencheurs: "portefeuille", "mes actions"
   - Analyse multi-tickers

7. **`market_overview`**
   - Déclencheurs: "marchés", "indices", "S&P 500"
   - Vue d'ensemble indices + secteurs

8. **`comparison`**
   - Déclencheurs: "comparer", "vs", "ou"
   - Comparaison 2+ actions

9. **`greeting`**
   - Déclencheurs: "bonjour", "salut", "aide"
   - Message d'accueil + capacités

10. **`briefing`**
    - Déclencheurs: "briefing", "résumé du jour"
    - Briefing quotidien personnalisé

### Exemples de Messages Utilisateur:
```javascript
// Analyse complète
"Analyse complète d'Apple"
"Tout sur AAPL"
"Dis-moi tout sur Microsoft"

// Prix rapide
"Prix d'AAPL"
"Cotation Tesla"
"MSFT quote"

// Fondamentaux
"Fondamentaux de GOOGL"
"P/E ratio Apple"
"Valorisation NVDA"

// Technique
"RSI TSLA"
"Support résistance AAPL"
"Analyse technique Microsoft"

// News
"Actualités Apple"
"News TSLA"
"Dernières nouvelles MSFT"

// Portefeuille
"Analyse mon portefeuille: AAPL, MSFT, GOOGL"

// Marchés
"Comment vont les marchés?"
"S&P 500 aujourd'hui"

// Comparaison
"Comparer AAPL vs MSFT"
"Apple ou Microsoft?"

// Greeting
"Bonjour Emma"
"Aide"
"Que peux-tu faire?"

// Briefing
"Briefing du jour"
"Résumé des marchés"
```

### Extraction Automatique de Tickers
**Fichier**: `lib/utils/ticker-extractor.js`

Emma extrait automatiquement les tickers de 3 façons:
1. **Symboles directs**: AAPL, MSFT, GOOGL (2-5 lettres majuscules)
2. **Noms de sociétés**: "Apple" → AAPL, "Microsoft" → MSFT
3. **Contexte**: "actions technologiques" → [AAPL, MSFT, GOOGL, NVDA]

### Commandes Spéciales (Admin Uniquement)
**Fichier**: `lib/invitation-handler.js`

Format: `INVITE +15551234567 John Doe`
- Envoie une invitation SMS à un nouveau numéro
- Réservé aux contacts connus (whitelist dans `lib/phone-contacts.js`)

---

## 5. Variables d'Environnement Requises

### Variables Twilio (OBLIGATOIRES pour SMS)
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Variables Emma/AI (OBLIGATOIRES)
```bash
GEMINI_API_KEY=AIza...
PERPLEXITY_API_KEY=pplx-...
ANTHROPIC_API_KEY=sk-ant-...  # Optionnel
OPENAI_API_KEY=sk-...          # Optionnel
```

### Variables Supabase (OBLIGATOIRES pour multicanal)
```bash
SUPABASE_URL=https://gob-watchlist.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Variables Financial APIs (RECOMMANDÉES)
```bash
FMP_API_KEY=...
FINNHUB_API_KEY=...
ALPHA_VANTAGE_API_KEY=...
TWELVE_DATA_API_KEY=...
```

### Variables n8n (OPTIONNELLES - uniquement pour automation)
```bash
N8N_WEBHOOK_BASE_URL=https://projetsjsl.app.n8n.cloud
N8N_API_KEY=n8n_api_xxxxxxxxxxxxxxxxxx
```

**Note**: Les workflows n8n pour newsletters **NE SONT PAS utilisés pour les SMS**. Les SMS utilisent uniquement `/api/adapters/sms` → `/api/chat`.

### Variables Email (OPTIONNELLES - pas pour SMS)
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=emma@gobapps.com
```

---

## 6. Dépendances NPM Existantes

**Fichier**: `package.json`

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@octokit/rest": "^20.0.0",
    "@anthropic-ai/sdk": "^0.17.0",
    "twilio": "^4.20.0",
    "resend": "^3.0.0",
    "@google/generative-ai": "^0.21.0"
  }
}
```

### Dépendances Additionnelles pour Serveur Test
```json
{
  "devDependencies": {
    "express": "^4.18.2",
    "body-parser": "^1.20.2",
    "dotenv": "^16.3.1",
    "axios": "^1.6.2"
  }
}
```

---

## 7. Structure Base de Données (Supabase)

### Tables Multicanal Existantes

#### `user_profiles`
```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  preferred_channel VARCHAR(20),  -- 'web', 'sms', 'email', 'messenger'
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP,
  metadata JSONB
);
```

#### `conversation_history` (Étendue)
```sql
-- Extensions ajoutées pour multicanal
ALTER TABLE conversation_history ADD COLUMN channel VARCHAR(20);
ALTER TABLE conversation_history ADD COLUMN channel_identifier VARCHAR(255);
ALTER TABLE conversation_history ADD COLUMN status VARCHAR(20);
```

#### `multichannel_messages` (Optionnel)
- Queue de messages à envoyer
- Tracking statuts (pending, sent, failed)

#### `channel_logs`
- Logs de debugging pour chaque canal
- Utile pour troubleshooting

---

## 8. Timeouts et Limites

### API Chat
- **Timeout**: 30 secondes (appel emma-agent)
- **Retry**: Pas de retry automatique

### SMS Twilio
- **Limite par message**: 1600 caractères
- **Découpage automatique**: Oui (via sendSMS())
- **Limite globale**: 4500 caractères (protection anti-spam)
- **Rate limiting**: À implémenter (TODO dans sms.js ligne 148)

### Workflow n8n
- **Timeout fonctions**: 30-60 secondes (selon node)
- **Pas applicable aux SMS** (SMS n'utilisent pas n8n workflows)

---

## 9. Modes de Déploiement

### Production (Actuel)
- **Hosting**: Vercel
- **URL**: `https://gob-projetsjsls-projects.vercel.app`
- **Webhook Twilio**: `https://gob-projetsjsls-projects.vercel.app/api/adapters/sms`
- **Base données**: Supabase cloud

### Développement Local (Pour tests)
- **Serveur**: `npm run dev` (Vite dev server)
- **Port**: 3000 (configurable)
- **Webhook local**: Nécessite ngrok pour exposer

---

## 10. Recommandations d'Intégration

### Pour le Serveur de Test SMS Local

#### ✅ Ce qui PEUT être réutilisé:
1. **Format payload Twilio** - Identique à production
2. **Endpoint `/api/chat`** - Appeler directement (pas besoin d'adapter)
3. **Format réponse Emma** - Parser chatResponse.response
4. **Variables d'environnement** - Réutiliser .env existant
5. **Dépendances npm** - express, body-parser, twilio (déjà installés)

#### ⚠️ Points d'Attention:
1. **N8N workflows NE SONT PAS utilisés pour SMS**
   - Les workflows n8n sont pour newsletters email uniquement
   - SMS utilisent `/api/adapters/sms` → `/api/chat` directement
   - Ne PAS créer de webhook n8n pour SMS

2. **Pas de commandes prédéfinies**
   - Emma utilise analyse d'intention (NLP)
   - Tester avec phrases naturelles, pas "MARCHE", "ANALYSE"
   - Exemples réels: "Analyse AAPL", "Prix de Tesla", "Actualités Microsoft"

3. **Format TwiML pour réponse**
   - Twilio attend du XML, pas du JSON
   - Utiliser `twilio.twiml.MessagingResponse()`

4. **Découpage automatique**
   - Implémenter fonction chunkMessage() si réponse > 1600 chars
   - Ou limiter les réponses pour éviter multi-SMS

5. **Mode simulation**
   - Utiliser `sendSMS(to, message, simulate=true)` pour tests sans frais
   - Logger les SMS au lieu de les envoyer

#### 🚀 Architecture Recommandée pour Serveur Test:
```
Dashboard HTML (formulaire)
        ↓
    POST /simulate-incoming
        ↓
Serveur Express Local (port 3000)
        ↓
    POST /api/chat (Vercel ou local)
        ↓
    Emma Agent traite
        ↓
    Réponse retournée
        ↓
    Affichage dans Dashboard
```

#### 📁 Fichiers à Créer:
1. **test-sms-server.js** (serveur Express)
2. **public/dashboard.html** (interface)
3. **test-scenarios.js** (scénarios de test)
4. **.env.test** (variables test)
5. **README-TEST-SMS.md** (documentation)

---

## 11. Questions pour Validation

### À Confirmer Avant Phase 2:

1. **Endpoint à utiliser pour Emma**:
   - ✅ Utiliser `/api/chat` directement (recommandé)
   - ⚠️ OU simuler complètement `/api/adapters/sms` en local
   - **Question**: Préférez-vous tester uniquement la partie "envoi SMS → Emma" ou tout le flow Twilio?

2. **Mode de test**:
   - ✅ Test avec API chat directement (plus simple, pas de frais)
   - ⚠️ Test avec vrais SMS via Twilio (frais, mais réaliste)
   - **Question**: Pour débuter, voulez-vous mode 100% gratuit (simulation) ou test avec quelques vrais SMS?

3. **Scénarios de test**:
   - ✅ Utiliser phrases naturelles ("Analyse AAPL", "Prix de Tesla")
   - ❌ NE PAS utiliser commandes type "MARCHE", "ANALYSE" (n'existent pas)
   - **Question**: Avez-vous des scénarios spécifiques à tester?

4. **Intégration n8n**:
   - ✅ N8N workflows ne sont PAS nécessaires pour SMS
   - ℹ️ N8N est utilisé uniquement pour newsletters email automatisées
   - **Question**: Souhaitez-vous tout de même créer un workflow n8n pour logs/monitoring des tests SMS?

5. **Base de données**:
   - ✅ Les conversations seront enregistrées dans Supabase (si SUPABASE_URL configuré)
   - ⚠️ OU mode in-memory pour tests rapides (pas de persistance)
   - **Question**: Voulez-vous persister les conversations de test dans Supabase ou juste en mémoire?

6. **Découpage SMS**:
   - ✅ Implémenter découpage automatique (comme production)
   - ⚠️ OU limiter réponses à 1600 chars (éviter multi-SMS)
   - **Question**: Comment gérer les longues réponses Emma en test?

---

## 12. Prochaines Étapes Suggérées

### Phase 2 - Implémentation (Après validation):

1. **Setup environnement test**
   - Créer .env.test avec variables nécessaires
   - Installer dépendances manquantes (express, body-parser)

2. **Serveur test-sms-server.js**
   - Endpoint POST /simulate-incoming
   - Appel à /api/chat avec format correct
   - Dashboard HTML pour UI

3. **Interface Dashboard**
   - Formulaire d'envoi (From, Body)
   - Générateur de numéros fictifs (+15551234567)
   - Historique conversations
   - Export JSON

4. **Scénarios de test**
   - Fichier test-scenarios.js avec cas réels
   - Phrases naturelles basées sur intentions Emma
   - Vérifications automatiques (keywords attendus)

5. **Documentation**
   - README-TEST-SMS.md avec instructions
   - Exemples de commandes à tester
   - Troubleshooting

---

## 📊 Résumé Exécutif

### ✅ Setup Existant Solide:
- Architecture multicanal opérationnelle (Web, SMS, Email, Messenger)
- Endpoint `/api/chat` unifié et robuste
- Intégration Twilio SMS fonctionnelle
- Base de données Supabase configurée
- Dépendances npm installées

### 🎯 Pour Serveur Test SMS:
- **Réutiliser** au maximum l'existant (format payload, endpoint chat)
- **NE PAS** utiliser workflows n8n (réservés aux newsletters)
- **Tester** avec phrases naturelles (pas de commandes prédéfinies)
- **Simuler** les SMS pour éviter les frais Twilio en phase de test

### ⚠️ Points Clés à Retenir:
1. Emma n'a pas de commandes "MARCHE", "ANALYSE" - utilise NLP
2. N8N workflows ≠ SMS (n8n = newsletters email seulement)
3. SMS utilisent `/api/adapters/sms` → `/api/chat` (pas n8n)
4. Découpage automatique si réponse > 1600 chars
5. Protection anti-spam à 4500 chars max

---

**🚦 Prêt pour Phase 2 après validation de ces points**

---

📅 **Créé**: 11 Novembre 2025
🤖 **Par**: Claude Code
📝 **Status**: ✅ Analyse Complète - En Attente de Validation
