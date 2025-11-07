Utilise le skill **FMP Ticker News** d'Emma pour obtenir les actualités récentes d'une action ou du marché.

**OBJECTIF**: Récupérer les actualités récentes, articles et événements liés à un ticker ou au marché en général.

**PARAMÈTRES**:
- **ticker** (optionnel): Symbole de l'action pour actualités spécifiques
- Si aucun ticker: Actualités générales du marché

**DONNÉES RETOURNÉES**:
- Titre de l'article
- Source de l'actualité
- Date de publication
- Résumé/extrait
- Sentiment (positif/négatif/neutre) si disponible
- Lien vers l'article complet

**INSTRUCTIONS**:
1. Demande à Emma d'utiliser le tool `fmp-ticker-news` via `/api/fmp?endpoint=ticker-news&symbols={ticker}`
2. Si FMP échoue, utilise fallback Finnhub
3. Limite à 5-10 actualités les plus récentes et pertinentes
4. Trie par date (plus récent en premier)
5. Identifie les nouvelles à fort impact (earnings, acquisitions, changements direction)
6. Résume brièvement chaque article

**EXEMPLE DE FORMAT DE RÉPONSE**:

```
📰 ACTUALITÉS: AAPL (Apple Inc.)

🔴 RÉCENTES (dernières 24h):

1. Apple annonce résultats Q4 au-dessus des attentes
   📅 Aujourd'hui 16h30
   📰 Source: Reuters
   💬 "Revenue de $89.5B (+8% YoY), EPS $1.46 vs $1.39 attendu"
   📊 Impact: POSITIF 📈
   🔗 [Lire l'article]

2. iPhone 16 dépasse les prévisions de ventes en Chine
   📅 Il y a 12h
   📰 Source: Bloomberg
   💬 "Les précommandes chinoises en hausse de 15% vs iPhone 15"
   📊 Impact: POSITIF 📈
   🔗 [Lire l'article]

3. Analyste Morgan Stanley relève objectif de prix à $195
   📅 Hier 14h20
   📰 Source: Seeking Alpha
   💬 "Upgrade de 'Hold' à 'Buy', cite croissance services"
   📊 Impact: POSITIF 📈
   🔗 [Lire l'article]

📊 SENTIMENT GÉNÉRAL: Positif (3/3 actualités favorables)

💡 RÉSUMÉ:
Momentum positif pour AAPL avec résultats solides Q4 et dynamique commerciale forte en Chine. Analystes majoritairement optimistes.
```

**FORMAT COURT (SMS)**:
```
AAPL News: ✅ Q4 beats expectations | ✅ iPhone 16 strong China sales | ✅ MS upgrades to Buy ($195 target)
```

**ACTUALITÉS MARCHÉ GÉNÉRAL** (sans ticker):
```
📰 ACTUALITÉS DU MARCHÉ

🔴 BREAKING (dernières heures):

1. Fed maintient taux à 5.25-5.50%
   📊 Impact: Marchés en hausse (+1.2%)

2. Inflation CPI à 3.2% (attendu: 3.3%)
   📊 Impact: Positif pour actions tech

3. Tesla rappelle 2M véhicules pour mise à jour software
   📊 Impact: TSLA -4.5%

[...]
```

**GESTION D'ERREURS**:
- Si ticker invalide: "❌ Pas d'actualités disponibles pour {TICKER}"
- Si pas de news récentes: "ℹ️ Aucune actualité majeure dans les dernières 24h"
- Si API down: Suggérer alternatives (Google News, Yahoo Finance)

**TON**: Factuel, journalistique, neutre avec analyse d'impact claire.

**EXEMPLES D'UTILISATION**:
- "News TSLA"
- "Actualités Apple"
- "Quoi de neuf pour NVDA?"
- "Dernières nouvelles marché"
