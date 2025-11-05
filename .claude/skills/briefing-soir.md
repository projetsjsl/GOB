# 🌙 Briefing Soir - Emma En Direct

## Description
Génère un briefing de clôture complet qui synthétise la journée de trading, analyse la performance des tickers d'équipe, et donne des perspectives pour le lendemain.

## Horaire
- **Heure de Montréal**: 16h20 (lundi au vendredi)
- **UTC**: 20h20 (weekdays)
- **Cron**: `20 20 * * 1-5`

## Structure du Briefing

### 1. Ouverture (2 phrases)
- Salutation de fin de journée
- Résumé global de la session (tendance dominante, sentiment)

### 2. Clôture des Marchés
- **Indices finaux**: S&P 500, Nasdaq, Dow Jones, TSX (prix de clôture + variations)
- **Performance journalière**: Ouverture → Clôture
- **Volumes de trading**: Total vs moyenne (confirmation?)
- **Comparaison intraday**: High/Low/Open/Close
- **Market breadth**: Ratio advancing/declining stocks

### 3. Secteurs Performants
- **Top 3 secteurs en hausse**: % gains + raisons
- **Top 3 secteurs en baisse**: % pertes + raisons
- **Rotation sectorielle**: Changements vs hier/semaine
- **Thèmes dominants**: Cycliques vs défensifs, growth vs value

### 4. Tickers d'Équipe - Bilan
- **Performance détaillée** de tous les tickers GOB
- **Variations du jour**: Prix, %, volume
- **Analyse contextuelle**: Pourquoi hausse/baisse?
- **Niveaux techniques**: Supports/résistances respectés?
- **Comparaison vs indices**: Outperformance/underperformance
- **Catalyseurs du jour**: News, earnings, upgrades/downgrades

### 5. Événements Marquants
- **Actualités qui ont impacté les marchés**
- **Données économiques** publiées aujourd'hui
- **Annonces d'entreprises** (earnings, guidance, M&A)
- **Déclarations Fed/Banques centrales**
- **Mouvements exceptionnels** (halts, circuit breakers)

### 6. Perspective Demain
- **Calendrier économique**: Événements clés de demain
- **Earnings attendus**: Grandes entreprises qui publient
- **Consensus des analystes**: Attentes du marché
- **Niveaux techniques à surveiller**: Support/résistance pour demain
- **Catalyseurs potentiels**: Ce qui pourrait faire bouger le marché

### 7. Conseil Emma
- **Recommandation stratégique** basée sur l'analyse de la journée
- **Opportunités identifiées** pour demain
- **Risques à surveiller**
- **Positionnement suggéré** (bullish/bearish/neutre)

### 8. Fermeture
- Message de fin de journée rassurant
- Rappel de la disponibilité d'Emma
- Rendez-vous demain matin (7h20)
- Souhait de bonne soirée

## Outils Prioritaires (dans l'ordre)
1. **fmp-quote** - Prix de clôture et variations finales
2. **fmp-fundamentals** - Données fondamentales (P/E, EPS, revenus)
3. **fmp-ratios** - Ratios financiers complets
4. **fmp-key-metrics** - Métriques clés (ROE, dette, marges)
5. **fmp-ticker-news** - Toutes les actualités de la journée
6. **team-tickers** - Performance complète de la watchlist
7. **earnings-calendar** - Résultats publiés + à venir demain
8. **economic-calendar** - Données économiques du jour + demain
9. **fmp-ratings** - Changements de recommandations

## Ton et Style
- **Synthétique** - Récapitulatif complet mais concis
- **Complet** - Aucune information importante omise
- **Rassurant** - Ton apaisant de fin de journée
- **Réflexif** - Analyse approfondie des événements
- **Prospectif** - Tourné vers demain et opportunités

## Longueur
300-400 mots (le plus long des 3 briefings)

## Configuration Email
- **Sujet**: `🌙 Emma En Direct · Soir - {date}`
- **Expéditeur**: Emma - Assistant Financier
- **Preview Text**: "Bilan de journée : Clôture des marchés et perspectives pour demain"

## Données Requises
- **market_close** - Tous les prix de clôture finaux
- **sector_performance** - Performance sectorielle complète
- **team_tickers_performance** - Bilan détaillé des tickers GOB
- **daily_events** - Tous les événements du jour
- **tomorrow_events** - Calendrier de demain

## Prompt Système (Emma Agent)

```
Tu es Emma, l'assistante financière intelligente. Génère un briefing de clôture qui synthétise la journée de trading. Structure ton email comme suit :

1. **Ouverture** (2 phrases) : Salutation et résumé de la journée
2. **Clôture des marchés** : Indices finaux, variations, volumes de trading
3. **Secteurs performants** : Top 3 secteurs en hausse/baisse avec explications
4. **Tickers d'équipe - Bilan** : Performance de nos actions avec analyse
5. **Événements marquants** : Nouvelles qui ont impacté les marchés
6. **Perspective demain** : Événements à surveiller et attentes
7. **Conseil Emma** : Recommandation ou insight pour la suite
8. **Fermeture** : Message de fin de journée et rendez-vous demain

Utilise toutes les données disponibles pour une analyse complète. Sois synthétique mais complet. Longueur : 300-400 mots.
```

## Exemples de Titres de Sections

### Ouverture
- "Bonne soirée ! La journée s'achève avec..."
- "Et voilà la clôture ! Les marchés terminent..."
- "Fin de session : Un bilan contrasté avec..."

### Clôture des Marchés
- "📊 Clôture finale : Les indices en détail"
- "🔔 Bell 16h00 : Scores du jour"

### Secteurs Performants
- "🏆 Gagnants et perdants sectoriels"
- "📈 Rotation sectorielle : Qui a brillé, qui a souffert"

### Tickers d'Équipe
- "💼 Notre Watchlist GOB : Bilan complet"
- "🎯 Performance de nos tickers : Analyse détaillée"

### Événements Marquants
- "⚡ Les temps forts de la journée"
- "📰 Ce qui a fait bouger le marché aujourd'hui"

### Perspective Demain
- "🔮 Demain au programme : Ce qui nous attend"
- "📅 Calendrier de demain : Points d'attention"

### Conseil Emma
- "💡 Mon analyse : Stratégie pour demain"
- "🧠 Perspective Emma : Opportunités et risques"

## API Endpoints

### Génération du Briefing
```
GET /api/emma-briefing?type=evening
```

### Déclenchement Cron (automatique)
```
POST /api/briefing-cron
Authorization: Bearer {CRON_SECRET}
Body: { "type": "evening" }
```

## Considérations Spéciales

### Timing du Marché
- 16h20 EST = **20 minutes après la clôture** (16h00)
- Données de clôture = **définitives et officielles**
- After-hours trading = **déjà actif** (16h00-20h00)

### Données de Clôture Complètes
À 16h20, toutes les données sont disponibles:
- **Tous les trades** de la journée sont comptabilisés
- **Volumes finaux** confirmés
- **VWAP (Volume-Weighted Average Price)** calculé
- **After-hours prices** déjà disponibles (20 min de trading)

### Analyse Journée Complète
Vue holistique de 9h30-16h00:
- **Gap d'ouverture**: Comblé ou amplifié?
- **Tendance intraday**: Trending ou ranging?
- **Volumes**: Distribution horaire, power hour?
- **Patterns**: Reversal, continuation, indécision?

### Focus After-Hours
Inclure si mouvements significatifs (±3%):
- Prix after-hours (16h00-16h20)
- Earnings releases post-market
- News importantes après la clôture

## Workflow de Génération

1. **Récupération des données** (api/emma-briefing.js)
   - Attendre 16h20 pour données finales
   - Charger config `evening` depuis `config/briefing-prompts.json`
   - Récupérer TOUS les tickers d'équipe

2. **Exécution Emma Agent** (api/emma-agent.js)
   - Exécuter tous les outils prioritaires (9 tools)
   - Analyser performance vs benchmarks
   - Identifier catalyseurs et anomalies
   - Synthèse complète via Perplexity

3. **Formatage HTML** (api/emma-briefing.js)
   - Template evening-specific (plus riche)
   - Tableaux de performance
   - Graphiques de secteurs (si disponibles)

4. **Envoi Email** (api/briefing-cron.js)
   - Via Resend API
   - Historique complet dans Supabase

## Analyse des Tickers d'Équipe

### Performance Metrics à Inclure
Pour chaque ticker GOB:
- **Prix de clôture** + variation % et $
- **Volume** vs moyenne (confirmation?)
- **Range du jour** (high-low)
- **Performance vs SPY/QQQ**: Outperformance?
- **Niveaux techniques**: Support/résistance

### Contextualisation
Pour chaque mouvement significatif (±3%):
- **Catalyseur identifié**: News, earnings, upgrade/downgrade
- **Justification fondamentale**: Ratios, métriques
- **Analyse technique**: RSI, MACD, tendance
- **Comparaison sectorielle**: Mouvement spécifique ou sectoriel?

### Exemples de Formulation

**Hausse significative**:
> "AAPL a terminé en hausse de 2,8% à 245,67$, porté par des ventes d'iPhone supérieures aux attentes en Chine (+15% YoY). Le titre a cassé sa résistance à 242$ avec un volume 2,1x supérieur à la moyenne, confirmant l'élan haussier."

**Baisse significative**:
> "TSLA a chuté de 4,2% à 187,32$ suite à un downgrade de Morgan Stanley (Overweight → Equal Weight). Le titre a touché un support clé à 185$ en séance avant de rebondir légèrement. RSI à 38 suggère une potentielle survente."

**Performance neutre mais importante**:
> "MSFT reste stable (+0,3% à 412,15$) malgré un marché volatil, confirmant son rôle de valeur défensive. Le titre consolide près de ses plus hauts historiques avec un volume faible, attendant probablement un catalyseur."

## Secteurs - Classification GICS

### 11 Secteurs Standards
1. **Energy** - Énergie (XLE)
2. **Materials** - Matériaux (XLB)
3. **Industrials** - Industriels (XLI)
4. **Consumer Discretionary** - Consommation discrétionnaire (XLY)
5. **Consumer Staples** - Biens de consommation de base (XLP)
6. **Health Care** - Santé (XLV)
7. **Financials** - Finances (XLF)
8. **Information Technology** - Technologie (XLK)
9. **Communication Services** - Services de communication (XLC)
10. **Utilities** - Services publics (XLU)
11. **Real Estate** - Immobilier (XLRE)

### Analyse Sectorielle
Pour top 3 hausse/baisse:
- **% de variation** du secteur
- **Raison principale**: Macro, réglementaire, technique
- **Leaders du secteur**: Top 3 actions du secteur
- **Perspective**: Continuation ou reversal attendu?

## Calendrier Économique - Événements Clés

### Données à Surveiller pour Demain
- **Emploi**: Jobless claims, NFP, ADP
- **Inflation**: CPI, PPI, PCE
- **Consommation**: Retail sales, consumer confidence
- **Immobilier**: Housing starts, existing home sales
- **Manufacturing**: PMI, ISM
- **Fed**: Minutes, discours, décisions

### Format de Présentation
```
📅 DEMAIN À SURVEILLER:
• 8h30 - Jobless Claims (consensus: 220K, prev: 215K)
• 10h00 - Consumer Confidence (consensus: 103.5, prev: 102.6)
• 14h00 - Fed Minutes FOMC
```

## Earnings Calendar

### Résultats du Jour (Post-Market)
```
📊 RÉSULTATS APRÈS-CLÔTURE:
• NVDA - Q4 2024: EPS $5.25 (est. $5.08) ✅ BEAT
• AMD - Q4 2024: EPS $0.92 (est. $0.96) ❌ MISS
```

### Résultats de Demain (Pre-Market + After-Hours)
```
📊 DEMAIN - RÉSULTATS ATTENDUS:
Pre-market (avant 9h30):
• WMT - Q4 2024 (consensus EPS: $1.76)
• HD - Q4 2024 (consensus EPS: $3.52)

After-hours (après 16h00):
• CSCO - Q2 2025 (consensus EPS: $0.87)
```

## Variables d'Environnement Requises

```bash
# API Keys pour données
GEMINI_API_KEY=xxx              # Gemini (Emma primary)
PERPLEXITY_API_KEY=xxx          # Perplexity (real-time synthesis)
FMP_API_KEY=xxx                 # Financial Modeling Prep (primary)
TWELVE_DATA_API_KEY=xxx         # Twelve Data (technical indicators)
POLYGON_API_KEY=xxx             # Polygon (backup data)
ALPHA_VANTAGE_API_KEY=xxx       # Alpha Vantage (backup)

# Email
RESEND_API_KEY=xxx              # Resend pour envoi emails
RESEND_TO_EMAIL=xxx@xxx.com     # Destinataires (séparés par virgules)

# Cron
CRON_SECRET=xxx                 # Authentification cron jobs

# Database
SUPABASE_URL=xxx                # Supabase URL
SUPABASE_SERVICE_ROLE_KEY=xxx   # Supabase key
```

## Métriques de Qualité du Briefing

### Complétude (Completeness Score)
- ✅ Tous les tickers d'équipe analysés
- ✅ Top 3 secteurs hausse/baisse identifiés
- ✅ Événements du jour couverts
- ✅ Calendrier de demain présent
- ✅ Conseil Emma fourni

### Précision (Accuracy Score)
- Volumes réels vs moyennes
- Catalyseurs vérifiés (news confirmées)
- Niveaux techniques respectés
- Consensus earnings corrects

### Timeliness
- Génération < 45s (9 tools en parallèle)
- Email envoyé avant 16h25
- Données de clôture confirmées (16h00)

## Suivi et Historique

Chaque briefing soir est enregistré dans Supabase:
- **Table**: `briefings_history`
- **Colonnes supplémentaires pour evening**:
  - `tickers_analyzed`: Liste des tickers GOB
  - `sector_performance`: JSON des 11 secteurs
  - `daily_events`: Événements du jour
  - `tomorrow_calendar`: Événements de demain
  - `completeness_score`: Score de complétude (0-100)

## Post-Briefing Analytics (Lendemain)

Le matin suivant, calculer:
- **Précision des perspectives**: Prédictions vs réalité
- **Niveaux techniques**: Supports/résistances respectés?
- **Catalyseurs identifiés**: Effectivement impactants?
- **Sentiment accuracy**: Marché a suivi le sentiment prédit?

## Disclaimer

> Les informations fournies sont à des fins éducatives uniquement et ne constituent pas des conseils financiers personnalisés. Les performances passées ne garantissent pas les résultats futurs. Consultez un conseiller financier professionnel avant de prendre des décisions d'investissement.

---

**Dernière mise à jour**: Novembre 2025
**Maintenu par**: Équipe GOB - JSL AI
