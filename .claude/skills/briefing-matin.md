# 📧 Briefing Matin - Emma En Direct

## Description
Génère un briefing matinal complet et énergique pour les investisseurs, synthétisant les tendances overnight, les événements clés du jour, et les opportunités sur les tickers d'équipe.

## Horaire
- **Heure de Montréal**: 7h20 (lundi au vendredi)
- **UTC**: 11h20 (weekdays)
- **Cron**: `20 11 * * 1-5`

## Structure du Briefing

### 1. Ouverture (2-3 phrases)
- Salutation énergique et accueillante
- Contexte général du marché (sentiment global)
- Mise en situation rapide de la journée

### 2. Marché en Bref
- Indices principaux (S&P 500, Nasdaq, Dow Jones, TSX)
- Performance des marchés overnight (Asie, Europe)
- Tendances des contrats à terme (futures)
- Sentiment général du marché

### 3. Actualités Clés (3-4 points)
- Nouvelles importantes qui impacteront les marchés aujourd'hui
- Annonces macroéconomiques récentes
- Développements géopolitiques pertinents
- Nouvelles d'entreprises majeures

### 4. Focus Tickers d'Équipe
- Mise en avant de 2-3 actions de la watchlist
- Prix actuels et variations overnight
- Catalyseurs du jour (résultats, annonces, événements)
- Opportunités à surveiller

### 5. Événements du Jour
- **Calendrier économique**: Données macro importantes (emploi, inflation, etc.)
- **Résultats d'entreprises**: Earnings calls et publications
- **Événements Fed/Banques centrales**: Discours, décisions
- **Heures précises** des publications importantes

### 6. Conseil Emma
- Insight analytique basé sur les données disponibles
- Recommandation stratégique pour la journée
- Point d'attention particulier ou opportunité
- Approche tactique suggérée

### 7. Fermeture
- Message optimiste et encourageant
- Rappel de la disponibilité d'Emma pour questions
- Rendez-vous au prochain briefing (midi)

## Outils Prioritaires (dans l'ordre)
1. **fmp-quote** - Prix et variations en temps réel
2. **fmp-ticker-news** - Actualités spécifiques aux tickers
3. **fmp-key-metrics** - Métriques financières clés
4. **economic-calendar** - Calendrier économique du jour
5. **team-tickers** - Liste des tickers de l'équipe GOB
6. **fmp-ratings** - Notations et recommandations analystes

## Ton et Style
- **Énergique** - Commencer la journée avec dynamisme
- **Professionnel** - Crédibilité et rigueur analytique
- **Optimiste** - Encourageant sans être naïf
- **Accessible** - Langage clair, pas de jargon excessif
- **Actionnable** - Informations concrètes et utilisables

## Longueur
200-300 mots (format email concis)

## Configuration Email
- **Sujet**: `📊 Emma En Direct · Matin - {date}`
- **Expéditeur**: Emma - Assistant Financier
- **Preview Text**: "Briefing matinal : Marchés, actualités et focus sur nos tickers d'équipe"

## Données Requises
- **market_indices** - Indices boursiers principaux
- **overnight_news** - Actualités overnight (Asie, Europe)
- **team_tickers_prices** - Prix actuels des tickers d'équipe
- **economic_events** - Événements économiques du jour

## Prompt Système (Emma Agent)

```
Tu es Emma, l'assistante financière intelligente. Génère un briefing matinal concis et informatif pour les investisseurs. Structure ton email comme suit :

1. **Ouverture** (2-3 phrases) : Salutation énergique et contexte du marché
2. **Marché en bref** : Indices principaux, tendances overnight
3. **Actualités clés** (3-4 points) : Nouvelles importantes qui impactent les marchés
4. **Focus tickers d'équipe** : Mise en avant de 2-3 actions de notre liste avec prix et variations
5. **Événements du jour** : Calendrier économique et résultats d'entreprises importants
6. **Conseil Emma** : Insight ou recommandation basée sur l'analyse
7. **Fermeture** : Ton optimiste et rappel de la disponibilité

Utilise les outils disponibles pour récupérer des données réelles et à jour. Sois précis, professionnel mais accessible. Longueur : 200-300 mots.
```

## Exemples de Titres de Sections

### Ouverture
- "Bonjour et bon matin ! Les marchés se préparent à..."
- "Excellente journée à vous ! L'Asie a clôturé en hausse..."
- "Bienvenue à cette nouvelle session ! Les futures américains..."

### Marché en Bref
- "📊 Vue d'ensemble : Marchés overnight et tendances"
- "🌍 Tour d'horizon global : Asie, Europe, Amérique"

### Actualités Clés
- "📰 Les nouvelles qui font bouger les marchés"
- "⚡ Actualités à impact : Ce qui compte aujourd'hui"

### Focus Tickers
- "🎯 Nos tickers à surveiller aujourd'hui"
- "💼 Watchlist GOB : Opportunités du jour"

### Événements du Jour
- "📅 Calendrier : Ce qui nous attend"
- "⏰ À ne pas manquer aujourd'hui"

### Conseil Emma
- "💡 Mon conseil pour la journée"
- "🧠 Perspective Emma : Point d'attention"

## API Endpoints

### Génération du Briefing
```
GET /api/emma-briefing?type=morning
```

### Déclenchement Cron (automatique)
```
POST /api/briefing-cron
Authorization: Bearer {CRON_SECRET}
Body: { "type": "morning" }
```

## Considérations Spéciales

### Timing du Marché
- 7h20 EST = **Avant l'ouverture** des marchés nord-américains (9h30)
- Focus sur **overnight performance** (Asie, Europe)
- Anticipation des **futures** et pré-market

### Sources de Données
1. Marchés overnight déjà clôturés (Asie)
2. Marchés européens en cours (7h20 EST = 13h20 CET)
3. Futures américains actifs
4. Calendrier économique pour la journée complète

### Attention Particulière
- **Données fraîches** : Utiliser les prix les plus récents
- **Contexte overnight** : Expliquer les mouvements asiatiques/européens
- **Anticipation** : Préparer les investisseurs pour l'ouverture
- **Catalyseurs** : Identifier les événements clés avant 9h30

## Workflow de Génération

1. **Récupération des données** (api/emma-briefing.js)
   - Charger config depuis `config/briefing-prompts.json`
   - Préparer contexte avec timing Montréal
   - Identifier outils prioritaires

2. **Exécution Emma Agent** (api/emma-agent.js)
   - Exécuter outils en parallèle (max 5)
   - Synthèse via Perplexity (avec données temps réel)
   - Validation de la fiabilité

3. **Formatage HTML** (api/emma-briefing.js)
   - Conversion markdown → HTML
   - Application du template email
   - Ajout disclaimer

4. **Envoi Email** (api/briefing-cron.js)
   - Via Resend API
   - Destinataires depuis env: `RESEND_TO_EMAIL`
   - Tracking dans Supabase

## Variables d'Environnement Requises

```bash
# API Keys pour données
GEMINI_API_KEY=xxx              # Gemini (Emma primary)
PERPLEXITY_API_KEY=xxx          # Perplexity (real-time synthesis)
FMP_API_KEY=xxx                 # Financial Modeling Prep

# Email
RESEND_API_KEY=xxx              # Resend pour envoi emails
RESEND_TO_EMAIL=xxx@xxx.com     # Destinataires (séparés par virgules)

# Cron
CRON_SECRET=xxx                 # Authentification cron jobs

# Database
SUPABASE_URL=xxx                # Supabase URL
SUPABASE_SERVICE_ROLE_KEY=xxx   # Supabase key
```

## Suivi et Historique

Chaque briefing est enregistré dans Supabase:
- **Table**: `briefings_history`
- **Colonnes**: `type`, `content`, `sent_status`, `tools_used`, `execution_time_ms`, `created_at`

## Disclaimer

> Les informations fournies sont à des fins éducatives uniquement et ne constituent pas des conseils financiers personnalisés.

---

**Dernière mise à jour**: Novembre 2025
**Maintenu par**: Équipe GOB - JSL AI
