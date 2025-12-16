# 🚀 Configuration Supabase pour Watchlist

## 🎯 Pourquoi Supabase ?

**Avantages vs GitHub :**
- ✅ **Plus rapide** : Base de données vs fichiers JSON
- ✅ **Plus fiable** : Pas de limite de requêtes
- ✅ **Temps réel** : Synchronisation instantanée
- ✅ **Plus simple** : Une seule API
- ✅ **Gratuit** : 500MB + 50k requêtes/mois

---

## 📋 ÉTAPES DE CONFIGURATION

### **1. Créer un projet Supabase**

1. Va sur [supabase.com](https://supabase.com)
2. Clique "Start your project"
3. Connecte-toi avec GitHub
4. Clique "New Project"
5. Choisis ton organisation
6. Nom du projet : `gob-watchlist`
7. Mot de passe : génère un mot de passe fort
8. Région : `Europe West (Ireland)` (plus proche)
9. Clique "Create new project"

### **2. Récupérer les clés API**

1. Dans ton projet Supabase → **Settings** → **API**
2. Copie ces 2 valeurs :
   - **Project URL** (ex: `https://xyz.supabase.co`)
   - **anon public** key (commence par `eyJ...`)

### **3. Configurer la base de données**

1. Dans Supabase → **SQL Editor**
2. Clique "New query"
3. Copie-colle le contenu de `supabase-setup.sql`
4. Clique "Run" (ou Ctrl+Enter)

### **4. Ajouter les variables d'environnement Vercel**

1. Va sur [Vercel Dashboard](https://vercel.com/projetsjsl/gob/settings/environment-variables)
2. Ajoute ces 2 variables :

```
SUPABASE_URL = https://ton-projet.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Clique "Save"
4. **Redéploie** l'application

---

## 🧪 TESTER LA CONFIGURATION

### **1. Test rapide**
Va sur : **https://gobapps.com/test-supabase-watchlist.html**

### **2. Tests à effectuer**
- ✅ "Charger depuis Supabase" → Doit charger ACN, NVDA, AAPL
- ✅ "Ajouter Ticker" → Ajoute TSLA instantanément
- ✅ "Supprimer Ticker" → Supprime TSLA instantanément
- ✅ "Sauvegarder Watchlist Complète" → Sauvegarde tout

### **3. Si ça marche**
Tu verras des messages verts ✅ et les tickers s'afficheront.

### **4. Si ça ne marche pas**
Tu verras des erreurs rouges ❌ avec le détail du problème.

---

## 🔧 MIGRATION DEPUIS GITHUB

Une fois Supabase configuré, on migrera automatiquement :

1. **Chargement initial** : Récupère ACN, NVDA, AAPL depuis GitHub
2. **Sauvegarde Supabase** : Stocke dans la base Supabase
3. **Switch complet** : Plus d'appels GitHub, tout via Supabase

---

## 📊 STRUCTURE DE LA BASE

```sql
Table: watchlists
├── id (BIGSERIAL PRIMARY KEY)
├── user_id (TEXT UNIQUE) → 'default'
├── tickers (TEXT[]) → ['ACN', 'NVDA', 'AAPL']
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

---

## 🚀 AVANTAGES FINAUX

### **Performance**
- **GitHub** : 2-3 secondes par sauvegarde
- **Supabase** : 50-100ms par opération

### **Fiabilité**
- **GitHub** : Limite de requêtes, peut être lent
- **Supabase** : Base de données optimisée, très fiable

### **Fonctionnalités**
- **GitHub** : Fichiers JSON statiques
- **Supabase** : Base de données relationnelle + temps réel

---

## 🆘 DÉPANNAGE

### **Erreur "Configuration Supabase manquante"**
→ Vérifie que `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont bien dans Vercel

### **Erreur "Table doesn't exist"**
→ Exécute le script SQL dans Supabase SQL Editor

### **Erreur "Invalid API key"**
→ Vérifie que tu as copié la bonne clé `anon public`

### **Erreur de connexion**
→ Vérifie que l'URL Supabase est correcte

---

## 📞 SUPPORT

Si tu as des problèmes :
1. Vérifie les logs dans la page de test
2. Regarde la console Vercel
3. Vérifie les variables d'environnement
4. Teste la connexion Supabase

**Une fois configuré, la watchlist sera ultra-rapide ! ⚡**
