# GOB - JLab™ Dashboard

Dashboard financier complet avec JLab™ (ex-JStocks™) pour le Groupe Ouellet Bolduc.

## 📚 Documentation

**👉 [Consultez la documentation complète](./docs/README.md)**

## 🧪 Emma SMS Test Server

- `test-sms-server.js` reproduit exactement les webhooks Twilio → Emma (n8n) avec trois modes: `test`, `prod_local`, `prod_cloud`.
- Démarrage rapide :
  ```bash
  # Mode test (numéros fictifs)
  npm run sms:test-server

  # Mode prod local (Twilio + ngrok)
  MODE=prod_local PUBLIC_URL=https://<ngrok>.ngrok.io npm run sms:test-server
  ```
- Le script `npm start` lance automatiquement `test-sms-server.js` (utile pour Render/Railway ou tout hébergeur Node).
- Dashboard: `http://localhost:3000` (modifiable via `TEST_SMS_PORT` / `PORT`).
- Scénarios automatiques alignés sur les vraies commandes Emma : `npm run sms:scenarios`.
- Guide complet: [`integration-guide.md`](./integration-guide.md) – connections n8n, Twilio, variables d'environnement.
- Nouveau webhook n8n dédié aux tests `gob-sms-webhook-test` (dans `n8n-workflows/sms-workflow.json`) pour isoler les simulations tout en gardant la logique centralisée.
- **Panneau Admin (Dashboard → Admin JSLAI → Emma SMS)** : interface graphique pour changer les variables `.env`, démarrer/arrêter le serveur test, lancer les scénarios et vérifier les webhooks Twilio/n8n sans toucher aux fichiers. Le dashboard Render (conversations, formulaire SMS) est également embarqué directement dans cet onglet dès que `PUBLIC_URL` pointe vers ton instance Render/Railway.

### 🚀 Démarrage Rapide
- **[Guide principal](./docs/user-guides/LISEZ_MOI_AU_REVEIL.md)** - Tout ce qu'il faut savoir
- **[Démarrage rapide](./docs/user-guides/DEMARRAGE_RAPIDE.md)** - Mise en route
- **[Vue d'ensemble](./docs/user-guides/TOUT_EN_UN_COUP_D_OEIL.md)** - Fonctionnalités

### 🔧 Pour les développeurs
- **[Plan d'implémentation](./docs/technical/COMPLETE_IMPLEMENTATION_PLAN.md)**
- **[Résultats des tests](./docs/TESTS_FINAUX_COMPLETS.md)**
- **[Configuration APIs](./docs/api/CONFIGURATION_CLES_API.md)**
- **⚠️ [Répertoire des Erreurs](./docs/REPERTOIRE_COMPLET_ERREURS.md)** - **CRITIQUE**: 32+ erreurs documentées avec solutions. **À consulter avant de coder**

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
