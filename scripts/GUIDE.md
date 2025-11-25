# 🚀 Guide d'Utilisation - Scripts Finance Pro

## 📋 Prérequis

1. **Credentials Supabase** : Créez un fichier `.env` dans `scripts/` :

```bash
cd scripts
cp .env.template .env
# Éditez .env et ajoutez votre SUPABASE_ANON_KEY
```

2. **Installation** :

```bash
npm install
```

## 🎯 Scripts Disponibles

### 1️⃣ Enrichir la Watchlist (`enrich-watchlist`)

Ajoute **~100 large caps** (Canada, US, International) à la watchlist Supabase.

```bash
npm run enrich-watchlist
```

**Tickers ajoutés :**
- 🇨🇦 **Canada** : RY.TO, TD.TO, SHOP.TO, CNR.TO, ENB.TO, etc. (~30 tickers)
- 🇺🇸 **US** : AAPL, MSFT, GOOGL, JPM, JNJ, WMT, etc. (~50 tickers)
- 🌍 **International** : ASML, TSM, NESN, LVMH, etc. (~20 tickers)

Tous les tickers sont marqués comme **favoris** (⭐ étoile dans 3p1).

---

### 2️⃣ Charger les Données (`bulk-load`)

Charge les données FMP et crée des snapshots pour **tous les tickers** de la watchlist.

```bash
npm run bulk-load
```

**Ce que fait le script :**
1. Récupère tous les tickers de `team_tickers` + `ticker_watchlist`
2. Pour chaque ticker :
   - Appelle `/api/fmp-company-data`
   - Calcule les hypothèses (CAGR, ratios moyens)
   - Sauvegarde un snapshot dans `finance_snapshots`
3. Affiche un résumé (✅ succès / ❌ échecs)

**Rate Limiting :** 500ms entre chaque requête (évite de surcharger FMP API)

---

### 3️⃣ Setup Complet (`full-setup`)

Exécute les 2 scripts en séquence :

```bash
npm run full-setup
```

1. **Enrichit** la watchlist avec les large caps
2. **Charge** les données pour tous les tickers

⏱️ **Temps estimé :** ~10-15 minutes pour 100 tickers

---

## 📊 Résultats Attendus

Après `npm run full-setup`, vous aurez :

✅ **~100 tickers** dans la watchlist Supabase  
✅ **~100 snapshots** dans `finance_snapshots`  
✅ **Tous les tickers** visibles dans Finance Pro 3p1  
✅ **Données auto-remplies** (prix, ratios, projections)

---

## 🔧 Dépannage

### Erreur : "Missing Supabase credentials"
➡️ Vérifiez que `.env` contient `SUPABASE_ANON_KEY`

### Erreur : "API error: 429 Too Many Requests"
➡️ FMP API rate limit atteint. Attendez quelques minutes et relancez.

### Erreur : "No data available for ticker XXX"
➡️ Normal pour certains tickers internationaux (.TO, .PA). Ils seront ignorés.

---

## 📝 Notes

- Les tickers canadiens (`.TO`) nécessitent un plan FMP premium
- Les tickers internationaux peuvent avoir des données limitées
- Les snapshots existants ne sont **pas écrasés** (création uniquement)
