# Guide de Déploiement Automatisé

Ce guide vous explique comment configurer le déploiement automatique de votre projet Seeking Alpha Dashboard avec Vercel et GitHub.

## 🚀 Configuration Automatique

### 1. Prérequis

- Compte GitHub avec votre repository
- Compte Vercel
- Clé API Finnhub (gratuite)

### 2. Configuration Vercel

#### A. Connecter votre repository GitHub à Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "New Project"
3. Importez votre repository GitHub `projetsjsl/seeking-alpha-auto`
4. Vercel détectera automatiquement la configuration

#### B. Configurer les variables d'environnement

Dans le dashboard Vercel de votre projet :

1. Allez dans **Settings** > **Environment Variables**
2. Ajoutez les variables suivantes :

```
FINNHUB_API_KEY = votre_clé_finnhub_ici
```

**Comment obtenir votre clé Finnhub :**
- Allez sur [finnhub.io/register](https://finnhub.io/register)
- Créez un compte gratuit
- Copiez votre clé API depuis le dashboard

### 3. Déploiement Automatique Vercel

Vercel gère automatiquement le déploiement à chaque push sur la branche `main`. Aucune configuration supplémentaire n'est nécessaire.

### 4. URLs de Déploiement

- **Production** : `https://votre-projet.vercel.app`
- **Prévisualisation** : `https://votre-projet-git-branch.vercel.app`

## 🔧 Configuration Manuelle (Alternative)

Si vous préférez déployer manuellement :

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter à Vercel
vercel login

# Déployer
vercel --prod
```

## 📁 Structure du Projet

```
├── api/
│   └── finnhub.js          # API route Vercel
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions
├── vercel.json             # Configuration Vercel
├── index.html              # Dashboard principal
└── scraper-snippet.js      # Script de scraping
```

## 🐛 Dépannage

### Erreur "FINNHUB_API_KEY non configurée"
- Vérifiez que la variable d'environnement est bien configurée dans Vercel
- Redéployez le projet après avoir ajouté la variable

### Erreur de déploiement Vercel
- Vérifiez que la variable d'environnement `FINNHUB_API_KEY` est bien configurée
- Vérifiez les logs de déploiement dans le dashboard Vercel

### CORS Errors
- L'API route est configurée pour accepter toutes les origines
- Vérifiez que vous utilisez l'URL Vercel et non localhost

## 📞 Support

En cas de problème :
1. Vérifiez les logs Vercel dans le dashboard
2. Vérifiez les logs GitHub Actions dans l'onglet Actions
3. Consultez la documentation Vercel : [vercel.com/docs](https://vercel.com/docs)
