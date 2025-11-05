# ⚡ Briefing Midi - Emma En Direct

## Description
Génère un briefing de mi-journée analytique qui fait le point sur la session du matin, analyse les mouvements techniques, et donne des perspectives pour l'après-midi.

## Horaire
- **Heure de Montréal**: 11h50 (lundi au vendredi)
- **UTC**: 15h50 (weekdays)
- **Cron**: `50 15 * * 1-5`

## Structure du Briefing

### 1. Ouverture (2 phrases)
- Salutation cordiale
- Résumé rapide de la matinée (tendance dominante)

### 2. Performance Matinale
- **Indices principaux**: S&P 500, Nasdaq, Dow Jones, TSX
- **Variations depuis ouverture** (9h30 - 11h50)
- **Secteurs en hausse/baisse**: Top 3 de chaque
- **Volumes de trading**: Comparaison vs moyenne
- **Breadth du marché**: Advancing vs declining stocks

### 3. Mouvements Notables
- **Actions en forte hausse** (+5% ou plus)
- **Actions en forte baisse** (-5% ou plus)
- **Explication des mouvements**: Catalyseurs, nouvelles, résultats
- **Focus sur tickers d'équipe** ayant des mouvements significatifs

### 4. Actualités Midi
- Développements survenus depuis le matin
- Réactions du marché aux données économiques
- Annonces d'entreprises en cours de session
- Sentiment de marché (fear/greed, VIX)

### 5. Focus Technique
- **Niveaux de support/résistance** des indices principaux
- **Indicateurs techniques**: RSI, MACD, moyennes mobiles
- **Volumes**: Confirmation ou divergence des mouvements
- **Patterns chartistes** émergents
- **Zones clés** à surveiller pour l'après-midi

### 6. Perspective Après-Midi
- Ce à quoi s'attendre pour la suite de la session
- Événements restants (14h00-16h00)
- Niveaux techniques à surveiller
- Scénarios possibles (continuation, reversal, consolidation)

### 7. Fermeture
- Message encourageant
- Rappel de surveiller les niveaux techniques
- Rendez-vous au briefing du soir (16h20)

## Outils Prioritaires (dans l'ordre)
1. **fmp-quote** - Prix et variations en temps réel
2. **fmp-ratios** - Ratios financiers pour analyse fondamentale
3. **fmp-key-metrics** - Métriques clés (P/E, EPS, etc.)
4. **twelve-data-technical** - Indicateurs techniques (RSI, MACD, MA)
5. **fmp-ticker-news** - Actualités de la matinée
6. **team-tickers** - Performance des tickers GOB
7. **fmp-ratings** - Changements de recommandations

## Ton et Style
- **Analytique** - Focus sur les données et tendances
- **Informatif** - Explication claire des mouvements
- **Équilibré** - Perspective objective sans biais
- **Technique** - Utilisation appropriée d'indicateurs
- **Pédagogique** - Expliquer le "pourquoi" des mouvements

## Longueur
250-350 mots (légèrement plus long que le briefing du matin)

## Configuration Email
- **Sujet**: `⚡ Emma En Direct · Midi - {date}`
- **Expéditeur**: Emma - Assistant Financier
- **Preview Text**: "Point mi-journée : Performance matinale et perspectives pour l'après-midi"

## Données Requises
- **morning_performance** - Performance des indices depuis ouverture
- **notable_movements** - Actions avec mouvements significatifs
- **technical_indicators** - RSI, MACD, volumes
- **midday_news** - Actualités de la matinée

## Prompt Système (Emma Agent)

```
Tu es Emma, l'assistante financière intelligente. Génère un briefing de mi-journée qui fait le point sur la session du matin. Structure ton email comme suit :

1. **Ouverture** (2 phrases) : Salutation et résumé de la matinée
2. **Performance matinale** : Indices, secteurs en hausse/baisse, volumes
3. **Mouvements notables** : Actions qui bougent significativement avec explications
4. **Actualités midi** : Développements récents et réactions du marché
5. **Focus technique** : Analyse rapide des tendances et niveaux clés
6. **Perspective après-midi** : Ce à quoi s'attendre pour la suite
7. **Fermeture** : Message encourageant et rappel du briefing du soir

Utilise les données techniques et fondamentales disponibles. Sois analytique mais accessible. Longueur : 250-350 mots.
```

## Exemples de Titres de Sections

### Ouverture
- "Bonjour à mi-parcours ! La matinée a été marquée par..."
- "Point mi-journée : Les marchés évoluent..."
- "Bilan matinal : Les indices affichent..."

### Performance Matinale
- "📊 Bilan 9h30-11h50 : Les indices en détail"
- "📈 Session du matin : Qui gagne, qui perd"

### Mouvements Notables
- "🎯 Movers & Shakers : Les actions qui bougent"
- "⚡ Forte volatilité : Ce qui fait bouger le marché"

### Actualités Midi
- "📰 Ce qui s'est passé ce matin"
- "🔔 Nouvelles fraîches : Réactions du marché"

### Focus Technique
- "📉 Analyse technique : Niveaux et tendances"
- "🔧 Indicateurs clés : RSI, MACD, Volumes"

### Perspective Après-Midi
- "🔮 Perspective : Ce qui nous attend"
- "⏰ Scénarios pour 12h00-16h00"

## API Endpoints

### Génération du Briefing
```
GET /api/emma-briefing?type=midday
```

### Déclenchement Cron (automatique)
```
POST /api/briefing-cron
Authorization: Bearer {CRON_SECRET}
Body: { "type": "midday" }
```

## Considérations Spéciales

### Timing du Marché
- 11h50 EST = **2h20 après l'ouverture** (9h30)
- Session du matin = **9h30-11h50** (2h20 de trading)
- Afternoon session = **12h00-16h00** (4h restantes)

### Analyse de la Matinée
- **Ouverture vs maintenant**: Gap comblé ou amplifié?
- **Volume progression**: Sur/sous la moyenne?
- **Secteurs leaders**: Rotation sectorielle?
- **Breadth**: Market breadth (advance/decline ratio)

### Focus Technique
À 11h50, les indicateurs techniques ont suffisamment de données:
- **RSI 4h/1d**: Surachat/survente?
- **MACD**: Croisements récents?
- **Volumes**: Confirmation des mouvements?
- **Support/Résistance**: Niveaux franchis ou rejetés?

### Perspective Après-Midi
Événements clés de l'après-midi:
- **13h00-14h00**: Annonces économiques fréquentes
- **14h00-15h00**: Power hour préparation
- **15h00-16h00**: Closing hour - volatilité accrue

## Workflow de Génération

1. **Récupération des données** (api/emma-briefing.js)
   - Charger config depuis `config/briefing-prompts.json`
   - Calculer performance depuis 9h30
   - Identifier movers (±5% ou plus)

2. **Exécution Emma Agent** (api/emma-agent.js)
   - Priorité: Données techniques (RSI, MACD, volumes)
   - Analyse fondamentale si catalyseurs
   - Synthèse via Perplexity

3. **Formatage HTML** (api/emma-briefing.js)
   - Template midday-specific
   - Graphiques techniques (si disponibles)
   - Tableau de mouvements notables

4. **Envoi Email** (api/briefing-cron.js)
   - Via Resend API
   - Historique dans Supabase

## Indicateurs Techniques Prioritaires

### RSI (Relative Strength Index)
- **> 70**: Surachat (potentiel pullback)
- **< 30**: Survente (potentiel rebond)
- **50**: Neutre

### MACD (Moving Average Convergence Divergence)
- **Croisement haussier**: MACD > Signal
- **Croisement baissier**: MACD < Signal
- **Histogramme**: Force de la tendance

### Volumes
- **Volume > Avg**: Confirmation du mouvement
- **Volume < Avg**: Mouvement faible, potentiel faux breakout
- **Volume spike**: Événement catalyseur

### Moyennes Mobiles
- **SMA 20/50/200**: Tendances court/moyen/long terme
- **Prix vs MA**: Au-dessus = bullish, en-dessous = bearish
- **Golden/Death Cross**: SMA50 vs Sma200

## Mouvements Notables - Critères

### Actions en forte hausse (top movers)
- **+5% ou plus** dans la matinée
- **Volume > 2x moyenne**: Confirmation
- **Catalyseur identifié**: News, earnings, upgrade

### Actions en forte baisse (top decliners)
- **-5% ou plus** dans la matinée
- **Catalyseur négatif**: Downgrade, miss earnings, bad news
- **Niveau technique**: Cassure de support?

### Tickers d'Équipe - Focus Spécial
Même si mouvement < 5%, inclure si:
- **Catalyseur important** (earnings, news)
- **Volume anormal** (>3x moyenne)
- **Niveau technique clé** (support/résistance)

## Variables d'Environnement Requises

```bash
# API Keys pour données
GEMINI_API_KEY=xxx              # Gemini (Emma primary)
PERPLEXITY_API_KEY=xxx          # Perplexity (real-time synthesis)
FMP_API_KEY=xxx                 # Financial Modeling Prep
TWELVE_DATA_API_KEY=xxx         # Twelve Data (technical indicators)

# Email
RESEND_API_KEY=xxx              # Resend pour envoi emails
RESEND_TO_EMAIL=xxx@xxx.com     # Destinataires

# Cron
CRON_SECRET=xxx                 # Authentification cron jobs

# Database
SUPABASE_URL=xxx                # Supabase URL
SUPABASE_SERVICE_ROLE_KEY=xxx   # Supabase key
```

## Métriques de Performance

Tracking de la qualité du briefing:
- **Précision des mouvements**: Tickers identifiés comme movers
- **Pertinence technique**: Niveaux respectés dans l'après-midi
- **Timeliness**: Délai génération (<30s idéal)
- **Completeness**: Toutes sections présentes

## Suivi et Historique

Chaque briefing est enregistré dans Supabase:
- **Table**: `briefings_history`
- **Colonnes supplémentaires pour midday**:
  - `movers_count`: Nombre de movers identifiés
  - `technical_indicators`: RSI, MACD values
  - `accuracy_score`: Score calculé en fin de journée

## Disclaimer

> Les informations fournies sont à des fins éducatives uniquement et ne constituent pas des conseils financiers personnalisés. Les analyses techniques sont basées sur des données historiques et ne garantissent pas les performances futures.

---

**Dernière mise à jour**: Novembre 2025
**Maintenu par**: Équipe GOB - JSL AI
