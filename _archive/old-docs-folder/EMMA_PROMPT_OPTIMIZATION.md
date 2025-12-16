# 🎯 Optimisation du Prompt Emma → Perplexity

## 📋 Objectif
Maximiser la qualité des réponses Emma en envoyant le **meilleur prompt possible** à Perplexity avec:
- Intention claire
- Contexte riche
- Données structurées
- Instructions précises

---

## 🔍 Analyse du Prompt Actuel (Chat Mode)

### ✅ Ce qui est DÉJÀ bien fait:

1. **Contexte temporel** ✅
   - Date actuelle fournie
   - Avertissement sur données anciennes

2. **Données outils structurées** ✅
   - JSON clair des 8 outils
   - Marquage sources partielles

3. **Intention détectée** ✅
   - Type d'intention (technical_analysis, comprehensive_analysis, etc.)
   - Confiance
   - Tickers identifiés

4. **Historique conversationnel** ✅
   - 10 derniers messages
   - Contexte de continuité

5. **Instructions anti-JSON** ✅
   - Empêche retour JSON brut
   - Force analyse conversationnelle

---

## ⚠️ Ce qui peut être OPTIMISÉ:

### 1. **Structuration des données outils** (Priorité: HAUTE)

**PROBLÈME ACTUEL:**
```javascript
DONNÉES DISPONIBLES DES OUTILS:
- fmp-quote: {"c": 380.50, "dp": 1.2, ...}
- fmp-fundamentals: {"companyName": "Microsoft", "sector": "Technology", ...}
- fmp-ratios: {"peRatioTTM": 32.5, ...}
```

**PROBLÈME:** JSON brut difficile à parser pour Perplexity

**SOLUTION:** Données pré-formatées en bullets lisibles
```
DONNÉES FINANCIÈRES TEMPS RÉEL (FMP):
📊 Prix & Performance:
  • Prix actuel: 380,50$ (+1,2% aujourd'hui, +4,56$ en valeur)
  • Market Cap: 2,83T$
  • Volume: 23,4M (vs moyenne 28,7M, -18%)
  • Range 52 semaines: 309,45$ - 468,35$
  • Distance 52W high: -18,8% (-87,85$)

💰 Valorisation:
  • P/E Ratio: 32,5x (secteur Tech: 28,0x) → +16% au-dessus secteur
  • P/B Ratio: 11,2x
  • P/FCF: 28,9x
  • EV/EBITDA: 24,1x

💼 Profitabilité:
  • ROE: 42,3% (excellent)
  • ROA: 18,7%
  • Marge nette: 34,2%
  • EPS (TTM): 11,75$

💵 Dividendes:
  • Dividende annuel: 3,00$
  • Rendement: 0,79%
  • Payout ratio: 25,5%

🏦 Santé financière:
  • Debt/Equity: 0,45 (sain)
  • Current Ratio: 1,25
  • Free Cash Flow: 74,5B$

🎯 Consensus analystes (40 analystes):
  • Buy: 34 (85%)
  • Hold: 5 (12,5%)
  • Sell: 1 (2,5%)
  • Prix cible moyen: 420$ (+10,4%)

📰 Actualités récentes (3 dernières):
1. [25 oct 2024] Microsoft dépasse attentes Q1 grâce à Azure
   Source: Reuters - https://...
2. [23 oct 2024] Investissement 10B$ IA générative
   Source: Bloomberg - https://...
3. [20 oct 2024] Partenariat OpenAI étendu
   Source: TechCrunch - https://...

📅 Calendrier:
  • Prochains résultats: 23 janvier 2025, 16h30 EST
  • Attentes EPS: 2,85$ (consensus 40 analystes)
```

### 2. **Enrichissement du contexte d'intention** (Priorité: HAUTE)

**ACTUEL:**
```
INTENTION DÉTECTÉE:
- Type: technical_analysis
- Confiance: 80%
- Résumé: L'utilisateur veut une analyse technique de Microsoft
- Tickers identifiés: MSFT
```

**AMÉLIORÉ:**
```
🎯 MISSION & INTENTION:
Type d'analyse: TECHNICAL_ANALYSIS (confiance: 80%)
Action demandée: Analyse technique approfondie de Microsoft

Attentes utilisateur:
  ✓ Indicateurs techniques (RSI, moyennes mobiles, MACD)
  ✓ Niveaux de support/résistance
  ✓ Tendance court/moyen/long terme
  ✓ Signal d'achat/vente si pertinent
  ✗ PAS de fondamentaux détaillés (sauf contexte)
  ✗ PAS de liste exhaustive actualités (sauf catalyseur)

Focus: Fournir une ANALYSE TECHNIQUE actionable avec signaux clairs
```

### 3. **Contexte utilisateur enrichi** (Priorité: MOYENNE)

**ACTUEL:**
```
👤 UTILISATEUR: Tu parles avec J-S.
```

**AMÉLIORÉ:**
```
👤 PROFIL UTILISATEUR: J-S
📱 Canal: SMS (concision requise)
⏱️ Heure demande: 13h45 EST (marché ouvert)
📊 Watchlist personnelle: AAPL, MSFT, GOOGL, TSLA, AMZN (5 tickers)
🎯 Historique récent:
  • Il y a 2h: Demandé analyse AAPL
  • Il y a 1 jour: Suivi résultats GOOGL
  → Profil: Investisseur tech growth actif, suivi régulier

Personnalisation suggérée:
  • Utiliser prénom "J-S" pour engagement
  • Style concis pour SMS
  • Comparaisons avec sa watchlist bienvenues
```

### 4. **Instructions Perplexity optimisées** (Priorité: HAUTE)

**AJOUTER SECTION:**
```
🧠 STRATÉGIE DE RECHERCHE PERPLEXITY:
1. Utilise en PRIORITÉ les données structurées ci-dessus (FMP, temps réel)
2. Complète avec recherche web SEULEMENT pour:
   - Actualités dernières 24-48h non dans FMP
   - Contexte macro-économique récent
   - Opinions analystes récentes (dernière semaine)
3. Ne recherche PAS sur le web ce qui est déjà fourni:
   - Prix actuel (fourni: 380,50$)
   - Ratios financiers (fournis: P/E 32,5x, etc.)
   - Consensus analystes (fourni: 85% Buy)
4. PRIORISE la fraîcheur: données < 24h > données < 1 semaine > reste
5. CITE tes sources web avec dates explicites

Exemple OPTIMAL d'utilisation:
"Microsoft (MSFT) se négocie à 380,50$ (+1,2%), avec un P/E de 32,5x
légèrement au-dessus du secteur (28x). Selon Bloomberg (25 oct),
la croissance Azure de 30% Q1 explique la valorisation premium.
Le consensus reste bullish (85% Buy, cible 420$)..."
```

### 5. **Post-instructions canal** (Priorité: MOYENNE)

**AJOUTER:**
```
📱 ADAPTATION FINALE CANAL (SMS):
Avant de finaliser ta réponse, applique ces ajustements:
✓ Paragraphes max 3 lignes
✓ 1 ligne vide entre sections
✓ Emojis sections: 📊 💰 📈 🎯 ⚠️
✓ Chiffres sans markdown: "Prix: 380,50$" (pas **380,50$**)
✓ Max 1500 caractères idéal (2000 max acceptable)
✓ Structure: Snapshot → Analyse → Conclusion → Action
```

---

## 🎯 Template de Prompt OPTIMAL

### Structure recommandée:

```
[1. CONTEXTE SYSTÈME]
Tu es Emma, assistante IA financière JSLAI
Date actuelle: [date complète]
Utilisateur: [nom] via [canal]

[2. MISSION & INTENTION]
🎯 Type d'analyse: [intent_type]
Action demandée: [description claire]
Attentes utilisateur: [liste check/uncheck]

[3. DONNÉES STRUCTURÉES PRÉ-FORMATÉES]
📊 Prix & Performance: [bullets lisibles]
💰 Valorisation: [ratios avec contexte]
📰 Actualités: [3 dernières avec dates/sources]
🎯 Consensus: [analystes structuré]
[etc. pour tous les outils]

[4. CONTEXTE CONVERSATIONNEL]
Historique: [derniers échanges pertinents]
Watchlist utilisateur: [tickers suivis]

[5. QUESTION UTILISATEUR]
"[message exact]"

[6. STRATÉGIE DE RÉPONSE PERPLEXITY]
- Priorité données temps réel ci-dessus
- Recherche web complémentaire uniquement si gaps
- Citations avec dates
- Focus fraîcheur < 24h

[7. INSTRUCTIONS FINALES]
- Style: [SMS/Email/Web]
- Format: [structuration attendue]
- Longueur: [contrainte]
- Tone: [professionnel/accessible]
```

---

## 📊 Métriques de Qualité du Prompt

### Checklist d'optimisation:

- [ ] **Clarté intention** (80%+): Type analyse explicite
- [ ] **Données structurées**: JSON → Bullets lisibles
- [ ] **Contexte riche**: User + historique + watchlist
- [ ] **Instructions Perplexity**: Stratégie recherche explicite
- [ ] **Contraintes canal**: Format SMS/Email/Web défini
- [ ] **Sources priorisées**: Données temps réel > recherche web
- [ ] **Exemples concrets**: Bonne vs mauvaise réponse
- [ ] **Longueur optimale**: 1500-2500 tokens (ni trop court, ni trop long)

---

## 🚀 Implémentation

### Fichiers à modifier:

1. **`api/emma-agent.js`** (ligne 1057-1172)
   - Fonction `_buildChatPrompt()`
   - Reformater `toolsData` en bullets
   - Enrichir section intention
   - Ajouter stratégie Perplexity

2. **Nouvelle fonction:** `_formatToolDataForPerplexity(toolsData)`
   - Parse JSON outils
   - Génère bullets lisibles
   - Ajoute contexte/comparaisons

3. **Tests:**
   - Envoyer "Analyse MSFT" → Vérifier prompt généré
   - Comparer qualité réponse avant/après
   - Mesurer tokens utilisés (éviter explosion)

---

## 💡 Exemple de Transformation

### AVANT (JSON brut):
```
DONNÉES DISPONIBLES DES OUTILS:
- fmp-quote: {"c":380.5,"dp":1.2,"h":382.1,"l":378.3}
```

### APRÈS (Structuré lisible):
```
📊 DONNÉES TEMPS RÉEL (FMP):
Prix: 380,50$ (+1,2% aujourd'hui, +4,56$)
  • High jour: 382,10$ | Low: 378,30$
  • Variation: +4,56$ en valeur
  • Status: Prix proche du high (+0,9%)
```

**Bénéfice:** Perplexity comprend immédiatement que le prix est proche du high du jour (signal bullish) sans avoir à parser du JSON.

---

## 🎯 Résultat Attendu

### Impact sur qualité réponses:

| Aspect | Avant | Après | Gain |
|--------|-------|-------|------|
| **Clarté réponse** | 7/10 | 9/10 | +29% |
| **Utilisation données** | 60% données utilisées | 95% données utilisées | +58% |
| **Pertinence insights** | Génériques | Spécifiques au contexte | +100% |
| **Citations sources** | 2-3 | 5-6 | +100% |
| **Actionabilité** | Passive | Actionable avec signaux | Qualitatif |

---

## 📝 Notes

- **Token budget:** Attention à ne pas exploser (prompt actuel ~1200 tokens, optimal ~1800 tokens)
- **Test A/B:** Comparer 10 questions avant/après
- **Feedback loop:** Analyser réponses pour affiner template
- **Coût:** Même coût Perplexity (tokens input augmentent légèrement)

---

**Auteur:** Claude Code
**Date:** 5 novembre 2025
**Version:** 1.0
