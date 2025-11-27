# 🔐 Vérification de l'authentification - Points critiques

**Date**: 2025-01-27  
**Objectif**: S'assurer que l'authentification reste fonctionnelle lors de la modularisation

---

## ⚠️ POINTS CRITIQUES À PRÉSERVER

### 1. Script auth-guard.js

**Status**: ✅ Présent dans les deux versions

- **Version actuelle**: Ligne 645 - `<script src="/js/auth-guard.js"></script>`
- **Version modulaire**: Ligne 518 - `<script src="/js/auth-guard.js"></script>`

**⚠️ CRITIQUE**: Le script DOIT être chargé **AVANT** tous les autres scripts (y compris les modules Babel).

**Vérification**:
```html
<!-- ✅ CORRECT - Dans les deux versions -->
<head>
    ...
    <!-- 🔐 Auth Guard - Protection du Dashboard -->
    <script src="/js/auth-guard.js"></script>
</head>
```

---

### 2. sessionStorage 'gob-user'

**Status**: ⚠️ Utilisé dans BetaCombinedDashboard

**Fonction critique**: `getUserLoginId()` (ligne ~1206 dans version actuelle)

```javascript
const getUserLoginId = () => {
    try {
        const userJson = sessionStorage.getItem('gob-user');
        if (userJson) {
            const user = JSON.parse(userJson);
            return user.username || user.display_name || githubUser?.login || githubUser?.name || 'toi';
        }
    } catch (e) {
        console.warn('Erreur récupération utilisateur:', e);
    }
    return githubUser?.login || githubUser?.name || 'toi';
};
```

**⚠️ ACTION REQUISE**: Cette fonction DOIT être:
1. ✅ Extraite dans `dashboard-main.js` lors de la complétion
2. ✅ Préservée avec la même logique
3. ✅ Accessible à tous les modules Tab qui en ont besoin

**Vérification dans modules**:
- Chercher `getUserLoginId` dans tous les modules Tab
- Si utilisé, s'assurer qu'il est passé en prop ou accessible globalement

---

### 3. window.GOB_AUTH (Permissions Emma)

**Status**: ⚠️ Créé par auth-guard.js

**Utilisation**: Permissions Emma pour sauvegarder conversations, voir historique, etc.

```javascript
window.GOB_AUTH = {
    user: this.currentUser,
    permissions: this.permissions,
    canSaveConversations: this.permissions.save_conversations,
    canViewHistory: this.permissions.view_own_history,
    canViewAllHistory: this.permissions.view_all_history
};
```

**⚠️ ACTION REQUISE**: 
- ✅ S'assurer que `window.GOB_AUTH` est accessible dans tous les modules
- ✅ Vérifier que les modules Emma (AskEmmaTab, EmmaSmsPanel) utilisent ces permissions
- ✅ Ne PAS modifier la structure de `window.GOB_AUTH`

---

### 4. Données préchargées (preloaded-dashboard-data)

**Status**: ⚠️ Utilisé dans plusieurs useEffect

**Utilisation**: Données préchargées depuis la page de login pour éviter les appels API redondants.

```javascript
const preloadedDataStr = sessionStorage.getItem('preloaded-dashboard-data');
if (preloadedDataStr) {
    const preloadedData = JSON.parse(preloadedDataStr);
    // Utiliser les données préchargées
}
```

**Modules utilisant preloaded-dashboard-data**:
- StocksNewsTab (ligne ~1693)
- IntelliStocksTab (ligne ~1955)
- EconomicCalendarTab (ligne ~2139)
- AskEmmaTab (ligne ~2899, ~2917, ~2987)

**⚠️ ACTION REQUISE**:
- ✅ Préserver cette logique dans tous les modules concernés
- ✅ S'assurer que sessionStorage est accessible dans les modules
- ✅ Ne PAS supprimer cette optimisation

---

### 5. Validation de session (/api/auth)

**Status**: ✅ Géré par auth-guard.js

**Fonction**: `validateSession()` dans auth-guard.js appelle `/api/auth` pour valider la session.

**⚠️ VÉRIFICATION**:
- ✅ L'endpoint `/api/auth` doit rester fonctionnel
- ✅ La validation doit se faire avant le chargement du dashboard
- ✅ En cas d'échec, redirection vers `/login.html`

---

## ✅ Checklist de vérification

### Avant migration
- [ ] Vérifier que auth-guard.js est chargé en premier dans version modulaire
- [ ] Vérifier que getUserLoginId() est présent dans dashboard-main.js
- [ ] Vérifier que window.GOB_AUTH est accessible
- [ ] Vérifier que preloaded-dashboard-data est utilisé dans modules concernés

### Pendant migration
- [ ] Ne PAS modifier auth-guard.js
- [ ] Ne PAS modifier la structure de sessionStorage
- [ ] Ne PAS modifier window.GOB_AUTH
- [ ] Préserver getUserLoginId() avec logique identique
- [ ] Préserver logique preloaded-dashboard-data

### Après migration
- [ ] Tester login → redirection → dashboard
- [ ] Tester déconnexion → nettoyage → redirection login
- [ ] Tester permissions Emma (save_conversations, view_history)
- [ ] Tester données préchargées (vérifier console pour appels API évités)
- [ ] Tester accès direct au dashboard sans login (doit rediriger)
- [ ] Tester session expirée (doit rediriger)

---

## 🔍 Tests à effectuer

### Test 1: Flux de connexion complet
1. Aller sur `/login.html`
2. Se connecter avec identifiants valides
3. Vérifier redirection vers dashboard
4. Vérifier que `sessionStorage.getItem('gob-user')` contient les données
5. Vérifier que `window.GOB_AUTH` est défini
6. Vérifier que `getUserLoginId()` retourne le bon nom

### Test 2: Accès direct sans login
1. Ouvrir `/beta-combined-dashboard.html` directement (sans login)
2. Vérifier redirection automatique vers `/login.html`
3. Vérifier console pour message "❌ Aucun utilisateur connecté"

### Test 3: Déconnexion
1. Être connecté au dashboard
2. Cliquer sur déconnexion (ou utiliser PlusTab)
3. Vérifier nettoyage de sessionStorage et localStorage
4. Vérifier redirection vers login
5. Vérifier que données Emma sont supprimées

### Test 4: Permissions Emma
1. Se connecter avec utilisateur ayant permissions limitées
2. Vérifier que `window.GOB_AUTH.canSaveConversations` est correct
3. Tester sauvegarde conversation (doit respecter permissions)
4. Tester accès historique (doit respecter permissions)

### Test 5: Données préchargées
1. Se connecter depuis login.html
2. Vérifier dans console que `preloaded-dashboard-data` est utilisé
3. Vérifier que moins d'appels API sont faits (grâce aux données préchargées)

---

## 📋 Modules concernés par l'authentification

### Modules utilisant getUserLoginId()
- ✅ À vérifier dans chaque module Tab
- ✅ Si utilisé, doit être passé en prop depuis dashboard-main.js

### Modules utilisant preloaded-dashboard-data
- **StocksNewsTab**: Ligne ~1693
- **IntelliStocksTab**: Ligne ~1955
- **EconomicCalendarTab**: Ligne ~2139
- **AskEmmaTab**: Lignes ~2899, ~2917, ~2987

**⚠️ ACTION**: Vérifier que ces modules préservent cette logique lors de la migration.

### Modules utilisant window.GOB_AUTH
- **AskEmmaTab**: Probablement pour permissions
- **EmmaSmsPanel**: Probablement pour permissions
- **EmailBriefingsTab**: Peut-être pour permissions

**⚠️ ACTION**: Vérifier utilisation et préserver.

---

## 🚨 Risques identifiés

### Risque 1: Ordre de chargement des scripts
**Impact**: Élevé  
**Mitigation**: S'assurer que auth-guard.js est toujours chargé en premier dans `<head>`

### Risque 2: getUserLoginId() non accessible
**Impact**: Moyen  
**Mitigation**: Extraire dans dashboard-main.js et passer en prop aux modules

### Risque 3: window.GOB_AUTH non défini
**Impact**: Moyen  
**Mitigation**: S'assurer que auth-guard.js s'exécute avant les modules

### Risque 4: Perte de données préchargées
**Impact**: Faible (performance)  
**Mitigation**: Préserver logique dans modules concernés

---

## ✅ Recommandations

1. **NE JAMAIS** modifier auth-guard.js sans validation complète
2. **TOUJOURS** charger auth-guard.js en premier dans `<head>`
3. **PRÉSERVER** getUserLoginId() avec logique identique
4. **VÉRIFIER** que window.GOB_AUTH est accessible dans tous les modules
5. **PRÉSERVER** logique preloaded-dashboard-data dans modules concernés
6. **TESTER** flux complet d'authentification après chaque modification

---

**Status**: ⚠️ **ATTENTION REQUISE** - Points critiques identifiés, vérification nécessaire lors de migration

