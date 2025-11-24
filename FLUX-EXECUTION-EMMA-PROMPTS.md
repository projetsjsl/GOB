# 🎯 FLUX D'EXÉCUTION: Quand les Prompts Hardcodés sont Appelés

## 📱 EXEMPLE CONCRET: User envoie SMS "Analyse AAPL"

### 1️⃣ Réception SMS (Twilio → Vercel)
```
Twilio → POST https://gobapps.com/api/adapters/sms
```

**Fichier**: `/api/adapters/sms.js`
- Reçoit le webhook de Twilio
- Parse le message SMS

---

### 2️⃣ Routage vers API Chat
```
/api/adapters/sms → POST /api/chat
```

**Fichier**: `/api/chat.js` (ligne 108+)
- Paramètres envoyés:
  ```javascript
  {
    message: "Analyse AAPL",
    userId: "+15145551234",
    channel: "sms",
    metadata: { ... }
  }
  ```

---

### 3️⃣ Appel Emma Agent
```
/api/chat → /api/emma-agent
```

**Fichier**: `/api/chat.js` (ligne 320+)
```javascript
// Ligne 320-340
const emmaResponse = await fetch('/api/emma-agent', {
  method: 'POST',
  body: JSON.stringify({
    message: userMessage,
    context: {
      user_id: userProfile.id,
      user_name: userProfile.name,
      user_channel: channel, // "sms"
      conversationHistory: formattedHistory,
      output_mode: 'chat'
    }
  })
});
```

---

### 4️⃣ Emma Agent - Analyse Intent
```
emma-agent.js → processRequest()
```

**Fichier**: `/api/emma-agent.js` (ligne 47-90)
```javascript
// Ligne 88-90
const intentData = await this._analyzeIntent(userMessage, context);
console.log('🧠 Intent analysis:', intentData.intent);
// Résultat: { intent: 'comprehensive_analysis', tickers: ['AAPL'], confidence: 0.95 }
```

---

### 5️⃣ Sélection du Modèle AI
```
emma-agent.js → _selectModel()
```

**Fichier**: `/api/emma-agent.js` (ligne 490-580)
```javascript
// Ligne 548: Détecte que c'est une analyse complète
if (factualIntents.includes('comprehensive_analysis')) {
    return {
        model: 'perplexity',  // ← PERPLEXITY sélectionné
        reason: 'Factual analysis requires real-time data',
        recency: 'day'
    };
}
```

---

### 6️⃣ **🔥 CONSTRUCTION DU PROMPT (ICI LES PROMPTS HARDCODÉS SONT UTILISÉS!)**

**Fichier**: `/api/emma-agent.js`

#### Étape 6.1: Build Perplexity Prompt
```javascript
// Ligne 1753-1759
const prompt = this._buildPerplexityPrompt(
    userMessage,      // "Analyse AAPL"
    toolsData,        // Données des APIs
    conversationContext,
    context,          // { user_channel: 'sms' }
    intentData        // { intent: 'comprehensive_analysis' }
);
```

#### Étape 6.2: Build Chat Prompt
```javascript
// Ligne 2168-2174
_buildPerplexityPrompt() {
    return this._buildChatPrompt(userMessage, toolsData, ...);
}
```

#### Étape 6.3: **🎯 LES PROMPTS HARDCODÉS SONT CHARGÉS ICI!**

**Fichier**: `/api/emma-agent.js` (ligne 2300-2420)

```javascript
// Ligne 2395-2418: CFA_SYSTEM_PROMPT HARDCODÉ IMPORTÉ
const cfaIdentity = ['comprehensive_analysis', ...].includes(intentData.intent)
    ? `${CFA_SYSTEM_PROMPT.identity}  // ← PROMPT HARDCODÉ #1

${CFA_SYSTEM_PROMPT.productTypeGuidance}  // ← PROMPT HARDCODÉ #2

${userChannel === 'sms' ? CFA_SYSTEM_PROMPT.smsFormat : ''}  // ← PROMPT HARDCODÉ #3 (spécial SMS!)

🎯 MISSION: Analyse de niveau institutionnel CFA® avec:
- Nombre de ratios adaptatif selon question
- Comparaisons historiques recommandées
- Justifications détaillées chiffrées
- Sources fiables (FMP, Perplexity, Bloomberg)
- Formatage Bloomberg Terminal style
`
    : '';
```

**ORIGINE DE CFA_SYSTEM_PROMPT**:
```javascript
// Ligne 14: Import du prompt hardcodé
import { CFA_SYSTEM_PROMPT } from '../config/emma-cfa-prompt.js';
```

**Fichier source**: `/config/emma-cfa-prompt.js`
```javascript
export const CFA_SYSTEM_PROMPT = {
    identity: `Tu es Emma, CFA® Level III, analyste financière senior...`,

    productTypeGuidance: `ADAPTATION PAR TYPE DE PRODUIT FINANCIER...`,

    smsFormat: `FORMAT SMS ANALYSES COMPLÈTES:
- Multi-parties: Maximum 2 SMS (👩🏻 Partie 1/2, Partie 2/2)
- Profondeur maximale CFA dans cette limite: 12 sections détaillées
- Structure 12 sections numérotées pour analyses ticker:
  1. Vue d'ensemble + prix
  2. Valorisation (P/E, P/B, P/CF...)
  3. Performance YTD
  ...`,

    // ... 2800 mots de prompts!
};
```

#### Étape 6.4: Construction du Prompt Final Assemblé

```javascript
// Le prompt final envoyé à Perplexity est composé de:

const finalPrompt = `
${cfaIdentity}  // ← Prompts CFA hardcodés (lignes 2395-2418)

${productTypeContext}  // ← Détection auto du type (ETF, Stock, etc.)

${channelSpecificInstructions}  // ← Instructions SMS (ligne 2420-2450)

${toolsDataFormatted}  // ← Données des APIs (prix, fondamentaux, news)

${conversationHistory}  // ← Historique des 10 derniers messages

${userMessage}  // ← "Analyse AAPL"

⚠️ IMPORTANT: Réponds en analysant AAPL avec les 12 sections obligatoires pour SMS
`;
```

**Taille du prompt final**: ~3500-5000 mots!

---

### 7️⃣ Envoi à Perplexity API

**Fichier**: `/api/emma-agent.js` (ligne 1772-1783)

```javascript
// Ligne 1773
const perplexityResult = await this._call_perplexity(
    prompt,        // ← PROMPT ASSEMBLÉ avec prompts hardcodés
    outputMode,    // 'chat'
    recency,       // 'day' (données dernières 24h)
    userMessage,
    intentData,
    toolResults,
    context
);
```

**Appel HTTP vers Perplexity**:
```javascript
POST https://api.perplexity.ai/chat/completions
Headers: {
  Authorization: Bearer ${PERPLEXITY_API_KEY}
}
Body: {
  model: "llama-3.1-sonar-large-128k-online",
  messages: [
    {
      role: "system",
      content: `${CFA_SYSTEM_PROMPT.identity}...`  // ← PROMPTS HARDCODÉS
    },
    {
      role: "user",
      content: "Analyse AAPL [avec données outils]"
    }
  ]
}
```

---

### 8️⃣ Réponse de Perplexity

Perplexity génère une réponse basée sur le prompt hardcodé:

```
👩🏻 Partie 1/2

🎯 ANALYSE COMPLÈTE AAPL (Apple Inc.)

1️⃣ VUE D'ENSEMBLE + PRIX
Prix actuel: 189,84$ (-0,8%)
Capitalisation: 2,91T$
Niveau: -21% sous record historique

2️⃣ VALORISATION
P/E: 31,2x vs hist 5Y 28,4x (+10%)
P/B: 50,8x vs secteur 6,2x (premium)
P/CF: 25,1x vs hist 23,7x (+6%)

3️⃣ PERFORMANCE YTD
+45,2% vs S&P500 +23,4%
Surperformance: +21,8pp

...

📚 Sources: FMP, Perplexity, Bloomberg
```

---

### 9️⃣ Retour au User via SMS

```
emma-agent → /api/chat → /api/adapters/sms → Twilio → User 📱
```

---

## 🎯 RÉSUMÉ: Où sont les Prompts Hardcodés?

| Étape | Fichier | Ligne | Prompt Hardcodé Utilisé |
|-------|---------|-------|-------------------------|
| **Import** | `/api/emma-agent.js` | 14 | `import { CFA_SYSTEM_PROMPT }` |
| **Sélection** | `/api/emma-agent.js` | 2395-2418 | `CFA_SYSTEM_PROMPT.identity` |
| **Format SMS** | `/api/emma-agent.js` | 2400 | `CFA_SYSTEM_PROMPT.smsFormat` |
| **Guidance** | `/api/emma-agent.js` | 2398 | `CFA_SYSTEM_PROMPT.productTypeGuidance` |
| **Source** | `/config/emma-cfa-prompt.js` | - | Fichier de 2800 mots |

---

## 📊 Tableau Comparatif: Hardcodé vs Supabase

| Aspect | Système Hardcodé (ACTUEL) | Système Supabase (emma-config) |
|--------|---------------------------|--------------------------------|
| **Stockage** | Fichiers JS `/config`, `/lib` | Table `emma_config` Supabase |
| **Modification** | Éditer code → commit → deploy | Interface web emma-config.html |
| **Délai d'application** | ~2 min (Vercel build) | Immédiat (si connecté) |
| **Status** | ✅ UTILISÉ EN PRODUCTION | ❌ Pas connecté à Emma |
| **Fichiers** | `emma-cfa-prompt.js`, `dynamic-prompts.js`, `intent-prompts.js` | API: `/api/admin/emma-config` |
| **Avantage** | Rapide, pas de DB query | Modifiable sans redéploiement |
| **Inconvénient** | Nécessite redéploiement | Nécessite implémentation |

---

## 🔄 Pour Connecter les Deux Systèmes

Il faudrait modifier `/api/emma-agent.js` ligne 2395:

**AVANT (hardcodé)**:
```javascript
const cfaIdentity = `${CFA_SYSTEM_PROMPT.identity}...`;
```

**APRÈS (depuis Supabase)**:
```javascript
// Charger depuis emma_config
const identityPrompt = await getConfig('prompts', 'general_identity');
const smsPrompt = await getConfig('prompts', 'general_identity_sms');
const cfaStandards = await getConfig('prompts', 'cfa_standards');

const cfaIdentity = `${identityPrompt.value}

${cfaStandards.value}

${userChannel === 'sms' ? smsPrompt.value : ''}
`;
```

---

## ✅ CONCLUSION

**Les prompts hardcodés sont appelés**:
1. ✅ À chaque requête utilisateur (SMS, Web, Email)
2. ✅ Dans `/api/emma-agent.js` ligne 2395-2418
3. ✅ Lors de la construction du prompt système pour Perplexity/Gemini/Claude
4. ✅ Avant l'envoi à l'API AI (étape 7)

**Ils sont importés depuis**:
- `/config/emma-cfa-prompt.js` (CFA_SYSTEM_PROMPT - 2800 mots)
- `/config/intent-prompts.js` (INTENT_PROMPTS par type d'analyse)
- `/lib/dynamic-prompts.js` (DynamicPromptsSystem - instructions canal)

**Fréquence d'utilisation**: **100% des requêtes Emma** utilisent ces prompts hardcodés!
