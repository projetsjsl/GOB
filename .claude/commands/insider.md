Utilise le skill **FMP Insider Trading** d'Emma pour suivre les achats/ventes d'initiés (SEC Form 4).

**OBJECTIF**: Afficher les transactions récentes des dirigeants et gros actionnaires d'une entreprise.

**PARAMÈTRES**:
- **ticker** (requis): Symbole de l'action (ex: AAPL, NVDA, META)
- **period** (optionnel): Période (défaut: 3 mois)

**DONNÉES RETOURNÉES**:
- Nom de l'initié et titre/fonction
- Type de transaction (Achat/Vente)
- Nombre d'actions
- Prix par action
- Valeur totale de la transaction
- Date de la transaction
- Actions détenues après transaction

**INSTRUCTIONS**:
1. Appelle `/api/fmp?endpoint=insider-trading&symbol={ticker}` pour transactions récentes
2. Filtre les 10 dernières transactions significatives (>$10,000)
3. Calcule le ratio Buy/Sell sur la période
4. Met en évidence les achats massifs (signal bullish) ou ventes importantes
5. Identifie les cluster trades (plusieurs initiés même période)

**EXEMPLE DE FORMAT DE RÉPONSE**:

```
🔍 INSIDER TRADING: NVDA (NVIDIA Corp.)

📊 Résumé (3 derniers mois):
• Total Achats: $2.4M (8 transactions)
• Total Ventes: $45.2M (12 transactions)
• Ratio Buy/Sell: 0.05 (Net vendeur)

📋 Transactions récentes:

🟢 ACHAT | Jensen Huang (CEO)
   Date: 15 jan 2025
   Actions: 10,000 @ $485.20
   Valeur: $4,852,000
   Après: 3,250,000 actions

🔴 VENTE | Mark Stevens (Director)
   Date: 12 jan 2025
   Actions: 25,000 @ $492.50
   Valeur: $12,312,500
   Après: 150,000 actions

🔴 VENTE | Colette Kress (CFO)
   Date: 8 jan 2025
   Actions: 15,000 @ $478.30
   Valeur: $7,174,500
   Après: 89,500 actions

---

⚠️ Signal: Ventes nettes importantes. Normal post-earnings/vesting.
💡 Contexte: Les ventes sont souvent planifiées (Rule 10b5-1).
```

**FORMAT SMS/COURT**:
```
NVDA Insider: Achats $2.4M | Ventes $45.2M | Net vendeur ⚠️
```

**SIGNAUX À SURVEILLER**:
- 🟢🟢🟢 Cluster d'achats = Signal très bullish
- CEO/CFO qui achète = Signal fort
- Ventes massives post-earnings = Souvent normal (vesting)
- Ventes sans raison apparente = À surveiller

**TYPES D'INSIDERS**:
- CEO, CFO, COO = Niveau C (très significatif)
- Director = Board member
- 10% Owner = Gros actionnaire
- VP, SVP = Vice-présidents

**GESTION D'ERREURS**:
- Si aucune transaction: "ℹ️ Aucune transaction d'initié récente pour {TICKER}."
- Si ticker invalide: "❌ Ticker {TICKER} non reconnu."

**TON**: Factuel avec interprétation prudente, émojis pour buy/sell.

**EXEMPLES D'UTILISATION**:
- "Insider trading AAPL"
- "Achats initiés NVDA"
- "Est-ce que le CEO de META vend?"
- "/insider TSLA"
- "Form 4 récents pour GOOGL"
