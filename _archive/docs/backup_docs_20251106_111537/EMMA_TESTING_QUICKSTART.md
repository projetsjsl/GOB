# ⚡ Quick Start: Emma 25 Tests - 5 Minutes

## TL;DR - Lancer les tests maintenant

```bash
# 1. Préparer
mkdir -p logs/emma_tests

# 2. Valider API
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Test","userId":"test1","channel":"web"}' | jq .success

# 3. Lancer test 1 (test rapide)
node test_emma_25_scenarios.js --scenarios=1 --verbose

# 4. Lancer tous les 25
node test_emma_25_scenarios.js

# 5. Analyser résultats
cat logs/emma_tests/results.json | jq '.results[] | {id, scenario, score}'
```

---

## Les 25 Scénarios en 30 Secondes

### Groupe 1: Analyses Fondamentales (5 tests)
1. **MSFT Complet** - DCF, ratios, 3 scénarios
2. **Comparaison Tech** - GOOGL vs MSFT vs AAPL
3. **TD Défensif** - Stock dividende sûr?
4. **SU Cyclique** - Pétrole sensibilité
5. **NVDA Cher?** - Valuation vs croissance AI

### Groupe 2: Portfolio Strategy (5 tests)
6. **Allocation 100k** - 3 profils (agressif/modéré/conservateur)
7. **Rebalancing** - Vendre/acheter quoi?
8. **Hedge Risque** - Couverture -20% correction
9. **Momentum vs Valeur** - Qui gagne 2025?
10. **Rotation Secteurs** - Quels secteurs maintenant?

### Groupe 3: Macro & Actualité (5 tests)
11. **Impact News** - Fed cut surprise → marchés?
12. **Cycle Fed** - Quand cut? Quel impact?
13. **Election US** - Dems vs GOP → stocks?
14. **Récession?** - Indicateurs d'alerte
15. **Tech Earnings** - Priced in?

### Groupe 4: Risques & Scenarios (5 tests)
16. **Stress Test** - Portefeuille -30%?
17. **Taux ↑ 5%** - Quel impact obligations/actions?
18. **Inflation 5%** - Défenses?
19. **Tech Disruption** - AI vs Quantum vs Biotech?
20. **Géopolitique** - US-China conflict?

### Groupe 5: CFA Institutionnel (5 tests)
21. **DCF Modeling** - Valuation MSFT complète
22. **ESG Impact** - Corrélation outperformance?
23. **Options Hedging** - Puts sur MSFT: rentable?
24. **M&A Impact** - Acquisition → stock?
25. **Behavior Finance** - Pourquoi panic-sell?

---

## Grille Évaluation Résumée (100 pts)

```
Cohérence (15 pts) ────────────── YTD cohérent, sources OK, pas de contradictions
Sophistication (20 pts) ───────── Concepts CFA, multi-angle, nuancé
Longueur (15 pts) ──────────────── 800+ mots, détaillé
Scénarios (15 pts) ───────────────3 scénarios (optimiste/pessimiste/réaliste)
Valeur Ajoutée (15 pts) ───────── Points forts+faibles, recommandations
Mémoire Conv. (10 pts) ────────── Rappel contexte
Multi-Canaux (10 pts) ─────────── Substance identique web/SMS/email
                      ════════════════════════════════════════════════════
                      TOTAL: 100 pts
```

---

## Expected Outcomes

### Si Emma Score 85+ → Production Ready ✅
- Cohérence excellente, données fiables
- Sophistication CFA-level, analyses multidimensionnelles
- Longueur appropriée, 3+ scénarios systématiques
- Valeur ajoutée élevée (points faibles aussi)

### Si Emma Score 75-84 → Minor Fixes ⚠️
- Quelques incohérences YTD
- Scénarios parfois manquants/superficiels
- Longueur acceptable mais peut être plus détaillée
- Valeur ajoutée présente mais incomplete

### Si Emma Score <75 → Major Refactor 🔴
- Problèmes données, données conflictuelles
- Analyses surface-level, peu de concepts CFA
- Trop court, scénarios manquants
- Pas de recommandations claires

---

## 3 Ways to Run Tests

### Way 1: Tout (45-60 min)
```bash
node test_emma_25_scenarios.js
```

### Way 2: Par Groupe (10-15 min)
```bash
# Juste analyses fondamentales
node test_emma_25_scenarios.js --group="Analyses Fondamentales"

# Juste portfolio strategy
node test_emma_25_scenarios.js --group="Stratégie Portfolio"

# Juste CFA questions
node test_emma_25_scenarios.js --group="Questions CFA"
```

### Way 3: Spécifique (5-10 min)
```bash
# Test 1 + 5 + 21
node test_emma_25_scenarios.js --scenarios=1,5,21

# Un seul channel (web uniquement)
node test_emma_25_scenarios.js --channel=web

# Combiné
node test_emma_25_scenarios.js --group="CFA" --channel=web --verbose
```

---

## Reading Results

### Test Output Real-Time
```
[1/25] Analyse complète tech (MSFT)
─────────────────────────────────────────────────
  → Testing via web...
  ✓ web: Score 92/100 (A)
  → Testing via sms...
  ✓ sms: Score 88/100 (B+)

[2/25] Comparaison sectorielle...
```

### After Tests: logs/emma_tests/results.json
```json
{
  "results": [
    {
      "id": 1,
      "scenario": "Analyse complète tech",
      "channelResults": {
        "web": {
          "success": true,
          "response": "...",
          "score": 92,
          "grade": "A"
        },
        "sms": {
          "success": true,
          "response": "...",
          "score": 88,
          "grade": "B"
        }
      }
    }
  ]
}
```

### Extract Scores Only
```bash
cat logs/emma_tests/results.json | jq '.results[] | "\(.id). \(.scenario): \(.channelResults.web.score)/100"'

# Output:
# 1. Analyse complète tech: 92/100
# 2. Comparaison sectorielle: 85/100
# ...
```

### Find All "A" Grades
```bash
grep -r '"grade":"A"' logs/emma_tests/
```

---

## Common Commands

### Check if API is ready
```bash
curl http://localhost:3000/api/status

# Expected: 200 OK with status info
```

### Run in background
```bash
nohup node test_emma_25_scenarios.js > test_run.log 2>&1 &
tail -f test_run.log
```

### Run specific test only
```bash
node test_emma_25_scenarios.js --scenarios=21 --verbose

# Test 21 = DCF Valuation (complex CFA analysis)
```

### Compare two test runs
```bash
diff logs/emma_tests_v1/results.json logs/emma_tests_v2/results.json
```

---

## Optimization Tips

### To Increase Longueur Scores (15 pts)
- Ensure Emma gets expectedLength param
- Prompts must ask for 800+ words explicitly
- Add "Longueur: 1200+ mots" to messages

### To Increase Sophistication (20 pts)
- Emma prompts must include CFA concepts
- Ask for DCF, WACC, ROIC, multiples
- Force nuance with "d'un côté... d'un autre côté"

### To Increase Scenario Scores (15 pts)
- Always ask for 3 explicit scenarios
- Label them: "optimiste", "pessimiste", "réaliste"
- Require quantitative differences

### To Increase Valeur Ajoutée (15 pts)
- Ask for both strengths AND weaknesses
- Require specific recommendations
- Force action items

---

## Monitoring During Tests

### In another terminal
```bash
# Watch file size grow
watch -n 1 'du -sh logs/emma_tests/'

# Watch new files
watch 'ls -lrt logs/emma_tests/*.json | tail -5'

# Count successes
watch 'grep -c "success.*true" logs/emma_tests/test_*.json'
```

---

## Troubleshooting Quick Fixes

| Issue | Fix |
|-------|-----|
| "API timeout" | Increase timeout in script (60s → 120s) |
| "Cannot find module" | `npm install` |
| "Permission denied" | `chmod +x test_emma_25_scenarios.js` |
| "ENOENT logs/" | `mkdir -p logs/emma_tests` |
| "SMS failed" | Use `--channel=web` only if SMS not ready |
| "No results" | Check API: `curl http://localhost:3000/api/chat` |

---

## Success Checklist

Before running:
- [ ] API running (`npm run dev`)
- [ ] No API errors (`curl /api/status`)
- [ ] logs/ directory exists
- [ ] Node.js ≥ 16 (`node --version`)
- [ ] Have 45-60 minutes available

After running:
- [ ] results.json created
- [ ] 25 test files in logs/emma_tests/
- [ ] EMMA_TEST_RESULTS.md generated
- [ ] Average score ≥ 75/100
- [ ] No critical failures

---

## Next: Analyze Results

After tests complete:
```bash
# 1. Review summary
cat logs/emma_tests/results.json | jq '.total_tests, .passed, .failed'

# 2. Extract averages
node analyze_emma_results.js

# 3. Find weak points
cat logs/emma_tests/results.json | jq '.results[] | select(.channelResults.web.score < 75) | .scenario'

# 4. Create improvement roadmap
node generate_improvements.js --input=logs/emma_tests/results.json
```

---

## 🎯 Your Mission

```
┌─────────────────────────────────────────────────────────┐
│  EXECUTE:                                               │
│  1. node test_emma_25_scenarios.js                      │
│  2. Wait 45-60 minutes                                  │
│  3. Review logs/emma_tests/results.json                 │
│  4. Share score with team                               │
│  5. Create improvement backlog                          │
│                                                         │
│  SUCCESS: Score ≥ 85/100                               │
│  GOOD: Score ≥ 75/100                                  │
│  ACTION: Score < 75/100                                │
└─────────────────────────────────────────────────────────┘
```

**GO!** 🚀

```bash
node test_emma_25_scenarios.js --verbose | tee test_results_$(date +%s).log
```

