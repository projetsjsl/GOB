# 🎯 GUIDE COMPLET SUPABASE GOB-WATCHLIST

## 📋 Informations de connexion

**Projet:** gob-watchlist  
**Mot de passe PostgreSQL:** `5mUaqujMflrgZyCo`

## 🔧 Étapes de configuration

### 1️⃣ Récupérer les informations de connexion

1. **Allez sur Supabase:**
   - URL: https://app.supabase.com
   - Connectez-vous à votre compte
   - Sélectionnez le projet **"gob-watchlist"**

2. **Récupérer les clés API:**
   - Allez dans **Settings > API**
   - Copiez les valeurs suivantes:
     - **Project URL** (ex: `https://gob-watchlist.supabase.co`)
     - **anon public key** (commence par `eyJ...`)
     - **service_role secret key** (commence par `eyJ...`)

3. **Récupérer les informations de base de données:**
   - Allez dans **Settings > Database**
   - Section **"Connection string"**
   - Copiez les informations:
     - **Host** (ex: `db.gob-watchlist.supabase.co`)
     - **Port** (généralement `5432`)
     - **Database name** (généralement `postgres`)
     - **Username** (généralement `postgres`)
     - **Password** (déjà fourni: `5mUaqujMflrgZyCo`)

### 2️⃣ Configurer les variables Vercel

Exécutez ces commandes dans votre terminal:

```bash
# URL du projet Supabase
vercel env add SUPABASE_URL
# Entrez: https://gob-watchlist.supabase.co

# Clé publique anonyme
vercel env add SUPABASE_ANON_KEY
# Entrez: eyJ... (récupéré depuis Supabase)

# Clé secrète service role
vercel env add SUPABASE_SERVICE_ROLE_KEY
# Entrez: eyJ... (récupéré depuis Supabase)

# Mot de passe PostgreSQL
vercel env add SUPABASE_DB_PASSWORD
# Entrez: 5mUaqujMflrgZyCo
```

### 3️⃣ Exécuter le SQL dans Supabase

1. **Ouvrir l'éditeur SQL:**
   - Dans Supabase, allez dans **SQL Editor**
   - Cliquez sur **"New query"**

2. **Copier et exécuter le script:**
   - Copiez **TOUT** le contenu du fichier `SUPABASE_SETUP_FINAL.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur **"Run"** ▶️

3. **Vérifier les résultats:**
   - Vous devriez voir 4 nouvelles tables créées:
     - `earnings_calendar`
     - `pre_earnings_analysis`
     - `earnings_results`
     - `significant_news`

### 4️⃣ Tester la connexion

```bash
# Tester la connexion Supabase
node test-supabase-gob-watchlist.js

# Tester la connexion PostgreSQL directe
node test-postgres-direct.js
```

### 5️⃣ Déployer les changements

```bash
# Pousser les changements vers GitHub
git add .
git commit -m "Configuration Supabase complète"
git push origin main

# Vérifier le déploiement Vercel
vercel --prod
```

## 📊 Structure de la base de données

### Tables principales

| Table | Description |
|-------|-------------|
| `earnings_calendar` | Calendrier des résultats trimestriels |
| `pre_earnings_analysis` | Analyses pré-résultats |
| `earnings_results` | Résultats et verdicts |
| `significant_news` | Nouvelles importantes avec scoring |
| `watchlist` | Liste de surveillance des utilisateurs |

### Vues utiles

| Vue | Description |
|-----|-------------|
| `upcoming_earnings` | Prochains earnings (7 jours) |
| `critical_news_pending` | News critiques non traitées |
| `earnings_performance_summary` | Résumé performance par ticker |

## 🔐 Sécurité

- **RLS (Row Level Security)** activé sur toutes les tables
- **Service role:** Accès complet via API
- **Public:** Lecture seule
- **Policies** configurées pour la sécurité

## 🚀 Prochaines étapes

1. ✅ Configurer les variables Vercel
2. ✅ Exécuter le SQL dans Supabase
3. ✅ Tester la connexion
4. 🔄 Initialiser le calendrier earnings
5. 🔄 Configurer les agents Emma
6. 🔄 Déployer les nouvelles fonctionnalités

## 🆘 Dépannage

### Erreur de connexion
- Vérifiez que les clés API sont correctes
- Vérifiez que le projet Supabase est actif
- Vérifiez les permissions RLS

### Tables non créées
- Vérifiez que le SQL s'est exécuté sans erreur
- Vérifiez les permissions dans Supabase
- Relancez le script SQL si nécessaire

### Variables d'environnement
- Vérifiez avec `vercel env ls`
- Redéployez après modification des variables
- Testez localement avec les bonnes variables

## 📞 Support

- **Documentation Supabase:** https://supabase.com/docs
- **Documentation Vercel:** https://vercel.com/docs
- **Scripts de test:** `test-supabase-gob-watchlist.js`

---

**✅ Configuration terminée !**  
Le système Emma AI est maintenant prêt avec toutes les tables nécessaires pour le suivi des earnings et l'analyse des nouvelles.

