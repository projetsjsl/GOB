# ⚡ LAUNCH EMMA TESTS NOW! 

## 🎯 En 30 secondes, teste Emma en direct

### Prérequis (Vérifier):
```bash
# 1. Emma API doit tourner
npm run dev
# Doit afficher: "Server running on http://localhost:3000"

# 2. Vérifier endpoint accessible
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Test","userId":"test","channel":"web"}'

# Doit retourner: {success: true, response: "..."}
```

---

## 🚀 LANCER LES TESTS MAINTENANT

### Option 1: Tests Rapides (10 tests = 5-10 min)
```bash
# Faire 10 appels RÉELS à Emma et récupérer réponses
node test_emma_live_now.js

# Outputs en temps réel:
# [1/10] MSFT Analyse Fondamentale (web)
# 📤 Envoi à Emma...
# ✅ Réponse reçue (1500 chars)
# [réponse complète affichée]
# 📊 Évaluation: Score 92/100 (A)
# ...
# [2/10] Comparaison 3 Techs...
# ... [continue]
#
# 📊 SUMMARY
# Succès: 10/10 ✓
# Score Moyen: 87.5/100
```

### Option 2: Test Unique (1 test = 2-3 min)
```bash
# Tester MSFT seul avant tout
node test_emma_live_now.js | head -100

# Verify API responsive avant full run
```

---

## 📊 Ce que tu vas voir

### En temps réel (par test):
```
[1/10] MSFT Analyse Fondamentale (web)
────────────────────────────────────────────────────────────────────────────
📤 Envoi à Emma...
   → URL: http://localhost:3000/api/chat
   → Channel: web
   → Message length: 284 chars
   → Response Status: 200

✅ Réponse reçue (1547 chars, 287 words)
────────────────────────────────────────────────────────────────────────────
Microsoft affiche une valorisation premium justifiée par sa croissance cloud 
robuste et son intégration IA-powered. Au 6 novembre 2025, le titre se négocie 
à 247,82$, marquant une performance YTD de -15% versus le S&P500 qui affiche 
+8%.

📊 VALORISATION:
Microsoft affiche un ratio P/E de 20,1x, légèrement sous la moyenne du secteur 
IT Services (24x). Le ratio P/FCF de 13,4x reste dans la norme. La capitalisation 
boursière s'élève à 154,9G$.

💰 RENTABILITÉ:
La forte profitabilité du groupe ressort avec un ROE de 25,6% très supérieur au 
secteur (18%). La marge nette atteint 11%.
... [tronqué]
────────────────────────────────────────────────────────────────────────────

📊 Évaluation:
   Longueur: 15/15 (1547 chars vs 800+ attendus) ✓
   Cohérence: 14/15 (données cohérentes)
   Sophistication: 18/20 (concepts CFA présents)
   Scénarios: 15/15 (3 scénarios détaillés)
   Valeur Ajoutée: 14/15 (recommandation + points faibles)
   📈 SCORE: 92/100 (A)
```

### Résumé final:
```
════════════════════════════════════════════════════════════════════════════

📊 SUMMARY
────────────────────────────────────────────────────────────────────────────
Succès: 10/10 ✓
Erreurs: 0/10 ❌
Durée: 47.3s

Score Moyen: 87.5/100
Longueur Moyenne: 1243 chars (249 words)

✅ Résultats sauvegardés dans: ./logs/emma_live_tests
📄 Rapport généré: ./logs/emma_live_tests/EMMA_LIVE_TEST_REPORT.md
```

---

## 📁 Fichiers Générés

Après les tests, dans `logs/emma_live_tests/`:
```
├── live_test_01.json      # Test 1 complet (réponse + évaluation)
├── live_test_02.json      # Test 2 complet
├── ...
├── live_test_10.json      # Test 10 complet
├── live_results_summary.json    # Résumé tous les tests
└── EMMA_LIVE_TEST_REPORT.md     # Rapport markdown
```

### Voir les réponses:
```bash
# Voir réponse test 1
cat logs/emma_live_tests/live_test_01.json | jq '.full_response' | less

# Voir tous les scores
cat logs/emma_live_tests/live_results_summary.json | jq '.results[] | {id: .id, name: .name, score: .evaluation.total}'

# Voir réponses brèves
cat logs/emma_live_tests/EMMA_LIVE_TEST_REPORT.md | head -200
```

---

## ✨ 10 Tests Inclus

| # | Nom | Channel | Focus | Expected |
|----|-----|---------|-------|----------|
| 1 | MSFT Analyse | web | Fondamentaux | 1000+ w |
| 2 | 3 Techs Comparaison | web | Comparaison | 1200+ w |
| 3 | TD Défensif | sms | Dividende | Court |
| 4 | Allocation 100k | web | Portfolio | 1200+ w |
| 5 | Fed Cut Impact | web | Macro | 1200+ w |
| 6 | Récession Check | sms | Indicators | Court |
| 7 | DCF MSFT | web | CFA - Modeling | 1400+ w |
| 8 | ESG Real? | web | CFA - Research | 1400+ w |
| 9 | Options Hedging | web | CFA - Derivatives | 1300+ w |
| 10 | Tech Disruption | web | Risques | 1300+ w |

---

## 🎯 Success Criteria

✅ **SUCCESS**: Si tu vois:
- [✓] 10/10 tests retournent réponses
- [✓] Réponses longues (1000+ chars généralement)
- [✓] Scores ≥ 80/100 (B ou mieux)
- [✓] Concepts CFA mentionnés (DCF, WACC, ROE, etc.)
- [✓] Scénarios explorés (optimiste/pessimiste/réaliste)

⚠️ **WARNING**: Si tu vois:
- [!] Scores 70-79/100 (C - améliorations à faire)
- [!] Réponses courtes (<800 chars)
- [!] Peu de scénarios (0-1 au lieu de 3)
- [!] Données incohérentes (YTD conflictuel)

❌ **FAILURE**: Si tu vois:
- [✗] API errors / timeouts
- [✗] Scores < 70/100 (D/F)
- [✗] Pas de concepts CFA
- [✗] Réponses génériques/surface-level

---

## 🔧 Troubleshooting

### Erreur: "Cannot reach API"
```bash
# Verify API is running
npm run dev

# Verify endpoint
curl http://localhost:3000/api/status

# Check firewall/localhost
curl -v http://localhost:3000/api/chat
```

### Erreur: "Timeout after 120s"
```bash
# Emma prend trop de temps (Perplexity slow)
# Options:
# 1. Attendre, essayer de nouveau
# 2. Vérifier PERPLEXITY_API_KEY: echo $PERPLEXITY_API_KEY
# 3. Augmenter timeout dans script (ligne 250): timeout: 240000
```

### Erreur: "No such file or directory"
```bash
# Créer logs directory
mkdir -p logs/emma_live_tests

# Relancer
node test_emma_live_now.js
```

### Erreur: "require is not defined"
```bash
# Node version issue - upgrade Node
nvm install 18
nvm use 18

# Relancer
node test_emma_live_now.js
```

---

## 📊 Interprétation Résultats

### Scores par Catégorie:

```
Longueur (15 pts):
  15/15: ✓ Excellent (1200+ chars)
  12-14: ✓ Bon (800-1200 chars)
  9-11: ⚠️ Acceptable (600-800 chars)
  <9: ❌ Trop court

Cohérence (15 pts):
  14-15: ✓ Excellent (pas de contradictions)
  12-13: ✓ Bon (petites inconsistances)
  10-11: ⚠️ Acceptable (quelques problèmes YTD)
  <10: ❌ Très incohérent

Sophistication (20 pts):
  18-20: ✓ Excellent (5+ concepts CFA)
  15-17: ✓ Bon (3-4 concepts CFA)
  12-14: ⚠️ Acceptable (1-2 concepts CFA)
  <12: ❌ Peu de sophistication

Scénarios (15 pts):
  15/15: ✓ Excellent (3 scénarios détaillés)
  10-14: ✓ Bon (2-3 scénarios)
  5-9: ⚠️ Acceptable (1-2 scénarios)
  <5: ❌ Manquent scénarios

Valeur Ajoutée (15 pts):
  14-15: ✓ Excellent (recommandations + faibles points)
  11-13: ✓ Bon (recommandations ou faibles points)
  8-10: ⚠️ Acceptable (peu de recommandations)
  <8: ❌ Juste des faits
```

### Score Global:
```
90-100: A - Excellent, production ready ✓
80-89: B - Bon, minor fixes  
70-79: C - Acceptable, improvements needed ⚠️
60-69: D - Faible, major refactor 🔴
<60: F - Échec, rethink approach 🔴
```

---

## 📈 After Tests: Next Steps

### 1. Review Results (2 min)
```bash
cat logs/emma_live_tests/EMMA_LIVE_TEST_REPORT.md
```

### 2. Extract Scores (1 min)
```bash
cat logs/emma_live_tests/live_results_summary.json | jq '.results[] | {name: .name, score: .evaluation.total}'
```

### 3. Identify Issues (5 min)
```bash
# Find low-scoring tests
cat logs/emma_live_tests/live_results_summary.json | jq '.results[] | select(.evaluation.total < 80)'

# Find what's missing
cat logs/emma_live_tests/live_test_*.json | jq '.evaluation' | grep -E '"score|"grade'
```

### 4. Create Improvements (10 min)
Based on low scores, create improvements:
- If longueur low: Increase max_tokens in emma-agent
- If sophistication low: Add CFA concepts to prompts
- If scénarios low: Explicitly ask for 3 scenarios
- If cohérence low: Use YTD validator (already implemented!)

### 5. Re-test (10 min)
```bash
# Re-run same 10 tests to verify improvements
node test_emma_live_now.js
```

---

## 🎓 What You'll Learn from Tests

✅ **Longueur Réponses**: Emma génère-t-elle suffisamment de détail?
✅ **Cohérence Données**: YTD et ratios cohérents? (Bug #2 déjà fixé)
✅ **Sophistication CFA**: Utilise-t-elle concepts institutionnels?
✅ **Scénarios**: Explore-t-elle 3 scénarios systématiquement?
✅ **Valeur Ajoutée**: Identifie-t-elle points forts ET faibles?
✅ **Multi-canal**: SMS aussi bon que web/email?

---

## 💡 Pro Tips

### Run in Background
```bash
# Si tu ne veux pas attendre
nohup node test_emma_live_now.js > emma_test.log 2>&1 &

# Monitor progress
tail -f emma_test.log
```

### Redirect to File
```bash
# Sauvegarder output complet
node test_emma_live_now.js | tee emma_live_run_$(date +%s).log
```

### Compare Runs
```bash
# Comparer deux exécutions
diff logs/emma_live_tests_run1/live_results_summary.json \
     logs/emma_live_tests_run2/live_results_summary.json
```

---

## ✨ Expected Output Preview

Si tout fonctionne, tu vas voir:

```
🚀 EMMA LIVE TEST - 10 Appels Immédiats

API Base: http://localhost:3000
Log Directory: ./logs/emma_live_tests

════════════════════════════════════════════════════════════════════════════

[1/10] MSFT Analyse Fondamentale (web)
────────────────────────────────────────────────────────────────────────────
📤 Envoi à Emma...
   → URL: http://localhost:3000/api/chat
   → Channel: web
   → Message length: 284 chars
   → Response Status: 200

✅ Réponse reçue (1547 chars, 287 words)
────────────────────────────────────────────────────────────────────────────
Microsoft affiche une valorisation premium justifiée par sa croissance cloud...
[réponse complète]
────────────────────────────────────────────────────────────────────────────

📊 Évaluation:
   Longueur: 15/15 (1547 chars vs 800+ attendus) ✓
   Cohérence: 14/15
   Sophistication: 18/20
   Scénarios: 15/15
   Valeur Ajoutée: 14/15
   📈 SCORE: 92/100 (A)

[continues for 10 tests...]

════════════════════════════════════════════════════════════════════════════

📊 SUMMARY
────────────────────────────────────────────────────────────────────────────
Succès: 10/10 ✓
Erreurs: 0/10 ❌
Durée: 47.3s

Score Moyen: 87.5/100
Longueur Moyenne: 1243 chars

✅ Résultats sauvegardés dans: ./logs/emma_live_tests
📄 Rapport généré: ./logs/emma_live_tests/EMMA_LIVE_TEST_REPORT.md
```

---

## 🎯 READY TO LAUNCH?

```bash
# ✅ Final Checklist:
# [ ] API running: npm run dev
# [ ] API responsive: curl http://localhost:3000/api/chat
# [ ] logs directory exists: mkdir -p logs/emma_live_tests
# [ ] You have 5-10 minutes available
# [ ] Ready to see Emma's actual responses

# 🚀 LAUNCH COMMAND:
node test_emma_live_now.js
```

---

**START NOW!** 🚀

```bash
node test_emma_live_now.js
```

This will:
1. ✅ Make 10 REAL API calls to Emma
2. ✅ Execute her full process (Perplexity, tools, etc.)
3. ✅ Retrieve actual responses
4. ✅ Evaluate quality (score 0-100)
5. ✅ Save results + generate report
6. ✅ Show everything in real-time

**Expected Time**: 5-10 minutes for 10 tests

**Expected Score**: 85+/100 if Emma is excellent ✓

**GO!** 🎯

