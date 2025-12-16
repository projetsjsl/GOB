# ⚡ Quick Reference: Prompts → n8n

## 🎯 Cas d'Usage Principal

**Objectif**: Récupérer un prompt depuis Supabase et l'utiliser avec Gemini dans n8n

---

## 📋 Workflow 3 Nodes (Le Plus Simple)

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  1. Get Prompt  │  →   │  2. Call Gemini │  →   │  3. Use Result  │
│   (HTTP)        │      │     (HTTP)      │      │   (Email/SMS)   │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

---

## 🔧 Configuration des Nodes

### Node 1: Get Prompt
**Type**: HTTP Request
```
Method: GET
URL: https://gobapps.com/api/admin/emma-config?key=intent_fundamentals
```

**Output**:
```json
{
  "intent_fundamentals": {
    "value": "Tu es Emma, analyste fondamental CFA...",
    "description": "Prompt pour fondamentaux"
  }
}
```

---

### Node 2: Call Gemini
**Type**: HTTP Request
```
Method: POST
URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={{$env.GEMINI_API_KEY}}

Headers:
  Content-Type: application/json

Body (JSON):
{
  "contents": [{
    "parts": [{
      "text": "{{$json.intent_fundamentals.value}}\n\nAnalyse le ticker: AAPL"
    }]
  }]
}
```

**Utiliser l'Expression Editor**:
```javascript
={{
  {
    "contents": [{
      "parts": [{
        "text": $json.intent_fundamentals.value + "\n\nAnalyse: " + $json.ticker
      }]
    }]
  }
}}
```

---

### Node 3: Extract Response
**Type**: Code
```javascript
const response = $json.candidates[0].content.parts[0].text;
return {
  analysis: response,
  ticker: $('Node 1').json.ticker
};
```

---

## 🔑 Variables d'Environnement Requises

Dans n8n → Settings → Variables:
```
GEMINI_API_KEY = AIza...
RESEND_API_KEY = re_...  (si email)
```

---

## 📊 Exemples de Prompts Disponibles

| Key | Usage | Type |
|-----|-------|------|
| `intent_fundamentals` | Analyse fondamentale | string |
| `intent_comprehensive_analysis` | Analyse 360° | string |
| `intent_comparative_analysis` | Comparaison tickers | string |
| `briefing_morning` | Briefing 7h20 | json |
| `briefing_midday` | Briefing 11h50 | json |
| `briefing_evening` | Briefing 16h20 | json |
| `cfa_standards` | Standards CFA® | string |

---

## 🚀 Templates Prêts à l'Emploi

### Template 1: Analyse Simple
```javascript
// Node: Code (avant Gemini)
const promptKey = 'intent_fundamentals';
const ticker = 'AAPL';

// Fetch prompt
const promptUrl = `https://gobapps.com/api/admin/emma-config?key=${promptKey}`;

return {
  json: {
    promptKey,
    ticker,
    promptUrl
  }
};
```

---

### Template 2: Briefing Automatique
```javascript
// Node: Schedule Trigger
Cron: 20 11 * * 1-5  // 7h20 AM EST, lun-ven

// Node: HTTP Request
URL: https://gobapps.com/api/prompt-delivery-config?prompt_id=briefing_morning

// Node: Code (construire le prompt)
const config = $json.config;
const fullPrompt = config.prompt;
const recipients = $json.email_recipients || ['votre@email.com'];

return {
  json: {
    systemPrompt: fullPrompt,
    recipients: recipients,
    subject: config.name
  }
};
```

---

### Template 3: Multi-Tickers Batch
```javascript
// Node: Code (début du workflow)
const tickers = ['AAPL', 'MSFT', 'GOOGL'];
const promptKey = 'intent_fundamentals';

return tickers.map(ticker => ({
  json: { ticker, promptKey }
}));

// Node: HTTP Request (dans une loop)
URL: https://gobapps.com/api/admin/emma-config?key={{$json.promptKey}}

// Node: Gemini Call (dans la même loop)
// ... génère une analyse par ticker
```

---

## 📞 APIs Utiles

### Récupérer UN prompt
```
GET https://gobapps.com/api/admin/emma-config?key=intent_fundamentals
```

### Récupérer TOUS les prompts
```
GET https://gobapps.com/api/admin/emma-config
```

### Récupérer config de delivery
```
GET https://gobapps.com/api/prompt-delivery-config?prompt_id=briefing_morning
```

---

## 🐛 Troubleshooting

### "Cannot read property 'value' of undefined"
**Problème**: Mauvais chemin JSON
**Solution**: Vérifier que le `key` existe:
```javascript
const promptData = $json[promptKey];
if (!promptData) {
  throw new Error(`Prompt '${promptKey}' not found`);
}
const promptText = promptData.value;
```

### "API key not valid"
**Problème**: Variable d'env manquante
**Solution**: Vérifier Settings → Variables → `GEMINI_API_KEY`

### "Prompt returns empty"
**Problème**: Prompt pas encore dans Supabase
**Solution**: Exécuter `supabase-setup-complete.sql` d'abord

---

## 💡 Tips

1. **Tester d'abord avec curl**:
```bash
curl https://gobapps.com/api/admin/emma-config?key=intent_fundamentals
```

2. **Activer les logs n8n** pour debug
3. **Utiliser Code node** pour inspecter `$json`:
```javascript
console.log('Received:', JSON.stringify($json, null, 2));
return $json;
```

4. **Sauvegarder les templates** n8n fréquemment

---

**Guide complet**: `GUIDE-AJOUT-PROMPTS-N8N.md`
