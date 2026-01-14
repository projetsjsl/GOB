Utilise le skill **FMP Dividend Data** d'Emma pour obtenir les informations de dividendes d'une action.

**OBJECTIF**: Récupérer rendement, historique des dividendes, dates ex-dividend et statut aristocrat.

**PARAMÈTRES**:
- **ticker** (requis): Symbole de l'action (ex: KO, JNJ, PG)

**DONNÉES RETOURNÉES**:
- Rendement du dividende (Dividend Yield %)
- Dividende annuel par action ($)
- Ratio de distribution (Payout Ratio)
- Date ex-dividend (prochaine)
- Date de paiement
- Historique des 5 dernières années
- Croissance du dividende (CAGR)
- Statut Dividend Aristocrat (25+ ans de hausse consécutive)

**INSTRUCTIONS**:
1. Appelle `/api/fmp?endpoint=stock-dividend&symbol={ticker}` pour données actuelles
2. Appelle `/api/fmp?endpoint=historical-dividend&symbol={ticker}` pour historique
3. Calcule le CAGR sur 5 ans si données disponibles
4. Vérifie si l'action est un Dividend Aristocrat (25+ ans) ou Dividend King (50+ ans)
5. Présente les données de manière claire avec contexte

**EXEMPLE DE FORMAT DE RÉPONSE**:

```
💰 DIVIDENDE: KO (Coca-Cola Co.)

Rendement actuel: 3.12%
Dividende annuel: $1.84/action
Payout Ratio: 72.4%

📅 Dates importantes:
• Ex-Dividend: 14 mars 2025
• Date de paiement: 1er avril 2025
• Fréquence: Trimestriel

📈 Historique (5 ans):
• 2024: $1.84 (+4.5%)
• 2023: $1.76 (+4.7%)
• 2022: $1.68 (+4.3%)
• 2021: $1.61 (+2.4%)
• 2020: $1.57 (+2.6%)

Croissance (CAGR 5 ans): 3.7%

👑 Statut: DIVIDEND KING (62 ans consécutifs de hausse)

---

💡 Note: Excellent historique de croissance régulière. Payout ratio soutenable.
```

**FORMAT SMS/COURT**:
```
KO Div: 3.12% | $1.84/an | Ex-div: 14 mars | King 62 ans 👑
```

**DIVIDEND ARISTOCRATS CHECK**:
- 25+ ans = Dividend Aristocrat 🏆
- 50+ ans = Dividend King 👑
- <25 ans = Indiquer nombre d'années consécutives

**GESTION D'ERREURS**:
- Si ticker ne verse pas de dividende: "ℹ️ {TICKER} ne verse pas de dividende actuellement."
- Si données indisponibles: Suggérer vérification sur dividend.com
- Si ticker invalide: "❌ Ticker {TICKER} non reconnu."

**MÉTRIQUES CLÉS À SURVEILLER**:
- Yield > 5% = Attention (vérifier soutenabilité)
- Payout Ratio > 80% = Risque de coupe
- CAGR < inflation = Érosion pouvoir d'achat

**TON**: Factuel avec perspective long terme, émojis pour statuts spéciaux.

**EXEMPLES D'UTILISATION**:
- "Dividende KO"
- "Yield de JNJ"
- "Historique dividendes PG"
- "/dividend AAPL"
- "Est-ce que T est un dividend aristocrat?"
