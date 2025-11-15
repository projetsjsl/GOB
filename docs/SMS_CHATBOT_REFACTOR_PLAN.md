# PLAN DE REFACTOR - CHATBOT SMS
## Architecture "LLM = Formateur de réponses"

**Date**: 2025-01-15
**Objectif**: Transformer le chatbot SMS en un système robuste où le LLM est uniquement un formateur, jamais une source de vérité.

---

## 📋 PRINCIPES CLÉS

### 1. Pipeline SMS Clair
```
SMS → Détection Intention → Appel API(s) → LLM Formatter → SMS Réponse
```

### 2. LLM = FORMATEUR Uniquement
- ❌ **Jamais source de faits** (prix, données, calculs)
- ✅ **Résumer** les données des APIs
- ✅ **Reformuler** en français clair
- ✅ **Structurer** pour format SMS (1-2 SMS max)
- ✅ **Tronquer intelligemment** si dépassement

### 3. Intentions SMS Limitées
Ensemble contrôlé et strict pour robustesse maximale :

**ANALYSES (6 intents):**
- `ANALYSE` : "Analyse AAPL" → Analyse complète du ticker
- `DONNEES` : "Prix AAPL", "Taux Fed" → Données spécifiques
- `RESUME` : "Résumé Perplexity: dette Canada" → Synthèse recherche
- `CALCUL` : "Calcul prêt 300k 25 ans 4.9%" → Calculs financiers
- `SOURCES` : "Source ?", "Sources ?" → Demander sources dernière réponse
- `AIDE` : "Aide", "Menu" → Guide d'utilisation

### 4. Validation Stricte
- **Symboles boursiers** → vérifier format (2-5 lettres, majuscules)
- **Montants** → vérifier format numérique valide
- **Dates** → parser et valider
- **Pourcentages** → vérifier plage raisonnable

### 5. Contraintes SMS
- **Longueur max**: 320 caractères (1 SMS) ou 640 (2 SMS max)
- **Sources obligatoires**: "Source: FMP" ou "Source: Perplexity"
- **Format lisible**: phrases courtes, sections claires
- **Erreur si flou**: Message explicite si intention non reconnue

---

## 🏗️ ARCHITECTURE PROPOSÉE

### MODULE 1: Intent Detector SMS (Nouveau)
**Fichier**: `lib/sms/intent-detector-sms.js`

```javascript
class SMSIntentDetector {
  detectIntent(message) {
    // Détection STRICTE basée sur mots-clés + regex
    // Mapping vers intents contrôlés: ANALYSE, DONNEES, RESUME, CALCUL, SOURCES, AIDE
    // Return: { intent, confidence, entities, needsClarification }
  }
}
```

**Responsabilités**:
- Détecter l'intent parmi l'ensemble limité (6 intents SMS)
- Extraire entités (tickers, montants, dates)
- Valider format des entités
- Retourner clarification si ambigu

### MODULE 2: Data Fetchers (Séparés)
**Fichier**: `lib/sms/data-fetchers/`

```javascript
// 📊 Stock Data Fetcher
class StockDataFetcher {
  async fetchPrice(ticker) { /* API FMP */ }
  async fetchFundamentals(ticker) { /* API FMP */ }
  async fetchNews(ticker) { /* API Finnhub */ }
}

// 🔍 Perplexity Research Fetcher
class PerplexityFetcher {
  async research(topic, options) { /* Perplexity Sonar */ }
}

// 📈 Financial Calculator
class FinancialCalculator {
  calculateLoan(principal, years, rate) { /* Calculs purs */ }
  calculateVariation(startValue, endValue) { /* Calculs purs */ }
}
```

**Responsabilités**:
- **Obtenir** les données factuelles depuis les sources fiables
- **Valider** la cohérence des données reçues
- **Retourner** données structurées avec métadonnées (source, timestamp)
- **Jamais** inventer de données

### MODULE 3: LLM Formatter (Nouveau - Rôle Limité)
**Fichier**: `lib/sms/llm-formatter.js`

```javascript
class LLMFormatter {
  async formatForSMS(data, intent, options = {}) {
    // Template de prompt strict
    const prompt = this._buildFormatterPrompt(data, intent);

    // Appel LLM (Gemini gratuit pour formatter)
    const response = await this._callLLM(prompt);

    // Post-traitement (longueur, sources, validation)
    return this._postProcess(response, data);
  }

  _buildFormatterPrompt(data, intent) {
    return `Tu es un assistant SMS.
    Règles STRICTES:
    - Réponse max 320 caractères
    - Utilise UNIQUEMENT les données fournies (pas d'invention)
    - Ajoute la source à la fin (ex: "Source: FMP")
    - Français clair, phrases courtes
    - Si données manquantes, dire "Données indisponibles"

    Données: ${JSON.stringify(data)}
    Intent: ${intent}

    Génère la réponse SMS:`;
  }
}
```

**Responsabilités**:
- **Formater** les données en réponse SMS lisible
- **Résumer** intelligemment si trop long
- **Ajouter sources** explicitement
- **Respecter contraintes** (longueur, format)
- **NE JAMAIS** inventer de faits ou chiffres

### MODULE 4: SMS Orchestrator (Nouveau - Logique Centrale)
**Fichier**: `lib/sms/sms-orchestrator.js`

```javascript
class SMSOrchestrator {
  async processMessage(smsMessage, userContext) {
    // 1. Détecter intention
    const intent = await this.intentDetector.detectIntent(smsMessage);

    // 2. Valider et router
    if (!intent || intent.needsClarification) {
      return this._handleClarification(intent);
    }

    // 3. Appeler data fetchers appropriés
    const data = await this._fetchData(intent);

    // 4. Formatter réponse avec LLM
    const smsResponse = await this.formatter.formatForSMS(data, intent);

    // 5. Valider contraintes SMS
    return this._validateResponse(smsResponse);
  }

  _fetchData(intent) {
    switch(intent.type) {
      case 'ANALYSE': return this.stockFetcher.fetchAnalysis(intent.ticker);
      case 'DONNEES': return this.stockFetcher.fetchData(intent.dataType, intent.ticker);
      case 'RESUME': return this.perplexityFetcher.research(intent.topic);
      case 'CALCUL': return this.calculator.calculate(intent.calcType, intent.params);
      case 'SOURCES': return this._getPreviousSources();
      case 'AIDE': return this._getHelpText();
    }
  }
}
```

**Responsabilités**:
- **Orchestrer** le flux complet SMS → réponse
- **Router** vers les bons data fetchers
- **Coordonner** formatter et validations
- **Gérer erreurs** et cas limites

### MODULE 5: SMS Validator (Nouveau - Contraintes)
**Fichier**: `lib/sms/sms-validator.js`

```javascript
class SMSValidator {
  validateResponse(response, maxLength = 320) {
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };

    // 1. Vérifier longueur
    if (response.length > maxLength * 2) {
      validation.valid = false;
      validation.errors.push('Réponse trop longue (max 640 chars)');
    }

    // 2. Vérifier présence source
    if (!response.includes('Source:')) {
      validation.warnings.push('Aucune source explicite');
    }

    // 3. Compter caractères SMS (UCS-2 vs GSM-7)
    const smsCount = this._calculateSMSCount(response);
    if (smsCount > 2) {
      validation.valid = false;
      validation.errors.push(`${smsCount} SMS requis (max 2)`);
    }

    return validation;
  }

  truncateIntelligently(response, maxLength) {
    // Couper au dernier point complet
    // Ajouter "..." si tronqué
    // Préserver la source
  }
}
```

**Responsabilités**:
- **Valider** longueur réponse (comptage SMS précis)
- **Vérifier** présence sources
- **Tronquer** intelligemment si dépassement
- **Signaler** warnings non-bloquants

---

## 📦 PLAN D'IMPLÉMENTATION (Progressive & Non-Destructive)

### PHASE 1: Création Nouveaux Modules (Non-Destructif)
**Durée**: 2-3h

1. ✅ Créer `lib/sms/` directory
2. ✅ Implémenter `intent-detector-sms.js`
   - Ensemble strict d'intents (6 intents)
   - Validation entités (tickers, montants)
   - Tests unitaires
3. ✅ Implémenter `data-fetchers/`
   - `stock-data-fetcher.js`
   - `perplexity-fetcher.js`
   - `financial-calculator.js`
4. ✅ Implémenter `llm-formatter.js`
   - Template prompt strict
   - Post-traitement (sources, longueur)
5. ✅ Implémenter `sms-validator.js`
   - Validation longueur SMS
   - Validation sources
   - Truncate intelligent

**Livrable**: Nouveaux modules prêts, anciens intacts

### PHASE 2: Orchestrateur SMS v2 (Coexistence)
**Durée**: 1-2h

1. ✅ Créer `sms-orchestrator.js` (nouvelle version)
2. ✅ Intégrer nouveaux modules
3. ✅ Tests end-to-end sur dataset SMS typiques
4. ✅ Marquer `emma-agent.js` comme `@deprecated` pour SMS
   - Ajouter commentaires TODO
   - Garder fonctionnel pour web/email

**Livrable**: Orchestrateur v2 fonctionnel, v1 intact

### PHASE 3: Intégration Progressive (Feature Flag)
**Durée**: 1h

1. ✅ Ajouter flag `USE_SMS_ORCHESTRATOR_V2` dans `/api/adapters/sms.js`
2. ✅ Modifier `/api/chat.js` pour router SMS vers nouveau système
   ```javascript
   if (channel === 'sms' && process.env.USE_SMS_ORCHESTRATOR_V2 === 'true') {
     return await smsOrchestratorV2.process(message, context);
   } else {
     return await emmaAgent.process(message, context); // Ancien système
   }
   ```
3. ✅ Tests A/B progressifs (10% → 50% → 100%)

**Livrable**: Migration douce avec rollback facile

### PHASE 4: Tests & Validation (Quality Assurance)
**Durée**: 2h

1. ✅ Tests unitaires pour chaque intent SMS
2. ✅ Tests edge cases (inputs invalides, floues)
3. ✅ Validation longueur SMS (comptage précis UCS-2)
4. ✅ Tests sources présentes dans 100% réponses
5. ✅ Benchmarks performance (<5s end-to-end)

**Livrable**: Suite de tests complète avec >90% coverage

### PHASE 5: Cleanup & Documentation (Post-Migration)
**Durée**: 1h

1. ✅ Supprimer ancien code SMS de `emma-agent.js` (après migration 100%)
2. ✅ Documenter nouveau système dans `docs/SMS_ARCHITECTURE.md`
3. ✅ Créer guide utilisateur SMS avec exemples
4. ✅ Créer guide développeur pour ajouter nouveaux intents

**Livrable**: Code propre, documenté, maintenable

---

## 🎯 EXEMPLES CONCRETS

### Exemple 1: "Analyse AAPL"
**Pipeline**:
1. **Intent Detector**: `{ intent: 'ANALYSE', ticker: 'AAPL', confidence: 0.95 }`
2. **Data Fetchers**:
   - StockDataFetcher → `{ price: 150.25, pe: 28.5, ... }`
   - PerplexityFetcher → `{ news: [...], moat: '...' }`
3. **LLM Formatter**:
   ```
   Input: { price: 150.25, pe: 28.5, marketCap: '2.5T', ... }
   Output: "Apple (AAPL) 150.25$ (+2.3%). P/E 28.5x. Cap 2.5T$.
            Moat fort (écosystème). Source: FMP"
   ```
4. **Validator**: `{ valid: true, length: 87, smsCount: 1 }`

### Exemple 2: "Prix Tesla"
**Pipeline**:
1. **Intent Detector**: `{ intent: 'DONNEES', dataType: 'prix', ticker: 'TSLA' }`
2. **Data Fetcher**: `{ price: 245.67, change: '+3.4%', volume: '125M' }`
3. **LLM Formatter**: `"Tesla (TSLA): 245.67$ (+3.4%). Vol: 125M. Source: FMP"`
4. **Validator**: `{ valid: true, length: 58, smsCount: 1 }`

### Exemple 3: "Résumé: Inflation Canada"
**Pipeline**:
1. **Intent Detector**: `{ intent: 'RESUME', topic: 'Inflation Canada' }`
2. **Perplexity Fetcher**: `{ summary: '...', sources: ['StatCan', 'BDC'] }`
3. **LLM Formatter**: `"Inflation Canada: 3.1% (déc 2024). Baisse vs 3.8% nov.
                        Banque du Canada pourrait baisser taux.
                        Source: Perplexity (StatCan)"`
4. **Validator**: `{ valid: true, length: 142, smsCount: 1 }`

### Exemple 4: Input Invalide
**Input**: "Analysse APLX" (typo + ticker invalide)
**Pipeline**:
1. **Intent Detector**: `{ intent: 'ANALYSE', ticker: 'APLX', confidence: 0.4, needsClarification: true }`
2. **Orchestrator**: Return clarification
   ```
   "Je n'ai pas compris. Formats supportés:
   - Analyse X
   - Prix X
   - Résumé sujet
   - Calcul a b c
   - Source"
   ```

---

## 🛡️ PROTECTION ANTI-HALLUCINATION

### Règles LLM Formatter Strictes
```javascript
const FORMATTER_RULES = `
RÈGLES ABSOLUES (NON NÉGOCIABLES):

1. TU NE DOIS JAMAIS inventer de chiffres, prix, ou données
2. TU NE PEUX utiliser QUE les données fournies dans le contexte
3. SI une donnée manque, TU DOIS dire "Donnée indisponible"
4. TU DOIS inclure la source à la fin (ex: "Source: FMP")
5. TU DOIS respecter la limite de 320 caractères
6. TU DOIS utiliser des phrases courtes et claires
7. SI le contexte est vide, TU DOIS dire "Aucune donnée disponible"

EXEMPLES:
✅ BON: "Apple (AAPL) 150.25$ (+2.3%). Source: FMP"
❌ MAUVAIS: "Apple se porte bien, environ 150$" (approximation interdite)

✅ BON: "P/E: Donnée indisponible. Source: FMP"
❌ MAUVAIS: "P/E probablement autour de 25x" (invention interdite)
`;
```

### Validation Post-LLM
```javascript
class ResponseValidator {
  validateNoHallucination(llmResponse, sourceData) {
    // 1. Extraire tous les chiffres de la réponse LLM
    const numbersInResponse = this._extractNumbers(llmResponse);

    // 2. Vérifier que chaque chiffre existe dans sourceData
    for (const num of numbersInResponse) {
      if (!this._numberExistsInSource(num, sourceData)) {
        throw new Error(`HALLUCINATION DÉTECTÉE: ${num} n'existe pas dans les données source`);
      }
    }

    // 3. Vérifier présence source
    if (!llmResponse.includes('Source:')) {
      throw new Error('AUCUNE SOURCE: La réponse doit inclure "Source: X"');
    }

    return true;
  }
}
```

---

## 📊 MÉTRIQUES DE SUCCÈS

### Objectifs Quantifiables
1. **Précision Intent**: >95% détection correcte sur dataset test
2. **Longueur SMS**: 100% des réponses ≤ 2 SMS (640 chars)
3. **Sources**: 100% des réponses incluent source explicite
4. **Latence**: <5s end-to-end (SMS → réponse)
5. **Zero Hallucination**: 0% de faits inventés (validé par tests)
6. **Clarification Rate**: <10% de demandes de clarification

### Dashboard Monitoring
```javascript
{
  "sms_stats": {
    "total_messages": 1250,
    "intent_accuracy": 0.97,
    "avg_sms_length": 245,
    "avg_latency_ms": 3840,
    "hallucination_count": 0,
    "clarification_rate": 0.08,
    "sources_present": 1.0
  }
}
```

---

## 🚀 NEXT STEPS

1. **Approuver ce plan** ✅ (vous)
2. **Commencer Phase 1** (création modules)
3. **Review code** après chaque phase
4. **Tests progressifs** avant migration
5. **Migration graduelle** (feature flag)
6. **Monitoring** post-déploiement

---

## 📝 NOTES IMPORTANTES

### Compatibilité
- ✅ Web/Email gardent l'ancien système (emma-agent.js)
- ✅ SMS migre progressivement vers nouveau système
- ✅ Coexistence des 2 systèmes pendant transition

### Rollback Plan
- Feature flag `USE_SMS_ORCHESTRATOR_V2=false` → rollback immédiat
- Ancien code préservé jusqu'à stabilité complète nouveau système
- Logs détaillés pour debugging

### Documentation
- Guide utilisateur SMS avec exemples
- Guide développeur pour ajouter intents
- Architecture diagram (créé en Phase 5)

---

**Questions / Clarifications ?**
Répondre avant de commencer l'implémentation.
