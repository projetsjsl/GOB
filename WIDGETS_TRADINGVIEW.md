# 🎯 Widgets TradingView - Guide complet

## Widgets à intégrer dans Emma

### 1. ✅ Advanced Chart (DÉJÀ INTÉGRÉ)
**Tag**: `[CHART:TRADINGVIEW:NASDAQ:AAPL]`
**Usage**: Graphique technique complet avec tous les outils
**Taille**: 400px de hauteur
**Features**: Indicateurs techniques, outils de dessin, timeframes

---

### 2. 📊 Mini Chart (À AJOUTER)
**Tag**: `[MINI:TRADINGVIEW:AAPL]`
**Description**: Version compacte du graphique
**Usage**: Comparaisons rapides, plusieurs tickers côte à côte
**Taille**: 220px de hauteur
**Code iframe**:
```html
<iframe src="https://www.tradingview.com/embed-widget/symbol-overview/?locale=fr&symbol=AAPL&theme=dark&style=1&withdateranges=false&showvolume=false&showma=false&width=100%&height=220"></iframe>
```

---

### 3. 🎯 Technical Analysis (À AJOUTER)
**Tag**: `[TECHNICAL:TRADINGVIEW:AAPL]`
**Description**: Résumé technique avec signal Achat/Vente
**Usage**: Signal d'achat/vente rapide basé sur indicateurs
**Taille**: 200px de hauteur
**Affiche**:
- Résumé (Achat Fort, Achat, Neutre, Vente, Vente Fort)
- Moyennes mobiles
- Oscillateurs
**Code iframe**:
```html
<iframe src="https://www.tradingview.com/embed-widget/technical-analysis/?locale=fr&symbol=AAPL&interval=1D&theme=dark&width=100%&height=200"></iframe>
```

---

### 4. 🌐 Market Overview (À AJOUTER)
**Tag**: `[OVERVIEW:TRADINGVIEW]`
**Description**: Vue d'ensemble multi-marchés
**Usage**: Contexte global (indices, forex, crypto)
**Taille**: 400px de hauteur
**Affiche**:
- Indices majeurs (S&P 500, Nasdaq, Dow Jones)
- Forex (EUR/USD, GBP/USD, etc.)
- Cryptos (BTC, ETH)
- Matières premières (Or, Pétrole)
**Code iframe**:
```html
<iframe src="https://www.tradingview.com/embed-widget/market-overview/?locale=fr&theme=dark&showChart=true&width=100%&height=400&tabs=indices,forex,crypto,futures"></iframe>
```

---

### 5. 📜 Ticker Tape (À AJOUTER)
**Tag**: `[TAPE:TRADINGVIEW:AAPL,MSFT,GOOGL]`
**Description**: Bandeau défilant avec plusieurs tickers
**Usage**: Watchlist en temps réel
**Taille**: 46px de hauteur
**Code iframe**:
```html
<iframe src="https://www.tradingview.com/embed-widget/ticker-tape/?locale=fr&symbols=AAPL,MSFT,GOOGL&theme=dark&isTransparent=false&displayMode=adaptive&width=100%&height=46"></iframe>
```

---

### 6. 💹 Single Quote (À AJOUTER)
**Tag**: `[QUOTE:TRADINGVIEW:AAPL]`
**Description**: Citation simple avec prix actuel
**Usage**: Prix rapide et élégant
**Taille**: 58px de hauteur
**Affiche**: Ticker, prix, variation %
**Code iframe**:
```html
<iframe src="https://www.tradingview.com/embed-widget/single-quote/?locale=fr&symbol=AAPL&theme=dark&width=100%&height=58"></iframe>
```

---

## 📋 Modifications à faire

### 1. Ajouter détection des nouveaux tags (dans formatMessageText)

```javascript
// [MINI:TRADINGVIEW:TICKER]
t = t.replace(/\[MINI:TRADINGVIEW:([A-Z]+)\]/g, (_m, ticker) => {
    const idx = imageTags.length;
    imageTags.push({ type: 'tradingview-mini', ticker });
    return `@@IMAGE_TAG_${idx}@@`;
});

// [TECHNICAL:TRADINGVIEW:TICKER]
t = t.replace(/\[TECHNICAL:TRADINGVIEW:([A-Z]+)\]/g, (_m, ticker) => {
    const idx = imageTags.length;
    imageTags.push({ type: 'tradingview-technical', ticker });
    return `@@IMAGE_TAG_${idx}@@`;
});

// [OVERVIEW:TRADINGVIEW]
t = t.replace(/\[OVERVIEW:TRADINGVIEW\]/g, (_m) => {
    const idx = imageTags.length;
    imageTags.push({ type: 'tradingview-overview' });
    return `@@IMAGE_TAG_${idx}@@`;
});

// [TAPE:TRADINGVIEW:TICKERS]
t = t.replace(/\[TAPE:TRADINGVIEW:([A-Z,]+)\]/g, (_m, tickers) => {
    const idx = imageTags.length;
    imageTags.push({ type: 'tradingview-tape', tickers });
    return `@@IMAGE_TAG_${idx}@@`;
});

// [QUOTE:TRADINGVIEW:TICKER]
t = t.replace(/\[QUOTE:TRADINGVIEW:([A-Z]+)\]/g, (_m, ticker) => {
    const idx = imageTags.length;
    imageTags.push({ type: 'tradingview-quote', ticker });
    return `@@IMAGE_TAG_${idx}@@`;
});
```

### 2. Ajouter les cases dans le switch (dans la réinsertion)

```javascript
case 'tradingview-mini':
    html = `<div class="my-3 w-full max-w-xl mx-auto">
        <div class="rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden">
            <div class="text-xs px-2 py-1 ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}">
                📊 Mini Chart: ${tag.ticker}
            </div>
            <iframe src="https://www.tradingview.com/embed-widget/symbol-overview/?locale=fr&symbol=${tag.ticker}&theme=${isDarkMode ? 'dark' : 'light'}&style=1&withdateranges=false&showvolume=false&showma=false&width=100%&height=220" style="width:100%;height:220px;border:0;" frameborder="0"></iframe>
        </div>
    </div>`;
    break;

case 'tradingview-technical':
    html = `<div class="my-3 w-full max-w-md mx-auto">
        <div class="rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden">
            <div class="text-xs px-2 py-1 ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}">
                🎯 Analyse Technique: ${tag.ticker}
            </div>
            <iframe src="https://www.tradingview.com/embed-widget/technical-analysis/?locale=fr&symbol=${tag.ticker}&interval=1D&theme=${isDarkMode ? 'dark' : 'light'}&width=100%&height=200" style="width:100%;height:200px;border:0;" frameborder="0"></iframe>
        </div>
    </div>`;
    break;

case 'tradingview-overview':
    html = `<div class="my-3 w-full mx-auto">
        <div class="rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden">
            <div class="text-xs px-2 py-1 ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}">
                🌐 Market Overview
            </div>
            <iframe src="https://www.tradingview.com/embed-widget/market-overview/?locale=fr&theme=${isDarkMode ? 'dark' : 'light'}&showChart=true&width=100%&height=400&tabs=indices,forex,crypto,futures" style="width:100%;height:400px;border:0;" frameborder="0"></iframe>
        </div>
    </div>`;
    break;

case 'tradingview-tape':
    html = `<div class="my-3 w-full mx-auto">
        <iframe src="https://www.tradingview.com/embed-widget/ticker-tape/?locale=fr&symbols=${tag.tickers}&theme=${isDarkMode ? 'dark' : 'light'}&isTransparent=false&displayMode=adaptive&width=100%&height=46" style="width:100%;height:46px;border:0;" frameborder="0"></iframe>
    </div>`;
    break;

case 'tradingview-quote':
    html = `<div class="my-3 w-full max-w-xs mx-auto">
        <iframe src="https://www.tradingview.com/embed-widget/single-quote/?locale=fr&symbol=${tag.ticker}&theme=${isDarkMode ? 'dark' : 'light'}&width=100%&height=58" style="width:100%;height:58px;border:0;" frameborder="0"></iframe>
    </div>`;
    break;
```

### 3. Mettre à jour le prompt Emma (dans api/emma-agent.js)

Ajouter ces nouveaux tags à la section "GRAPHIQUES ET VISUALISATIONS":

```
**Widgets TradingView disponibles:**
- [CHART:TRADINGVIEW:EXCHANGE:TICKER] → Graphique complet avec outils
- [MINI:TRADINGVIEW:TICKER] → Mini-graphique compact
- [TECHNICAL:TRADINGVIEW:TICKER] → Analyse technique (signal achat/vente)
- [OVERVIEW:TRADINGVIEW] → Vue d'ensemble multi-marchés
- [TAPE:TRADINGVIEW:TICKER1,TICKER2,TICKER3] → Bandeau watchlist
- [QUOTE:TRADINGVIEW:TICKER] → Citation simple avec prix
```

---

## 🎨 Exemples d'utilisation pour Emma

### Analyse technique rapide:
```
Voici l'analyse de Microsoft:

[QUOTE:TRADINGVIEW:MSFT]

Signal technique actuel:

[TECHNICAL:TRADINGVIEW:MSFT]

Le résumé technique indique un signal d'achat...
```

### Comparaison multi-tickers:
```
Voici une vue rapide de vos actions:

[TAPE:TRADINGVIEW:AAPL,MSFT,GOOGL,AMZN,TSLA]

Détails:
[MINI:TRADINGVIEW:AAPL]
[MINI:TRADINGVIEW:MSFT]
```

### Contexte global du marché:
```
Contexte des marchés aujourd'hui:

[OVERVIEW:TRADINGVIEW]

Les indices américains sont en hausse...
```

---

## ✅ Checklist d'implémentation

- [ ] Ajouter détection des 5 nouveaux tags
- [ ] Ajouter les 5 cases dans le switch
- [ ] Mettre à jour le prompt Emma
- [ ] Tester chaque widget
- [ ] Commit et push

---

*Document créé le 31/10/2025 - GOB Finance Dashboard*
