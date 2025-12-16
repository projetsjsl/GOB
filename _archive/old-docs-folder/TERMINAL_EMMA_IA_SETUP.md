# Terminal Emma IA - Guide d'Intégration

## Vue d'ensemble

Le Terminal Emma IA est un module complet d'analyse financière intégré au dashboard GOB. Il utilise FMP Premier comme source de données et Supabase comme couche de persistance et de calcul.

## Architecture

```
FMP Premier API
    ↓
Service d'ingestion (fmp-sync.js)
    ↓
Supabase (tables: instruments, metrics, kpi_values, etc.)
    ↓
API Terminal Data (terminal-data.js)
    ↓
Frontend (terminal-emma-ia.html)
    ↓
Dashboard (TerminalEmmaIATab.js)
```

## Installation

### 1. Schéma Supabase

Exécutez le script SQL pour créer les tables :

```bash
# Via Supabase Dashboard ou CLI
psql -h [host] -U [user] -d [database] -f supabase-terminal-emma-ia-schema.sql
```

Ou via l'interface Supabase :
1. Allez dans SQL Editor
2. Copiez le contenu de `supabase-terminal-emma-ia-schema.sql`
3. Exécutez la requête

### 2. Variables d'environnement Vercel

Assurez-vous que les variables suivantes sont configurées dans Vercel :

```bash
# FMP Premier
FMP_API_KEY=votre_cle_fmp_premier

# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_KEY=votre_service_role_key
# OU
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

### 3. Initialisation des KPI

Exécutez le script SQL pour créer des KPI de base :

```bash
psql -h [host] -U [user] -d [database] -f supabase-terminal-emma-ia-kpi-init.sql
```

### 4. Synchronisation initiale des données

Lancez la synchronisation initiale des instruments :

```bash
curl -X POST https://votre-app.vercel.app/api/fmp-sync?action=sync-instruments
```

Puis synchronisez les indices de marché :

```bash
curl -X POST https://votre-app.vercel.app/api/fmp-sync?action=sync-indices
```

## Utilisation

### Synchronisation des données FMP

Le service `fmp-sync.js` permet de synchroniser les données FMP vers Supabase :

#### Actions disponibles :

1. **sync-instruments** : Synchronise la liste des instruments (S&P 500, TSX)
   ```bash
   POST /api/fmp-sync?action=sync-instruments
   ```

2. **sync-quote** : Synchronise le prix actuel d'un symbole
   ```bash
   POST /api/fmp-sync?action=sync-quote&symbol=AAPL
   ```

3. **sync-history** : Synchronise l'historique des prix
   ```bash
   POST /api/fmp-sync?action=sync-history&symbol=AAPL&limit=252
   ```

4. **sync-fundamentals** : Synchronise les ratios et key metrics
   ```bash
   POST /api/fmp-sync?action=sync-fundamentals&symbol=AAPL
   ```

5. **sync-indices** : Synchronise les indices de marché
   ```bash
   POST /api/fmp-sync?action=sync-indices
   ```

6. **sync-all** : Synchronisation complète pour un symbole
   ```bash
   POST /api/fmp-sync?action=sync-all&symbol=AAPL
   ```

### Calcul des KPI

Le moteur KPI (`kpi-engine.js`) calcule les valeurs de KPI :

#### Calcul pour un symbole :
```bash
POST /api/kpi-engine
{
  "action": "compute",
  "kpi_code": "QUALITY_SCORE_V1",
  "symbol": "AAPL",
  "as_of": "2025-01-15"  # optionnel
}
```

#### Calcul en batch :
```bash
POST /api/kpi-engine
{
  "action": "compute-batch",
  "kpi_code": "QUALITY_SCORE_V1",
  "symbols": ["AAPL", "MSFT", "GOOGL"],
  "as_of": "2025-01-15"  # optionnel
}
```

### Accès aux données

L'API `terminal-data.js` expose les données pour le frontend :

#### Instruments :
```bash
GET /api/terminal-data?action=instruments&country=US&limit=100&offset=0
```

#### Valeurs de KPI :
```bash
GET /api/terminal-data?action=kpi-values&kpi_code=QUALITY_SCORE_V1&symbols=AAPL,MSFT,GOOGL
```

#### Indices de marché :
```bash
GET /api/terminal-data?action=market-indices
```

#### Historique des prix :
```bash
GET /api/terminal-data?action=price-history&symbol=AAPL&days=252
```

#### Métriques d'un symbole :
```bash
GET /api/terminal-data?action=symbol-metrics&symbol=AAPL&metric_codes=ROIC_TTM,FCF_YIELD
```

## Automatisation (Cron Jobs)

### Vercel Cron

Ajoutez dans `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/fmp-sync?action=sync-indices",
      "schedule": "0 9,15,21 * * *"
    },
    {
      "path": "/api/fmp-sync?action=sync-instruments",
      "schedule": "0 0 * * 1"
    }
  ]
}
```

### Synchronisation quotidienne des quotes

Créez un cron job pour synchroniser les quotes des instruments actifs :

```javascript
// Dans un Edge Function Supabase ou un worker externe
const symbols = await getActiveSymbols();
for (const symbol of symbols) {
  await syncQuote(symbol);
}
```

## Ajout d'un nouveau KPI

### 1. Créer la définition dans Supabase

```sql
INSERT INTO kpi_definitions (name, code, expression, description, category, is_active)
VALUES (
  'Quality Score V1',
  'QUALITY_SCORE_V1',
  '(ROIC_TTM * 0.3) + (NET_MARGIN_TTM * 0.3) + (FCF_YIELD * 0.4)',
  'Score de qualité basé sur ROIC, marge nette et FCF yield',
  'Quality',
  true
);
```

### 2. Ajouter les variables

```sql
INSERT INTO kpi_variables (kpi_id, variable_name, metric_code, weight, order_index)
SELECT 
  id,
  'ROIC_TTM',
  'ROIC_TTM',
  0.3,
  1
FROM kpi_definitions WHERE code = 'QUALITY_SCORE_V1';

-- Répéter pour chaque variable
```

### 3. Tester le calcul

```bash
curl -X POST https://votre-app.vercel.app/api/kpi-engine \
  -H "Content-Type: application/json" \
  -d '{
    "action": "compute",
    "kpi_code": "QUALITY_SCORE_V1",
    "symbol": "AAPL"
  }'
```

## Intégration dans le Dashboard

L'onglet Terminal Emma IA est déjà créé dans `TerminalEmmaIATab.js`. Pour l'ajouter au dashboard principal :

1. Ajoutez le script dans `beta-combined-dashboard.html` :

```html
<script type="text/babel" src="js/dashboard/components/tabs/TerminalEmmaIATab.js"></script>
```

2. Ajoutez le bouton d'onglet dans la navigation (cherchez où les autres onglets sont définis)

3. Ajoutez le rendu conditionnel du contenu :

```javascript
{activeTab === 'terminal-emma-ia' && (
  <TerminalEmmaIATab isDarkMode={isDarkMode} />
)}
```

## Structure des données

### Table: instruments
Stocke les informations de base sur les instruments financiers.

### Table: metrics
Stocke les métriques atomiques calculées à partir de FMP (ROIC_TTM, FCF_YIELD, etc.).

### Table: kpi_definitions
Définitions des KPI avec leurs formules.

### Table: kpi_variables
Variables utilisées dans les formules KPI.

### Table: kpi_values
Valeurs calculées des KPI par symbole et date.

### Table: watchlists
Listes de surveillance des utilisateurs.

### Table: price_history
Historique des prix OHLC.

## Troubleshooting

### Les données ne se synchronisent pas

1. Vérifiez que `FMP_API_KEY` est configurée dans Vercel
2. Vérifiez les logs dans `job_logs` :
   ```sql
   SELECT * FROM job_logs ORDER BY started_at DESC LIMIT 10;
   ```

### Les KPI ne se calculent pas

1. Vérifiez que les métriques nécessaires existent :
   ```sql
   SELECT * FROM metrics WHERE symbol = 'AAPL' ORDER BY as_of DESC;
   ```

2. Vérifiez que la définition du KPI existe et est active :
   ```sql
   SELECT * FROM kpi_definitions WHERE code = 'QUALITY_SCORE_V1';
   ```

3. Vérifiez les variables du KPI :
   ```sql
   SELECT * FROM kpi_variables WHERE kpi_id = (SELECT id FROM kpi_definitions WHERE code = 'QUALITY_SCORE_V1');
   ```

### L'iframe ne charge pas

1. Vérifiez que `/terminal-emma-ia.html` est accessible
2. Vérifiez la console du navigateur pour les erreurs CORS
3. Vérifiez que les API endpoints répondent correctement

## Prochaines étapes

- [ ] Ajouter plus de KPI prédéfinis
- [ ] Implémenter la page de détail titre (`/titre/[symbol]`)
- [ ] Ajouter des graphiques interactifs (Chart.js)
- [ ] Implémenter le système de watchlists utilisateur
- [ ] Ajouter des alertes basées sur les KPI
- [ ] Optimiser les performances avec du caching

## Support

Pour toute question ou problème, consultez :
- `docs/REPERTOIRE_COMPLET_ERREURS.md` pour les erreurs courantes
- `CLAUDE.md` pour l'architecture générale du projet

