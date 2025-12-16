# 📘 Guide: Ajouter des Prompts et les Utiliser dans n8n

## 🎯 Deux Méthodes pour Ajouter des Prompts

### Méthode 1: Interface Web (RECOMMANDÉ) ✅

**Avantages**: Interface visuelle, validation automatique, preview en temps réel

**Étapes**:
1. Ouvrir https://gobapps.com/emma-config.html
2. Cliquer **"+ Nouveau Prompt"**
3. Remplir le formulaire:
   - **Key**: Identifiant unique (ex: `my_custom_prompt`)
   - **Description**: Description courte
   - **Type**: `string` ou `json`
   - **Category**: `prompt`, `briefing`, ou `system`
   - **Value**: Contenu du prompt
4. Cliquer **"Sauvegarder"**

---

### Méthode 2: SQL Direct dans Supabase

**Avantages**: Bulk insert, scripts automatisés

**Format Simple (Texte)**:
```sql
INSERT INTO emma_config (key, value, description, type, category, updated_by)
VALUES (
    'my_custom_prompt',
    jsonb_build_object('value', 'Ton contenu de prompt ici...'),
    'Description de mon prompt',
    'string',
    'prompt',
    'votre_nom'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();
```

**Format Complexe (Briefing)**:
```sql
INSERT INTO emma_config (key, value, description, type, category, prompt_id, prompt_number, updated_by)
VALUES (
    'briefing_custom',
    jsonb_build_object(
        'name', 'Mon Briefing Personnalisé',
        'schedule', '14h00 (heure de Montréal)',
        'cron_utc', '0 18 * * 1-5',
        'prompt', 'Instructions détaillées du briefing...',
        'tone', 'professionnel',
        'length', '300-400 mots'
    ),
    'Mon briefing personnalisé',
    'json',
    'briefing',
    'briefing_custom',
    4,
    'votre_nom'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    prompt_id = EXCLUDED.prompt_id,
    prompt_number = EXCLUDED.prompt_number,
    updated_at = NOW();
```

---

## 🔌 Utiliser les Prompts dans n8n

### Étape 1: Récupérer un Prompt Spécifique

**Node n8n**: **HTTP Request**

**Configuration**:
- **Method**: `GET`
- **URL**: `https://gobapps.com/api/admin/emma-config?key=my_custom_prompt`
- **Authentication**: None (API publique pour lecture)

**Réponse JSON**:
```json
{
  "my_custom_prompt": {
    "value": "Contenu du prompt...",
    "description": "Description",
    "type": "string",
    "category": "prompt"
  }
}
```

**Extraire la valeur dans n8n**:
```javascript
// Code Node JavaScript
const promptData = $json.my_custom_prompt;
const promptText = promptData.value;

return { promptText };
```

---

### Étape 2: Récupérer TOUS les Prompts

**URL**: `https://gobapps.com/api/admin/emma-config`

**Réponse JSON**:
```json
{
  "prompts": {
    "cfa_identity": { "value": "..." },
    "cfa_standards": { "value": "..." },
    "intent_fundamentals": { "value": "..." }
  },
  "briefing": {
    "briefing_morning": { "name": "...", "prompt": "..." },
    "briefing_midday": { "name": "...", "prompt": "..." }
  },
  "system": { ... }
}
```

---

### Étape 3: Utiliser le Prompt avec Emma (Gemini)

**Workflow n8n Complet**:

```
[Trigger] → [HTTP Request: Get Prompt] → [Code: Extract Text] → [HTTP Request: Call Gemini] → [Send Result]
```

#### Node 1: Récupérer le Prompt
- **URL**: `https://gobapps.com/api/admin/emma-config?key=intent_fundamentals`

#### Node 2: Extraire et Construire le Message
**Code Node**:
```javascript
// Extraire le prompt
const promptConfig = $json.intent_fundamentals;
const systemPrompt = promptConfig.value;

// Ticker à analyser (exemple)
const ticker = "AAPL";

// Construire le message pour Gemini
const requestBody = {
  contents: [{
    parts: [{
      text: `${systemPrompt}\n\nAnalyse: ${ticker}`
    }]
  }],
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048
  }
};

return {
  json: {
    requestBody,
    geminiApiKey: $env.GEMINI_API_KEY
  }
};
```

#### Node 3: Appeler Gemini
**HTTP Request**:
- **Method**: `POST`
- **URL**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={{$json.geminiApiKey}}`
- **Body**: `{{$json.requestBody}}`
- **Headers**: `Content-Type: application/json`

#### Node 4: Extraire la Réponse
**Code Node**:
```javascript
const response = $json.candidates[0].content.parts[0].text;
return { analysis: response };
```

---

### Étape 4: Utiliser un Briefing Programmé

**Récupérer Config de Delivery**:
- **URL**: `https://gobapps.com/api/prompt-delivery-config?prompt_id=briefing_morning`

**Réponse**:
```json
{
  "key": "briefing_morning",
  "prompt_id": "briefing_morning",
  "prompt_number": 1,
  "config": {
    "name": "Emma En Direct - Matin",
    "schedule": "7h20 (heure de Montréal)",
    "cron_utc": "20 11 * * 1-5",
    "prompt": "Instructions complètes...",
    "tone": "énergique, professionnel",
    "length": "200-300 mots"
  },
  "email_recipients": ["email@example.com"],
  "delivery_enabled": true,
  "delivery_schedule": {
    "cron": "20 11 * * 1-5",
    "timezone": "America/Montreal"
  }
}
```

**Workflow Briefing Automatisé**:
```
[Schedule Trigger: Cron] → [Get Briefing Config] → [Generate Content via Gemini] → [Send Email via Resend]
```

#### Node 1: Schedule Trigger
- **Cron**: `20 11 * * 1-5` (7h20 AM EST, lun-ven)

#### Node 2: Get Briefing Config
- **URL**: `https://gobapps.com/api/prompt-delivery-config?prompt_id=briefing_morning`

#### Node 3: Generate Briefing
**Code Node**:
```javascript
const config = $json.config;
const recipients = $json.email_recipients;

// Construire le prompt complet
const fullPrompt = `${config.prompt}

Ton: ${config.tone}
Longueur: ${config.length}`;

return {
  json: {
    systemPrompt: fullPrompt,
    recipients: recipients,
    subject: config.name
  }
};
```

#### Node 4: Call Gemini
(Même config qu'avant)

#### Node 5: Send Email (Resend)
**HTTP Request**:
- **Method**: `POST`
- **URL**: `https://api.resend.com/emails`
- **Headers**:
  - `Authorization: Bearer {{$env.RESEND_API_KEY}}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "from": "emma@gobapps.com",
  "to": "{{$json.recipients}}",
  "subject": "{{$json.subject}}",
  "html": "{{$json.generatedContent}}"
}
```

---

## 📊 Exemples de Prompts Utiles

### 1. Prompt Analyse Technique
```sql
INSERT INTO emma_config (key, value, description, type, category, updated_by)
VALUES (
    'intent_technical_analysis',
    jsonb_build_object('value', 'Tu es Emma, analyste technique senior.

🎯 OBJECTIF: Analyse technique complète

📊 INDICATEURS REQUIS:
- RSI (14 jours) + interprétation
- MACD (12,26,9) + signal
- Moyennes mobiles (20, 50, 200 jours)
- Volume relatif vs moyenne 30 jours
- Support/Résistance clés
- Tendance: haussière/baissière/neutre

CONCLUSION: Signal trading (Achat/Vente/Neutre) avec niveau de confiance'),
    'Prompt pour analyse technique',
    'string',
    'prompt',
    'migration_auto'
);
```

### 2. Prompt Résumé News
```sql
INSERT INTO emma_config (key, value, description, type, category, updated_by)
VALUES (
    'intent_news_summary',
    jsonb_build_object('value', 'Tu es Emma, analyste news financières.

🎯 OBJECTIF: Résumer actualités récentes (<24h)

📰 STRUCTURE:
1. Titre principal (1 phrase)
2. Points clés (3-5 bullets)
3. Impact potentiel sur le titre
4. Sentiment: Positif/Négatif/Neutre

CONTRAINTES:
- Longueur: 150-200 mots
- Ton: Factuel, sans biais
- Sources: Citer si disponible'),
    'Prompt pour résumé de news',
    'string',
    'prompt',
    'migration_auto'
);
```

### 3. Briefing Hebdomadaire
```sql
INSERT INTO emma_config (key, value, description, type, category, prompt_id, prompt_number, updated_by)
VALUES (
    'briefing_weekly',
    jsonb_build_object(
        'name', 'Emma Hebdo - Résumé de la Semaine',
        'schedule', 'Vendredi 17h00 (heure de Montréal)',
        'cron_utc', '0 21 * * 5',
        'prompt', 'Tu es Emma, analyste financière CFA, générant un récap hebdomadaire.

TÂCHE: Rédiger résumé semaine boursière (lundi-vendredi).

STRUCTURE:
1. Performance globale (indices majeurs)
2. Top 3 gagnants du portefeuille
3. Top 3 perdants du portefeuille
4. Événements marquants de la semaine
5. Actualités sectorielles
6. Perspective semaine prochaine
7. Rappel: Événements économiques à venir

CONTRAINTES:
- Longueur: 500-700 mots
- Ton: Analytique, réfléchi
- Données: Synthèse semaine complète',
        'tone', 'analytique, réfléchi',
        'length', '500-700 mots'
    ),
    'Briefing hebdomadaire vendredi',
    'json',
    'briefing',
    'briefing_weekly',
    4,
    'migration_auto'
);
```

---

## 🔄 Workflow n8n Complet: Analyse Multi-Prompts

**Cas d'usage**: Générer une analyse complète avec plusieurs prompts

```
[Webhook/Trigger]
    ↓
[Get All Prompts] (HTTP Request)
    ↓
[Split into Tasks] (Split in Batches)
    ↓
├─→ [Fundamentals] → [Call Gemini]
├─→ [Technical] → [Call Gemini]
├─→ [News] → [Call Gemini]
    ↓
[Merge Results] (Merge)
    ↓
[Format Final Report] (Code)
    ↓
[Send Email/SMS] (Resend/Twilio)
```

**Code Node - Format Final Report**:
```javascript
// Récupérer toutes les analyses
const fundamentals = $input.first().json.fundamentalsAnalysis;
const technical = $input.item(1).json.technicalAnalysis;
const news = $input.item(2).json.newsAnalysis;

// Construire le rapport complet
const finalReport = `
📊 ANALYSE COMPLÈTE: ${$json.ticker}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 ANALYSE FONDAMENTALE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fundamentals}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📉 ANALYSE TECHNIQUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${technical}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📰 ACTUALITÉS RÉCENTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${news}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Généré par Emma IA™ - ${new Date().toISOString()}
`;

return {
  json: {
    report: finalReport,
    ticker: $json.ticker
  }
};
```

---

## 🎛️ Variables d'Environnement n8n

Ajoutez ces variables dans n8n Settings → Variables:

```
GEMINI_API_KEY=your_key_here
RESEND_API_KEY=your_key_here
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
GOB_API_BASE=https://gobapps.com/api
```

---

## 📚 Référence API Emma Config

### Endpoints Disponibles

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/emma-config` | GET | Liste tous les prompts |
| `/api/admin/emma-config?key=X` | GET | Récupère un prompt spécifique |
| `/api/admin/emma-config` | POST | Crée/Met à jour un prompt |
| `/api/admin/emma-config?key=X` | DELETE | Supprime un prompt |
| `/api/prompt-delivery-config` | GET | Liste prompts avec delivery activé |
| `/api/prompt-delivery-config?prompt_id=X` | GET | Config delivery spécifique |

### Format POST Body

```json
{
  "key": "my_prompt",
  "value": "Contenu du prompt",
  "description": "Description",
  "type": "string",
  "category": "prompt"
}
```

---

## 🚀 Démarrage Rapide

**Template n8n pré-configuré** (à importer):

```json
{
  "name": "Emma Analysis - Simple",
  "nodes": [
    {
      "name": "Get Prompt",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://gobapps.com/api/admin/emma-config?key=intent_fundamentals",
        "method": "GET"
      }
    },
    {
      "name": "Call Gemini",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={{$env.GEMINI_API_KEY}}",
        "method": "POST",
        "bodyParametersJson": "={{ { \"contents\": [{ \"parts\": [{ \"text\": $json.intent_fundamentals.value + \"\\n\\nAnalyse: AAPL\" }] }] } }}"
      }
    }
  ]
}
```

---

## 📞 Support

Questions? Consultez:
- `GUIDE-EXECUTION-SQL.md` - Setup initial Supabase
- `docs/api/DOCUMENTATION_APIs.md` - Documentation API complète
- Interface: https://gobapps.com/emma-config.html

**Bon workflow n8n!** 🎉
