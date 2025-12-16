# 🔑 Récupérer N8N_API_KEY depuis Vercel

## Méthode 1 : Script automatique (Recommandé)

```bash
./get-n8n-api-key.sh
```

Ce script va :
1. Vérifier si vous êtes connecté à Vercel
2. Vous proposer de vous connecter si nécessaire
3. Récupérer toutes les variables d'environnement
4. Extraire et afficher la clé N8N_API_KEY

## Méthode 2 : Commande Vercel CLI directe

```bash
# 1. Se connecter à Vercel (si pas déjà connecté)
vercel login

# 2. Récupérer les variables d'environnement
vercel env pull .env.local

# 3. Vérifier que N8N_API_KEY est présente
grep N8N_API_KEY .env.local
```

## Méthode 3 : Depuis le Dashboard Vercel

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet GOB
3. Allez dans **Settings** → **Environment Variables**
4. Cherchez `N8N_API_KEY`
5. Copiez la valeur

## Une fois la clé récupérée

### Option A : Utiliser le script qui charge automatiquement .env.local

```bash
# Le script charge automatiquement .env.local s'il existe
node connect-n8n-with-vercel.js
```

### Option B : Exporter la variable manuellement

```bash
# Depuis .env.local
export $(grep N8N_API_KEY .env.local | xargs)
node connect-n8n-with-vercel.js

# Ou directement
export N8N_API_KEY="votre_cle_ici"
node connect-n8n-with-vercel.js
```

### Option C : Passer en argument

```bash
node connect-n8n-with-vercel.js --api-key "votre_cle_ici"
```

## Vérification

Une fois la clé configurée, le script devrait :
- ✅ Se connecter à votre instance n8n
- ✅ Récupérer le workflow `03lgcA4e9uRTtli1`
- ✅ Afficher toutes les informations (nodes, webhooks, etc.)
- ✅ Sauvegarder le workflow en JSON
- ✅ Lister tous vos workflows

## Dépannage

### Erreur "No existing credentials found"
```bash
vercel login
```

### Erreur "Project not found"
Assurez-vous d'être dans le bon répertoire du projet GOB

### La clé n'est pas dans Vercel
1. Vérifiez dans le Dashboard Vercel
2. Si elle n'existe pas, créez-la :
   ```bash
   vercel env add N8N_API_KEY
   ```
3. Ou créez-la directement dans le Dashboard

