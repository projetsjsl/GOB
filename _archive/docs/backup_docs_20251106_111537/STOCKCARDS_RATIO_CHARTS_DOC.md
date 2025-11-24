# 📊 Documentation: Cartes Boursières et Graphiques de Ratios

**Date:** 31 octobre 2025
**Auteur:** Claude AI pour GOB (Groupe Ouellet Bolduc)
**Version:** 1.0

---

## 🎯 Vue d'ensemble

Cette documentation décrit deux nouvelles fonctionnalités multimédias ajoutées à Emma IA™ pour enrichir les réponses financières avec des visuels professionnels inspirés de Perplexity Finance et Macrotrends.

### Nouvelles fonctionnalités

1. **[STOCKCARD:TICKER]** - Cartes boursières style Perplexity Finance
2. **[RATIO_CHART:TICKER:METRIC]** - Graphiques de ratios historiques style Macrotrends

---

## 💼 1. Cartes Boursières (`[STOCKCARD:TICKER]`)

### Description

Les cartes boursières affichent un résumé visuel professionnel d'une action, incluant:
- Logo de l'entreprise (avec fallback SVG élégant)
- Prix actuel en temps réel
- Variation du jour (%, $) avec couleurs (vert/rouge)
- Heure de la dernière mise à jour
- 4 métriques clés: Capitalisation boursière, Volume, P/E Ratio, 52W Range
- Mini-graphique technique Finviz intégré
- Lien vers Yahoo Finance

### Syntaxe

```
[STOCKCARD:TICKER]
```

### Exemples d'utilisation

#### Exemple 1: Action simple
```
Voici la performance actuelle de Magna International:

[STOCKCARD:MGA]

L'action montre une tendance haussière avec un bon volume.
```

#### Exemple 2: Multiple actions
```
Comparaison des géants technologiques:

**Apple Inc.**
[STOCKCARD:AAPL]

**Microsoft Corp.**
[STOCKCARD:MSFT]

**Tesla Inc.**
[STOCKCARD:TSLA]
```

#### Exemple 3: Actions canadiennes
```
Secteur minier canadien:

[STOCKCARD:SHOP.TO]

[STOCKCARD:WEED.TO]
```

### Tickers supportés

- **US**: AAPL, MSFT, TSLA, NVDA, etc. (tous les symboles US)
- **Canada**: Ajouter `.TO` (TSX) ou `.V` (TSX-V): SHOP.TO, MGA.TO, etc.
- **International**: Tous les tickers avec données FMP disponibles

### Design

La carte affiche:
- **Header**: Logo (12x12) + Nom du ticker + Nom complet + Lien externe
- **Prix**: Large (3xl), USD, en temps réel
- **Variation**: Badge coloré (vert si +, rouge si -) avec % et montant
- **Métriques**: Grille 2x2 avec fond semi-transparent
- **Mini-chart**: Graphique Finviz intégré pleine largeur
- **Effets**: Hover lift, bordure bleue, gradient background, shadow-xl

### API utilisée

- **Data**: `/api/marketdata?ticker=TICKER` (fallback FMP → Finnhub → Alpha Vantage)
- **Logo**: Clearbit API (`logo.clearbit.com`) avec fallback SVG
- **Chart**: Finviz (`finviz.com/chart.ashx`)

---

## 📈 2. Graphiques de Ratios Historiques (`[RATIO_CHART:TICKER:METRIC]`)

### Description

Affiche l'évolution historique (5 ans) d'un ratio ou d'une métrique fondamentale sous forme de tableau professionnel, avec lien vers Macrotrends pour graphiques complets.

### Syntaxe

```
[RATIO_CHART:TICKER:METRIC]
```

### Métriques disponibles

| Code Métrique | Label Français | Description |
|--------------|----------------|-------------|
| `PE` | P/E Ratio | Price-to-Earnings Ratio |
| `PB` | P/B Ratio | Price-to-Book Ratio |
| `PS` | P/S Ratio | Price-to-Sales Ratio |
| `PROFIT_MARGIN` | Marge bénéficiaire | Net Profit Margin (%) |
| `ROE` | Return on Equity | ROE (%) |
| `ROA` | Return on Assets | ROA (%) |
| `DEBT_EQUITY` | Dette/Capitaux propres | Debt-to-Equity Ratio |
| `CURRENT_RATIO` | Ratio de liquidité | Current Ratio |
| `REVENUE_GROWTH` | Croissance du CA | Revenue Growth (%) |
| `EARNINGS_GROWTH` | Croissance des bénéfices | Earnings Growth (%) |

### Exemples d'utilisation

#### Exemple 1: Valorisation
```
Analyse de valorisation d'Apple:

Le P/E Ratio d'Apple a évolué ainsi sur 5 ans:

[RATIO_CHART:AAPL:PE]

Cette tendance montre une expansion multiple cohérente avec la croissance.
```

#### Exemple 2: Profitabilité
```
Microsoft maintient des marges exceptionnelles:

[RATIO_CHART:MSFT:PROFIT_MARGIN]

La marge bénéficiaire reste supérieure à 30% depuis 5 ans.
```

#### Exemple 3: Santé financière
```
Analyse de la structure financière de Tesla:

**Ratio d'endettement:**
[RATIO_CHART:TSLA:DEBT_EQUITY]

**Liquidité:**
[RATIO_CHART:TSLA:CURRENT_RATIO]

L'entreprise a significativement réduit son endettement depuis 2020.
```

#### Exemple 4: Croissance
```
Amazon - Trajectoire de croissance:

**Croissance du chiffre d'affaires:**
[RATIO_CHART:AMZN:REVENUE_GROWTH]

**Croissance des bénéfices:**
[RATIO_CHART:AMZN:EARNINGS_GROWTH]
```

### Design

Le composant affiche:
- **Header**: Nom de la métrique (français) + Ticker + "Historique 5 ans"
- **Badge**: "📊 Analyse fondamentale" (bleu)
- **Tableau**: Année | Valeur (2 décimales)
  - Lignes alternées (gris/blanc en light mode, gris foncé/très foncé en dark mode)
  - Header avec fond distinct
- **Footer**: Source FMP + Lien Macrotrends
- **Effets**: Bordure, shadow-lg, background semi-transparent

### API utilisée

- **Data**: `/api/fmp?endpoint=ratios&ticker=TICKER&period=annual&limit=5`
- **Fallback**: Si données non disponibles, message + lien Macrotrends

---

## 🎨 Intégration dans Emma IA™

### Quand Emma utilise ces tags automatiquement

Emma a été configurée pour utiliser intelligemment ces tags dans les contextes suivants:

#### STOCKCARD automatique pour:
- Questions comme: "Quelle est la performance de [TICKER]?"
- "Comment va [TICKER] aujourd'hui?"
- "Prix actuel de [TICKER]"
- "Donne-moi un aperçu de [TICKER]"
- Briefings quotidiens (actions clés)
- Comparaisons d'actions multiples

#### RATIO_CHART automatique pour:
- "Évolution du P/E de [TICKER]"
- "Marge bénéficiaire historique de [TICKER]"
- "Croissance de [TICKER] sur 5 ans"
- "Analyse fondamentale de [TICKER]"
- "Tendances de valorisation de [TICKER]"
- Briefings approfondis avec analyse fondamentale

### System Prompts mis à jour

Les system prompts suivants ont été enrichis avec les instructions STOCKCARD/RATIO_CHART:

1. **Perplexity Sonar Pro** (chat mode) - `/api/emma-agent.js:1291`
2. **Google Gemini 2.0 Flash** (fallback) - `/api/emma-agent.js:1347`
3. **Claude 3.5 Sonnet** (briefings) - `/api/emma-agent.js:1429`
4. **Emma Briefing Analyst** (briefings détaillés) - `/api/emma-agent.js:1117`

---

## 🧪 Tests et Validation

### Test 1: STOCKCARD simple

**Input utilisateur:**
```
Quelle est la performance actuelle de MGA?
```

**Réponse attendue d'Emma:**
```
Voici la performance actuelle de Magna International (MGA):

[STOCKCARD:MGA]

L'action affiche [analyse contextuelle basée sur les données].
```

**Validation visuelle:**
- ✅ Carte affichée avec logo MGA
- ✅ Prix en temps réel affiché
- ✅ Variation colorée (vert si +, rouge si -)
- ✅ 4 métriques remplies (Market Cap, Volume, P/E, 52W Range)
- ✅ Mini-chart Finviz chargé
- ✅ Lien Yahoo Finance fonctionnel

### Test 2: RATIO_CHART - P/E Ratio

**Input utilisateur:**
```
Montre-moi l'évolution du P/E d'Apple sur 5 ans
```

**Réponse attendue d'Emma:**
```
Évolution du P/E Ratio d'Apple (AAPL) sur 5 ans:

[RATIO_CHART:AAPL:PE]

Le multiple de valorisation a progressé de X à Y, reflectant [analyse].
```

**Validation visuelle:**
- ✅ Header "P/E Ratio" + "AAPL • Historique 5 ans"
- ✅ Badge "📊 Analyse fondamentale"
- ✅ Tableau avec 5 lignes (années 2020-2024)
- ✅ Valeurs numériques formatées (2 décimales)
- ✅ Lien Macrotrends fonctionnel

### Test 3: Multiple STOCKCARDS

**Input utilisateur:**
```
Compare AAPL, MSFT et TSLA
```

**Réponse attendue d'Emma:**
```
Comparaison des trois géants:

**Apple Inc.**
[STOCKCARD:AAPL]

**Microsoft Corp.**
[STOCKCARD:MSFT]

**Tesla Inc.**
[STOCKCARD:TSLA]

Analyse comparative: [insights]
```

**Validation:**
- ✅ Trois cartes affichées côte à côte (ou empilées sur mobile)
- ✅ Chaque carte charge indépendamment
- ✅ Pas d'erreurs JavaScript en console
- ✅ Performance acceptable (< 3s pour charger les 3)

### Test 4: RATIO_CHART - Marge bénéficiaire

**Input utilisateur:**
```
Analyse la profitabilité de Microsoft
```

**Réponse attendue d'Emma:**
```
Analyse de profitabilité de Microsoft:

[RATIO_CHART:MSFT:PROFIT_MARGIN]

Microsoft maintient une marge bénéficiaire exceptionnelle...
```

**Validation:**
- ✅ Header "Marge bénéficiaire"
- ✅ Données PROFIT_MARGIN affichées
- ✅ Valeurs en pourcentage cohérentes

---

## 🔧 Architecture Technique

### Frontend - Tag Parsing System

**Fichier:** `public/beta-combined-dashboard.html`

**Fonction principale:** `formatMessageText(raw)` (lignes 11405-11685)

**Étapes du parsing:**

1. **Extraction des tags** (lignes 11479-11498)
   ```javascript
   // Regex pour STOCKCARD
   t = t.replace(/\[STOCKCARD:([A-Z\.]+)\]/g, (_m, ticker) => {
       imageTags.push({ type: 'stockcard', ticker: ticker });
       return `@@IMAGE_TAG_${idx}@@`;
   });

   // Regex pour RATIO_CHART
   t = t.replace(/\[RATIO_CHART:([A-Z\.]+):([A-Z_]+)\]/g, (_m, ticker, metric) => {
       imageTags.push({ type: 'ratio_chart', ticker: ticker, metric: metric });
       return `@@IMAGE_TAG_${idx}@@`;
   });
   ```

2. **Remplacement par placeholders** (`@@IMAGE_TAG_N@@`)

3. **Markdown processing** (autres tags, formatage, etc.)

4. **Réinsertion HTML** (lignes 11551-11857)
   ```javascript
   t = t.replace(/@@IMAGE_TAG_(\d+)@@/g, (_m, idxStr) => {
       const tag = imageTags[parseInt(idxStr)];

       switch (tag.type) {
           case 'stockcard':
               return generateStockCardHTML(tag);
           case 'ratio_chart':
               return generateRatioChartHTML(tag);
       }
   });
   ```

### Backend - Emma System Prompts

**Fichier:** `api/emma-agent.js`

**Prompts enrichis:**

1. **Briefing Analyst** (lignes 1117-1131)
   ```
   B-BIS) CARTES BOURSIÈRES ET RATIOS HISTORIQUES (NOUVEAU):
   💼 Carte boursière: [STOCKCARD:TICKER]
   📊 Graphique ratios: [RATIO_CHART:TICKER:METRIC]

   Métriques: PE, PB, PS, PROFIT_MARGIN, ROE, etc.
   ```

2. **Perplexity Chat** (lignes 1291+)
   ```
   🎨 TAGS MULTIMÉDIAS DISPONIBLES:
   - [STOCKCARD:TICKER] → Carte boursière professionnelle
   - [RATIO_CHART:TICKER:METRIC] → Évolution historique
   ```

3. **Gemini** (lignes 1355-1359)

4. **Claude** (lignes 1440-1451)

### APIs et Sources de Données

**STOCKCARD data flow:**
```
User Query → Emma Agent → /api/marketdata?ticker=X
                              ↓
                         FMP API (primary)
                              ↓ (fallback)
                         Finnhub API
                              ↓ (fallback)
                         Alpha Vantage
                              ↓
                    Frontend StockCard render
                              ↓
                    Real-time display with:
                    - Clearbit logo
                    - Finviz mini-chart
                    - Yahoo Finance link
```

**RATIO_CHART data flow:**
```
User Query → Emma Agent → /api/fmp?endpoint=ratios&ticker=X
                              ↓
                         FMP Ratios Endpoint
                              ↓
                    Frontend RatioChart render
                              ↓
                    Table display + Macrotrends link
```

---

## 📚 Exemples d'Usage Avancés

### Scénario 1: Analyse sectorielle

**Prompt:**
```
Analyse le secteur technologique en comparant AAPL, MSFT, NVDA et META
```

**Réponse Emma (structure):**
```markdown
## 📊 Analyse Sectorielle - Technologie

### Performance du Jour

[STOCKCARD:AAPL]
[STOCKCARD:MSFT]
[STOCKCARD:NVDA]
[STOCKCARD:META]

### Valorisation Comparative

**Apple - P/E Ratio:**
[RATIO_CHART:AAPL:PE]

**Microsoft - P/E Ratio:**
[RATIO_CHART:MSFT:PE]

**Nvidia - P/E Ratio:**
[RATIO_CHART:NVDA:PE]

**Meta - P/E Ratio:**
[RATIO_CHART:META:PE]

### Insights

Apple et Microsoft affichent des P/E ratios plus stables autour de 30-35x,
reflétant leur maturité. Nvidia montre une expansion significative suite
au boom de l'IA, tandis que Meta a réduit son multiple après 2022.
```

### Scénario 2: Due Diligence complète

**Prompt:**
```
Fais une analyse fondamentale complète de Tesla (TSLA)
```

**Réponse Emma (structure):**
```markdown
## 🔍 Due Diligence - Tesla Inc. (TSLA)

### Vue d'ensemble

[STOCKCARD:TSLA]

### 1. Valorisation

**P/E Ratio - Évolution:**
[RATIO_CHART:TSLA:PE]

**P/S Ratio:**
[RATIO_CHART:TSLA:PS]

### 2. Profitabilité

**Marge bénéficiaire:**
[RATIO_CHART:TSLA:PROFIT_MARGIN]

**Return on Equity:**
[RATIO_CHART:TSLA:ROE]

### 3. Santé financière

**Ratio d'endettement:**
[RATIO_CHART:TSLA:DEBT_EQUITY]

**Liquidité:**
[RATIO_CHART:TSLA:CURRENT_RATIO]

### 4. Croissance

**Revenue Growth:**
[RATIO_CHART:TSLA:REVENUE_GROWTH]

**Earnings Growth:**
[RATIO_CHART:TSLA:EARNINGS_GROWTH]

### Synthèse

[Analyse détaillée basée sur toutes les données visuelles]
```

### Scénario 3: Briefing quotidien

**Prompt:** (automatique via cron)
```
Génère le briefing matinal du 31 octobre 2025
```

**Réponse Emma (extrait):**
```markdown
## 📈 Briefing Matinal - 31 Octobre 2025

### Actions à Surveiller

**Magna International (MGA) - Résultats Q3**
[STOCKCARD:MGA]

L'entreprise publie ses résultats trimestriels aujourd'hui.
Le P/E Ratio est historiquement attractif:

[RATIO_CHART:MGA:PE]

### Movers du Jour

**Tesla +5.2% (annonce surprise)**
[STOCKCARD:TSLA]

**Apple -1.3% (prise de bénéfices)**
[STOCKCARD:AAPL]

...
```

---

## 🚀 Déploiement et Monitoring

### Fichiers modifiés

1. `public/beta-combined-dashboard.html`
   - Ajout regex parsers (lignes 11479-11498)
   - Ajout HTML generators (lignes 11676-11849)
   - ~200 lignes de code ajoutées

2. `api/emma-agent.js`
   - Enrichissement system prompts (4 endroits)
   - ~50 lignes d'instructions ajoutées

### Nouvelles dépendances

**Aucune!** Les tags utilisent les APIs et ressources existantes:
- `/api/marketdata` (déjà en place)
- `/api/fmp` (déjà en place)
- Clearbit, Finviz, Macrotrends (externes, gratuits)

### Performance

**STOCKCARD:**
- Temps de chargement: ~500ms (API call) + ~200ms (render)
- Poids: ~5KB HTML + ~50KB image (Finviz chart)
- **Total par carte: ~55KB, ~700ms**

**RATIO_CHART:**
- Temps de chargement: ~800ms (FMP ratios) + ~100ms (render)
- Poids: ~2KB HTML (table only)
- **Total par chart: ~2KB, ~900ms**

**Multiple tags:**
- Les appels API sont parallèles (async/await)
- 5 STOCKCARDS = ~3.5s total (non bloquant)

### Monitoring recommandé

```bash
# Vérifier les erreurs API
vercel logs --follow | grep -E "(STOCKCARD|RATIO_CHART|marketdata|ratios)"

# Tester les endpoints
curl "https://GOB.vercel.app/api/marketdata?ticker=MGA"
curl "https://GOB.vercel.app/api/fmp?endpoint=ratios&ticker=AAPL&period=annual&limit=5"
```

---

## 🐛 Troubleshooting

### Problème 1: STOCKCARD ne charge pas les données

**Symptôme:** Carte affiche "--" pour toutes les métriques

**Causes possibles:**
1. API `/api/marketdata` down ou timeout
2. Ticker invalide ou non supporté
3. Rate limit FMP atteint

**Solution:**
```javascript
// Vérifier console navigateur
// Devrait afficher: "Erreur StockCard TICKER: [error]"

// Tester l'API directement
fetch('/api/marketdata?ticker=MGA')
  .then(r => r.json())
  .then(console.log);

// Vérifier variables d'environnement Vercel
vercel env ls
```

### Problème 2: RATIO_CHART affiche "Données non disponibles"

**Symptôme:** Message "Données non disponibles pour ce ratio"

**Causes possibles:**
1. FMP ne fournit pas ce ratio pour ce ticker
2. Endpoint `/api/fmp` incorrectement configuré
3. Nom de métrique incorrect (casse)

**Solution:**
```javascript
// Vérifier l'API FMP directement
fetch('/api/fmp?endpoint=ratios&ticker=AAPL&period=annual&limit=5')
  .then(r => r.json())
  .then(data => console.log(data.data));

// Vérifier que la métrique existe dans la réponse
// Ex: data.data[0].pe, data.data[0].profit_margin

// Mapper le code METRIC au champ FMP
// PE → pe
// PROFIT_MARGIN → profit_margin (lowercase dans FMP)
```

### Problème 3: Logo ne s'affiche pas

**Symptôme:** Logo remplacé par SVG fallback

**Cause:** Clearbit n'a pas le logo pour ce ticker

**Solution:** C'est normal! Le fallback SVG est volontaire:
- SVG avec initiale du ticker sur fond bleu
- Design cohérent et professionnel
- Pas d'action requise

### Problème 4: Mini-chart Finviz ne charge pas

**Symptôme:** Zone vide ou erreur 404

**Cause:** Ticker non supporté par Finviz (ex: certains tickers canadiens)

**Solution:**
```html
<!-- Le tag onerror du composant gère automatiquement -->
<!-- Pas d'action requise, l'erreur est silencieuse -->
<!-- Le reste de la carte reste fonctionnel -->
```

### Problème 5: Dark mode incorrect

**Symptôme:** Couleurs mal adaptées en mode sombre

**Cause:** `isDarkMode` non propagé correctement

**Solution:**
```javascript
// Vérifier que isDarkMode est bien passé au formatMessageText
// beta-combined-dashboard.html:11685

// Les classes Tailwind conditionnelles doivent utiliser:
${isDarkMode ? 'dark-class' : 'light-class'}

// Exemple:
${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
```

---

## 📖 Changelog

### Version 1.0 (31 octobre 2025)

**Ajouts:**
- ✅ Tag `[STOCKCARD:TICKER]` avec composant React inline
- ✅ Tag `[RATIO_CHART:TICKER:METRIC]` avec 10 métriques
- ✅ Intégration dans 4 system prompts Emma
- ✅ Support dark/light mode
- ✅ Responsive design (mobile/desktop)
- ✅ Fallbacks élégants (logo SVG, message si no data)
- ✅ Documentation complète

**APIs utilisées:**
- `/api/marketdata` (existant)
- `/api/fmp` (existant, endpoint ratios ajouté)
- Clearbit Logo API (externe)
- Finviz Charts (externe)
- Macrotrends (lien externe)

**Fichiers modifiés:**
- `public/beta-combined-dashboard.html` (+200 lignes)
- `api/emma-agent.js` (+50 lignes)

**Tests effectués:**
- ✅ STOCKCARD: AAPL, MSFT, TSLA, MGA, SHOP.TO
- ✅ RATIO_CHART: PE, PROFIT_MARGIN, ROE, DEBT_EQUITY
- ✅ Multiple tags simultanés (5+)
- ✅ Dark/light mode
- ✅ Responsive mobile
- ✅ Fallbacks (logo, data)

---

## 🎓 Ressources et Références

### Inspirations Design

- **Perplexity Finance:** https://www.perplexity.ai/search/mga-stock-xxx
  - Cartes boursières clean avec métriques clés
  - Badges colorés pour variations
  - Mini-charts intégrés

- **Macrotrends:** https://www.macrotrends.net/stocks/charts/AAPL/apple/pe-ratio
  - Graphiques historiques de ratios
  - Tableaux de données annuelles
  - Analyse fondamentale approfondie

### APIs Documentation

- **FMP (Financial Modeling Prep):**
  - Ratios: `https://financialmodelingprep.com/api/v3/ratios/AAPL?period=annual&limit=5`
  - Quote: `https://financialmodelingprep.com/api/v3/quote/AAPL`

- **Clearbit Logo:**
  - `https://logo.clearbit.com/ticker.com`
  - Gratuit, pas de clé API requise
  - Fallback si 404

- **Finviz Charts:**
  - `https://finviz.com/chart.ashx?t=TICKER&ty=c&ta=0&p=d&s=l`
  - Gratuit, embed autorisé
  - Paramètres: ty=candle/line, ta=indicators, p=period, s=size

### Tailwind CSS Classes Utilisées

```css
/* Cartes */
.rounded-xl, .border-2, .shadow-xl, .hover-lift
.bg-gradient-to-br, .from-gray-900/80, .to-gray-800/80

/* Grid */
.grid, .grid-cols-2, .gap-3

/* Typographie */
.text-3xl, .font-bold, .text-xs, .font-semibold

/* Couleurs dynamiques */
.bg-green-500, .bg-red-500, .text-white
.bg-blue-500/20, .text-blue-300 (dark mode)
.bg-blue-100, .text-blue-700 (light mode)

/* Responsive */
.w-full, .max-w-md, .max-w-3xl, .mx-auto

/* Effets */
.transition-all, .duration-300
.animate-pulse
```

---

## 📞 Support

Pour toute question ou problème:

1. **Documentation existante:**
   - `GUIDE_IMAGES_GRAPHIQUES_PERPLEXITY.md` (tags images généraux)
   - `EMMA_SUGGESTIONS_PROMPTS.md` (suggestions de prompts)
   - `SESSION_MARATHON_31OCT_COMPLETE.md` (VAGUES 1-4)

2. **GitHub Issues:**
   - https://github.com/projetsjsl/GOB/issues

3. **Logs Vercel:**
   ```bash
   vercel logs --follow
   ```

---

**Fin de la documentation STOCKCARDS_RATIO_CHARTS**

Dernière mise à jour: 31 octobre 2025
