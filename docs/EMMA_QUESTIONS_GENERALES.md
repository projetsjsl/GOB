# Emma - Support des Questions Générales/Non-Financières

## 📋 Résumé

Emma peut maintenant répondre naturellement à des questions générales et non-financières, en utilisant Perplexity comme source de connaissances. Elle n'est plus limitée au strict cadre financier.

## 🎯 Objectif

Permettre à Emma d'être une assistante polyvalente qui peut :
- Répondre à des questions générales de connaissance
- Traiter des sujets non-financiers (sciences, culture, vie quotidienne, etc.)
- Utiliser Perplexity efficacement pour ces questions
- Adapter son ton et son prompt selon le type de question

## ✅ Fonctionnalités Ajoutées

### 1. **Détection Prioritaire des Questions Générales**

Dans `_shouldUsePerplexityOnly()`, une détection prioritaire identifie les questions générales/non-financières avant toute extraction de tickers ou analyse financière.

**Keywords détectés** :
- Questions générales : "qu'est-ce que", "c'est quoi", "explique", "comment fonctionne"
- Sciences : physique, chimie, biologie, mathématiques, technologie
- Vie quotidienne : cuisine, voyage, santé, sport, météo
- Business général : marketing, management, leadership (non-financier)
- Culture : histoire, géographie, art, littérature, cinéma
- Éducation : tutoriels, guides, méthodes, techniques
- Conversation : bonjour, merci, aide, etc.

### 2. **Prompt Adaptatif**

Le prompt système s'adapte automatiquement selon le type de question :

**Questions Financières** :
```
Tu es Emma, CFA® - Analyste Financière Senior...
[Prompt CFA complet avec ratios, analyses, etc.]
```

**Questions Générales/Non-Financières** :
```
Tu es Emma, une assistante IA polyvalente et intelligente. 
Tu peux répondre à des questions sur de nombreux sujets, 
pas seulement la finance. Réponds en français de manière 
naturelle, accessible et engageante. Si la question n'est 
pas financière, réponds simplement et utilement sans 
forcer un contexte financier.
```

### 3. **Instructions Simplifiées pour Questions Générales**

Pour les questions générales, les instructions sont simplifiées :
- Pas de contraintes financières
- Pas de formatage Bloomberg Terminal
- Pas de ratios obligatoires
- Réponse naturelle et utile

### 4. **Routage Intelligent**

- **Questions générales** → Perplexity seul (pas d'APIs financières)
- **Questions financières** → Perplexity + APIs selon besoin
- **Questions mixtes** → Détection contextuelle intelligente

## 📊 Exemples de Questions Supportées

### Sciences & Technologie
- "Qu'est-ce que la photosynthèse ?"
- "Comment fonctionne un ordinateur quantique ?"
- "Explique-moi la relativité générale"

### Vie Quotidienne
- "Quelle est la meilleure recette de lasagnes ?"
- "Comment planifier un voyage au Japon ?"
- "Quels sont les bienfaits de la méditation ?"

### Culture & Histoire
- "Qui était Napoléon Bonaparte ?"
- "Explique-moi la Renaissance"
- "Quels sont les meilleurs films de 2024 ?"

### Business Général (Non-Financier)
- "Comment améliorer la productivité d'une équipe ?"
- "Qu'est-ce que le design thinking ?"
- "Explique-moi le marketing digital"

### Éducation
- "Comment apprendre une nouvelle langue ?"
- "Quelle est la meilleure méthode pour étudier ?"
- "Explique-moi les bases de la programmation"

## 🔄 Logique de Détection

### Étape 1 : Détection Prioritaire
```javascript
// Dans _shouldUsePerplexityOnly()
const generalNonFinancialKeywords = [
    'qu\'est-ce que', 'explique', 'comment fonctionne',
    'physique', 'chimie', 'cuisine', 'voyage', ...
];

const hasGeneralKeyword = generalNonFinancialKeywords.some(kw => message.includes(kw));
const hasFinancialKeyword = [...tous les keywords financiers...].some(...);

if (hasGeneralKeyword && !hasFinancialKeyword && extractedTickers.length === 0) {
    return { usePerplexityOnly: true, reason: 'Question générale/non-financière' };
}
```

### Étape 2 : Marquage du Contexte
```javascript
// Dans _plan_with_scoring()
if (perplexityDecision.reason.includes('générale/non-financière')) {
    context.is_general_question = true;
    context.perplexity_only_reason = perplexityDecision.reason;
}
```

### Étape 3 : Adaptation du Prompt
```javascript
// Dans _buildPerplexityPrompt()
const isGeneralNonFinancial = context.is_general_question || 
    (intentData && ['general_conversation', 'help'].includes(intentData.intent));

const cfaIdentity = isGeneralNonFinancial
    ? `Tu es Emma, une assistante IA polyvalente...`
    : `Tu es Emma, CFA® - Analyste Financière...`;
```

## 🎯 Bénéfices

1. **Polyvalence**
   - Emma peut maintenant répondre à un éventail beaucoup plus large de questions
   - Expérience utilisateur améliorée (pas besoin de changer d'assistant)

2. **Efficacité**
   - Pas d'appels APIs inutiles pour questions générales
   - Utilisation optimale de Perplexity pour connaissances générales

3. **Naturel**
   - Réponses adaptées au contexte (pas de jargon financier pour questions générales)
   - Ton approprié selon le type de question

4. **Intelligent**
   - Détection automatique du type de question
   - Routage optimal vers la bonne source de connaissances

## 📝 Exemples de Réponses

### Question Générale
**Utilisateur** : "Qu'est-ce que la photosynthèse ?"

**Emma** : "La photosynthèse est le processus par lequel les plantes, les algues et certaines bactéries convertissent la lumière du soleil en énergie chimique. Voici comment ça fonctionne :

1. **Absorption de la lumière** : Les chloroplastes dans les feuilles absorbent la lumière solaire, principalement grâce à la chlorophylle.

2. **Réaction lumineuse** : L'énergie lumineuse est utilisée pour diviser les molécules d'eau (H₂O) en hydrogène et oxygène. L'oxygène est libéré dans l'atmosphère.

3. **Réaction sombre (cycle de Calvin)** : L'hydrogène et l'énergie sont utilisés pour convertir le dioxyde de carbone (CO₂) en glucose, une forme de sucre que la plante utilise comme source d'énergie.

**Équation** : 6CO₂ + 6H₂O + lumière → C₆H₁₂O₆ + 6O₂

C'est un processus fondamental pour la vie sur Terre, car il produit l'oxygène que nous respirons et constitue la base de la chaîne alimentaire."

### Question Financière (Comportement Normal)
**Utilisateur** : "Analyse AAPL"

**Emma** : "[Analyse CFA complète avec ratios, fondamentaux, etc.]"

## ⚠️ Notes Importantes

1. **Priorité** : Les questions financières gardent la priorité. Si une question contient des mots financiers ET généraux, elle sera traitée comme financière.

2. **Tickers** : Si un ticker est détecté, la question sera traitée comme financière même si elle contient des mots généraux.

3. **Contexte** : Emma peut basculer entre mode financier et mode général dans la même conversation selon les questions.

4. **Perplexity** : Pour les questions générales, Emma utilise uniquement Perplexity (pas d'APIs financières), ce qui est optimal pour ces types de questions.

## 🔮 Améliorations Futures Possibles

1. **Détection Plus Fine** : Améliorer la détection pour les questions mixtes (ex: "Comment la technologie affecte-t-elle les marchés financiers ?")

2. **Mémoire Contextuelle** : Mieux gérer le contexte dans les conversations mixtes (financier + général)

3. **Sources Spécialisées** : Intégrer des sources spécialisées pour certains domaines (ex: Wolfram Alpha pour sciences)

4. **Personnalisation** : Permettre à l'utilisateur de définir ses préférences (mode strictement financier vs polyvalent)

## ✅ Statut

**Terminé** - Emma peut maintenant répondre naturellement aux questions générales et non-financières.

---

*Dernière mise à jour : Novembre 2025*
