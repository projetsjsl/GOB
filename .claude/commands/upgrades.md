Utilise le skill **FMP Analyst Ratings** d'Emma pour afficher les upgrades/downgrades d'analystes.

**OBJECTIF**: Suivre les changements de recommandations et objectifs de prix des analystes Wall Street.

**PARAMÈTRES**:
- **ticker** (optionnel): Symbole spécifique ou "all" pour vue marché
- **period** (optionnel): today, week, month (défaut: today)

**DONNÉES RETOURNÉES**:
- Firme d'analyse (Goldman, Morgan Stanley, etc.)
- Action (Upgrade, Downgrade, Initiation, Reiterate)
- Ancienne note → Nouvelle note
- Ancien PT → Nouveau PT (Price Target)
- Date de publication

**INSTRUCTIONS**:
1. Appelle `/api/fmp?endpoint=upgrades-downgrades&symbol={ticker}` pour ticker spécifique
2. Ou `/api/fmp?endpoint=upgrades-downgrades-consensus` pour vue marché
3. Filtre par période demandée
4. Trie par impact (écart PT vs prix actuel)
5. Résume le consensus actuel

**EXEMPLE DE FORMAT DE RÉPONSE**:

```
📊 ANALYSTES: AAPL (Apple Inc.)

Prix actuel: $185.20

🔼 UPGRADES AUJOURD'HUI (2):

Morgan Stanley | 9h30 EST
• Rating: Hold → Buy
• PT: $180 → $220 (+22% upside)
• Analyste: Erik Woodring
• "iPhone 16 demand stronger than expected"

Wedbush | 7h15 EST
• Rating: Outperform → Outperform (reiterate)
• PT: $200 → $225 (+21.5% upside)
• Analyste: Dan Ives
• "AI features driving upgrade cycle"

🔽 DOWNGRADES AUJOURD'HUI (0):
Aucun

📈 CONSENSUS ACTUEL:
• Moyenne PT: $208.50 (+12.6% vs actuel)
• Notes: 28 Buy | 12 Hold | 3 Sell
• Score consensus: 4.1/5 (Buy)

---

💡 Momentum: 2 upgrades sans downgrade = signal positif
```

**VUE MARCHÉ (sans ticker)**:

```
📊 UPGRADES/DOWNGRADES DU JOUR

🔼 TOP UPGRADES:

1. NVDA | Goldman Sachs
   Hold → Buy | PT $550 → $700

2. MSFT | JPMorgan
   Neutral → Overweight | PT $400 → $480

3. AMZN | Bank of America
   Neutral → Buy | PT $180 → $220

🔽 NOTABLE DOWNGRADES:

1. TSLA | Morgan Stanley
   Buy → Hold | PT $350 → $280

2. META | Barclays
   Overweight → Equal Weight | PT $550 → $500

📊 Stats du jour:
• Total upgrades: 45
• Total downgrades: 23
• Ratio Up/Down: 1.96 (bullish)
```

**FORMAT SMS/COURT**:
```
AAPL: 2 upgrades | MS Buy $220 | WB $225 | Consensus Buy 4.1/5
```

**TERMES DE RATING**:
- Buy/Overweight/Outperform = Positif
- Hold/Neutral/Equal Weight = Neutre
- Sell/Underweight/Underperform = Négatif

**FIRMES MAJEURES**:
Goldman Sachs, Morgan Stanley, JPMorgan, Bank of America, Citi, Barclays, UBS, Credit Suisse, Deutsche Bank, Wedbush, Piper Sandler, Needham

**GESTION D'ERREURS**:
- Si aucun changement: "ℹ️ Aucun upgrade/downgrade pour {TICKER} aujourd'hui."
- Si ticker invalide: "❌ Ticker {TICKER} non reconnu."

**TON**: Factuel avec contexte marché, émojis pour direction.

**EXEMPLES D'UTILISATION**:
- "Upgrades aujourd'hui"
- "Downgrades TSLA"
- "/upgrades NVDA"
- "Consensus analystes AAPL"
- "Price targets META"
- "Qui a upgradé MSFT?"
