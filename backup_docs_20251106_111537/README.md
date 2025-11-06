# GOB - JLab™ Dashboard

Dashboard financier complet avec JLab™ (ex-JStocks™) pour le Groupe Ouellet Bolduc.

## 📚 Documentation

**👉 [Consultez la documentation complète](./docs/README.md)**

### 🚀 Démarrage Rapide
- **[Guide principal](./docs/user-guides/LISEZ_MOI_AU_REVEIL.md)** - Tout ce qu'il faut savoir
- **[Démarrage rapide](./docs/user-guides/DEMARRAGE_RAPIDE.md)** - Mise en route
- **[Vue d'ensemble](./docs/user-guides/TOUT_EN_UN_COUP_D_OEIL.md)** - Fonctionnalités

### 🔧 Pour les développeurs
- **[Plan d'implémentation](./docs/technical/COMPLETE_IMPLEMENTATION_PLAN.md)**
- **[Résultats des tests](./docs/technical/TEST_RESULTS.md)**
- **[Configuration APIs](./docs/api/CONFIGURATION_CLES_API.md)**

---

## Ancien projet Seeking Alpha

## Installation

1. Ouvrez le dashboard: https://projetsjsl.github.io/seeking-alpha-auto/
2. Entrez votre token GitHub (créé sur https://github.com/settings/tokens avec permission "repo")
3. Ajoutez vos tickers via l'interface

## Scraping des données

1. Téléchargez `scraper-snippet.js`
2. Ouvrez Chrome et connectez-vous à Seeking Alpha
3. F12 > Sources > Snippets > New snippet
4. Collez le code de `scraper-snippet.js`
5. Remplacez VOTRE_TOKEN_ICI par votre token GitHub
6. Clic droit > Run

Le scraper va automatiquement extraire toutes les données et les sauvegarder sur GitHub.

## Fichiers

- `index.html` - Dashboard web
- `scraper-snippet.js` - Script de scraping Chrome
- `tickers.json` - Liste des tickers à suivre
- `stock_data.json` - Données scrapées
# Test deployment Mon Oct 13 15:42:10 EDT 2025
