# 📚 Emma Comprehensive Testing - Complete Index

## 🎯 Mission
Exécuter 25 tests automatisés pour évaluer Emma sur: cohérence, sophistication CFA, longueur, mémoire, scénarios, valeur ajoutée.

**Expected Output**: Score 85+/100 (Excellent) | Génération de rapport détaillé

---

## 📋 Documents Créés

### 1. **EMMA_COMPREHENSIVE_TEST_PLAN.md** (150+ lignes)
**Contenu**: Plan complet avec 25 scénarios détaillés
- Matrice 25 tests (groupe, scenario, ticker, channels)
- Grille d'évaluation (100 pts)
- Setup infra, exécution phases, métriques sortie

**Utilisation**: Référence des 25 scénarios avant de lancer tests

---

### 2. **test_emma_25_scenarios.js** (500+ lignes)
**Contenu**: Script Node.js d'exécution automatisé
- 25 scénarios hardcodés avec messages complets
- Calling API /api/chat via web/SMS/email
- Évaluation automatique par critères
- Génération logs + rapport

**Utilisation**: `node test_emma_25_scenarios.js`

**Features**:
- Options: `--scenarios=1,5,10`, `--channel=web`, `--group="CFA"`
- Output: logs/emma_tests/*.json + EMMA_TEST_RESULTS.md
- Duration: ~45-60 min pour 25 tests

---

### 3. **EMMA_TEST_EXECUTION_GUIDE.md** (350+ lignes)
**Contenu**: Guide détaillé d'exécution
- Prérequis & setup
- 4 options d'exécution (tous, group, spécifique, combinations)
- Interprétation des résultats (scores, grades, benchmarks)
- Troubleshooting common issues

**Utilisation**: Avant de lancer, lire ce guide si questions

---

### 4. **EMMA_TESTING_QUICKSTART.md** (200+ lignes)
**Contenu**: TL;DR version - lancer tests en 5 min
- 3 commandes rapides pour démarrer
- Les 25 scénarios en 30 sec
- Grille evaluation compactée
- Common commands & monitoring

**Utilisation**: Démarrage rapide si experience d'exécution

---

## 🚀 Quick Execution Path

### Step 1: Prepare (2 min)
```bash
mkdir -p logs/emma_tests
# Vérifier API: curl http://localhost:3000/api/chat -d '{"message":"test","userId":"test","channel":"web"}'
```

### Step 2: Choose Execution Mode (1 min)
```bash
# Option A: Tous les 25 tests (~50 min)
node test_emma_25_scenarios.js

# Option B: Groupe spécifique (~15 min)
node test_emma_25_scenarios.js --group="Analyses Fondamentales"

# Option C: Tests spécifiques (~10 min)
node test_emma_25_scenarios.js --scenarios=1,5,21

# Option D: Dry run - test 1 seulement (~5 min)
node test_emma_25_scenarios.js --scenarios=1 --verbose
```

### Step 3: Monitor (ongoing)
```bash
# In another terminal:
watch 'tail -20 test_run.log'
# ou
tail -f logs/emma_tests/test_01.json | jq .
```

### Step 4: Analyze (20 min after completion)
```bash
# View results
cat logs/emma_tests/results.json | jq '.results[] | {id, scenario, web_score: .channelResults.web.score}'

# Find weak tests
cat logs/emma_tests/results.json | jq '.results[] | select(.channelResults.web.score < 80)'

# Extract report
cat EMMA_TEST_RESULTS.md
```

---

## 📊 25 Scenarios Reference

| ID | Groupe | Scenario | Ticker | Channels | Longueur | Scénarios |
|----|--------|----------|--------|----------|----------|-----------|
| 1 | Fondamentaux | Analyse complète tech | MSFT | web, sms | 1200+ | 3 |
| 2 | Fondamentaux | Comparaison sectorielle | GOOGL, MSFT, AAPL | web, email | 1500+ | 3 |
| 3 | Fondamentaux | Value stock défensif | TD | web, sms | 1000+ | 3 |
| 4 | Fondamentaux | Cyclique en reprise | SU | web, email | 1100+ | 3 |
| 5 | Fondamentaux | Growth survalué? | NVDA | web, sms | 1300+ | 3 |
| 6 | Portfolio | Allocation 100k | N/A | web, email | 1200+ | 3 |
| 7 | Portfolio | Rebalancing tactique | 5 tickers | web, sms | 1000+ | 2 |
| 8 | Portfolio | Couverture de risque | N/A | web, email | 1100+ | 3 |
| 9 | Portfolio | Tendance vs Valeur | N/A | web, sms | 1200+ | 3 |
| 10 | Portfolio | Rotation sectorielle | N/A | web, email | 1300+ | 3 |
| 11 | Macro | Impact News (Fed cut) | N/A | web, sms | 1200+ | 3 |
| 12 | Macro | Cycle Fed | N/A | web, email | 1300+ | 3 |
| 13 | Macro | Election US | N/A | web, sms | 1300+ | 3 |
| 14 | Macro | Récession indicators | N/A | web, email | 1400+ | 3 |
| 15 | Macro | Tech earnings | MSFT, GOOGL, AAPL, META, NVDA | web, sms | 1200+ | 3 |
| 16 | Risques | Stress test -30% | 5 tickers | web, email | 1100+ | 4 |
| 17 | Risques | Taux ↑ 5% | N/A | web, sms | 1200+ | 3 |
| 18 | Risques | Inflation 5% | N/A | web, email | 1200+ | 3 |
| 19 | Risques | Tech disruption | N/A | web, sms | 1300+ | 3 |
| 20 | Risques | Géopolitique | N/A | web, email | 1300+ | 3 |
| 21 | CFA | DCF Valuation | MSFT | web, sms | 1400+ | 3 |
| 22 | CFA | ESG impact | N/A | web, email | 1400+ | 2 |
| 23 | CFA | Options hedging | MSFT | web, sms | 1200+ | 3 |
| 24 | CFA | M&A impacts | N/A | web, email | 1300+ | 3 |
| 25 | CFA | Comportement investisseur | N/A | web, sms | 1300+ | 2 |

---

## 📈 Evaluation Criteria (100 pts total)

```
[15 pts] Cohérence ──────────────┬─ YTD cohérent ✓
                                 ├─ Sources documentées ✓
                                 └─ Pas de contradictions ✓

[20 pts] Sophistication ─────────┬─ Concepts CFA (DCF, WACC, ROIC)
                                 ├─ Analyses multidimensionnelles
                                 ├─ Nuances et contexte
                                 └─ Professionnalisme

[15 pts] Longueur & Profondeur───┬─ 800+ mots pour analyses
                                 ├─ 3+ scénarios
                                 └─ Détail calculs/ratios

[10 pts] Mémoire Conversation ───└─ Rappel contexte

[15 pts] Valeur Ajoutée ────────┬─ Au-delà du factuel
                                 ├─ Points forts + faibles
                                 └─ Recommandations actionables

[15 pts] Couverture Scénarios ──┬─ Optimiste
                                 ├─ Pessimiste
                                 └─ Réaliste

[10 pts] Cohérence Multi-Canaux─└─ Substance identique web/SMS/email

     ═══════════════════════════════════════════════════════════
     TOTAL: 100 points
```

---

## 🎯 Success Metrics

### Global Target: 85+/100

| Score | Verdict | Action |
|-------|---------|--------|
| 90-100 | A - Excellent | ✅ Production ready |
| 80-89 | B - Bon | ⚠️ Minor fixes, puis deploy |
| 70-79 | C - Acceptable | 🔄 Improvements needed |
| 60-69 | D - Faible | 🔴 Major refactor |
| <60 | F - Échec | 🔴 Rethink approach |

### Per Category Targets:
- Cohérence: ≥ 13/15
- Sophistication: ≥ 16/20
- Longueur: ≥ 12/15
- Scénarios: ≥ 13/15
- Valeur ajoutée: ≥ 12/15

### Per Channel:
- Web: ≥ 85/100
- SMS: ≥ 80/100 (peut être plus bref)
- Email: ≥ 87/100 (peut être plus long)

---

## 📁 Output Files Location

After running tests, you'll find:

```
logs/emma_tests/
├── test_01.json          # Test 1 résultat complet
├── test_02.json          # Test 2 résultat complet
├── ...
├── test_25.json          # Test 25 résultat complet
└── results.json          # Résumé tous les 25 tests

EMMA_TEST_RESULTS.md      # Rapport généré automatiquement
EMMA_TEST_RESULTS_[timestamp].md  # Backup d'exécutions précédentes
```

---

## 🔍 Analysis After Tests

### Command: Voir scores par test
```bash
cat logs/emma_tests/results.json | jq '.results[] | {id, scenario, web: .channelResults.web.score, sms: .channelResults.sms.score}'
```

### Command: Moyenne par groupe
```bash
cat logs/emma_tests/results.json | jq '[.results[] | .channelResults.web.score] | add/length'
```

### Command: Trouver tests faibles
```bash
cat logs/emma_tests/results.json | jq '.results[] | select(.channelResults.web.score < 80) | .scenario'
```

### Command: Extract recommendations
```bash
grep -r "recommendation" logs/emma_tests/*.json
```

---

## 🛠️ Maintenance & Iteration

### After First Run:
1. Review EMMA_TEST_RESULTS.md
2. Identify < 80/100 tests
3. Create improvement backlog (by priority)
4. Implement fixes in emma-agent.js or prompts
5. Re-run affected tests

### Quarterly Re-testing:
```bash
# Run same tests quarterly to track progress
node test_emma_25_scenarios.js --output=EMMA_TEST_RESULTS_Q1_2025.md
# Compare vs previous quarter
```

---

## 📞 Getting Help

### If API errors:
1. Check: `curl http://localhost:3000/api/status`
2. Verify: `echo $PERPLEXITY_API_KEY` (should have value)
3. Restart: `npm run dev`
4. Test single call: `node test_emma_25_scenarios.js --scenarios=1 --verbose`

### If test hangs:
1. Check logs: `tail -f test_run.log`
2. Increase timeout: `timeout: 120000` in script (2 min)
3. Kill and restart: `pkill -f "test_emma"` then re-run

### If low scores:
1. Check coherence first (should be 14-15/15)
2. Then sophistication (should be 16-20/20)
3. Then length (most should be 12-15/15)
4. Debug per category based on what's failing

---

## 📚 Reference Documentation

- **CLAUDE.md**: Project overview & architecture
- **EMMA_FIXES_DEPLOYED.md**: Recent bug fixes (BUG #1 & #2)
- **EMMA_FEEDBACK_ANALYSIS.md**: Your feedback analysis & fixes
- **BUG_REPORT_EMMA_YTD_INCONSISTENCIES.md**: Detailed YTD issues

---

## 🎓 Expected Response Quality

### A-Grade Response Example (92/100)
```
✓ Cohérence: 15/15
✓ Sophistication: 18/20 (DCF, WACC, multiples détaillés)
✓ Longueur: 15/15 (1450 words)
✓ Scénarios: 15/15 (optimiste/pessimiste/réaliste)
✓ Valeur ajoutée: 14/15 (points forts+faibles, recommandation)

"MSFT affiche une valorisation premium justifiée par sa croissance cloud
et son intégration IA. DCF à 18% WACC suggère valeur de $295. D'un côté,
la croissance cloud (+30% YoY) soutient les multiples élevés (28x P/E).
De l'autre, la concentration clientèle et la concurrence cloud sont des risques.
Scénario optimiste: AI adoption accélère → $350. Pessimiste: tech slowdown → $250.
Réaliste: croissance modérée → $300. RECOMMANDATION: BUY < $290, HOLD $290-310."
```

### C-Grade Response Example (72/100)
```
⚠️ Cohérence: 11/15 (YTD inconsistent with prior data)
⚠️ Sophistication: 14/20 (mentionne P/E mais peu d'analyse)
⚠️ Longueur: 9/15 (650 words vs 1200+ attendus)
⚠️ Scénarios: 10/15 (2 scénarios mentionnés brièvement)
⚠️ Valeur ajoutée: 8/15 (pas de recommandation claire)

"MSFT est bon stock. P/E est 28x, c'est élevé. Croissance cloud est forte.
Risques incluent concurrence. Peut monter ou descendre selon marché."
```

---

## ✨ Final Checklist Before Launch

- [ ] Read EMMA_COMPREHENSIVE_TEST_PLAN.md (scenarios understood)
- [ ] Read EMMA_TESTING_QUICKSTART.md (feel confident)
- [ ] API ready: `curl http://localhost:3000/api/chat` returns 200
- [ ] logs/emma_tests/ directory created
- [ ] Node.js ≥ 16: `node --version`
- [ ] Have 45-60 min available OR run subset with `--scenarios=1,6,11,16,21`
- [ ] Ready to commit results to git

---

## 🚀 READY TO GO!

```
┌─────────────────────────────────────────────────────┐
│  LAUNCH EMMA COMPREHENSIVE TEST SUITE               │
│                                                     │
│  Command:                                           │
│  node test_emma_25_scenarios.js --verbose           │
│                                                     │
│  Expected: 25 tests, ~50 min, score ≥ 85/100       │
│  Output: logs/emma_tests/ + EMMA_TEST_RESULTS.md   │
└─────────────────────────────────────────────────────┘
```

**START**: `node test_emma_25_scenarios.js`

**MONITOR**: `tail -f test_run.log`

**ANALYZE**: `cat logs/emma_tests/results.json | jq`

Good luck! 🎯✨

