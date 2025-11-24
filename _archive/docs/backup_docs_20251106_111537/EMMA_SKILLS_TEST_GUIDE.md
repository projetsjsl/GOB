# 🚀 Emma SKILLS Test Guide - Test TOUS les mots-clés

> **Vous avez demandé**: "Je veux que tu lui poses des questions de finance et gestion de portefeuille et tickers et tous les mots clés SKILLS qu'on lui a créé et que tu analyse ses réponses"
>
> ✅ **Livré**: Script complet qui teste TOUS les 30+ SKILLS d'Emma

---

## 📋 What is Being Tested?

Emma a **30+ SKILLS (mots-clés spécialisés)** en 8 catégories:

### 1. 📊 Analyses Complètes (7 SKILLS)
```
ANALYSE [TICKER]     → Analyse complète
FONDAMENTAUX [T]     → Ratios financiers
TECHNIQUE [TICKER]   → Analyse technique
COMPARER [T1] [T2]   → Comparaison multi-tickers
PRIX [TICKER]        → Prix temps réel
RATIOS [TICKER]      → P/E, P/B, ROE, etc.
CROISSANCE [TICKER]  → Croissance revenus/EPS
```

### 2. 📈 Indicateurs Techniques (3 SKILLS)
```
RSI [TICKER]         → Force relative
MACD [TICKER]        → Momentum MACD
MOYENNES [TICKER]    → Moyennes mobiles 50/200
```

### 3. 📰 Actualités (3 SKILLS)
```
TOP 5 NEWS          → Top actualités du jour
NEWS [TICKER]       → Actualités ticker
ACTUALITES [T]      → Alternative NEWS
```

### 4. 📅 Calendriers (3 SKILLS)
```
RESULTATS           → Earnings calendar complet
RESULTATS [TICKER]  → Earnings spécifique
CALENDRIER ECONOMIQUE → Macro events
```

### 5. 📊 Watchlist (3 SKILLS)
```
LISTE               → Voir ta watchlist
AJOUTER [TICKER]    → Ajouter à watchlist
RETIRER [TICKER]    → Retirer de watchlist
```

### 6. 📈 Vue Marché (3 SKILLS)
```
INDICES             → Dow, S&P, Nasdaq
MARCHE              → Vue marchés globale
SECTEUR [NOM]       → Analyse secteur
```

### 7. 💼 Recommandations (2 SKILLS)
```
ACHETER [TICKER]    → Avis achat justifié
VENDRE [TICKER]     → Avis vente justifié
```

### 8. 🌍 Macro-Économie (3 SKILLS)
```
INFLATION           → Données inflation
FED                 → Fed & taux directeurs
TAUX                → Taux d'intérêt
```

### 9. 📚 Aide (3 SKILLS)
```
AIDE                → Guide complet
EXEMPLES            → Exemples questions
SKILLS              → Liste SKILLS
```

**TOTAL: 32 SKILLS à tester** ✓

---

## 🏃 Quick Start - 3 Étapes

### Étape 1: Lancer le test (5-10 minutes)
```bash
# Terminal 1: Lancer le serveur dev
npm run dev

# Terminal 2: Lancer les tests
node test_emma_all_skills.js
```

### Étape 2: Observer les résultats
```
[1/32] ANALYSE
Category: Analyses Complètes
Question: "ANALYSE MSFT"
📤 Sending to Emma...
✅ Response received (X chars)

[Emma's Response...]

📊 Quick Evaluation:
   Length: 8/10
   Coherence: 9/10
   Relevance: 10/10
   🎯 SCORE: 27/30 (A)

[Repeats 32 times...]
```

### Étape 3: Voir le rapport
```bash
# Les résultats sont dans:
ls -la logs/emma_skills_test/

# Voir le rapport complet:
cat logs/emma_skills_test/EMMA_SKILLS_REPORT.md

# Voir les JSON détaillés:
cat logs/emma_skills_test/skill_01_ANALYSE.json | jq
```

---

## 📊 Analysis Framework

Chaque réponse est évaluée sur **30 points**:

### Length Score (10 pts) 📏
- **10 pts**: 500+ words (Analyses) ou 300+ words (autres)
- **8 pts**: 250-500 words
- **5 pts**: 100-250 words
- **2 pts**: < 100 words
- **0 pts**: Empty

**Importance**: Emma doit donner des réponses DÉTAILLÉES, pas laconiques

### Coherence Score (10 pts) 🎯
- **10 pts**: Response cohérente, données consistantes
- **9 pts**: Très cohérente avec données valides
- **7 pts**: Cohérente mais quelques données manquantes
- **5 pts**: Partially coherent, quelques contradictions
- **0 pts**: Incoherent ou complètement faux

**Importance**: Évite les hallucinations et contradictions

### Relevance Score (10 pts) ✓
- **10 pts**: Répond parfaitement à la question
- **9 pts**: Répond à 90%+ de la question
- **7 pts**: Répond à 70%+ de la question
- **5 pts**: Répond à 50%+ de la question
- **0 pts**: Hors sujet

**Importance**: Emma reste sur sujet et pertinent

---

## 🎯 Grades

```
Grade A: 25-30 pts = Production Ready ✅
Grade B: 20-24 pts = Good, minor fixes
Grade C: 15-19 pts = Acceptable, improvements needed
Grade D: < 15 pts  = Needs major rework
```

---

## 📁 Output Files

Après exécution, vous avez:

```
logs/emma_skills_test/
├─ skill_01_ANALYSE.json              # Détails test #1
├─ skill_02_FONDAMENTAUX.json         # Détails test #2
├─ ... (32 files)
├─ skill_32_SKILLS.json               # Détails test #32
├─ skills_summary.json                # Résumé JSON complet
└─ EMMA_SKILLS_REPORT.md              # Rapport formaté
```

### Chaque JSON contient:
```json
{
  "skillNum": 1,
  "keyword": "ANALYSE",
  "category": "Analyses Complètes",
  "question": "ANALYSE MSFT",
  "description": "Analyse complète d'un ticker",
  "response": "Emma's full response here...",
  "response_length": 2145,
  "evaluation": {
    "total": 28,
    "grade": "A",
    "length_score": 10,
    "coherence_score": 9,
    "relevance_score": 9
  }
}
```

---

## 🔍 What to Look For

### ✅ Good Signs
- [ ] Response > 300 words (analyses) ou > 100 words (aide)
- [ ] Données cohérentes entre réponses
- [ ] Mots-clés du SKILL présents dans la réponse
- [ ] Structure logique et facile à lire
- [ ] Aucune hallucination ou données fausses
- [ ] Références à des sources (FMP, données temps réel)

### ❌ Warning Signs
- [ ] Réponse trop courte (< 100 words)
- [ ] Données contradictoires
- [ ] Hors sujet ou vague
- [ ] Hallucinations (nombres inventés, tickers inexistants)
- [ ] Pas de structure logique
- [ ] Erreurs financières (P/E négatif, etc.)

---

## 📈 Category Analysis

### Par catégorie, qu'attendre?

**Analyses Complètes** (ANALYSE, FONDAMENTAUX, etc.)
- ✅ Espéré: Grade A (25-30 pts)
- Pourquoi: Core business d'Emma
- Si faible: Vérifier data sources (FMP, Perplexity)

**Indicateurs Techniques** (RSI, MACD, MOYENNES)
- ✅ Espéré: Grade A-B (20-30 pts)
- Pourquoi: Calculs standards, bien documentés
- Si faible: Vérifier formules techniques

**Actualités** (TOP 5 NEWS, NEWS)
- ✅ Espéré: Grade A-B (20-30 pts)
- Pourquoi: Données temps réel disponibles
- Si faible: Vérifier API news (Finnhub, FMP)

**Calendriers** (RESULTATS, CALENDRIER)
- ✅ Espéré: Grade B (20-25 pts)
- Pourquoi: Données structurées, à jour demandée
- Si faible: Vérifier calendar endpoints

**Watchlist** (LISTE, AJOUTER, RETIRER)
- ✅ Espéré: Grade A (25-30 pts)
- Pourquoi: Opérations simples mais essentielles
- Si faible: Vérifier Supabase connectivity

**Vue Marché** (INDICES, MARCHE, SECTEUR)
- ✅ Espéré: Grade A-B (20-30 pts)
- Pourquoi: Données importantes pour investisseurs
- Si faible: Vérifier aggregation et formatage

**Recommandations** (ACHETER, VENDRE)
- ✅ Espéré: Grade A (25-30 pts, sophistication CFA)
- Pourquoi: Core wealth advice
- Si faible: Enrichir prompt avec critères DCF, scénarios

**Macro-Économie** (INFLATION, FED, TAUX)
- ✅ Espéré: Grade A-B (20-30 pts)
- Pourquoi: Données macro importantes
- Si faible: Vérifier sources économiques

**Aide** (AIDE, EXEMPLES, SKILLS)
- ✅ Espéré: Grade A (25-30 pts, complètes)
- Pourquoi: Reference information, important for UX
- Si faible: Enrichir les messages d'aide

---

## 🛠️ Optimization If Scores Too Low

### Si Length < 8/10
```javascript
// Dans api/emma-agent.js:
// Augmenter max_tokens basé sur SKILL
const maxTokensMap = {
  'ANALYSE': 2048,       // Long analyses
  'FONDAMENTAUX': 1500,  // Detailed ratios
  'AIDE': 2048,          // Complete guides
  'RESULTATS': 1024      // Calendar summary
  // ...
};
```

### Si Coherence < 9/10
```javascript
// Dans api/chat.js:
// Utiliser ytd-validator pour données consistantes
// Enrichir stockData avec source (FMP vs Perplexity)
const validatedStockData = enrichStockDataWithSources(metadata?.stockData, 'fmp');
```

### Si Relevance < 9/10
```javascript
// Vérifier prompt construction pour SKILL spécifique
// Ajouter exemple output type pour le SKILL
// Forcer inclusion de keywords du SKILL dans réponse
```

---

## 🚀 Next Steps

1. **Lancer les tests**:
   ```bash
   node test_emma_all_skills.js
   ```

2. **Analyser les résultats**:
   - Lire EMMA_SKILLS_REPORT.md
   - Identifier catégories avec scores < 20/30
   - Voir patterns d'échecs

3. **Optimiser**:
   - Pour chaque échec, implémenter recommandation
   - Re-tester SKILLS spécifiques
   - Itérer jusqu'à tous grades ≥ B

4. **Documenter**:
   - Créer fichier de fixes par SKILL
   - Tracker improvements
   - Valider multi-channel (SMS, Email, Web)

---

## 📞 Questions?

Pour chaque SKILL qui échoue:
- Vérifier console logs: `grep -A 5 "SKILL_NAME" logs/emma_skills_test/`
- Voir réponse complète: `cat logs/emma_skills_test/skill_XX_NAME.json | jq .response`
- Checker API: `curl http://localhost:3000/api/status?test=true`

---

## 📊 Summary

**Vous testez**: 32 SKILLS dans 9 catégories

**Vous mesurez**:
- Length (réponse assez détaillée?)
- Coherence (données cohérentes?)
- Relevance (répond bien à la question?)

**Vous optimisez**: Chaque SKILL vers Grade A (≥ 25/30)

**Vous validez**: Multi-channel (Web, SMS, Email)

🚀 **Ready? Let's go!**

```bash
npm run dev
node test_emma_all_skills.js
```

---

Generated: $(date)

