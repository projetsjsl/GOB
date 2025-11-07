Utilise le skill **RSI Screener** d'Emma pour identifier les opportunités de trading basées sur RSI extrêmes.

**OBJECTIF**: Trouver les actions en zones RSI extrêmes sur les marchés internationaux.

**CRITÈRES DE RECHERCHE**:
- **SURVENTE EXTRÊME**: RSI(14) ≤ 20 ET RSI(5) ≤ 5 (potentiels rebonds)
- **SURACHAT EXTRÊME**: RSI(14) ≥ 80 ET RSI(5) ≥ 95 (potentielles corrections)

**MARCHÉS DISPONIBLES**:
- US (NYSE, NASDAQ)
- CA (TSX, TSXV)
- UK (LSE)
- FR (EURONEXT)
- DE (XETRA)
- EU (Europe)

**PARAMÈTRES PAR DÉFAUT**:
- Type: Les deux (survente + surachat)
- Marchés: US
- Limite: 20 résultats par catégorie
- Capitalisation: Large cap (> $10B)

**INSTRUCTIONS**:
1. Demande à Emma d'utiliser le tool `rsi-screener` avec l'endpoint `/api/rsi-screener`
2. Si l'utilisateur ne spécifie pas de marché, utilise US par défaut
3. Si l'utilisateur ne spécifie pas de type, montre les deux (survente ET surachat)
4. Présente les résultats de manière claire avec:
   - Ticker, nom de l'entreprise
   - Prix actuel et market cap
   - Valeurs RSI(14) et RSI(5)
   - Signal (SURVENTE ou SURACHAT)
   - Marché/exchange
   - Interprétation

**EXEMPLES DE FORMAT DE RÉPONSE**:

```
📊 RSI SCREENER - Opportunités Extrêmes

🔴 SURVENTE EXTRÊME (5 trouvés)
Critères: RSI(14) ≤ 20 ET RSI(5) ≤ 5

1. AAPL - Apple Inc. (NASDAQ)
   Prix: $178.50 | Market Cap: $2.8T
   RSI(14): 18.5 | RSI(5): 3.2
   💡 Potentiel rebond technique

2. [...]

🔵 SURACHAT EXTRÊME (3 trouvés)
Critères: RSI(14) ≥ 80 ET RSI(5) ≥ 95

1. NVDA - NVIDIA Corporation (NASDAQ)
   Prix: $485.20 | Market Cap: $1.2T
   RSI(14): 82.3 | RSI(5): 96.5
   ⚠️ Potentiel correction

2. [...]

⚠️ AVERTISSEMENT:
Ces signaux RSI indiquent des zones extrêmes mais ne garantissent pas de rebond/correction. Toujours vérifier les fondamentaux et le contexte du marché avant d'investir.
```

**TON**: Professionnel, factuel, avec avertissement clair sur les risques.
