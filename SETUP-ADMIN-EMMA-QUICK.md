# 🚀 Setup Rapide - Interface Admin Emma

**Temps estimé : 10 minutes**

## Étape 1 : Configuration Supabase (5 min)

### 1.1 Créer la table `emma_system_config`

1. Aller sur [Supabase Dashboard - SQL Editor](https://app.supabase.com/project/_/sql)
2. Coller le contenu de `supabase-emma-admin-setup.sql`
3. Cliquer sur **"Run"**

✅ **Vérification** : Aller dans "Table Editor" → Vous devriez voir `emma_system_config`

---

## Étape 2 : Configuration Vercel (3 min)

### 2.1 Générer un token admin

Dans votre terminal :
```bash
openssl rand -hex 32
```

Copiez le résultat (ex: `a7f3b9c2e1d4f8a6b5c9e2d7f1a8b3c4e6d9f2a5b8c1e4d7f0a3b6c9e2d5f8a1`)

### 2.2 Ajouter dans Vercel

1. Aller sur [Vercel - Environment Variables](https://vercel.com/projetsjsls-projects/gob/settings/environment-variables)
2. Cliquer **"Add New"**
3. Remplir :
   - **Name** : `ADMIN_API_KEY`
   - **Value** : [le token généré ci-dessus]
   - **Environments** : Cocher **Production**, **Preview**, **Development**
4. Cliquer **"Save"**

### 2.3 Redéployer (optionnel)

Si vous êtes pressé, forcez un redéploiement :
```bash
vercel --prod
```

Sinon, le prochain commit déclenchera le redéploiement.

✅ **Vérification** : La variable apparaît dans la liste

---

## Étape 3 : Test de l'Interface (2 min)

### 3.1 Accéder à l'interface

Ouvrir dans votre navigateur :
```
https://gobapps.com/admin-jslai.html
```

### 3.2 Entrer le token

Un prompt vous demandera le token admin → Entrer le token généré à l'étape 2.1

**OU** sauvegarder dans localStorage (pour ne pas le redemander) :
1. Ouvrir la console navigateur (F12)
2. Taper :
   ```javascript
   localStorage.setItem('admin_token', 'VOTRE_TOKEN_ICI')
   ```
3. Recharger la page

### 3.3 Vérifier le chargement

Vous devriez voir :
- ✅ 4 onglets : Prompts Système, Variables, Directives, Routage
- ✅ Configuration chargée automatiquement
- ✅ Possibilité de modifier et sauvegarder

---

## Étape 4 : Premier Test (1 min)

1. Aller dans l'onglet **"⚙️ Variables"**
2. Modifier **"Température"** : `0.1` → `0.2`
3. Cliquer **"💾 Sauvegarder"**
4. Cliquer **"🔄 Recharger"** dans le header
5. Vérifier que la température est bien `0.2`

✅ **Si ça fonctionne = Configuration réussie !** 🎉

---

## 🛠️ Script de Test Automatique

Pour vérifier que tout est OK :

```bash
bash test-admin-emma.sh
```

Ce script vérifie :
- ✅ Interface HTML accessible
- ✅ API backend configurée
- ✅ Fichiers présents
- ✅ Configuration Vercel

---

## 📋 Checklist Complète

- [ ] Table Supabase `emma_system_config` créée
- [ ] Variable `ADMIN_API_KEY` ajoutée dans Vercel
- [ ] Token sauvegardé dans un endroit sécurisé (1Password, etc.)
- [ ] Interface accessible à https://gobapps.com/admin-jslai.html
- [ ] Configuration se charge correctement
- [ ] Test de modification/sauvegarde réussi

---

## 🆘 Dépannage

### Erreur 401 (Non autorisé)
→ Vérifier que `ADMIN_API_KEY` est bien défini dans Vercel

### Interface ne charge pas
→ Vérifier le déploiement : `vercel logs --follow`

### Configuration ne se sauvegarde pas
→ Vérifier que la table Supabase existe bien

### Token perdu
→ Régénérer un nouveau token et mettre à jour dans Vercel

---

## 📖 Documentation Complète

Pour plus de détails, voir : **`docs/ADMIN_JSLai_SETUP.md`**

---

## 🎯 Fonctionnalités Disponibles

Une fois configuré, vous pouvez :

✅ **Modifier les prompts système** (identité CFA, instructions)
✅ **Ajuster les paramètres** (tokens, température, récence)
✅ **Configurer les directives** (clarifications, longueur adaptative)
✅ **Gérer le routage** (keywords Perplexity vs APIs)

**SANS redéployer le code !** 🚀

---

**Temps total : ~10 minutes**
**Difficulté : ⭐ Facile**
