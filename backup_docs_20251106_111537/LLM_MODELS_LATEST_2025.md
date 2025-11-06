# 🤖 Modèles LLM Les Plus Récents - Janvier 2025

**Date de validation:** 2025-01-27

---

## 📊 Modèles Actuels dans Emma

| Provider | Modèle Actuel | Date Version | Status |
|----------|---------------|--------------|--------|
| **Perplexity** | `sonar-pro` | 2024 | 🟡 À mettre à jour |
| **Gemini** | `gemini-2.0-flash-exp` | Déc 2024 | ✅ Récent |
| **Claude** | `claude-3-5-sonnet-20241022` | Oct 2024 | 🟡 Vérifier updates |
| **OpenAI** | N/A | - | ❌ Pas intégré |

---

## ✅ Modèles Recommandés - Janvier 2025

### 1. **Perplexity (Mise à jour disponible)**

**Modèles disponibles (2025):**

| Modèle | Description | Cas d'usage | Coût |
|--------|-------------|-------------|------|
| **sonar** | Nouveau modèle unifié (remplace sonar-pro) | Recherche générale avec sources | $$ |
| **sonar-reasoning** | Version avec capacités de raisonnement | Analyses complexes | $$$ |
| **sonar-pro** (ancien) | Modèle précédent | Déprécié progressivement | $$ |

**Recommandation:** ✅ **Migrer vers `sonar`**

**Raisons:**
- Plus récent et optimisé
- Meilleures capacités de recherche
- Remplace officiellement sonar-pro
- Même prix

**Alternative:** `sonar-reasoning` pour analyses complexes (+coût)

---

### 2. **Gemini (Déjà à jour avec options avancées)**

**Modèles disponibles (Janvier 2025):**

| Modèle | Description | Contexte | Coût |
|--------|-------------|----------|------|
| **gemini-2.0-flash-exp** ✅ | Version rapide (actuel) | 1M tokens | GRATUIT |
| **gemini-2.0-flash-thinking-exp-01-21** | Avec raisonnement étendu | 1M tokens | GRATUIT |
| **gemini-exp-1206** | Version expérimentale avancée | 2M tokens | GRATUIT |
| **gemini-2.0-flash-thinking-exp** | Ancien thinking | 32K tokens | GRATUIT |

**Recommandation actuelle:** ✅ **Garder `gemini-2.0-flash-exp`** (excellent balance)

**Alternative pour raisonnement:** `gemini-2.0-flash-thinking-exp-01-21`

**Raisons:**
- Modèle actuel est excellent
- Gratuit et rapide
- 1M tokens context suffit

**Option avancée:** Utiliser `gemini-2.0-flash-thinking-exp-01-21` pour:
- Analyses earnings complexes
- Verdicts BUY/HOLD/SELL nécessitant raisonnement
- Questions multi-étapes

---

### 3. **Claude (Vérifier dernière version)**

**Modèles disponibles (Janvier 2025):**

| Modèle | Description | Contexte | Disponibilité |
|--------|-------------|----------|---------------|
| **claude-3-5-sonnet-20241022** ✅ | Version actuelle | 200K | Stable |
| **claude-3-5-sonnet-20250122** | Possiblement sorti en janvier | 200K | À vérifier |
| **claude-3-opus-20240229** | Plus puissant mais lent | 200K | Stable |

**Recommandation:** 🔍 **Vérifier si version janvier 2025 existe**

**Action:**
1. Tester si `claude-3-5-sonnet-20250122` existe
2. Si oui → migrer
3. Si non → garder `claude-3-5-sonnet-20241022`

**Version actuelle (Oct 2024) est excellente pour:**
- Briefings quotidiens
- Rédaction long format
- Ton professionnel

---

### 4. **OpenAI (À Ajouter)**

**Modèles disponibles (Janvier 2025):**

| Modèle | Description | Contexte | Coût | Cas d'usage |
|--------|-------------|----------|------|-------------|
| **gpt-4o** | Multimodal, plus rapide | 128K | $$$ | Chat général, analyses |
| **gpt-4o-mini** | Version économique | 128K | $ | Tâches simples |
| **o1-preview** | Raisonnement complexe | 128K | $$$$ | Analyses critiques |
| **o1-mini** | Raisonnement économique | 128K | $$ | Analyses standards |
| **gpt-4-turbo** | GPT-4 optimisé | 128K | $$$ | Alternative stable |

**Recommandations par cas d'usage:**

#### Option 1: GPT-4o (Standard)
```javascript
model: 'gpt-4o'  // Balance qualité/coût
```
- ✅ Bon pour chat général
- ✅ Analyses rapides
- ✅ Multimodal (images si besoin futur)

#### Option 2: o1-mini (Raisonnement)
```javascript
model: 'o1-mini'  // Raisonnement économique
```
- ✅ Verdict earnings (BUY/HOLD/SELL)
- ✅ Analyses complexes multi-facteurs
- ✅ Meilleur que GPT-4o pour logique

#### Option 3: o1-preview (Premium)
```javascript
model: 'o1-preview'  // Raisonnement avancé
```
- ✅ Analyses critiques très importantes
- ❌ Plus cher (~3x o1-mini)
- 🎯 Réserver pour cas exceptionnels

---

## 🎯 Configuration Recommandée (Janvier 2025)

### Architecture Optimale - 5 LLMs

| Provider | Modèle | Usage | Cas d'usage |
|----------|--------|-------|-------------|
| **Perplexity** | `sonar` | 60% | Recherche avec sources |
| **Gemini** | `gemini-2.0-flash-exp` | 15% | Questions conceptuelles |
| **Gemini Thinking** | `gemini-2.0-flash-thinking-exp-01-21` | 10% | Analyses complexes |
| **OpenAI** | `gpt-4o` | 10% | Chat général + fallback |
| **Claude** | `claude-3-5-sonnet-20241022` | 5% | Briefings premium |

**Coût estimé:** ~$30-40/mois

---

### Architecture Budget - 3 LLMs

| Provider | Modèle | Usage | Cas d'usage |
|----------|--------|-------|-------------|
| **Perplexity** | `sonar` | 75% | Recherche avec sources |
| **Gemini** | `gemini-2.0-flash-exp` | 20% | Conceptuel + fallback |
| **Claude** | `claude-3-5-sonnet-20241022` | 5% | Briefings |

**Coût estimé:** ~$25/mois

---

## 📝 Changements à Effectuer dans le Code

### 1. Perplexity: sonar-pro → sonar

**Fichier:** `api/emma-agent.js` ligne 1161

**AVANT:**
```javascript
const requestBody = {
    model: 'sonar-pro',  // Modèle actuel Perplexity
    messages: [...]
};
```

**APRÈS:**
```javascript
const requestBody = {
    model: 'sonar',  // Nouveau modèle unifié Perplexity (Jan 2025)
    messages: [...]
};
```

---

### 2. Gemini: Ajouter option thinking

**Fichier:** `api/emma-agent.js` ligne 1218

**GARDER actuel pour chat:**
```javascript
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`;
```

**AJOUTER nouveau pour raisonnement:**
```javascript
// Nouvelle méthode _call_gemini_thinking()
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp-01-21:generateContent?key=${process.env.GEMINI_API_KEY}`;
```

**Utilisation:** Pour earnings verdicts, analyses multi-étapes

---

### 3. Claude: Vérifier dernière version

**Fichier:** `api/emma-agent.js` ligne 1307

**Test si nouvelle version existe:**
```javascript
// Essayer d'abord version janvier 2025
model: 'claude-3-5-sonnet-20250122'

// Si erreur 404 → fallback sur actuelle
model: 'claude-3-5-sonnet-20241022'
```

---

### 4. OpenAI: Ajouter nouveau provider

**Nouveau fichier ou méthode dans `api/emma-agent.js`:**

```javascript
/**
 * Appel à OpenAI GPT-4o
 */
async _call_gpt4(prompt, outputMode = 'chat') {
    try {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY not configured');
        }

        const maxTokens = outputMode === 'briefing' ? 4000 : 1000;

        // Choisir le bon modèle selon le cas
        let model = 'gpt-4o'; // Default

        // Si raisonnement complexe nécessaire
        if (outputMode === 'reasoning') {
            model = 'o1-mini'; // Meilleur pour logique
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: outputMode === 'data'
                            ? 'Tu es Emma Data Extractor. Retourne UNIQUEMENT du JSON valide.'
                            : `Tu es Emma, analyste financière experte.

RÈGLES CRITIQUES:
- ❌ NE JAMAIS retourner du JSON brut ou du code
- ✅ TOUJOURS analyser et interpréter les données
- ✅ Tu es une ANALYSTE qui INTERPRÈTE
- ✅ Réponds en français professionnel et accessible`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: maxTokens,
                temperature: 0.7,
                // JSON mode si data extraction
                ...(outputMode === 'data' && { response_format: { type: 'json_object' } })
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error('❌ OpenAI API error:', error);
        throw new Error(`Erreur de communication avec OpenAI: ${error.message}`);
    }
}
```

---

### 5. SmartRouter: Ajouter logique GPT-4o

**Fichier:** `api/emma-agent.js` méthode `_selectModel()`

**AJOUTER après la section Gemini:**

```javascript
// GPT-4O: Fallback premium ou analyses spécifiques
const gpt4Intents = [
    'json_extraction',  // JSON garanti avec response_format
    'complex_analysis'  // Si Perplexity fails
];

if (gpt4Intents.includes(intent) || outputMode === 'data_guaranteed') {
    console.log(`🤖 GPT-4o selected for ${intent} (JSON guaranteed)`);
    return {
        model: 'gpt4',
        reason: `GPT-4o for ${intent} with guaranteed JSON`,
        recency: null
    };
}
```

---

## 🧪 Plan de Test

### Test 1: Perplexity `sonar`
```bash
# Tester avec simple query
curl -X POST "https://api.perplexity.ai/chat/completions" \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sonar",
    "messages": [{"role": "user", "content": "What is Apple stock price?"}]
  }'
```

**Résultat attendu:** Réponse avec sources web

---

### Test 2: Gemini Thinking
```bash
# Tester raisonnement complexe
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp-01-21:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "If Apple beats EPS by 5% but lowers guidance, should I buy or sell?"}]
    }]
  }'
```

**Résultat attendu:** Raisonnement step-by-step avant conclusion

---

### Test 3: Claude nouvelle version
```bash
# Tester si version janvier existe
curl "https://api.anthropic.com/v1/messages" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20250122",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**Si erreur 404:** Garder `claude-3-5-sonnet-20241022`

---

### Test 4: OpenAI GPT-4o
```bash
# Tester GPT-4o
curl "https://api.openai.com/v1/chat/completions" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Analyze Apple earnings"}]
  }'
```

---

## 💰 Impact Coûts

### Avant (3 LLMs):
- Perplexity (sonar-pro): $20
- Gemini (2.0-flash): $0
- Claude (3.5 sonnet): $5
- **Total: $25/mois**

### Après - Option Minimale (3 LLMs optimisés):
- Perplexity (sonar): $20
- Gemini (2.0-flash): $0
- Claude (3.5 sonnet): $5
- **Total: $25/mois** ✅ Pas de surcoût

### Après - Option Standard (+ OpenAI):
- Perplexity (sonar): $18
- Gemini (2.0-flash): $0
- Claude (3.5 sonnet): $5
- OpenAI (gpt-4o): $7
- **Total: $30/mois** (+$5)

### Après - Option Premium (+ OpenAI + Thinking):
- Perplexity (sonar): $15
- Gemini (2.0-flash + thinking): $0
- Claude (3.5 sonnet): $5
- OpenAI (gpt-4o + o1-mini): $12
- **Total: $32/mois** (+$7)

---

## 🎯 Recommandation Finale

### Mise à jour Minimale (Gratuit, Immédiat):
1. ✅ Perplexity: `sonar-pro` → `sonar`
2. ✅ Garder Gemini `gemini-2.0-flash-exp`
3. ✅ Vérifier Claude pour version janvier
4. ❌ Pas OpenAI pour l'instant

**Avantages:**
- Aucun surcoût
- Modèles plus récents
- Meilleures performances

---

### Mise à jour Recommandée (+$5-7/mois):
1. ✅ Perplexity: `sonar`
2. ✅ Gemini: `gemini-2.0-flash-exp` + `gemini-2.0-flash-thinking-exp-01-21`
3. ✅ Claude: Latest version
4. ✅ OpenAI: `gpt-4o` pour fallback premium

**Avantages:**
- Redondance complète
- Meilleure qualité analyses
- JSON garanti (GPT-4o)
- Raisonnement avancé (Gemini Thinking + o1-mini)

---

**Status:** 🟢 **Prêt pour mise à jour**
**Action:** **Appliquer changements maintenant**
