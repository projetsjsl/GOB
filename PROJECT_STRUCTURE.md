# 📂 Structure du Projet GOB Apps

## 🎯 **Vue d'Ensemble Simplifiée**

```
GOB/
├── 📄 Configuration & Documentation
│   ├── BRANCHES.md              ← Explication des branches Git
│   ├── URLS.md                  ← Toutes les URLs du projet
│   ├── PROJECT_STRUCTURE.md     ← Ce fichier (structure)
│   ├── README.md                ← Documentation générale
│   ├── API_CONFIGURATION.md     ← Configuration des APIs
│   ├── API_IMPROVEMENTS.md      ← Améliorations APIs
│   ├── DEPLOYMENT.md            ← Guide de déploiement
│   └── vercel.json              ← Configuration Vercel
│
├── 🌐 Pages Web (public/)
│   ├── beta-combined-dashboard.html  ← 🎯 DASHBOARD PRINCIPAL
│   ├── test-simple.html              ← Page de test
│   ├── financial-dashboard.html      ← Dashboard alternatif
│   ├── stocksandnews.html           ← Stocks & News
│   └── seeking-alpha/
│       ├── index.html               ← Interface Seeking Alpha
│       ├── stock_analysis.json      ← Données analysées
│       └── stock_data.json          ← Données brutes
│
├── 🔌 APIs (api/)
│   ├── finnhub.js                ← API Finnhub (principale)
│   ├── news.js                   ← API News (multi-sources)
│   ├── alpha-vantage.js          ← API Alpha Vantage
│   ├── twelve-data.js            ← API Twelve Data
│   ├── unified-market-data.js    ← API unifiée
│   ├── status.js                 ← Monitoring APIs
│   ├── fallback.js               ← Données de secours
│   ├── claude.js                 ← Intégration Claude AI
│   ├── github-update.js          ← Mise à jour GitHub
│   └── check-password.js         ← Vérification mot de passe
│
├── ⚛️ Application React (src/)
│   ├── App.tsx                   ← Application principale React
│   ├── main.tsx                  ← Point d'entrée React
│   └── index.css                 ← Styles globaux
│
├── 🧪 Tests & Scripts
│   ├── test-apis.js              ← Test des APIs
│   ├── test-finnhub-connection.js ← Test connexion Finnhub
│   └── scraper-snippet.js        ← Snippet de scraping
│
└── ⚙️ Configuration Développement
    ├── package.json              ← Dépendances npm
    ├── tsconfig.json             ← Configuration TypeScript
    ├── vite.config.ts            ← Configuration Vite
    ├── tailwind.config.js        ← Configuration Tailwind
    └── .gitignore                ← Fichiers à ignorer
```

---

## 🎯 **Fichiers Principaux à Connaître**

### **1. Dashboard Principal** 🌟
```
public/beta-combined-dashboard.html
```
**Description :** Dashboard financier complet avec React  
**Fonctionnalités :**
- Tickers : CVS, MSFT, MGA, GOOG, MU, BRK.B, UNH, PFE, BCE, T
- Onglets : Seeking Alpha + Stocks & News
- APIs : Finnhub, NewsAPI, données en temps réel
- Interface responsive et moderne

**URL Production :** https://gobapps.com/beta-combined-dashboard.html

---

### **2. APIs Backend**

#### **API Finnhub** (Principal)
```
api/finnhub.js
```
**Endpoints disponibles :**
- `quote` - Prix en temps réel
- `profile` - Profil de l'entreprise
- `news` - Actualités
- `recommendation` - Recommandations
- `peers` - Pairs de l'industrie
- `earnings` - Résultats financiers

**Exemple d'utilisation :**
```
https://gobapps.com/api/finnhub?endpoint=quote&symbol=MSFT
```

#### **API News** (Multi-sources)
```
api/news.js
```
**Sources :** NewsAPI.ai, Finnhub News, Alpha Vantage  
**Exemple :**
```
https://gobapps.com/api/news?q=MSFT+OR+AAPL&limit=20
```

#### **API Status** (Monitoring)
```
api/status.js
```
**Vérifie l'état de toutes les APIs**  
**Exemple :**
```
https://gobapps.com/api/status?test=true
```

---

### **3. Configuration**

#### **Vercel** (Déploiement)
```
vercel.json
```
**Configure :**
- Routes HTTP
- Headers de sécurité
- Cache et optimisations
- Rewrites pour les pages

#### **Variables d'Environnement**
```
env.example
```
**À configurer sur Vercel :**
- `FINNHUB_API_KEY` - Clé API Finnhub
- `NEWSAPI_KEY` - Clé API NewsAPI
- `ALPHA_VANTAGE_API_KEY` - Clé API Alpha Vantage
- `TWELVE_DATA_API_KEY` - Clé API Twelve Data
- `ANTHROPIC_API_KEY` - Clé API Claude (optionnel)

---

## 🌐 **URLs du Projet**

### **Production (gobapps.com)**
```
https://gobapps.com/beta-combined-dashboard.html  ← Dashboard principal
https://gobapps.com/test-simple.html              ← Page de test
https://gobapps.com/                              ← Page d'accueil React
```

### **APIs**
```
https://gobapps.com/api/finnhub?endpoint=quote&symbol=MSFT
https://gobapps.com/api/news?q=MSFT&limit=20
https://gobapps.com/api/status?test=true
```

### **Données JSON**
```
https://gobapps.com/seeking-alpha/stock_analysis.json
https://gobapps.com/seeking-alpha/stock_data.json
```

---

## 🔄 **Workflow de Développement**

### **Développement Local**
```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev

# 3. Le projet s'ouvre automatiquement sur http://localhost:5173
```

### **Déploiement en Production**
```bash
# 1. Ajouter les changements
git add .

# 2. Committer
git commit -m "feat: Description de vos changements"

# 3. Pousser vers GitHub
git push

# 4. Vercel redéploie automatiquement (30-60 secondes)
```

---

## 📊 **Tickers Configurés**

```
CVS      - CVS Health Corporation
MSFT     - Microsoft Corporation
MGA      - Magna International
GOOG     - Alphabet Inc. (Google)
MU       - Micron Technology
BRK.B    - Berkshire Hathaway
UNH      - UnitedHealth Group
PFE      - Pfizer
BCE      - Bell Canada Enterprises
T        - AT&T
```

---

## 🎨 **Technologies Utilisées**

### **Frontend**
- ⚛️ **React 18** - Framework UI
- 🎨 **Tailwind CSS** - Styling
- 📱 **Responsive Design** - Mobile-friendly
- 🔄 **Babel** - Transpilation (dev)

### **Backend**
- 🟢 **Node.js** - Runtime
- 🚀 **Vercel** - Hébergement & déploiement
- 🔌 **API Serverless** - Functions Vercel

### **APIs Externes**
- 📊 **Finnhub** - Données financières principales
- 📰 **NewsAPI.ai** - Actualités financières
- 📈 **Alpha Vantage** - Données alternatives
- 💹 **Twelve Data** - Données alternatives
- 🤖 **Claude AI** - Analyse (optionnel)

### **Outils de Dev**
- ⚡ **Vite** - Build tool rapide
- 📘 **TypeScript** - Type safety
- 🧪 **ESLint** - Linting
- 📦 **npm** - Gestion de packages

---

## 📝 **Fichiers à Ne Pas Modifier**

⚠️ **Ces fichiers sont générés automatiquement :**
```
node_modules/           ← Dépendances npm
package-lock.json       ← Lockfile npm
dist/                   ← Build de production
.git/                   ← Historique Git
```

---

## 🔒 **Fichiers Sensibles (Non Versionnés)**

🚫 **Ces fichiers NE SONT PAS dans Git :**
```
.env                    ← Variables d'environnement locales
.env.local              ← Variables locales
*.log                   ← Logs
```

**Raison :** Ils contiennent des clés API sensibles

---

## 📚 **Documentation Disponible**

| Fichier | Description |
|---------|-------------|
| `README.md` | Vue d'ensemble du projet |
| `BRANCHES.md` | Structure des branches Git (1 seule : main) |
| `URLS.md` | Toutes les URLs du projet |
| `API_CONFIGURATION.md` | Configuration des APIs |
| `FINNHUB_SETUP.md` | Setup Finnhub spécifique |
| `DEPLOYMENT.md` | Guide de déploiement |
| `PROJECT_STRUCTURE.md` | Ce fichier (structure) |

---

## 🎯 **Commandes Utiles**

### **Développement**
```bash
npm run dev         # Lancer le serveur de dev
npm run build       # Compiler pour production
npm run preview     # Preview du build
npm run lint        # Vérifier le code
```

### **Git**
```bash
git status          # Voir les changements
git add .           # Ajouter tous les fichiers
git commit -m ""    # Committer
git push            # Pousser vers GitHub
git log --oneline   # Voir l'historique
```

### **Tests**
```bash
node test-apis.js                    # Tester toutes les APIs
node test-finnhub-connection.js      # Tester Finnhub
```

---

## 🚀 **Pour Démarrer Rapidement**

### **Accéder au Dashboard**
```
https://gobapps.com/beta-combined-dashboard.html
```

### **Modifier le Dashboard**
1. Ouvrir `public/beta-combined-dashboard.html`
2. Modifier le code React/JSX
3. Sauvegarder
4. Git push (déploiement automatique)

### **Ajouter des Tickers**
1. Ouvrir `public/beta-combined-dashboard.html`
2. Chercher : `const [tickers, setTickers] = useState([...])`
3. Ajouter votre ticker à la liste
4. Sauvegarder et push

---

## ✅ **Configuration Actuelle (Nettoyée)**

- ✅ **1 seule branche** : `main`
- ✅ **Workflow simplifié** : pas de confusion
- ✅ **Documentation complète** : 7+ fichiers .md
- ✅ **APIs multiples** : Finnhub, NewsAPI, Alpha Vantage, Twelve Data
- ✅ **Déploiement automatique** : Push → Vercel → Production
- ✅ **Production ready** : https://gobapps.com

---

**Dernière mise à jour :** 2025-01-07  
**Status :** ✅ Production Ready  
**Branche :** `main` (unique)  
**URL Production :** https://gobapps.com/beta-combined-dashboard.html

