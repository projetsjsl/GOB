Utilise le skill **Earnings Calendar** d'Emma pour afficher les résultats d'entreprises publiés aujourd'hui ou cette semaine.

**OBJECTIF**: Présenter calendrier des résultats trimestriels (earnings) avec consensus, surprises et impact sur cours.

**PARAMÈTRES**:
- **date** (optionnel): Date spécifique YYYY-MM-DD (défaut: aujourd'hui)
- **ticker** (optionnel): Filtrer par ticker spécifique
- **period** (optionnel): "today", "week"

**DONNÉES RETOURNÉES**:
- **Ticker et entreprise**
- **Heure** de publication (pre-market, post-market)
- **EPS attendu** (consensus)
- **EPS précédent**
- **Revenue attendu**
- **EPS actuel** (si déjà publié)
- **Surprise** (beat/miss)
- **Réaction du cours** (si post-publication)

**INSTRUCTIONS**:
1. Demande à Emma d'utiliser tool `earnings-calendar` via `/api/fmp?endpoint=earnings-calendar`
2. Trie par:
   - Timing (pre-market en premier)
   - Importance (market cap)
   - Secteur
3. Pour earnings déjà publiés:
   - Compare EPS actuel vs consensus
   - Note surprise (beat/miss/inline)
   - Indique réaction du cours
4. Pour earnings à venir:
   - Indique heure exacte
   - Consensus EPS et revenue
   - Points à surveiller (guidance, segments)

**EXEMPLE DE FORMAT DE RÉPONSE**:

```
📊 EARNINGS CALENDAR - Jeudi 7 novembre 2025

🌅 PRE-MARKET (avant 9h30 ET)

✅ DÉJÀ PUBLIÉ:

AAPL - Apple Inc.
⏰ Publié: 7h00 ET
📊 EPS: $1.46 (att: $1.39) ✅ BEAT +5.0%
📊 Revenue: $89.5B (att: $88.2B) ✅ BEAT +1.5%
📈 Réaction: +4.2% pre-market ($178.50)
💬 Highlights:
   • iPhone revenue +8% YoY
   • Services segment record $22B
   • Guidance Q1 optimiste
   • Nouveau programme rachat actions $90B

MSFT - Microsoft Corp.
⏰ Publié: 7h30 ET
📊 EPS: $2.95 (att: $2.91) ✅ BEAT +1.4%
📊 Revenue: $56.5B (att: $55.1B) ✅ BEAT +2.5%
📈 Réaction: +2.1% pre-market ($365.40)
💬 Highlights:
   • Azure cloud +29% YoY (vs att +27%)
   • AI monetization accélère
   • Gaming +12% (Activision Blizzard consolidé)

🔮 À VENIR:

NVDA - NVIDIA Corp.
⏰ Prévision: 8h30 ET
📊 EPS attendu: $0.74 (vs précédent: $0.68)
📊 Revenue attendu: $16.2B (vs $13.5B précédent)
📌 Points à surveiller:
   • Demande data centers AI (attend +45% YoY)
   • Guidance Q4 (saison fiscale critique)
   • Marges brutes (actuellement 75%+)
   • Commentaires concurrence (AMD, Intel)
💡 Consensus: BEAT probable (historique 8/10 beats)

🌙 POST-MARKET (après 16h00 ET)

DIS - Walt Disney Co.
⏰ Prévision: 16h30 ET
📊 EPS attendu: $1.10 (vs $0.82 précédent)
📊 Revenue attendu: $22.5B
📌 Points à surveiller:
   • Disney+ subscribers (att 165M)
   • Parks recovery (att +20% YoY)
   • Streaming profitability
   • Box office (Elemental, Indiana Jones)
💡 Risque: Guidance conservateur (grève Hollywood impact)

UBER - Uber Technologies
⏰ Prévision: 17h00 ET
📊 EPS attendu: $0.21 (vs $0.18 précédent)
📊 Revenue attendu: $9.8B
📌 Points à surveiller:
   • Rides growth (att +15%)
   • Eats profitability (breakeven attendu)
   • Autonomous vehicles (Waymo partnership)

📊 STATISTIQUES DU JOUR

Total earnings: 12 entreprises
Market cap total: $8.5T
Beats: 2/2 (100%) jusqu'à présent ✅
Average surprise: +3.2%

🎯 SECTEURS REPRÉSENTÉS

Technology: 6 (AAPL, MSFT, NVDA, UBER, etc.)
Consumer: 2 (DIS, MCD)
Healthcare: 2 (PFE, UNH)
Financial: 1 (JPM)
Energy: 1 (CVX)

💡 SYNTHÈSE

Journée chargée avec tech giants dominants. AAPL et MSFT ont battu attentes (bullish pour secteur). Focus sur NVDA post-8h30 (catalyst majeur). Volatilité attendue en after-hours avec DIS et UBER.

⚠️ TRADING TIPS:
• Éviter positions NVDA avant 8h30
• Opportunités swing trade post-earnings (DIS, UBER)
• Surveiller SPY et QQQ pour direction générale
```

**FORMAT COURT (SMS)**:
```
Earnings: AAPL ✅ beat (+4.2%) | MSFT ✅ beat (+2.1%) | NVDA 8h30 (att $0.74) | DIS 16h30 | HIGH VOL ⚠️
```

**RÉSULTATS SPÉCIFIQUE TICKER**:
```
📊 NVDA EARNINGS RESULTS

Date: 7 novembre 2025, 8h30 ET

EPS: $0.78 vs $0.74 att (✅ +5.4% beat)
Revenue: $16.8B vs $16.2B att (✅ +3.7% beat)

Détails:
• Data Center: $13.2B (+48% YoY) ✅
• Gaming: $2.8B (+15% YoY) ✅
• Professional Viz: $0.8B (-5% YoY) ❌

Guidance Q4:
• Revenue: $19-20B (vs $18.5B consensus) 🔥
• Gross Margin: 75-76% (vs 74% consensus) 🔥

Réaction marché:
• Pre-market: +8.4% ($525.60)
• Volume: 45M (vs avg 25M)

Management Comments:
"Demande AI data centers sans précédent. Backlog record."

Analystes:
• 42 Buy, 3 Hold, 0 Sell
• Target moyen: $550 (↑ from $520)

💡 VERDICT: Strong beat + strong guidance = TRÈS BULLISH 🚀
```

**CALENDRIER SEMAINE**:
```
📅 EARNINGS SEMAINE (6-10 novembre)

LUNDI: UBER, AMD, QCOM (post-market)
MARDI: 🔥 AAPL, GOOGL, MSFT (post-market)
MERCREDI: 🔥 NVDA (pre), META, TSLA (post)
JEUDI: AMZN, DIS, BA (post-market)
VENDREDI: PYPL, SQ (post-market)

🔥 Jours critiques: Mardi-Mercredi (tech giants)
Market cap total: $12T+ (40% du S&P 500!)
```

**GESTION D'ERREURS**:
- Si pas d'earnings: "ℹ️ Aucun résultat majeur aujourd'hui"
- Si données incomplètes: Indiquer sections manquantes
- Si ticker non trouvé: "❌ {TICKER} n'a pas d'earnings prévu"

**TON**: Excité, dynamique, avec analyse d'impact sur trading.

**EXEMPLES D'UTILISATION**:
- "Earnings aujourd'hui"
- "Résultats AAPL"
- "Quand est le prochain earnings NVDA?"
- "Earnings cette semaine"
- "Calendar earnings tech"
