# 🎯 Emma Agent - Système de Contexte 3 Modes

**Architecture:** Output Mode Adaptation - Context-Aware Responses

---

## 🔍 PROBLÈME ACTUEL

Emma Agent retourne TOUJOURS une réponse conversationnelle, quelle que soit l'utilisation:

```javascript
// PROBLÈME: Même prompt pour tous les contextes
_buildPerplexityPrompt(userMessage, toolsData, conversationContext, context, intentData) {
    let prompt = `Tu es Emma, l'assistante financière intelligente. Réponds en français de manière professionnelle et accessible.

    QUESTION DE L'UTILISATEUR: ${userMessage}

    INSTRUCTIONS:
    1. Utilise UNIQUEMENT les données fournies par les outils
    2. Sois précis et cite tes sources
    3. Adapte ton ton selon le contexte
    ...`;

    return prompt;
}
```

**Résultat:**
- ❌ Ask Emma Chatbot: "Voici le prix d'Apple: $245.67..." ✅ OK pour chat
- ❌ Populate JLab: "Voici le prix d'Apple: $245.67..." ❌ On veut juste `245.67`
- ❌ Génération email: "Apple se négocie à..." ❌ On veut analyse détaillée formatée

---

## ✅ SOLUTION: 3 MODES OUTPUT

### **Mode 1: CHAT** (Conversationnel)
**Utilisation:** Ask Emma Chatbot
**Format:** Réponse conversationnelle naturelle
**Exemple:**
```
Utilisateur: "Quel est le prix d'Apple?"
Emma: "Le prix actuel d'Apple (AAPL) est de $245.67, en hausse de +2.34%
       (+$5.67) aujourd'hui. Le titre a ouvert à $240.00..."
```

### **Mode 2: DATA** (Données Structurées)
**Utilisation:** Populate UI (JLab, Watchlist, StocksNews)
**Format:** JSON structuré avec SEULEMENT les données demandées
**Exemple:**
```json
{
  "AAPL": {
    "price": 245.67,
    "change": 5.67,
    "changePercent": 2.34,
    "volume": 58234567,
    "marketCap": 3850000000000,
    "pe": 32.4,
    "eps": 7.58
  }
}
```

### **Mode 3: BRIEFING** (Analyse Détaillée)
**Utilisation:** Emma En Direct - Génération d'emails
**Format:** Analyse approfondie formatée en HTML/Markdown
**Exemple:**
```markdown
## 📊 Apple Inc. (AAPL) - Analyse de Clôture

**Prix Actuel:** $245.67 (+2.34%, +$5.67)

### Performance du Jour
Apple a clôturé en hausse de 2.34% à $245.67, porté par des résultats
trimestriels supérieurs aux attentes. Le volume s'est établi à 58.2M
d'actions, supérieur à la moyenne de 50.3M.

### Catalyseurs
- Résultats Q4: EPS $1.52 vs $1.39 attendu (+9% surprise)
- Revenus iPhone: +12% YoY ($45.2B)
- Services en forte croissance: +16% YoY

### Analyse Technique
- RSI: 67 (territoire d'achat modéré)
- MACD: Signal d'achat confirmé
- Support: $240, Résistance: $250

### Recommandations Analystes
- 24 Buy, 8 Hold, 2 Sell
- Prix cible moyen: $260 (+5.8% de potentiel)

---
**Sources:** Polygon.io, FMP, Finnhub News
```

---

## 🛠️ IMPLÉMENTATION

### **1. Ajouter `output_mode` au Contexte**

```javascript
// Dans chaque appel à Emma Agent, spécifier le mode
const context = {
    output_mode: 'chat' | 'data' | 'briefing',
    ...otherContext
};
```

### **2. Modifier `_buildPerplexityPrompt()`**

```javascript
_buildPerplexityPrompt(userMessage, toolsData, conversationContext, context, intentData = null) {
    const outputMode = context.output_mode || 'chat'; // Default: chat

    let prompt = '';

    // Adapter le prompt selon le mode
    switch (outputMode) {
        case 'chat':
            prompt = this._buildChatPrompt(userMessage, toolsData, conversationContext, intentData);
            break;

        case 'data':
            prompt = this._buildDataPrompt(userMessage, toolsData, context);
            break;

        case 'briefing':
            prompt = this._buildBriefingPrompt(userMessage, toolsData, context, intentData);
            break;

        default:
            prompt = this._buildChatPrompt(userMessage, toolsData, conversationContext, intentData);
    }

    return prompt;
}
```

### **3. Créer Prompts Spécifiques**

#### **A. Chat Prompt** (Conversationnel)
```javascript
_buildChatPrompt(userMessage, toolsData, conversationContext, intentData) {
    return `Tu es Emma, l'assistante financière intelligente. Réponds en français de manière professionnelle et accessible.

CONTEXTE DE LA CONVERSATION:
${conversationContext.map(c => `- ${c.role}: ${c.content}`).join('\n')}

DONNÉES DISPONIBLES DES OUTILS:
${toolsData.map(t => `- ${t.tool}: ${JSON.stringify(t.data)}`).join('\n')}

QUESTION DE L'UTILISATEUR: ${userMessage}

INSTRUCTIONS:
1. Réponds de manière CONVERSATIONNELLE et NATURELLE
2. Utilise UNIQUEMENT les données fournies par les outils
3. Cite tes sources (outils utilisés)
4. Sois précis mais accessible
5. Si les données sont insuffisantes, indique-le clairement

RÉPONSE:`;
}
```

#### **B. Data Prompt** (JSON Structuré)
```javascript
_buildDataPrompt(userMessage, toolsData, context) {
    return `Tu es Emma Data Extractor. Extrait et structure les données demandées en JSON STRICT.

DONNÉES DISPONIBLES DES OUTILS:
${toolsData.map(t => `- ${t.tool}: ${JSON.stringify(t.data)}`).join('\n')}

DEMANDE: ${userMessage}

TICKERS DEMANDÉS: ${context.tickers?.join(', ') || 'tous'}

INSTRUCTIONS CRITIQUES:
1. RETOURNER UNIQUEMENT DU JSON VALIDE - PAS DE TEXTE AVANT OU APRÈS
2. Structure: { "TICKER": { "field": value, ... } }
3. Inclure SEULEMENT les champs demandés ou pertinents
4. Valeurs numériques en NUMBER, pas en STRING
5. Si donnée manquante: utiliser null
6. Pas de commentaires, pas d'explications, SEULEMENT JSON

EXEMPLE FORMAT:
{
  "AAPL": {
    "price": 245.67,
    "change": 5.67,
    "changePercent": 2.34,
    "volume": 58234567,
    "pe": 32.4
  }
}

RÉPONSE JSON:`;
}
```

#### **C. Briefing Prompt** (Analyse Détaillée)
```javascript
_buildBriefingPrompt(userMessage, toolsData, context, intentData) {
    const briefingType = context.briefing_type || 'general'; // morning/noon/evening/general

    return `Tu es Emma Financial Analyst. Rédige une analyse approfondie pour un briefing ${briefingType}.

DONNÉES DISPONIBLES DES OUTILS:
${toolsData.map(t => `- ${t.tool}: ${JSON.stringify(t.data)}`).join('\n')}

CONTEXTE: ${userMessage}

INTENT DÉTECTÉ:
- Type: ${intentData?.intent || 'market_overview'}
- Importance: ${intentData?.importance_level || 5}/10
- Trending Topics: ${intentData?.trending_topics?.join(', ') || 'N/A'}

INSTRUCTIONS:
1. Rédige une analyse DÉTAILLÉE et PROFESSIONNELLE (1500-2000 mots)
2. Structure: Résumé → Performance → Catalyseurs → Analyse Technique → Recommandations
3. Format MARKDOWN avec sections claires (##, ###)
4. Inclure des DONNÉES CHIFFRÉES précises
5. Citer les SOURCES en bas
6. Ton: Professionnel institutionnel
7. Focus sur l'ACTIONNABLE

STRUCTURE ATTENDUE:
## 📊 [Titre Principal]

**Résumé Exécutif:** [2-3 phrases clés]

### Performance du Jour
[Analyse des mouvements de prix, volumes, catalyseurs]

### Analyse Fondamentale
[PE, revenus, marges, croissance]

### Analyse Technique
[RSI, MACD, support/résistance]

### Actualités et Catalyseurs
[News importantes avec impact]

### Recommandations
[Insights actionnables]

---
**Sources:** [Liste des outils/APIs utilisés]

RÉPONSE MARKDOWN:`;
}
```

### **4. Formater la Sortie selon le Mode**

```javascript
async _generate_response(userMessage, toolResults, context, intentData = null) {
    try {
        const outputMode = context.output_mode || 'chat';

        // Préparer données
        const toolsData = toolResults
            .filter(r => r.success && r.data)
            .map(r => ({ tool: r.tool_id, data: r.data }));

        const conversationContext = this.conversationHistory.slice(-5);

        // Construire prompt adapté au mode
        const perplexityPrompt = this._buildPerplexityPrompt(
            userMessage,
            toolsData,
            conversationContext,
            context,
            intentData
        );

        // Appel Perplexity
        let perplexityResponse = await this._call_perplexity(perplexityPrompt, outputMode);

        // Post-traitement selon le mode
        if (outputMode === 'data') {
            // Valider et parser le JSON
            perplexityResponse = this._validateAndParseJSON(perplexityResponse);
        }

        return perplexityResponse;

    } catch (error) {
        console.error('❌ Response generation failed:', error);
        return this._generateFallbackResponse(userMessage, toolResults, context.output_mode);
    }
}
```

### **5. Valider JSON en Mode DATA**

```javascript
_validateAndParseJSON(response) {
    try {
        // Extraire JSON si du texte avant/après
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Retourner JSON stringifié proprement
        return JSON.stringify(parsed, null, 2);

    } catch (error) {
        console.error('❌ JSON validation failed:', error);
        return '{}'; // Fallback: objet vide
    }
}
```

---

## 📊 EXEMPLES CONCRETS PAR MODE

### **Exemple 1: Ask Emma Chatbot → MODE CHAT**

```javascript
// Appel
const response = await fetch('/api/emma-agent', {
    method: 'POST',
    body: JSON.stringify({
        message: "Quel est le prix d'Apple?",
        context: {
            output_mode: 'chat',  // ← MODE CHAT
            tickers: ['AAPL']
        }
    })
});

// Réponse
{
    "success": true,
    "response": "Le prix actuel d'Apple (AAPL) est de $245.67, en hausse de +2.34% (+$5.67) aujourd'hui. Le titre a ouvert à $240.00 et a atteint un maximum de $246.50. Le volume s'est établi à 58.2M d'actions.\n\n**Sources:** Polygon Stock Price API",
    "tools_used": ["polygon-stock-price"],
    "output_mode": "chat"
}
```

### **Exemple 2: Populate JLab → MODE DATA**

```javascript
// Appel
const response = await fetch('/api/emma-agent', {
    method: 'POST',
    body: JSON.stringify({
        message: "Récupérer prix, PE, volume pour tous les tickers d'équipe",
        context: {
            output_mode: 'data',  // ← MODE DATA
            tickers: ['AAPL', 'MSFT', 'GOOGL'],
            fields_requested: ['price', 'pe', 'volume', 'marketCap']
        }
    })
});

// Réponse
{
    "success": true,
    "response": {
        "AAPL": {
            "price": 245.67,
            "pe": 32.4,
            "volume": 58234567,
            "marketCap": 3850000000000
        },
        "MSFT": {
            "price": 428.32,
            "pe": 38.1,
            "volume": 24567890,
            "marketCap": 3200000000000
        },
        "GOOGL": {
            "price": 178.45,
            "pe": 28.7,
            "volume": 18923456,
            "marketCap": 2240000000000
        }
    },
    "tools_used": ["polygon-stock-price", "fmp-fundamentals"],
    "output_mode": "data"
}
```

### **Exemple 3: Emma En Direct → MODE BRIEFING**

```javascript
// Appel
const response = await fetch('/api/emma-agent', {
    method: 'POST',
    body: JSON.stringify({
        message: "Générer briefing du soir pour les tickers d'équipe",
        context: {
            output_mode: 'briefing',  // ← MODE BRIEFING
            briefing_type: 'evening',
            tickers: ['AAPL', 'MSFT'],
            intent: 'market_overview',
            importance_level: 7
        }
    })
});

// Réponse
{
    "success": true,
    "response": "## 📊 Rapport de Clôture - 16 octobre 2025\n\n**Résumé Exécutif:** Les marchés ont clôturé en hausse, portés par des résultats solides d'Apple et Microsoft...\n\n### Performance du Jour\nApple (AAPL) a gagné 2.34% à $245.67...\n\n[...analyse détaillée 1500-2000 mots...]",
    "tools_used": ["polygon-stock-price", "finnhub-news", "fmp-fundamentals"],
    "output_mode": "briefing"
}
```

---

## 🗄️ SAUVEGARDE CONFIG DANS SUPABASE

Créer une table `emma_context_configs` pour retenir les préférences:

```sql
CREATE TABLE emma_context_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    context_name TEXT,  -- 'ask_emma_chat', 'jlab_populate', 'briefing_evening'
    output_mode TEXT,   -- 'chat', 'data', 'briefing'
    default_params JSONB,  -- Paramètres par défaut pour ce contexte
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exemple de configs sauvegardées
INSERT INTO emma_context_configs (context_name, output_mode, default_params) VALUES
('ask_emma_chat', 'chat', '{"temperature": 0.7, "max_tokens": 1000}'),
('jlab_populate', 'data', '{"fields": ["price", "pe", "volume"], "format": "json"}'),
('briefing_morning', 'briefing', '{"type": "morning", "length": 2000, "style": "professional"}');
```

---

## 🎯 BÉNÉFICES

| Aspect | AVANT | APRÈS |
|--------|-------|-------|
| **Ask Emma Chat** | ✅ Conversationnel | ✅ Conversationnel (inchangé) |
| **Populate UI** | ❌ Blabla inutile | ✅ JSON structuré propre |
| **Briefing Email** | ❌ Réponse courte | ✅ Analyse détaillée 1500-2000 mots |
| **Clarté Intention** | ❌ Ambiguë | ✅ Mode explicite |
| **Performance** | ❌ Tokens gaspillés | ✅ Réponses optimisées |
| **Maintenance** | ❌ 1 prompt pour tout | ✅ 3 prompts spécialisés |

---

## 🚀 PROCHAINES ÉTAPES

1. ✅ Créer cette documentation
2. ⏳ Implémenter les 3 fonctions de prompt
3. ⏳ Modifier `_buildPerplexityPrompt()` avec switch
4. ⏳ Ajouter validation JSON pour mode DATA
5. ⏳ Créer table Supabase pour config
6. ⏳ Tester les 3 modes
7. ⏳ Déployer et valider en production

---

**Version:** 1.0 - Context Mode System
**Dernière mise à jour:** 2025-10-16
