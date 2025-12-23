# 🎯 Multi-Agent Orchestrator - Integration Guide

## Where to Interact with the Orchestrator

This document shows all the places where you can call the Multi-Agent Orchestrator.

---

## 🌐 1. REST API Endpoint

### Location: `/api/orchestrator`

**GET Requests:**

```javascript
// Get status
fetch('/api/orchestrator')

// List personas
fetch('/api/orchestrator?action=personas')

// Get recommended model
fetch('/api/orchestrator?action=models&taskType=research')
```

**POST Requests:**

```javascript
// Simple request
fetch('/api/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        message: "Analyse AAPL"
    })
})

// With persona
fetch('/api/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        message: "Trouve les risques",
        persona: "critic",
        tickers: ["TSLA"],
        options: { comprehensive: true }
    })
})
```

---

## 🖥️ 2. Browser Console (Global Client)

### File: `/public/js/orchestrator-client.js`

When loaded in the browser, `window.orchestratorClient` is available:

```javascript
// Simple ask
await orchestratorClient.ask("Analyse AAPL")

// Persona shortcuts
await orchestratorClient.askFinance("Valorisation Microsoft", ["MSFT"])
await orchestratorClient.askCritic("Risques Tesla")
await orchestratorClient.askResearcher("Tendances IA 2025")
await orchestratorClient.askWriter("Briefing marchés matinal")
await orchestratorClient.askGeek("RSI et MACD sur NVDA", ["NVDA"])
await orchestratorClient.askMacro("Impact des taux Fed")
await orchestratorClient.askCEO("Apple", "Quelle est votre stratégie IA ?")

// Get status
await orchestratorClient.getStatus()

// List personas
await orchestratorClient.getPersonas()
```

---

## 📊 3. Dashboard Integration Points

### AskEmmaTab.js

**File:** `/public/js/dashboard/components/tabs/AskEmmaTab.js`

Add orchestrator as message handler:

```javascript
// In sendMessageToEmma function, replace or add:
import { orchestratorClient } from '../../orchestrator-client.js';

const sendMessageToOrchestrator = async (message, persona = 'finance') => {
    const result = await orchestratorClient.askAs(persona, message, {
        tickers: extractedTickers
    });
    return result.response;
};
```

### ChatGPTGroupTab.js

**File:** `/public/js/dashboard/components/tabs/ChatGPTGroupTab.js`

Use orchestrator for multi-persona conversations:

```javascript
// Ask multiple personas
const [finance, critic] = await Promise.all([
    orchestratorClient.askFinance(message),
    orchestratorClient.askCritic(message)
]);
```

### EmailBriefingsTab.js

**File:** `/public/js/dashboard/components/tabs/EmailBriefingsTab.js`

Generate briefings with Writer persona:

```javascript
const briefingContent = await orchestratorClient.askWriter(
    `Génère un briefing ${type} pour le ${date}`,
    { format: 'email' }
);
```

---

## 🔗 4. EmmaIA App Integration

### File: `/emmaia/services/`

Create orchestrator service:

```javascript
// emmaia/services/orchestrator-service.ts
import { orchestratorClient } from '../../public/js/orchestrator-client.js';

export async function processWithPersona(message: string, personaId: string) {
    return orchestratorClient.askAs(personaId, message);
}
```

### Mode Components

- `CeoMode.tsx` → `orchestratorClient.askCEO(company, question)`
- `CriticMode.tsx` → `orchestratorClient.askCritic(message)`
- `ResearcherMode.tsx` → `orchestratorClient.askResearcher(message)`
- `WriterMode.tsx` → `orchestratorClient.askWriter(message)`
- `TechnicalMode.tsx` → `orchestratorClient.askGeek(message)`

---

## ⚡ 5. Server-Side (Node.js Scripts)

### Direct Import

```javascript
import { masterOrchestrator } from './lib/orchestrator/master-orchestrator.js';

const result = await masterOrchestrator.process(
    "Analyse AAPL",
    { persona: 'finance' }
);
console.log(result.response);
```

### In Cron Jobs / Scheduled Tasks

```javascript
// api/cron-briefings.js
import { masterOrchestrator } from '../lib/orchestrator/master-orchestrator.js';

async function generateMorningBriefing() {
    const result = await masterOrchestrator.process(
        "Génère le briefing matinal complet",
        { persona: 'writer', channel: 'email' }
    );
    return result.response;
}
```

---

## 📱 6. SMS / Twilio Integration

### File: `/lib/sms/`

```javascript
import { masterOrchestrator } from '../orchestrator/master-orchestrator.js';

async function handleSMSMessage(from, body) {
    const result = await masterOrchestrator.process(body, {
        persona: 'finance',  // Default for SMS
        channel: 'sms',
        user: from
    });
    
    // Format for SMS (short responses)
    return formatForSMS(result.response);
}
```

---

## 🧪 7. Testing / Development

### Test Script

```bash
node scripts/test-orchestrator.js
```

### Quick REPL Test

```javascript
// In Node.js REPL
import { masterOrchestrator } from './lib/orchestrator/master-orchestrator.js';

await masterOrchestrator.process("Test", { persona: "finance" });
```

---

## 📋 Quick Reference: All Personas

| Persona ID | Client Method | Best For |
|------------|---------------|----------|
| `finance` | `askFinance()` | Stock analysis, fundamentals |
| `critic` | `askCritic()` | Risk analysis, contrarian views |
| `researcher` | `askResearcher()` | Deep research, citations |
| `writer` | `askWriter()` | Briefings, emails, reports |
| `geek` | `askGeek()` | Technical analysis, charts |
| `ceo` | `askCEO()` | CEO simulation |
| `macro` | `askMacro()` | Macroeconomics, Fed, rates |
| `politics` | (use `askAs`) | Geopolitical analysis |

---

## 🔧 Configuration

### emma-config (Supabase)

All prompts are configurable via `/emma-config.html`:

- `prompts.finance_identity`
- `prompts.critic_identity`
- `prompts.researcher_identity`
- `prompts.writer_identity`
- `prompts.technical_identity`
- `prompts.ceo_template`
- `prompts.macro_identity`
- `prompts.politics_identity`

---

## 📁 File Locations Summary

```
GOB/
├── api/
│   └── orchestrator.js              # REST API endpoint
│
├── lib/orchestrator/
│   ├── master-orchestrator.js       # Central brain
│   ├── persona-manager.js           # 8 personas
│   ├── model-selector-agent.js      # LLM selection
│   └── base-agent.js                # Agent base class
│
├── public/js/
│   └── orchestrator-client.js       # Frontend client
│
└── scripts/
    └── test-orchestrator.js         # Test suite
```

---

*Last updated: 2024-12-22*
