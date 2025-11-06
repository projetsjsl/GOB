# 🚀 START HERE - Emma Testing

Tu veux tester Emma MAINTENANT et voir comment elle répond? C'est ici!

---

## 3 Options (Choisis une):

### Option A: Tests Rapides MAINTENANT (10 tests = 5-10 min) ⚡
```bash
node test_emma_live_now.js
```
**Le plus important**: Voir Emma répondre en direct et obtenir scores 0-100

### Option B: Plan Complet des 25 Tests (Lire d'abord)
Lire: `EMMA_TESTING_QUICKSTART.md`

Puis:
```bash
node test_emma_25_scenarios.js --scenarios=1,6,11,16,21  # Sample
# ou
node test_emma_25_scenarios.js  # Tous les 25 (~50 min)
```

### Option C: Comprendre Tout (Deep Dive)
1. Lire: `EMMA_TESTING_INDEX.md` (overview complet)
2. Lire: `EMMA_COMPREHENSIVE_TEST_PLAN.md` (25 scénarios détaillés)
3. Lire: `EMMA_TEST_EXECUTION_GUIDE.md` (guide complet)
4. Puis exécuter tests

---

## 🎯 Recommended Path (Pour commencer):

### Étape 1: Prérequis (1 min)
```bash
# 1. Ensure Emma API runs
npm run dev

# 2. Verify it's accessible
curl http://localhost:3000/api/chat -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"test","userId":"u1","channel":"web"}'

# Must return: {"success":true, "response":"..."}
```

### Étape 2: Launch Tests (5-10 min)
```bash
# Run 10 quick tests with real Emma responses
node test_emma_live_now.js

# Watch output in real-time
# You'll see Emma's actual responses scored 0-100
```

### Étape 3: Review Results (5 min)
```bash
# See scores
cat logs/emma_live_tests/live_results_summary.json | jq '.results[] | {name, score: .evaluation.total}'

# See report
cat logs/emma_live_tests/EMMA_LIVE_TEST_REPORT.md
```

### Étape 4: Decide (5 min)
- **Score ≥ 85**: Emma is excellent ✓ (Production ready)
- **Score 75-84**: Emma is good but needs minor improvements
- **Score <75**: Emma needs work

---

## 📊 What You'll Get

After `node test_emma_live_now.js` runs:

```
✅ Emma will:
   - Receive 10 complex questions
   - Execute full process (Perplexity, FMP APIs, etc.)
   - Return real responses (not simulated)
   - Get scored 0-100 per response

📁 Files created:
   - logs/emma_live_tests/live_test_01.json (response 1)
   - logs/emma_live_tests/live_test_02.json (response 2)
   - ...
   - logs/emma_live_tests/EMMA_LIVE_TEST_REPORT.md (summary report)

📊 Metrics calculated:
   - Longueur: Is Emma verbose enough?
   - Cohérence: Are data points consistent?
   - Sophistication: Does she use CFA concepts?
   - Scénarios: Does she explore multiple scenarios?
   - Valeur Ajoutée: Does she add opinion + risks?
   - Score: 0-100 per response (A/B/C/D/F grade)
```

---

## ✨ Quick Preview

Running the tests, you'll see LIVE OUTPUT like:

```
[1/10] MSFT Analyse Fondamentale (web)
────────────────────────────────────────
📤 Envoi à Emma...
✅ Réponse reçue (1547 chars)

[Emma's actual response displayed here - 1000+ words]

📊 Évaluation:
   Longueur: 15/15 ✓
   Cohérence: 14/15
   Sophistication: 18/20
   Scénarios: 15/15
   Valeur Ajoutée: 14/15
   📈 SCORE: 92/100 (A)

[Repeat for 10 tests...]

📊 SUMMARY:
   Succès: 10/10
   Score Moyen: 87.5/100
```

---

## 🎓 What These Tests Measure

✅ **Longueur** (15 pts): Are responses detailed enough? (800+ words)
✅ **Cohérence** (15 pts): Are YTD/ratios consistent? (BUG #2 FIXED!)
✅ **Sophistication** (20 pts): Does she use DCF, WACC, ROIC, etc.? (CFA-level)
✅ **Scénarios** (15 pts): Does she explore 3 scenarios? (optimiste/pessimiste/réaliste)
✅ **Valeur Ajoutée** (15 pts): Points forts + faibles + recommandations?
✅ **Mémoire** (10 pts): Remember prior context?
✅ **Multi-Canaux** (10 pts): Same quality on web/SMS/email?

**TOTAL: 100 points** → Grade A-F

---

## 📋 The 10 Quick Tests

```
Test 1: MSFT Analyse (web) - Fondamentaux complets
Test 2: 3 Techs Comparaison (web) - Comparative analysis
Test 3: TD Défensif (sms) - Defensive stock
Test 4: Allocation 100k (web) - Portfolio allocation
Test 5: Fed Cut (web) - Macro impact
Test 6: Récession Check (sms) - Risk indicators
Test 7: DCF MSFT (web) - CFA modeling
Test 8: ESG Real? (web) - Research skills
Test 9: Options Hedging (web) - Derivatives
Test 10: Tech Disruption (web) - Risk analysis
```

Each tests a different aspect of Emma's capabilities.

---

## ⏱️ Time Estimate

```
Prérequis:      1 minute
Tests:          5-10 minutes
Review:         5 minutes
═════════════════════════════
Total:          10-15 minutes
```

---

## 🔧 Troubleshooting

| Problem | Fix |
|---------|-----|
| "API not reachable" | Run `npm run dev` first |
| "Timeout" | API is slow - increase timeout or try again |
| "No results" | Check logs/emma_live_tests/ directory |
| "Module not found" | Run `npm install` |

---

## 🚀 Ready?

### Just run this:

```bash
node test_emma_live_now.js
```

That's it! You'll get:
- 10 real Emma responses
- Automatic evaluation (0-100 score each)
- Overall report
- Actionable insights

---

## 📚 After Tests: Learn More

If you want details:
- **Quick overview**: EMMA_TESTING_QUICKSTART.md
- **All 25 tests**: EMMA_COMPREHENSIVE_TEST_PLAN.md
- **Complete guide**: EMMA_TEST_EXECUTION_GUIDE.md
- **Master index**: EMMA_TESTING_INDEX.md

---

## 🎯 Goal

Get Emma tested, scored, and improved. That's it!

**Let's go!** 🚀

```bash
node test_emma_live_now.js
```

