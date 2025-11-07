Utilise le skill **Supabase Watchlist** d'Emma pour gérer la watchlist de Dan et afficher les tickers suivis.

**OBJECTIF**: Lire, afficher et analyser les tickers de la watchlist personnelle stockée dans Supabase.

**ACTIONS DISPONIBLES**:
- **Lire** la watchlist complète
- **Afficher** les prix actuels de tous les tickers
- **Analyser** performance de la watchlist
- **Identifier** opportunités dans la watchlist
- **Résumer** état de la watchlist

**DONNÉES RETOURNÉES**:
- Liste des tickers suivis
- Prix actuels et variations
- Performance YTD de chaque ticker
- Secteurs représentés
- Opportunités détectées (RSI bas, nouvelles positives, etc.)

**INSTRUCTIONS**:
1. Demande à Emma d'utiliser le tool `supabase-watchlist` pour lire table `watchlist`
2. Pour chaque ticker, récupère prix actuel via `fmp-quote`
3. Calcule statistiques de la watchlist:
   - Nombre total de tickers
   - Performance moyenne
   - Meilleurs performers
   - Pires performers
   - Répartition sectorielle
4. Identifie opportunités basées sur:
   - RSI < 30 (survente)
   - Actualités positives récentes
   - Upgrades analystes
   - Résultats dépassant attentes

**EXEMPLE DE FORMAT DE RÉPONSE**:

```
📊 WATCHLIST DAN - Vue d'ensemble

📈 STATISTIQUES GÉNÉRALES
Nombre de tickers: 28
Performance YTD moyenne: +12.4%
Meilleur performer: NVDA (+156.3%)
Pire performer: PYPL (-18.2%)

🎯 TOP 5 PERFORMERS (YTD)

1. NVDA - NVIDIA Corp.
   Prix: $485.20 | YTD: +156.3% 🔥
   Secteur: Technology (Semiconductors)

2. META - Meta Platforms
   Prix: $342.80 | YTD: +48.5% 📈
   Secteur: Technology (Social Media)

3. AAPL - Apple Inc.
   Prix: $178.50 | YTD: +32.1% 📈
   Secteur: Technology (Consumer Electronics)

4. MSFT - Microsoft Corp.
   Prix: $365.40 | YTD: +28.7% 📈
   Secteur: Technology (Software)

5. GOOGL - Alphabet Inc.
   Prix: $138.20 | YTD: +24.3% 📈
   Secteur: Technology (Internet)

📉 BOTTOM 5 PERFORMERS (YTD)

1. PYPL - PayPal Holdings
   Prix: $58.30 | YTD: -18.2% ⚠️
   Secteur: Technology (Fintech)

2. TDOC - Teladoc Health
   Prix: $12.40 | YTD: -12.8% ⚠️
   Secteur: Healthcare (Telehealth)

3. [...]

🎨 RÉPARTITION SECTORIELLE

Technology: 18 tickers (64%) 💻
Healthcare: 4 tickers (14%) 🏥
Financial: 3 tickers (11%) 💰
Consumer: 2 tickers (7%) 🛒
Energy: 1 ticker (4%) ⚡

💡 OPPORTUNITÉS DÉTECTÉES

1. PYPL (PayPal) - SURVENTE
   RSI(14): 28 | Prix: -18% YTD
   💬 Potentiel rebond technique, surveiller support $55

2. BA (Boeing) - ACTUALITÉ POSITIVE
   Nouveau contrat $8B annoncé aujourd'hui
   💬 Catalyst positif, entrée possible sur pullback

3. DIS (Disney) - UPGRADE ANALYSTE
   Morgan Stanley upgrade "Overweight", target $125
   💬 Valorisation attractive post-correction

🎯 RÉSUMÉ

La watchlist est dominée par la tech (64%) avec performance YTD solide (+12.4%). NVDA reste le leader incontesté. Quelques opportunités en survente (PYPL, TDOC) méritent attention pour rebond technique.

📅 Dernière mise à jour: Aujourd'hui 15h45 EST
```

**FORMAT COURT (SMS)**:
```
Watchlist (28): +12.4% YTD | Top: NVDA +156% | Bottom: PYPL -18% | Opps: PYPL (RSI 28), BA (news+)
```

**ACTIONS SPÉCIFIQUES**:

**Voir watchlist complète**:
```
📋 WATCHLIST COMPLÈTE (28 tickers)

AAPL $178.50 (+2.1%)     MSFT $365.40 (+1.5%)
GOOGL $138.20 (+0.8%)    NVDA $485.20 (+3.2%)
META $342.80 (+1.9%)     TSLA $242.50 (-1.3%)
[...]
```

**Performance watchlist**:
```
📊 PERFORMANCE WATCHLIST

YTD: +12.4%
1 mois: +3.2%
3 mois: +8.1%
6 mois: +15.6%
1 an: +18.9%

vs S&P 500 YTD: +12.4% vs +16.2% (underperform -3.8%)
```

**GESTION D'ERREURS**:
- Si watchlist vide: "ℹ️ Watchlist vide"
- Si Supabase down: "❌ Impossible d'accéder à la watchlist"
- Si tickers invalides: Les ignorer et mentionner

**TON**: Amical, informatif, avec suggestions actionnables.

**EXEMPLES D'UTILISATION**:
- "Montre-moi ma watchlist"
- "Performance de ma watchlist"
- "Quelles opportunités dans ma watchlist?"
- "Watchlist Dan aujourd'hui"
- "Résumé watchlist"
