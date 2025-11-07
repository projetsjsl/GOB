Utilise le skill **FMP Stock Quote** d'Emma pour obtenir le prix et les données en temps réel d'une action.

**OBJECTIF**: Récupérer prix actuel, variation, volume et données intraday d'un ticker.

**PARAMÈTRES**:
- **ticker** (requis): Symbole de l'action (ex: AAPL, GOOGL, TSLA)

**DONNÉES RETOURNÉES**:
- Prix actuel (en temps réel ou 15min delay selon marché)
- Variation du jour ($ et %)
- High/Low du jour
- Volume du jour
- Prix d'ouverture
- Prix de clôture précédent
- Market cap (si disponible)

**INSTRUCTIONS**:
1. Demande à Emma d'utiliser le tool `fmp-quote` via `/api/fmp?endpoint=quote&symbol={ticker}`
2. Si FMP échoue, utilise fallback chain: Finnhub → Alpha Vantage → Yahoo Finance
3. Présente les données de manière claire et concise
4. Ajoute contexte si variation importante (>5%)
5. Mentionne heures de trading si marché fermé

**EXEMPLE DE FORMAT DE RÉPONSE**:

```
📊 QUOTE: AAPL (Apple Inc.)

Prix: $178.50
Variation: +$3.75 (+2.14%) 📈

Détails Intraday:
• Ouverture: $175.20
• High: $179.80
• Low: $174.90
• Clôture précédente: $174.75

Volume: 58,234,520 actions
Volume moyen (3M): 52,100,000

Market Cap: $2.78T

🕐 Dernière mise à jour: 15h45 EST
📅 Marché: NASDAQ (ouvert)

---

💡 Note: Variation positive suite à l'annonce de résultats trimestriels solides.
```

**FORMAT SMS/COURT**:
```
AAPL: $178.50 (+2.14%) | High: $179.80 | Low: $174.90 | Vol: 58.2M
```

**GESTION D'ERREURS**:
- Si ticker invalide: "❌ Ticker {TICKER} non reconnu. Vérifie l'orthographe."
- Si marché fermé: Indiquer heures d'ouverture
- Si données indisponibles: Suggérer sources alternatives (Yahoo Finance, Google Finance)

**TON**: Factuel, concis, avec émojis pour les variations significatives.

**EXEMPLES D'UTILISATION**:
- "Prix AAPL"
- "Quote TSLA"
- "Cours de GOOGL"
- "MSFT prix actuel"
