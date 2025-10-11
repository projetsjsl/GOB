# 📚 Documentation des APIs - GOB Dashboard

## ✅ Point 2: Validation du Prompt Emma

Emma reçoit **TOUJOURS** un prompt système personnalisé avant la demande de l'utilisateur.

### Configuration du Prompt

Le prompt est défini dans `public/emma-financial-profile.js` et stocké dans `localStorage` sous la clé `emma-financial-prompt`.

**Contenu du prompt système :**
```
Tu es Emma, une assistante virtuelle spécialisée en analyse financière. 
Tu es professionnelle, experte et bienveillante.

**Ton rôle :**
- Aider les utilisateurs avec l'analyse et l'évaluation financière
- Fournir des conseils basés sur des données fiables
- Expliquer les concepts financiers de manière claire
- Guider dans l'interprétation des données du dashboard

**Règles IMPORTANTES :**
- Utilise TOUJOURS les fonctions disponibles pour extraire des données réelles
- N'utilise JAMAIS de chiffres "à titre d'exemple" ou fictifs
- Si une donnée est indisponible, explique-le clairement et propose une alternative
- Toujours rappeler que pour des conseils personnalisés, consulter un expert qualifié
```

### Où le prompt est utilisé

1. **Frontend**: `public/emma-gemini-service.js` (ligne 98-101, 146-147)
2. **Backend**: `api/gemini/chat.js` (ligne 34-67)

Le prompt est **toujours injecté** avant le message de l'utilisateur.

---

## ✅ Point 4: Retrait des Données Démo

**TERMINÉ** - Toutes les données de démonstration ont été retirées.

### APIs Modifiées

#### `/api/marketdata`
- ❌ Plus de données démo
- ✅ Retourne erreur 503 si aucune clé API configurée
- ✅ Force l'utilisation de vraies sources (Yahoo, Finnhub, Alpha Vantage, Twelve Data)
- ✅ Fallback automatique entre sources disponibles

#### `/api/news`
- ❌ Plus de données démo
- ✅ Retourne erreur 503 si aucune clé API configurée
- ✅ Utilise plusieurs sources (NewsAPI.ai, Finnhub, Alpha Vantage)
- ✅ Retourne erreur si toutes les sources échouent

### Comportement Actuel

Si une API n'a pas de clés configurées :
```json
{
  "error": "Service indisponible",
  "message": "Aucune clé API configurée. Veuillez configurer au moins une des variables d'environnement suivantes : FINNHUB_API_KEY, ALPHA_VANTAGE_API_KEY, TWELVE_DATA_API_KEY",
  "requiredKeys": ["FINNHUB_API_KEY", "ALPHA_VANTAGE_API_KEY", "TWELVE_DATA_API_KEY"]
}
```

---

## ✅ Point 6: API GitHub Update et Save Tickers

### Différence entre les deux APIs

#### `/api/save-tickers` (POST)
**Objectif:** Sauvegarder la **liste centralisée** des tickers que vous suivez

**Utilisation:**
```javascript
POST /api/save-tickers
{
  "tickers": ["AAPL", "MSFT", "CVS", "GOOGL"]
}
```

**Ce qu'elle fait:**
- Valide les tickers (1-5 lettres majuscules)
- Sauvegarde dans `public/tickers.json` sur GitHub
- Crée un commit automatique
- Permet de synchroniser votre watchlist entre appareils

**Fichier créé:** `public/tickers.json`
```json
{
  "tickers": ["AAPL", "MSFT", "CVS", "GOOGL"],
  "lastUpdated": "2025-10-11T02:45:00.000Z",
  "count": 4
}
```

---

#### `/api/github-update` (POST)
**Objectif:** Sauvegarder les **données d'analyse** individuelles pour chaque ticker

**Utilisation:**
```javascript
POST /api/github-update
{
  "file": "public/stock_data.json",
  "ticker": "AAPL",
  "action": "update_stock",
  "data": {
    "price": 175.43,
    "change": 0.87,
    "metrics": { ... }
  }
}
```

**Ce qu'elle fait:**
- Met à jour `public/stock_data.json` avec les données de prix
- Met à jour `public/stock_analysis.json` avec les analyses Claude/Gemini
- Permet de garder un historique des analyses

**Actions supportées:**
- `update_stock`: Mise à jour des données de marché
- `update_analysis`: Mise à jour des analyses IA

---

### Lien entre les deux APIs

```
┌─────────────────────────┐
│  /api/save-tickers      │  ← Sauvegarde LA LISTE des tickers
│  public/tickers.json    │     ["AAPL", "MSFT", "CVS"]
└─────────────────────────┘
            │
            ▼
   Pour chaque ticker...
            │
            ▼
┌─────────────────────────┐
│  /api/github-update     │  ← Sauvegarde LES DONNÉES de chaque ticker
│  public/stock_data.json │     { "AAPL": { prix, change, ... } }
│  stock_analysis.json    │     { "AAPL": { analyse, rating, ... } }
└─────────────────────────┘
```

**Exemple de workflow:**
1. Utilisateur ajoute tickers à sa watchlist → `/api/save-tickers`
2. Dashboard charge la liste depuis `tickers.json`
3. Pour chaque ticker, récupère données → `/api/marketdata`
4. Sauvegarde les données → `/api/github-update` avec `action: "update_stock"`
5. Génère analyse IA → `/api/claude` ou `/api/gemini/chat`
6. Sauvegarde l'analyse → `/api/github-update` avec `action: "update_analysis"`

---

## ✅ Point 9: API Status - Pourquoi certaines ne répondent pas

### Test de l'API Status

```bash
GET /api/status?test=true
```

### Raisons Possibles

1. **Clés API non configurées** → Status: `not_configured`
2. **Clés API invalides** → Status: `error`
3. **Limites de taux dépassées** → Status: `error`
4. **Service temporairement indisponible** → Status: `error`

### Vérification des Variables d'Environnement

Pour Vercel:
```bash
vercel env ls
```

Variables nécessaires:
- `GEMINI_API_KEY` - Google Gemini
- `ANTHROPIC_API_KEY` - Claude AI
- `FINNHUB_API_KEY` - Finnhub
- `ALPHA_VANTAGE_API_KEY` - Alpha Vantage
- `TWELVE_DATA_API_KEY` - Twelve Data
- `NEWSAPI_KEY` - NewsAPI.ai
- `GITHUB_TOKEN` - GitHub

### APIs qui ne nécessitent PAS de clé

- **Yahoo Finance** - Gratuit, pas de clé nécessaire
- **API Fallback** - Utilise des données statiques (secours uniquement)

---

## ❌ Perplexity API

**Réponse:** NON, vous n'avez PAS besoin d'une clé API Perplexity.

### Pourquoi ?

Perplexity est mentionné dans le dashboard (`beta-combined-dashboard.html`) mais uniquement à titre **informatif/démo**.

Les lignes mentionnant Perplexity sont des **labels d'interface** :
- "Mode Démo Hybride • FMP + Perplexity AI"
- "Insights IA (Perplexity)"

### Ce que vous avez VRAIMENT

Vous avez déjà des **vraies APIs d'IA** configurées :
1. **Gemini 2.0 Flash** (`/api/gemini/chat`) - Function calling pour données financières
2. **Claude 3.5 Sonnet** (`/api/claude`) - Analyses financières approfondies

Ces deux APIs sont **largement suffisantes** et même plus puissantes que Perplexity pour vos besoins.

---

## 📊 Résumé des Corrections

| Point | Status | Description |
|-------|--------|-------------|
| 2️⃣ | ✅ | Prompt Emma validé et injecté systématiquement |
| 4️⃣ | ✅ | Données démo retirées, vraies sources uniquement |
| 6️⃣ | ✅ | APIs GitHub clarifiées et liées aux tickers |
| 9️⃣ | ⚠️ | API Status fonctionne, vérifier clés env |
| 🔮 | ✅ | Perplexity NON nécessaire |

---

## 🔧 Commandes de Test

```bash
# Tester toutes les APIs
node test-apis.js

# Tester API Status
curl "https://votre-app.vercel.app/api/status?test=true"

# Tester sauvegarde tickers
curl -X POST https://votre-app.vercel.app/api/save-tickers \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["AAPL", "MSFT", "CVS"]}'

# Tester market data
curl "https://votre-app.vercel.app/api/marketdata?endpoint=quote&symbol=AAPL&source=auto"
```

---

## 📝 Variables d'Environnement Recommandées

### Priorité Haute (Essentielles)
```bash
GEMINI_API_KEY=your_key          # IA principale
GITHUB_TOKEN=your_token          # Sauvegarde données
FINNHUB_API_KEY=your_key         # Données marché
```

### Priorité Moyenne (Recommandées)
```bash
ALPHA_VANTAGE_API_KEY=your_key   # Fallback données
TWELVE_DATA_API_KEY=your_key     # Fallback données
ANTHROPIC_API_KEY=your_key       # Analyses IA avancées
```

### Priorité Basse (Optionnelles)
```bash
NEWSAPI_KEY=your_key             # Actualités (Finnhub suffit)
```

---

## 🎯 Prochaines Étapes

1. Configurer les variables d'environnement sur Vercel
2. Tester `/api/status?test=true` pour vérifier la connexion
3. Utiliser `/api/save-tickers` pour créer votre watchlist
4. Le dashboard chargera automatiquement les données depuis les vraies APIs
