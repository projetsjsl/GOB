# 🎯 Emma - Analyste Agile et Polyvalente

**Date**: 18 Novembre 2025  
**Philosophie**: Emma est une analyste financière qui utilise Perplexity + APIs, mais elle est **agile** et peut répondre à des questions hors du domaine financier.

---

## 🧠 Principe Fondamental

**Emma est une ANALYSTE INTELLIGENTE**, pas seulement un système d'interprétation. Elle:
- ✅ Utilise **Perplexity comme première option** pour chercher activement des informations réelles
- ✅ Combine **Perplexity + APIs** pour les questions financières (données précises)
- ✅ Est **agile**: Si une question sort du domaine financier, elle cherche activement la réponse au lieu de donner une réponse générique

---

## 📊 Architecture: Perplexity First

### Détection Agile des Questions

Le système détecte automatiquement les questions générales/non-financières via `generalNonFinancialKeywords`:

```javascript
const generalNonFinancialKeywords = [
    // Questions générales
    'qu\'est-ce que', 'explique', 'comment fonctionne',
    // Sciences
    'physique', 'chimie', 'biologie', 'mathématiques',
    // Vie quotidienne
    'cuisine', 'voyage', 'santé', 'sport', 'météo',
    // Culture
    'histoire', 'géographie', 'art', 'littérature',
    // ...
];
```

### Routage Intelligent

**Questions Générales (hors finance)**:
- ✅ Détectées via `generalNonFinancialKeywords`
- ✅ Routées vers **Perplexity seul** (pas d'APIs financières)
- ✅ Prompt adapté pour recherche active d'informations réelles

**Questions Financières**:
- ✅ Routées vers **Perplexity + APIs** (FMP, Polygon, etc.)
- ✅ Données précises en temps réel
- ✅ Analyse CFA® niveau institutionnel

---

## 🎯 Prompt Renforcé pour Questions Générales

### Identité d'Emma (Questions Générales)

```
Tu es Emma, une ANALYSTE INTELLIGENTE polyvalente qui utilise Perplexity 
pour chercher activement des informations RÉELLES et RÉCENTES sur le web.

🎯 TON RÔLE:
- Tu es une ANALYSTE qui RECHERCHE et SYNTHÉTISE des informations
- Tu DOIS utiliser Perplexity pour chercher des données factuelles et à jour
- Tu es agile et adaptative: si une question sort du domaine financier, 
  tu cherches activement la réponse

✅ TON COMPORTEMENT:
- RECHERCHE ACTIVE: Pour toute question demandant une information spécifique 
  (météo, actualités, données), tu DOIS chercher cette information RÉELLE 
  via Perplexity
- RÉPONSES DIRECTES: Réponds DIRECTEMENT à la question posée, pas de 
  "Je peux t'aider avec..." ou "Que veux-tu savoir?"
- DONNÉES RÉELLES: Fournis des données concrètes, chiffres, dates, sources
```

### Instructions Critiques

```
🎯 INSTRUCTIONS POUR QUESTION GÉNÉRALE (HORS FINANCE):
- ⚠️⚠️⚠️ CRITIQUE ABSOLUE: Tu es une ANALYSTE INTELLIGENTE qui DOIT chercher 
  des informations RÉELLES et RÉCENTES
- 🚫 INTERDIT: Répondre de manière générique sans chercher d'informations réelles
- ✅ OBLIGATOIRE: Utilise Perplexity pour RECHERCHER activement des données 
  factuelles et à jour sur le web
- 📊 Exemples de questions qui nécessitent recherche active:
  • "Météo à Rimouski" → Cherche température actuelle, conditions, 
    prévisions météo Rimouski
  • "Actualités du jour" → Cherche les actualités récentes (pas de généralités)
  • "Qu'est-ce que X" → Cherche définition récente et précise de X
- ✅ RÈGLE D'OR: Si la question demande une information spécifique (météo, 
  actualités, données), tu DOIS chercher cette information RÉELLE via Perplexity
- ❌ NE PAS: Répondre "Je peux t'aider avec..." ou "Que veux-tu savoir?" 
  - réponds DIRECTEMENT à la question
```

---

## 🔄 Flux de Traitement

### 1. Détection de Type de Question

```
Message utilisateur
    ↓
_shouldUsePerplexityOnly()
    ↓
Détection keywords générales/non-financières
    ↓
┌─────────────────┬─────────────────┐
│ Question        │ Question        │
│ Générale        │ Financière      │
└─────────────────┴─────────────────┘
    ↓                    ↓
Perplexity seul    Perplexity + APIs
```

### 2. Génération de Réponse

**Questions Générales**:
1. Prompt adapté (analyste polyvalente, recherche active)
2. Instructions renforcées (données réelles, pas de généralités)
3. Perplexity appelé avec `search_recency_filter: 'day'` pour données récentes
4. Réponse directe avec informations réelles

**Questions Financières**:
1. Prompt CFA® (analyste financière experte)
2. APIs appelées pour données précises (FMP, Polygon, etc.)
3. Perplexity pour contexte macro et actualités
4. Analyse complète niveau institutionnel

---

## 📝 Exemples de Questions Supportées

### Questions Générales (Hors Finance)

**Météo**:
- ❌ AVANT: "Je peux t'aider avec des questions financières..."
- ✅ APRÈS: "À Rimouski aujourd'hui: 12°C, nuageux, vent 15 km/h. Prévisions: pluie demain, 8-14°C. [Source: MétéoMédia]"

**Actualités**:
- ❌ AVANT: "Que veux-tu savoir ?"
- ✅ APRÈS: "Actualités du jour: [3-4 actualités récentes avec sources]"

**Sciences/Culture**:
- ❌ AVANT: Réponse générique
- ✅ APRÈS: Explication détaillée avec sources et données récentes

### Questions Financières

**Analyse de Ticker**:
- ✅ Prix en temps réel (FMP)
- ✅ Ratios financiers (FMP)
- ✅ Actualités récentes (Perplexity + Finnhub)
- ✅ Analyse CFA® complète

**Questions Macro**:
- ✅ Taux d'intérêt (Perplexity)
- ✅ Inflation (Perplexity)
- ✅ Contexte géopolitique (Perplexity)

---

## 🚀 Avantages de l'Approche Agile

1. **Flexibilité**: Emma peut répondre à n'importe quelle question, pas seulement la finance
2. **Source d'Intelligence**: Perplexity comme première option pour informations réelles
3. **Précision Financière**: APIs pour données financières précises
4. **Agilité**: Détection automatique et routage intelligent
5. **Expérience Utilisateur**: Réponses directes et utiles, pas de réponses génériques

---

## 🔧 Configuration Technique

### Variables d'Environnement Requises

```bash
# Perplexity (obligatoire pour questions générales)
PERPLEXITY_API_KEY=pplx-...

# APIs Financières (pour questions financières)
FMP_API_KEY=...
FINNHUB_API_KEY=...
POLYGON_API_KEY=...
```

### Fichiers Clés

- `api/emma-agent.js` - Logique principale de routage et prompts
- `lib/intent-analyzer.js` - Détection d'intentions
- `config/tools_config.json` - Configuration des outils

---

## 📊 Métriques de Performance

### Questions Générales
- **Détection**: Via `generalNonFinancialKeywords`
- **Routage**: Perplexity seul (pas d'APIs)
- **Latence**: ~2-5s (Perplexity)
- **Qualité**: Réponses avec sources et données réelles

### Questions Financières
- **Détection**: Via keywords financiers + tickers
- **Routing**: Perplexity + APIs (FMP, Polygon, etc.)
- **Latence**: ~3-8s (APIs parallèles + Perplexity)
- **Qualité**: Analyse CFA® niveau institutionnel

---

## ✅ Résultat Final

**Emma est maintenant une ANALYSTE AGILE** qui:
- ✅ Utilise Perplexity comme source d'intelligence universelle
- ✅ Combine Perplexity + APIs pour précision financière
- ✅ Répond directement aux questions, pas de réponses génériques
- ✅ Cherche activement des informations réelles au lieu de donner des généralités
- ✅ S'adapte automatiquement au type de question (générale vs financière)

**Exemple concret**:
- Question: "Météo d'aujourd'hui à Rimouski ?"
- ❌ AVANT: "Je peux t'aider avec des questions financières..."
- ✅ APRÈS: "À Rimouski aujourd'hui: 12°C, nuageux, vent 15 km/h. Prévisions: pluie demain, 8-14°C. [Source: MétéoMédia]"

