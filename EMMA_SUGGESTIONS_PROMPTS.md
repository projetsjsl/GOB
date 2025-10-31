# 💡 Suggestions de Prompts Intelligentes pour Emma IA™

## Objectif
Aider l'utilisateur à découvrir et exploiter toutes les capacités d'Emma avec des suggestions cliquables qui s'insèrent dans la zone de texte (sans envoi automatique).

---

## 🎯 CATÉGORIES DE SUGGESTIONS

### 1. 📊 ANALYSE RAPIDE (Quick Insights)

```
"Quel est le prix actuel de [TICKER] ?"
"Performance de [TICKER] aujourd'hui"
"Résumé rapide de [TICKER]"
"[TICKER] est-il suracheté ou survendu ?"
```

**Objectif**: Réponses rapides, 800-2000 tokens, données essentielles

---

### 2. 🔬 ANALYSE APPROFONDIE (Deep Dive)

```
"Analyse approfondie de [TICKER] : fondamentaux, technique, actualités et recommandation"
"Évalue [TICKER] selon les critères de Warren Buffett"
"Analyse complète du bilan de [TICKER]"
"Force et faiblesses de [TICKER] par rapport à ses concurrents"
"Qualité du management et gouvernance de [TICKER]"
```

**Objectif**: Réponses exhaustives, 4000-8000 tokens, analyse multi-dimensionnelle

---

### 3. 📈 GRAPHIQUES & VISUALISATIONS

```
"Montre-moi le graphique technique de [TICKER]"
"Visualise la performance de [TICKER] avec chart"
"Heatmap des secteurs du marché aujourd'hui"
"Affiche le logo et le chart de [TICKER]"
"Compare [ACTION1] et [ACTION2] avec graphiques"
```

**Objectif**: Déclencher l'utilisation des tags [CHART:...], [LOGO:...], [CHART:FINVIZ:SECTORS]

---

### 4. ⚖️ COMPARAISON MULTI-TICKERS

```
"Compare [ACTION1], [ACTION2] et [ACTION3] : valorisation, croissance et dividendes"
"Qui est le meilleur entre [ACTION1] et [ACTION2] ?"
"Analyse comparative des GAFAM avec tableaux"
"Range [ACTION1], [ACTION2], [ACTION3] du meilleur au pire selon le P/E"
"Quelle action offre le meilleur potentiel : [ACTION1], [ACTION2] ou [ACTION3] ?"
```

**Objectif**: Réponses structurées avec tableaux, comparaisons claires

---

### 5. 💼 GESTION DE PORTEFEUILLE

```
"Mon portefeuille contient [ACTION1], [ACTION2], [ACTION3]. Que dois-je surveiller ?"
"Analyse les risques de mon portefeuille : [ACTION1], [ACTION2], [ACTION3]"
"Suggère des actions pour diversifier un portefeuille tech ([ACTION1], [ACTION2])"
"Mon portefeuille [ACTION1], [ACTION2], [ACTION3] est-il trop concentré ?"
"Calcule l'allocation optimale entre [ACTION1], [ACTION2] et [ACTION3]"
```

**Objectif**: Conseils personnalisés, analyse de risque, diversification

---

### 6. 📰 ACTUALITÉS & ÉVÉNEMENTS

```
"Quelles sont les dernières actualités importantes sur [TICKER] ?"
"Y a-t-il des catalyseurs à venir pour [TICKER] ?"
"Résumé des résultats trimestriels de [TICKER]"
"[TICKER] a-t-il annoncé quelque chose récemment ?"
"Calendrier des événements importants pour [TICKER] cette semaine"
```

**Objectif**: News fraîches, events à venir, timeline

---

### 7. 🎯 SCORING & RECOMMANDATIONS

```
"Calcule le score JSLAI™ de [TICKER] et explique-le"
"[TICKER] est-il un achat, une conservation ou une vente ?"
"Note [TICKER] sur 10 selon les critères de Peter Lynch"
"Quel est le fair value de [TICKER] ?"
"[TICKER] mérite-t-il sa valorisation actuelle ?"
```

**Objectif**: Scoring quantitatif, recommandations claires

---

### 8. 🌍 SECTEURS & MACRO

```
"Quel est le meilleur secteur à investir en ce moment ?"
"Performance du secteur technologique vs secteur financier"
"Impact de la hausse des taux sur [TICKER]"
"Quelles actions profitent de la tendance IA ?"
"Analyse macro-économique et implications pour mon portefeuille"
```

**Objectif**: Vue d'ensemble, contexte macro, trends sectoriels

---

### 9. 🔮 PRÉVISIONS & SCÉNARIOS

```
"Prévisions pour [TICKER] sur les 6-12 prochains mois"
"Scénarios bull/bear pour [TICKER]"
"À quel prix devrais-je acheter [TICKER] ?"
"Stop loss suggéré pour [TICKER] ?"
"Objectif de prix à 12 mois pour [TICKER]"
```

**Objectif**: Forward-looking, risques/opportunités, stratégie

---

### 10. 📚 ÉDUCATION & CONCEPTS

```
"Explique-moi le ratio P/E et comment l'interpréter"
"C'est quoi le ROIC et pourquoi c'est important ?"
"Comment analyser le cash flow d'une entreprise ?"
"Quelle est la différence entre croissance et value investing ?"
"Les critères de Warren Buffett pour sélectionner une action"
```

**Objectif**: Apprendre, comprendre, devenir meilleur investisseur

---

## 🎨 DESIGN & UX

### Affichage

**Layout proposé** (sous la zone de texte Emma):
```
┌─────────────────────────────────────────────────────────┐
│  💡 Suggestions :                                       │
│  ┌──────────────────────┐  ┌─────────────────────────┐ │
│  │ 📊 Analyse rapide    │  │ 🔬 Analyse approfondie  │ │
│  └──────────────────────┘  └─────────────────────────┘ │
│  ┌──────────────────────┐  ┌─────────────────────────┐ │
│  │ 📈 Graphiques        │  │ ⚖️ Comparaisons         │ │
│  └──────────────────────┘  └─────────────────────────┘ │
│  ┌──────────────────────┐  ┌─────────────────────────┐ │
│  │ 💼 Portefeuille      │  │ 📰 Actualités           │ │
│  └──────────────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Comportement au clic

1. **Clic sur une catégorie** → Affiche un dropdown avec 3-5 suggestions de cette catégorie
2. **Clic sur une suggestion** → Insère le texte dans la zone de texte (avec placeholders)
3. **Utilisateur édite** les placeholders [TICKER], [ACTION1], etc.
4. **Utilisateur appuie sur Entrée** pour envoyer

### Placeholders éditables

Format : `[TEXTE_EN_MAJUSCULES]`

**Exemples** :
- `[TICKER]` → AAPL, MSFT, GOOGL, etc.
- `[ACTION1]` → AAPL
- `[ACTION2]` → MSFT
- `[ACTION3]` → GOOGL
- `[SECTEUR]` → technologie, finance, santé
- `[PÉRIODE]` → 6 mois, 1 an, 5 ans

**Auto-focus sur le premier placeholder** après insertion.

---

## 🛠️ IMPLÉMENTATION TECHNIQUE

### Structure React

```javascript
const EmmaSuggestions = () => {
    const [selectedCategory, setSelectedCategory] = useState(null);

    const categories = [
        { id: 'quick', label: '📊 Analyse rapide', icon: '📊' },
        { id: 'deep', label: '🔬 Analyse approfondie', icon: '🔬' },
        { id: 'charts', label: '📈 Graphiques', icon: '📈' },
        { id: 'compare', label: '⚖️ Comparaisons', icon: '⚖️' },
        { id: 'portfolio', label: '💼 Portefeuille', icon: '💼' },
        { id: 'news', label: '📰 Actualités', icon: '📰' },
        { id: 'scoring', label: '🎯 Scoring', icon: '🎯' },
        { id: 'sectors', label: '🌍 Secteurs', icon: '🌍' }
    ];

    const suggestions = {
        quick: [
            "Quel est le prix actuel de [TICKER] ?",
            "Performance de [TICKER] aujourd'hui",
            "Résumé rapide de [TICKER]",
            "[TICKER] est-il suracheté ou survendu ?"
        ],
        deep: [
            "Analyse approfondie de [TICKER] : fondamentaux, technique, actualités et recommandation",
            "Évalue [TICKER] selon les critères de Warren Buffett",
            "Force et faiblesses de [TICKER] par rapport à ses concurrents"
        ],
        charts: [
            "Montre-moi le graphique technique de [TICKER]",
            "Heatmap des secteurs du marché aujourd'hui",
            "Compare [ACTION1] et [ACTION2] avec graphiques"
        ],
        // ... etc
    };

    const handleSuggestionClick = (text) => {
        // Insérer dans la zone de texte
        setEmmaInput(text);

        // Auto-focus sur le premier placeholder
        const firstPlaceholder = text.match(/\[([^\]]+)\]/);
        if (firstPlaceholder) {
            // Sélectionner le texte du placeholder
            setTimeout(() => {
                const input = document.querySelector('#emma-input');
                const start = text.indexOf(firstPlaceholder[0]);
                const end = start + firstPlaceholder[0].length;
                input.setSelectionRange(start, end);
                input.focus();
            }, 100);
        }
    };

    return (
        <div className="emma-suggestions">
            <div className="suggestions-header">💡 Suggestions :</div>
            <div className="categories-grid">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className="category-button"
                    >
                        {cat.icon} {cat.label}
                    </button>
                ))}
            </div>
            {selectedCategory && (
                <div className="suggestions-dropdown">
                    {suggestions[selectedCategory].map((text, i) => (
                        <div
                            key={i}
                            onClick={() => handleSuggestionClick(text)}
                            className="suggestion-item"
                        >
                            {text}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
```

### Styles CSS

```css
.emma-suggestions {
    margin-top: 10px;
    padding: 15px;
    background: rgba(59, 130, 246, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(59, 130, 246, 0.2);
}

.suggestions-header {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 10px;
    color: #3b82f6;
}

.categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 8px;
}

.category-button {
    padding: 10px 15px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 13px;
    text-align: left;
}

.category-button:hover {
    background: #f3f4f6;
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.suggestions-dropdown {
    margin-top: 10px;
    padding: 10px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.suggestion-item {
    padding: 12px;
    margin-bottom: 8px;
    background: #f9fafb;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 13px;
    color: #374151;
}

.suggestion-item:hover {
    background: #eff6ff;
    border-left: 3px solid #3b82f6;
    transform: translateX(5px);
}

.suggestion-item:last-child {
    margin-bottom: 0;
}

/* Highlight des placeholders dans l'input */
#emma-input::selection {
    background: #bfdbfe;
    color: #1e40af;
}
```

---

## 📊 SUGGESTIONS PAR CATÉGORIE (Liste complète)

### 📊 Analyse Rapide (4 suggestions)
1. "Quel est le prix actuel de [TICKER] ?"
2. "Performance de [TICKER] aujourd'hui"
3. "Résumé rapide de [TICKER]"
4. "[TICKER] est-il suracheté ou survendu ?"

### 🔬 Analyse Approfondie (5 suggestions)
1. "Analyse approfondie de [TICKER] : fondamentaux, technique, actualités et recommandation"
2. "Évalue [TICKER] selon les critères de Warren Buffett"
3. "Analyse complète du bilan de [TICKER]"
4. "Force et faiblesses de [TICKER] par rapport à ses concurrents"
5. "Qualité du management et gouvernance de [TICKER]"

### 📈 Graphiques (5 suggestions)
1. "Montre-moi le graphique technique de [TICKER]"
2. "Visualise la performance de [TICKER] avec chart"
3. "Heatmap des secteurs du marché aujourd'hui"
4. "Affiche le logo et le chart de [TICKER]"
5. "Compare [ACTION1] et [ACTION2] avec graphiques"

### ⚖️ Comparaisons (5 suggestions)
1. "Compare [ACTION1], [ACTION2] et [ACTION3] : valorisation, croissance et dividendes"
2. "Qui est le meilleur entre [ACTION1] et [ACTION2] ?"
3. "Analyse comparative des GAFAM avec tableaux"
4. "Range [ACTION1], [ACTION2], [ACTION3] du meilleur au pire selon le P/E"
5. "Quelle action offre le meilleur potentiel : [ACTION1], [ACTION2] ou [ACTION3] ?"

### 💼 Portefeuille (5 suggestions)
1. "Mon portefeuille contient [ACTION1], [ACTION2], [ACTION3]. Que dois-je surveiller ?"
2. "Analyse les risques de mon portefeuille : [ACTION1], [ACTION2], [ACTION3]"
3. "Suggère des actions pour diversifier un portefeuille tech ([ACTION1], [ACTION2])"
4. "Mon portefeuille [ACTION1], [ACTION2], [ACTION3] est-il trop concentré ?"
5. "Calcule l'allocation optimale entre [ACTION1], [ACTION2] et [ACTION3]"

### 📰 Actualités (5 suggestions)
1. "Quelles sont les dernières actualités importantes sur [TICKER] ?"
2. "Y a-t-il des catalyseurs à venir pour [TICKER] ?"
3. "Résumé des résultats trimestriels de [TICKER]"
4. "[TICKER] a-t-il annoncé quelque chose récemment ?"
5. "Calendrier des événements importants pour [TICKER] cette semaine"

### 🎯 Scoring (5 suggestions)
1. "Calcule le score JSLAI™ de [TICKER] et explique-le"
2. "[TICKER] est-il un achat, une conservation ou une vente ?"
3. "Note [TICKER] sur 10 selon les critères de Peter Lynch"
4. "Quel est le fair value de [TICKER] ?"
5. "[TICKER] mérite-t-il sa valorisation actuelle ?"

### 🌍 Secteurs (4 suggestions)
1. "Quel est le meilleur secteur à investir en ce moment ?"
2. "Performance du secteur technologique vs secteur financier"
3. "Quelles actions profitent de la tendance IA ?"
4. "Analyse macro-économique et implications pour mon portefeuille"

---

## 🎯 PRIORISATION

### Phase 1 (MVP - Quick Win)
- 4 catégories principales : Analyse rapide, Analyse approfondie, Graphiques, Comparaisons
- 3-4 suggestions par catégorie
- UI simple : boutons + dropdown

### Phase 2 (Enhanced)
- Ajouter : Portefeuille, Actualités, Scoring, Secteurs
- Améliorer l'UX : animations, transitions
- Ajouter filtres/recherche

### Phase 3 (Advanced)
- Suggestions contextuelles (basées sur l'historique)
- Suggestions personnalisées (ML)
- Suggestions rapides (favoris)

---

## 📝 NOTES D'IMPLÉMENTATION

### Détection des placeholders
```javascript
const placeholderRegex = /\[([^\]]+)\]/g;
const placeholders = text.match(placeholderRegex);
// ["[TICKER]", "[ACTION1]", "[ACTION2]"]
```

### Auto-remplacement intelligent
Si l'utilisateur a déjà mentionné un ticker dans la conversation, pré-remplir automatiquement :
```javascript
const lastMentionedTicker = extractLastTickerFromHistory(conversationHistory);
if (lastMentionedTicker) {
    text = text.replace('[TICKER]', lastMentionedTicker);
}
```

### Analytics
Tracker quelles suggestions sont les plus utilisées pour optimiser l'ordre :
```javascript
analytics.track('emma_suggestion_clicked', {
    category: 'charts',
    suggestion: 'Montre-moi le graphique technique de [TICKER]',
    timestamp: Date.now()
});
```

---

*Document créé par Claude Code*
*Date: 31 Octobre 2025*
