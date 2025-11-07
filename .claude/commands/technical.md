Utilise le skill **Analyse Technique** d'Emma pour analyser les indicateurs techniques d'une action.

**OBJECTIF**: Analyser RSI, MACD, moyennes mobiles et fournir signaux d'achat/vente basés sur analyse technique.

**PARAMÈTRES**:
- **ticker** (requis): Symbole de l'action

**INDICATEURS ANALYSÉS**:
- **RSI(14)**: Relative Strength Index (survente/surachat)
- **MACD**: Momentum et divergences
- **SMA**: Moyennes mobiles (20, 50, 200 jours)
- **EMA**: Moyennes exponentielles (20 jours)
- **Volume**: Comparaison vs moyenne 3 mois
- **Support/Résistance**: Niveaux clés estimés

**INSTRUCTIONS**:
1. Demande à Emma d'utiliser le tool `twelve-data-technical` via API Twelve Data
2. Si Twelve Data échoue, utilise fallback FMP
3. Récupère également prix actuel via `fmp-quote` pour contexte
4. Calcule tous les indicateurs en parallèle
5. Identifie:
   - Tendance court terme (< 20 jours)
   - Tendance moyen terme (50-200 jours)
   - Signal global (BUY/HOLD/SELL/WAIT)
   - Points d'attention
6. Donne conseil actionnable avec avertissement

**EXEMPLE DE FORMAT DE RÉPONSE**:

```
📈 ANALYSE TECHNIQUE: AAPL (Apple Inc.)
Prix actuel: $178.50 (+2.1% aujourd'hui)

📊 INDICATEURS TECHNIQUES

RSI(14): 58
Zone saine (30-70) ✅
Signal: Neutre, légèrement favorable

MACD:
• Ligne MACD: +1.25
• Ligne Signal: +0.85
• Histogramme: +0.40 (croissant)
Signal: Momentum haussier 📈

MOYENNES MOBILES:
• SMA 20: $175.20 (prix +1.9% au-dessus)
• SMA 50: $172.80 (prix +3.3% au-dessus)
• SMA 200: $165.40 (prix +7.9% au-dessus)
• EMA 20: $176.10

Croisements: NEUTRE (pas de croisement récent)

🎯 NIVEAUX CLÉS

Résistances:
• R1: $182.00 (high 52 semaines)
• R2: $185.00 (extension Fibonacci)

Supports:
• S1: $175.00 (low récent)
• S2: $172.80 (SMA 50)
• S3: $165.40 (SMA 200 - support majeur)

📊 VOLUME

Volume aujourd'hui: 58.2M actions
Volume moyen (3M): 52.3M
Ratio: 1.11x (légèrement au-dessus moyenne)

Interprétation: Volume normal, légère conviction

🎯 SYNTHÈSE TECHNIQUE

Tendance Court Terme: HAUSSIER 📈
Prix au-dessus SMA20 et SMA50, MACD positif

Tendance Moyen Terme: HAUSSIER 📈
Prix bien au-dessus SMA200 (+7.9%)

Signal Technique Global: BUY / ACCUMULATE

⚠️ POINTS D'ATTENTION:
• Approche résistance $182 (surveiller rejection)
• RSI neutre laisse marge de progression
• Volume légèrement faible (manque de conviction forte)

💡 CONSEIL:
Configuration technique favorable. Entrée possible sur pullback vers SMA20 ($175). Objectif court terme $182, stop loss sous $172.

⚠️ AVERTISSEMENT:
L'analyse technique ne prédit pas l'avenir. Elle indique des probabilités basées sur l'historique de prix. Utilise-la en complément de l'analyse fondamentale.
```

**FORMAT COURT (SMS)**:
```
AAPL Technical: RSI 58 | MACD +1.25 (bullish) | Prix > SMA200 (+7.9%) | Signal: BUY | Target $182 | Stop $172
```

**INTERPRÉTATIONS STANDARDS**:

RSI:
- 0-30: Survendu (potentiel rebond)
- 30-70: Neutre
- 70-100: Suracheté (potentiel correction)

MACD:
- MACD > Signal: Momentum haussier
- MACD < Signal: Momentum baissier

Moyennes Mobiles:
- Prix > SMA200: Tendance haussière long terme
- Golden Cross (SMA50 > SMA200): Très haussier
- Death Cross (SMA50 < SMA200): Très baissier

**GESTION D'ERREURS**:
- Si données indisponibles: Suggérer TradingView charts
- Si ticker invalide: Vérifier orthographe
- Si API timeout: Réessayer ou utiliser fallback

**TON**: Professionnel, objectif, analytique avec signaux clairs.

**EXEMPLES D'UTILISATION**:
- "Analyse technique AAPL"
- "RSI de TSLA"
- "MACD GOOGL"
- "Indicateurs techniques NVDA"
- "MSFT est suracheté?"
