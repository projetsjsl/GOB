# 📧 Emma En Direct - Cognitive Briefing System

**Architecture:** Cognitive Scaffolding + Adaptive Email Generation + Preview System

---

## 🎯 NOUVEAU FLOW (5 ÉTAPES)

### **AVANT (Actuel):**
```
1. Perplexity: Données marché
2. Perplexity: Actualités
3. Perplexity: Analyse
4. Génération HTML
5. Preview statique
```

### **APRÈS (Avec Cognitive Scaffolding):**
```
┌─────────────────────────────────────────────────────┐
│ ÉTAPE 0: COGNITIVE SCAFFOLDING                     │ ← NOUVEAU
│ - Emma Agent analyse l'actualité du jour           │
│ - Intent: Trending topics, important news          │
│ - Détecte: earnings, fed meeting, market crash etc │
└─────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│ ÉTAPE 1: SMART DATA GATHERING                      │ ← NOUVEAU
│ - Emma Agent sélectionne outils pertinents         │
│ - Récupère: market data, news, economic calendar   │
│ - Filtre par pertinence                            │
└─────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│ ÉTAPE 2: CONTENT SELECTION                         │ ← NOUVEAU
│ - Emma décide: What's important today?             │
│ - Priorité: Breaking news > Earnings > Normal      │
│ - Adapte prompt selon intent                       │
└─────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│ ÉTAPE 3: ADAPTIVE EMAIL GENERATION                 │ ← AMÉLIORÉ
│ - Perplexity avec prompt ajusté dynamiquement      │
│ - Inclut SEULEMENT données pertinentes             │
│ - Style adapté à l'urgence/importance              │
└─────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│ ÉTAPE 4: INTELLIGENT PREVIEW                       │ ← AMÉLIORÉ
│ - Affiche email avec metadata                      │
│ - Montre: intent, confidence, tools used           │
│ - Boutons: Edit, Send, Cancel                      │
└─────────────────────────────────────────────────────┘
```

---

## 🧠 ÉTAPE 0: COGNITIVE SCAFFOLDING

### **Objectif:**
Analyser l'environnement macro et détecter les événements importants du jour.

### **Intent Analysis Prompt:**
```javascript
const intentAnalysisPrompt = `Tu es Emma, assistante financière experte.
Analyse l'actualité et l'environnement de marché pour ${briefingType}.

DATE: ${new Date().toLocaleDateString('fr-FR')}
HEURE: ${new Date().toLocaleTimeString('fr-FR')}
BRIEFING: ${briefingType} (morning/noon/evening)

ANALYSE L'ACTUALITÉ DU JOUR ET DÉTECTE:

1. **TRENDING TOPICS**: Quels sont les sujets dominants aujourd'hui?
   - Earnings releases (Apple, Tesla, etc.)
   - Fed/ECB meetings
   - Economic data (CPI, jobs report, etc.)
   - Geopolitical events
   - Market crashes/rallies

2. **IMPORTANCE LEVEL**:
   - BREAKING (10/10): Événement majeur (market crash, Fed decision)
   - HIGH (7-9/10): Earnings important, economic data critique
   - MEDIUM (4-6/10): Normal market day
   - LOW (1-3/10): Quiet market

3. **RECOMMENDED TOOLS**:
   Suggère quels outils Emma Agent doit utiliser:
   - polygon-stock-price: Si focus sur indices/actions
   - economic-calendar: Si événement macro important
   - earnings-calendar: Si earnings releases
   - finnhub-news: Si breaking news
   - analyst-recommendations: Si changements ratings importants

4. **EMAIL STYLE**:
   - urgent: Si BREAKING news (style alarmiste)
   - professional: Si HIGH importance (style sérieux)
   - casual: Si MEDIUM/LOW (style informatif)

RÉPONDS EN JSON:
{
  "intent": "earnings_day",
  "confidence": 0.95,
  "importance_level": 8,
  "trending_topics": [
    "Apple Q4 earnings beat expectations",
    "Fed hints at rate pause",
    "Tech sector rally"
  ],
  "recommended_tools": [
    "earnings-calendar",
    "polygon-stock-price",
    "finnhub-news",
    "analyst-recommendations"
  ],
  "email_style": "professional",
  "key_tickers": ["AAPL", "TSLA", "MSFT"],
  "prompt_adjustments": {
    "focus_on": "earnings results and guidance",
    "tone": "optimistic but cautious",
    "priority_sections": ["earnings", "market_reaction", "outlook"]
  },
  "summary": "Apple vient de publier des résultats record. Le marché réagit positivement. Fed signale une possible pause dans les hausses de taux."
}`;
```

### **Emma Agent Call:**
```javascript
const intentResponse = await fetch('/api/emma-agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        message: intentAnalysisPrompt,
        context: {
            briefing_type: type,
            analysis_type: 'briefing_intent_analysis',
            date: new Date().toISOString()
        }
    })
});

const intentData = await intentResponse.json();
// → intentData.response contient le JSON parsé
```

---

## 📊 ÉTAPE 1: SMART DATA GATHERING

### **Objectif:**
Utiliser Emma Agent pour récupérer SEULEMENT les données pertinentes selon l'intent.

### **Exemple - Normal Day:**
```javascript
Intent: "market_overview"
Tools: ["polygon-stock-price", "finnhub-news"]
Focus: "Indices principaux + top 5 news"
```

### **Exemple - Earnings Day:**
```javascript
Intent: "earnings_day"
Tools: [
  "earnings-calendar",      // Quels earnings aujourd'hui
  "polygon-stock-price",    // Prix actions qui publient
  "analyst-recommendations", // Réactions analystes
  "finnhub-news"            // News sur les earnings
]
Focus: "Earnings + Guidance + Market reaction"
```

### **Exemple - Fed Meeting:**
```javascript
Intent: "fed_decision"
Tools: [
  "economic-calendar",      // Événement Fed
  "polygon-stock-price",    // Indices + VIX
  "finnhub-news"            // Réaction médias
]
Focus: "Fed decision + Indices reaction + Bond yields"
```

### **Emma Agent Call:**
```javascript
const dataResponse = await fetch('/api/emma-agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        message: `Récupérer les données pour briefing ${type}. Focus: ${intentData.summary}`,
        context: {
            briefing_type: type,
            intent: intentData.intent,
            recommended_tools: intentData.recommended_tools,
            key_tickers: intentData.key_tickers,
            tickers: teamTickers,
            news_requested: true
        }
    })
});

const smartData = await dataResponse.json();
// → smartData contient données filtrées et pertinentes
```

---

## 🎯 ÉTAPE 2: CONTENT SELECTION

### **Objectif:**
Décider ce qui doit être dans l'email basé sur l'importance.

### **Logique de Sélection:**
```javascript
function selectEmailContent(intentData, smartData) {
    const sections = [];

    // SECTION 1: TOUJOURS - Market Overview (si disponible)
    if (smartData.market_indices) {
        sections.push({
            title: "📊 Vue d'ensemble du marché",
            priority: 10,
            content: smartData.market_indices
        });
    }

    // SECTION 2: CONDITIONNELLE - Breaking News
    if (intentData.importance_level >= 8) {
        sections.push({
            title: "🚨 BREAKING - Événement majeur",
            priority: 9,
            content: intentData.trending_topics[0],
            style: "alert"
        });
    }

    // SECTION 3: CONDITIONNELLE - Earnings (si earnings day)
    if (intentData.intent === 'earnings_day' && smartData.earnings) {
        sections.push({
            title: "📈 Résultats trimestriels",
            priority: 8,
            content: smartData.earnings
        });
    }

    // SECTION 4: CONDITIONNELLE - Fed/ECB Decision
    if (intentData.intent === 'fed_decision' && smartData.economic_events) {
        sections.push({
            title: "🏛️ Décision de politique monétaire",
            priority: 9,
            content: smartData.economic_events
        });
    }

    // SECTION 5: TOUJOURS - Top News
    if (smartData.top_news) {
        sections.push({
            title: "📰 Actualités principales",
            priority: 7,
            content: smartData.top_news.slice(0, 5)  // Top 5
        });
    }

    // SECTION 6: CONDITIONNELLE - Watchlist (si tickers watchlist impactés)
    if (smartData.watchlist_updates && smartData.watchlist_updates.length > 0) {
        sections.push({
            title: "👁️ Votre Watchlist",
            priority: 6,
            content: smartData.watchlist_updates
        });
    }

    // Trier par priorité décroissante
    sections.sort((a, b) => b.priority - a.priority);

    return sections;
}
```

---

## ✍️ ÉTAPE 3: ADAPTIVE EMAIL GENERATION

### **Objectif:**
Générer l'email avec Perplexity en utilisant un prompt **adapté dynamiquement**.

### **Prompt Template Adaptatif:**
```javascript
function buildAdaptivePrompt(type, intentData, selectedSections) {
    const basePrompt = getBasePrompt(type);  // Morning/Noon/Evening base

    // Ajustements selon l'intent
    let adaptedPrompt = basePrompt;

    // Si BREAKING news
    if (intentData.importance_level >= 8) {
        adaptedPrompt = `🚨 BREAKING - Événement majeur détecté

${intentData.trending_topics[0]}

${basePrompt}

⚠️ INSTRUCTIONS SPÉCIALES:
- COMMENCER par l'événement majeur
- Style: Urgent mais professionnel
- Inclure implications pour le marché
- Recommandations tactiques immédiates
`;
    }

    // Si Earnings Day
    else if (intentData.intent === 'earnings_day') {
        adaptedPrompt = `📈 EARNINGS DAY - ${intentData.key_tickers.join(', ')}

${basePrompt}

📊 FOCUS PRIORITAIRE:
- Résultats vs attentes
- Guidance management
- Réaction marché
- Implications secteur
`;
    }

    // Si Fed Decision
    else if (intentData.intent === 'fed_decision') {
        adaptedPrompt = `🏛️ FED DECISION DAY

${basePrompt}

🎯 FOCUS PRIORITAIRE:
- Décision taux
- Commentaires Powell
- Réaction obligataire
- Impact devises/actions
`;
    }

    // Ajouter sections sélectionnées
    adaptedPrompt += `\n\nSECTIONS À INCLURE (PAR ORDRE DE PRIORITÉ):\n`;
    selectedSections.forEach((section, index) => {
        adaptedPrompt += `${index + 1}. ${section.title}\n`;
    });

    // Ajouter données réelles
    adaptedPrompt += `\n\nDONNÉES RÉELLES:\n`;
    selectedSections.forEach(section => {
        adaptedPrompt += `\n${section.title}:\n${JSON.stringify(section.content, null, 2)}\n`;
    });

    return adaptedPrompt;
}
```

### **Perplexity Call avec Prompt Adaptatif:**
```javascript
const analysisResponse = await fetch('/api/ai-services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        service: 'perplexity',
        prompt: buildAdaptivePrompt(type, intentData, selectedSections),
        section: 'analysis',
        model: 'sonar-reasoning-pro',  // Modèle le plus puissant pour analyse
        max_tokens: 3000,
        temperature: 0.2  // Très factuel
    })
});
```

---

## 👁️ ÉTAPE 4: INTELLIGENT PREVIEW

### **Objectif:**
Afficher un preview complet avec metadata et options d'édition.

### **Preview Component:**
```javascript
const EmailPreview = ({ briefing, intentData, smartData }) => {
    return (
        <div className="email-preview">
            {/* Header avec metadata */}
            <div className="preview-header">
                <h3>📧 Preview - {briefing.subject}</h3>
                <div className="metadata">
                    <span className="badge intent">
                        Intent: {intentData.intent}
                    </span>
                    <span className="badge confidence">
                        Confiance: {(intentData.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="badge importance">
                        Importance: {intentData.importance_level}/10
                    </span>
                    <span className="badge style">
                        Style: {intentData.email_style}
                    </span>
                </div>
            </div>

            {/* Trending Topics */}
            <div className="trending-topics">
                <h4>🔥 Trending Topics</h4>
                <ul>
                    {intentData.trending_topics.map((topic, i) => (
                        <li key={i}>{topic}</li>
                    ))}
                </ul>
            </div>

            {/* Tools Used */}
            <div className="tools-used">
                <h4>🔧 Outils Emma Agent utilisés</h4>
                <div className="tools-list">
                    {smartData.tools_used?.map((tool, i) => (
                        <span key={i} className="tool-badge">{tool}</span>
                    ))}
                </div>
            </div>

            {/* Email HTML Preview */}
            <div className="email-html-preview">
                <iframe
                    srcDoc={briefing.html}
                    style={{ width: '100%', height: '600px', border: '1px solid #ddd' }}
                    title="Email Preview"
                />
            </div>

            {/* Actions */}
            <div className="preview-actions">
                <button onClick={() => editEmail(briefing)}>
                    ✏️ Modifier
                </button>
                <button onClick={() => regenerateEmail(briefing, intentData)}>
                    🔄 Régénérer
                </button>
                <button onClick={() => sendEmail(briefing)}>
                    📧 Envoyer maintenant
                </button>
                <button onClick={() => cancelPreview()}>
                    ❌ Annuler
                </button>
            </div>
        </div>
    );
};
```

---

## 🎯 EXEMPLES CONCRETS

### **Exemple 1: Normal Morning (Importance: 5/10)**

**Intent Analysis:**
```json
{
  "intent": "market_overview",
  "confidence": 0.85,
  "importance_level": 5,
  "trending_topics": [
    "Indices stables après séance mixte",
    "Dollar légèrement en hausse",
    "Pétrole à $85/baril"
  ],
  "recommended_tools": [
    "polygon-stock-price",
    "finnhub-news"
  ],
  "email_style": "casual",
  "key_tickers": [],
  "summary": "Journée calme sans événements majeurs"
}
```

**Email Sections:**
1. Vue d'ensemble marché (indices)
2. Top 5 news
3. Watchlist si updates

**Style:** Informatif et concis

---

### **Exemple 2: Apple Earnings Day (Importance: 9/10)**

**Intent Analysis:**
```json
{
  "intent": "earnings_day",
  "confidence": 0.98,
  "importance_level": 9,
  "trending_topics": [
    "Apple Q4 earnings: EPS $1.52 vs $1.39 attendu",
    "Revenus iPhone en hausse de 12%",
    "Action AAPL +5% en pre-market"
  ],
  "recommended_tools": [
    "earnings-calendar",
    "polygon-stock-price",
    "analyst-recommendations",
    "finnhub-news"
  ],
  "email_style": "professional",
  "key_tickers": ["AAPL"],
  "summary": "Apple surpasse les attentes avec des résultats records"
}
```

**Email Sections:**
1. 🚨 BREAKING - Apple Earnings Beat
2. Vue d'ensemble marché (focus tech)
3. Résultats détaillés AAPL
4. Réactions analystes
5. Top news related
6. Watchlist si AAPL dedans

**Style:** Professionnel, optimiste, détaillé

---

### **Exemple 3: Fed Decision Day (Importance: 10/10)**

**Intent Analysis:**
```json
{
  "intent": "fed_decision",
  "confidence": 1.0,
  "importance_level": 10,
  "trending_topics": [
    "Fed maintains rates at 5.25-5.50%",
    "Powell signals potential pause in hikes",
    "Market rallies on dovish tone"
  ],
  "recommended_tools": [
    "economic-calendar",
    "polygon-stock-price",
    "finnhub-news"
  ],
  "email_style": "urgent",
  "key_tickers": [],
  "summary": "La Fed maintient les taux et signale une pause possible"
}
```

**Email Sections:**
1. 🚨 BREAKING - Fed Decision
2. Détails décision + Commentaires Powell
3. Réaction marché (indices, VIX, bonds)
4. Implications devises et matières premières
5. Top news related
6. Recommandations tactiques

**Style:** Urgent, factuel, actionnable

---

## 🔄 WORKFLOW COMPLET

```javascript
async function generateCognitiveBriefing(type) {
    console.log('🧠 Cognitive Briefing START');

    // ÉTAPE 0: Intent Analysis
    const intentData = await analyzeIntent(type);
    console.log('Intent:', intentData);

    // ÉTAPE 1: Smart Data Gathering
    const smartData = await gatherSmartData(type, intentData);
    console.log('Data gathered:', smartData);

    // ÉTAPE 2: Content Selection
    const selectedSections = selectEmailContent(intentData, smartData);
    console.log('Sections:', selectedSections);

    // ÉTAPE 3: Adaptive Email Generation
    const adaptivePrompt = buildAdaptivePrompt(type, intentData, selectedSections);
    const emailContent = await generateEmailWithPerplexity(adaptivePrompt);
    console.log('Email generated');

    // ÉTAPE 4: Create Briefing Object
    const briefing = {
        type,
        subject: getSubjectForType(type, intentData),
        html: createBriefingHTML(type, emailContent, selectedSections),
        intentData,
        smartData,
        selectedSections,
        timestamp: new Date().toISOString()
    };

    // ÉTAPE 5: Show Preview
    setPreviewBriefing(briefing);
    setShowPreview(true);

    console.log('✅ Cognitive Briefing COMPLETE');
    return briefing;
}
```

---

## 📊 COMPARAISON AVANT/APRÈS

| Métrique | AVANT | APRÈS (Cognitive) |
|----------|-------|-------------------|
| **Intent Analysis** | ❌ Non | ✅ Oui (Emma Agent) |
| **Tools Selection** | ❌ Fixe | ✅ Adaptatif |
| **Content Filtering** | ❌ Tout inclus | ✅ Pertinent uniquement |
| **Prompt Adaptation** | ❌ Statique | ✅ Dynamique |
| **Email Style** | ❌ Fixe | ✅ Adapté à l'urgence |
| **Preview Metadata** | ❌ Basique | ✅ Complet |
| **User Control** | ❌ Limité | ✅ Total (Edit, Regenerate) |

---

## 🚀 BÉNÉFICES

1. ✅ **Pertinence:** Email adapté aux événements du jour
2. ✅ **Intelligence:** Emma comprend le contexte macro
3. ✅ **Efficacité:** Seulement données importantes
4. ✅ **Flexibilité:** Style adapté à l'urgence
5. ✅ **Contrôle:** Preview complet avant envoi
6. ✅ **Transparence:** Metadata (intent, tools, confidence)

---

## 📚 RÉFÉRENCES

- **Emma Agent:** `/api/emma-agent.js`
- **AI Services:** `/api/ai-services.js`
- **Dashboard:** `/public/beta-combined-dashboard.html`
- **Tools Config:** `/config/tools_config.json`

---

**Version:** 2.0 - Cognitive Briefing System
**Dernière mise à jour:** 2025-10-16
