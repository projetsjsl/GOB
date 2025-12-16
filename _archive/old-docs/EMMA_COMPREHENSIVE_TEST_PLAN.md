# 🧪 Plan de Test Compréhensif Emma - 25 Scénarios

## Objectif
Évaluer Emma sur 25 scénarios distincts en testant:
- ✅ Cohérence des réponses (même question, différents canaux)
- ✅ Qualité institutionnelle (grade CFA)
- ✅ Sophistication de l'analyse
- ✅ Longueur et profondeur du contenu
- ✅ Mémoire de conversation
- ✅ Valeur ajoutée (au-delà du factuel)
- ✅ Scénarios (optimiste, pessimiste, réaliste)

---

## 📋 Matrice de Test

### Groupe 1: ANALYSES FONDAMENTALES (5 tests)

| # | Scenario | Ticker | Questions | Attendu | Canaux Test |
|---|----------|--------|-----------|---------|-------------|
| 1 | Analyse complète tech | MSFT | "Analyse fondamentale MSFT - valorisation, rentabilité, risques" | 1200+ mots, 3 scénarios, ratios détaillés | Web, SMS |
| 2 | Comparaison sectorielle | GOOGL vs MSFT vs AAPL | "Compare les 3 géants tech: valorisation, croissance, moat" | Tableau comparatif, points forts/faibles par ticker | Web, Email |
| 3 | Value stock défensif | TD | "Analyse TD: est-ce un bon défensif pour 2025?" | Analyse risques + rendement, scénarios économiques | Web, SMS |
| 4 | Cyclique en reprise | SU (Suncor) | "Suncor est-il attractif à ce prix? Dépendances géopolitiques?" | Impact géopolitique, sensibilité prix pétrole, 3 scénarios | Web, Email |
| 5 | Growth survalué? | NVDA | "NVDA est trop chère ou justifiée par la croissance IA?" | DCF scenario, comparaison pairs, points de rupture | Web, SMS |

---

### Groupe 2: STRATÉGIE PORTFOLIO (5 tests)

| # | Scenario | Focus | Questions | Attendu |
|---|----------|-------|-----------|---------|
| 6 | Allocation risque | Multi-asset | "Comment allouer 100k$ entre actions/obligatoires/crypto en 2025?" | 3 profils (agressif/modéré/conservateur) avec poids sectoriels |
| 7 | Rebalancing tactique | Watchlist | "Dois-je rebalancer ma watchlist? Quels tickers vendre/acheter?" | Analyse de concentration, recommandations avec timing |
| 8 | Couverture de risque | Hedge | "Comment me couvrir contre correction 20%?" | Outils (puts, VIX, positions courtes), coûts vs bénéfices |
| 9 | Tendance vs Valeur | Stratégies | "Momentum ou mean-reversion en 2025?" | Contexte macro justifiant chaque approche, backtests |
| 10 | Rotation sectorielle | Macro | "Quels secteurs pour Fed cuts vs inflation persist?" | Corrélations sectorielles, timing rotations, 3 scénarios |

---

### Groupe 3: ACTUALITÉ & MACRO (5 tests)

| # | Scenario | Contexte | Questions | Attendu |
|---|----------|----------|-----------|---------|
| 11 | News impact | Récent | "Impacte de [récent news] sur le marché 6 mois?" | Timeline d'effets, gagnants/perdants, scénarios |
| 12 | Cycle Fed | Monétaire | "Quand va la Fed couper et quel impact sur marchés?" | Probabilités, chronologie, effets par classe d'actif |
| 13 | Election US | Géopolitique | "2025: implications pour marché si Dems vs GOP?" | Différences politiques, secteurs impactés, timeline |
| 14 | Récession indicator | Macro | "Sommmes-nous en train de glisser vers récession?" | Indicateurs surveillés, probabilité dans 12M, scénarios |
| 15 | Tech earnings | Secteur | "Résultats tech attendus - est-ce "priced in"?" | Attentes vs historique, catalyseurs, valuations post-earnings |

---

### Groupe 4: RISQUES & SCENARIOS (5 tests)

| # | Scenario | Risk Type | Questions | Attendu |
|---|----------|-----------|-----------|---------|
| 16 | Stress test portefeuille | Downside | "Portefeuille de [tickers] en crash -30%?" | Impact détaillé, corrélations, positifs résistants |
| 17 | Taux d'intérêt | Fixed income | "Si Fed ↑ taux à 5% - quel impact?" | Prix obligations/actions, valuations, secteurs vulnérables |
| 18 | Inflation surprise | Inflation | "Inflation repart à 5%: quoi font les investisseurs?" | Rotations, commodités, protections nominales vs réelles |
| 19 | Disruption tech | Technologique | "Quelle techno disrupte le plus en 2025: AI vs Quantum?" | Probabilités, gagnants/perdants, investissements défensifs |
| 20 | Événement géopolitique | Géopolitique | "Conflict US-China - impact sur stocks tech?" | Timeline effets, secteurs impactés, corrélations géopolitiques |

---

### Groupe 5: QUESTIONS COMPLEXES & CFA (5 tests)

| # | Scenario | Complexité | Questions | Attendu |
|---|----------|-----------|-----------|---------|
| 21 | DCF valuation | Modeling | "Valeur intrinsèque de [ticker]? Sensibilités?" | Modèle complet, assomptions, analyses sensibilité |
| 22 | ESG/Sustainable | Impact | "ESG vraiment corrélé à outperformance long-terme?" | Études empiriques, corrélations, biais de sélection |
| 23 | Options stratégies | Dérivés | "Couvrir position long [ticker] avec puts? Optimal?" | Coût vs protection, alternatives, Greeks |
| 24 | M&A impacts | M&A | "Acquisition [CompanyA] par [CompanyB] - impact cours?" | Synergies, dilution, risques réglementaires, timeline |
| 25 | Comportement investisseur | Behavioral | "Pourquoi investisseurs panic-sell en baisse? Comment résister?" | Biais comportementaux, stratégies psychologiques, données |

---

## 🔧 Setup Test Infrastructure

### Canaux à Tester:
1. **Web** - `/api/chat` avec channel='web'
2. **SMS** - `/api/adapters/sms` via Twilio
3. **Email** - `/api/adapters/email` via ImprovMX
4. **Messenger** - `/api/adapters/messenger` (optionnel)

### Données à Collecter par Test:

```json
{
  "test_id": 1,
  "scenario": "Analyse complète tech",
  "timestamp": "2025-11-06T14:30:00Z",
  "request": {
    "message": "Analyse fondamentale MSFT...",
    "channel": "web",
    "userId": "test_user_001"
  },
  "response": {
    "content": "...",
    "length": 1500,
    "model": "perplexity",
    "execution_time_ms": 3200,
    "tools_used": ["fmp-fundamentals", "news"]
  },
  "evaluation": {
    "coherence": 9.5,
    "sophistication": 8.8,
    "cfa_grade": "A",
    "longueur": 1500,
    "mémoire": true,
    "valeur_ajoutée": 9,
    "scénarios_count": 3,
    "strengths": ["..."],
    "weaknesses": ["..."],
    "recommendations": ["..."]
  }
}
```

---

## 📊 Grille d'Évaluation (100 points)

### 1. Cohérence (15 pts)
- ✅ Données YTD/ratios cohérents (5 pts)
- ✅ Citations sources cohérentes (5 pts)
- ✅ Pas de contradictions (5 pts)

### 2. Sophistication Institutionnelle (20 pts)
- ✅ Utilisation concept CFA (5 pts) - DCF, WACC, free cash flow, etc.
- ✅ Analyses multidimensionnelles (5 pts) - macro, micro, sentiment
- ✅ Nuances et contexte (5 pts) - "d'un côté... d'un autre..."
- ✅ Professionnalisme (5 pts) - ton, structure, clarté

### 3. Longueur & Profondeur (15 pts)
- ✅ Réponse > 800 mots pour analyses (5 pts)
- ✅ 3+ scénarios explorés (5 pts)
- ✅ Détail des calculs/ratios (5 pts)

### 4. Mémoire de Conversation (10 pts)
- ✅ Rappel contexte conversations précédentes (10 pts)

### 5. Valeur Ajoutée (15 pts)
- ✅ Au-delà du factuel, opinions justifiées (5 pts)
- ✅ Points forts ET faibles identifiés (5 pts)
- ✅ Recommandations actionables (5 pts)

### 6. Couverture Scénarios (15 pts)
- ✅ Optimiste exploré (5 pts)
- ✅ Pessimiste exploré (5 pts)
- ✅ Réaliste exploré (5 pts)

### 7. Cohérence Multi-Canaux (10 pts)
- ✅ Même contenu substance via web/SMS/email (10 pts)

---

## 🚀 Exécution des Tests

### Phase 1: Setup (Aujourd'hui)
```bash
# 1. Créer fichier de test scenarios
cp EMMA_TEST_SCENARIOS_25.json test_suite.json

# 2. Préparer infra logging
mkdir -p logs/emma_tests

# 3. Valider endpoints disponibles
curl -X POST http://localhost:3000/api/chat -d '{"message":"Test"}'
```

### Phase 2: Exécution (Semaine 1)
```bash
# Lancer 25 tests en séquence
node run_emma_tests.js --scenarios=25 --log-results

# Outputs:
# - logs/emma_tests/test_001_analysis_msft.json
# - logs/emma_tests/test_002_comparison_tech.json
# - ...
# - logs/emma_tests/test_025_behavioral.json
```

### Phase 3: Analyse (Semaine 1)
```bash
# Compiler résultats
node analyze_emma_results.js --input=logs/emma_tests --output=EMMA_TEST_RESULTS.md

# Génère:
# - Grille d'évaluation par test
# - Scores globaux par catégorie
# - Recommandations prioritaires
```

---

## 📈 Métriques de Sortie

### Par Test (25 résultats):
```
Test 1: MSFT Analysis
├─ Cohérence: 9.5/10 ✓
├─ Sophistication: 8.8/10 ✓
├─ Longueur: 1247 mots ✓ (> 800)
├─ Scénarios: 3/3 ✓ (optimiste, pessimiste, réaliste)
├─ CFA Grade: A ✓
├─ Points forts: [DCF detail, macro context]
├─ Points faibles: [Peu de quantification ESG]
└─ Score Global: 88/100
```

### Synthèse Globale:
```
Scores Moyens:
├─ Cohérence: 9.1/10 ✓
├─ Sophistication: 8.4/10 ✓
├─ Longueur: 1050 mots ✓
├─ Mémoire: 7.2/10 ⚠️ (à améliorer)
├─ Scénarios: 2.8/3 ⚠️ (parfois 2 au lieu de 3)
└─ Score Global: 84.5/100 ✓ TRÈS BON

Top Strengths:
1. Analyses fondamentales très détaillées
2. Contexte macro intégré naturellement
3. Multiple valuation methods used

Top Weaknesses:
1. Mémoire conversation à améliorer
2. Certains scénarios manquent de détail
3. Quantification ESG/impact social

Next Phase:
1. Implémenter mémoire conversation robuste
2. Forcer 3 scénarios (actuellement 2.8 en moyenne)
3. Ajouter templates ESG automatiques
```

---

## 📝 Génération Rapport Final

Après les 25 tests, générer:

1. **EMMA_TEST_RESULTS_DETAILED.md** (150+ pages)
   - Résultats 25 tests
   - Grille d'évaluation détaillée
   - Exemples de réponses

2. **EMMA_QUALITY_SCORECARD.json**
   - Scores par catégorie
   - Comparaisons web/SMS/email
   - Dégradation qualité par canal

3. **EMMA_IMPROVEMENT_ROADMAP.md**
   - Top 10 priorités
   - Changements recommandés
   - ROI de chaque fix

4. **EMMA_PROMPTS_OPTIMIZED.js**
   - Prompts améliorés basés sur test results
   - New templates for scenarios
   - Enhanced validation rules

---

## ✅ Checklist Prêt-à-Tester

- [ ] 25 scénarios définis (ci-dessus)
- [ ] Endpoints /api/chat validés
- [ ] SMS adapter testé manuellement
- [ ] Email adapter testé manuellement
- [ ] Script d'exécution prêt
- [ ] Grille d'évaluation finalisée
- [ ] Logging infrastructure en place
- [ ] Stockage résultats configuré
- [ ] Analyseur de résultats prêt
- [ ] Rapports templates créés

---

## 🎯 Success Criteria

✅ **SUCCESS**: Si tous les 25 tests:
- Cohérence ≥ 8.5/10
- Sophistication ≥ 8/10
- Longueur ≥ 800 mots (analyses)
- 3+ scénarios explorés
- Valeur ajoutée ≥ 8/10
- Même substance multi-canaux

⚠️ **WARNING**: Si 30%+ des tests < 80/100
🔴 **FAIL**: Si > 50% des tests < 75/100

---

**Status**: 📋 Plan Ready → Awaiting Execution

