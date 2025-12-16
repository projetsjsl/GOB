# 🔄 Différences entre les Boutons de Synchronisation

## 📍 Vue d'Ensemble

Il existe **deux boutons de synchronisation** dans l'application 3p1, et ils ont des comportements légèrement différents :

1. **"Sync. Données"** (dans l'onglet Analyse, pour un ticker à la fois)
2. **"Synchroniser tous les tickers"** (dans la sidebar, pour tous les tickers)

---

## 🔵 Bouton "Sync. Données" (Analyse - Un ticker)

### 📍 Localisation
- **Où** : Dans l'onglet "Analyse", en haut à droite, à côté du bouton "Sauvegarder"
- **Fichier** : `public/3p1/components/Header.tsx` (ligne 225-235)
- **Fonction appelée** : `handleFetchData()` → `performSync()`

### ⚙️ Fonctionnement

```typescript
// 1. Vérifie s'il y a des modifications manuelles
const hasEdits = hasManualEdits(data);

// 2. Si oui, affiche un dialog de confirmation
//    - Option 1: Sauvegarder avant de synchroniser
//    - Option 2: Synchroniser sans sauvegarder

// 3. Appelle performSync(saveCurrentVersion: boolean)
```

### 🔄 Ce que fait `performSync()` :

1. **Sauvegarde optionnelle AVANT** :
   - Si l'utilisateur choisit "Sauvegarder avant", un snapshot est créé
   - Sinon, pas de sauvegarde avant

2. **Récupère les données FMP** pour le ticker actif uniquement

3. **Merge intelligent des données** :
   - ✅ Préserve les données manuelles (`autoFetched: false` ou `undefined`)
   - ✅ Met à jour les données auto-fetchées (`autoFetched: true`)
   - ✅ Ajoute les nouvelles années de FMP

4. **Met à jour les métriques** :
   - Info (nom, secteur, logo, beta, etc.)
   - Préserve les métriques ValueLine (securityRank, earningsPredictability, etc.)
   - Recalcule les assumptions (growth rates, target ratios) avec `autoFillAssumptionsFromFMPData()`

5. **Sauvegarde automatique APRÈS** :
   - Crée toujours un snapshot après la sync réussie
   - Marqué comme `is_current: true` et `auto_fetched: true`

6. **Met à jour le state local** :
   - `setData(mergedData)`
   - `setAssumptions(autoFilledAssumptions)`
   - `setInfo(updatedInfo)`
   - `setLibrary()` (pour persister dans localStorage)

### ✅ Avantages
- Rapide (un seul ticker)
- Contrôle fin (choix de sauvegarder ou non avant)
- Feedback immédiat (notification de succès/erreur)

### ⚠️ Limitations
- Ne synchronise qu'un ticker à la fois
- Nécessite de cliquer pour chaque ticker

---

## 🟢 Bouton "Synchroniser tous les tickers" (Sidebar)

### 📍 Localisation
- **Où** : Dans la sidebar (menu latéral), en bas, bouton vert
- **Fichier** : `public/3p1/components/Sidebar.tsx` (ligne 105-119)
- **Fonction appelée** : `handleBulkSyncAllTickers()`

### ⚙️ Fonctionnement

```typescript
// 1. Affiche une confirmation avec le nombre de tickers
if (!confirm(`Synchroniser tous les ${Object.keys(library).length} tickers ?...`)) {
    return;
}

// 2. Traite les tickers par batch (3 à la fois)
// 3. Pour chaque ticker :
//    - Sauvegarde AVANT (toujours)
//    - Récupère FMP
//    - Merge intelligent
//    - Recalcule métriques
//    - Sauvegarde APRÈS
```

### 🔄 Ce que fait `handleBulkSyncAllTickers()` :

1. **Sauvegarde TOUJOURS AVANT** pour chaque ticker :
   - Crée un snapshot "Avant synchronisation globale" pour chaque ticker
   - Marqué comme `is_current: false` (on va le remplacer)

2. **Traite par batch** :
   - 3 tickers en parallèle
   - Délai de 1 seconde entre chaque batch
   - Affiche une barre de progression : `Sync X/Y`

3. **Pour chaque ticker** :
   - Récupère les données FMP
   - **Merge intelligent** (même logique que `performSync`)
   - Recalcule les assumptions avec `autoFillAssumptionsFromFMPData()`
   - Met à jour la `library` directement (pas seulement le state local)
   - Sauvegarde un snapshot APRÈS avec les nouvelles métriques

4. **Met à jour localStorage** après chaque ticker

5. **Affiche un résumé** :
   - Nombre de réussites
   - Nombre d'erreurs
   - Liste des erreurs (premiers 5)

### ✅ Avantages
- Automatise la synchronisation de tous les tickers
- Sauvegarde automatique avant chaque sync (sécurité)
- Barre de progression pour suivre l'avancement
- Gestion des erreurs par ticker (continue même si un échoue)

### ⚠️ Limitations
- Plus lent (traite tous les tickers)
- Pas de contrôle fin (sauvegarde toujours avant)
- Peut prendre plusieurs minutes si beaucoup de tickers

---

## 🔍 Différences Clés

| Aspect | "Sync. Données" (Analyse) | "Synchroniser tous les tickers" (Sidebar) |
|--------|---------------------------|-------------------------------------------|
| **Tickers traités** | 1 (ticker actif) | Tous les tickers dans la library |
| **Sauvegarde AVANT** | Optionnelle (choix utilisateur) | Toujours (automatique) |
| **Sauvegarde APRÈS** | Toujours (automatique) | Toujours (automatique) |
| **Traitement** | Séquentiel (immédiat) | Par batch (3 en parallèle) |
| **Feedback** | Notification simple | Barre de progression + résumé |
| **Mise à jour** | State local + library | Library directement |
| **Gestion erreurs** | Arrête si erreur | Continue même si erreur |
| **Temps d'exécution** | ~2-5 secondes | ~30 secondes - 5 minutes |

---

## 🎯 Quand Utiliser Chaque Bouton ?

### Utilisez "Sync. Données" (Analyse) quand :
- ✅ Vous voulez synchroniser **un seul ticker** rapidement
- ✅ Vous voulez **choisir** de sauvegarder ou non avant
- ✅ Vous travaillez sur une analyse spécifique
- ✅ Vous voulez un feedback immédiat

### Utilisez "Synchroniser tous les tickers" (Sidebar) quand :
- ✅ Vous voulez **mettre à jour tous vos tickers** en une fois
- ✅ Vous voulez une **sauvegarde automatique** avant chaque sync
- ✅ Vous avez le temps d'attendre (plusieurs minutes)
- ✅ Vous voulez un **résumé global** des succès/erreurs

---

## 🔧 Logique de Merge (Identique pour les Deux)

Les deux boutons utilisent **exactement la même logique** de merge intelligent :

```typescript
// 1. Créer un map des nouvelles données par année
const newDataByYear = new Map(result.data.map(row => [row.year, row]));

// 2. Pour chaque ligne existante :
const mergedData = data.map((existingRow) => {
    const newRow = newDataByYear.get(existingRow.year);
    
    // Si pas de nouvelle donnée, garder l'existant
    if (!newRow) {
        return existingRow;
    }
    
    // Si la donnée existante est manuelle, la garder
    if (existingRow.autoFetched === false || existingRow.autoFetched === undefined) {
        return existingRow; // ✅ PRÉSERVER
    }
    
    // Sinon, utiliser la nouvelle donnée
    return {
        ...newRow,
        autoFetched: true
    };
});

// 3. Ajouter les nouvelles années
result.data.forEach(newRow => {
    const exists = mergedData.some(row => row.year === newRow.year);
    if (!exists) {
        mergedData.push({
            ...newRow,
            autoFetched: true
        });
    }
});

// 4. Trier par année
mergedData.sort((a, b) => a.year - b.year);
```

### ✅ Ce qui est préservé :
- **Données manuelles** : Toutes les lignes avec `autoFetched: false` ou `undefined`
- **Métriques ValueLine** : securityRank, earningsPredictability, priceGrowthPersistence, priceStability
- **Exclusions** : excludeEPS, excludeCF, excludeBV, excludeDIV
- **Hypothèses personnalisées** : requiredReturn, dividendPayoutRatio (si définies)

### 🔄 Ce qui est mis à jour :
- **Données auto-fetchées** : Toutes les lignes avec `autoFetched: true`
- **Nouvelles années** : Ajoutées depuis FMP
- **Assumptions calculées** : growthRateEPS, growthRateCF, targetPE, targetPCF, targetPBV, targetYield
- **Info** : nom, secteur, logo, beta (depuis FMP)

---

## 📝 Exemple Concret

### Scénario : Vous avez modifié manuellement l'année 2023 pour AAPL

**Avec "Sync. Données" (Analyse)** :
1. Vous cliquez sur "Sync. Données"
2. Dialog : "Voulez-vous sauvegarder avant ?" → Vous choisissez "Oui"
3. Snapshot créé : "Before API sync - 4 déc 2025 12:00"
4. FMP récupère les données
5. Merge : Votre modification 2023 est **préservée** ✅
6. Nouvelles années (2024, 2025) sont **ajoutées** ✅
7. Assumptions recalculées avec les données mergées
8. Snapshot créé : "API sync - 4 déc 2025 12:01"
9. Notification : "Données synchronisées avec succès pour AAPL"

**Avec "Synchroniser tous les tickers" (Sidebar)** :
1. Vous cliquez sur "Synchroniser tous les tickers"
2. Confirmation : "Synchroniser tous les 50 tickers ?" → "Oui"
3. Pour AAPL (et tous les autres) :
   - Snapshot créé : "Avant synchronisation globale - 4 déc 2025 12:00"
   - FMP récupère les données
   - Merge : Votre modification 2023 est **préservée** ✅
   - Nouvelles années ajoutées ✅
   - Assumptions recalculées
   - Snapshot créé : "Synchronisation globale - 4 déc 2025 12:01"
4. Barre de progression : "Sync 1/50", "Sync 2/50", ...
5. Résumé : "Synchronisation terminée - Réussies: 48, Erreurs: 2"

---

## ⚠️ Points d'Attention

1. **Les deux utilisent la même logique de merge** : Les données manuelles sont toujours préservées, peu importe le bouton utilisé.

2. **"Synchroniser tous les tickers" sauvegarde toujours avant** : C'est plus sûr, mais crée plus de snapshots.

3. **Les assumptions sont recalculées** : Même si vous avez modifié manuellement un growth rate, il sera recalculé selon les données FMP. Pour préserver une assumption, vous devrez la modifier après la sync.

4. **Les métriques ValueLine sont préservées** : Elles ne sont jamais écrasées par FMP (car FMP ne les fournit pas).

5. **Les snapshots sont créés automatiquement** : Les deux boutons créent des snapshots après la sync, ce qui peut rapidement remplir la base de données.

---

## 🎓 Conclusion

Les deux boutons font **essentiellement la même chose** (merge intelligent, préservation des données manuelles, recalcul des assumptions), mais :

- **"Sync. Données"** = Rapide, pour un ticker, avec choix de sauvegarder
- **"Synchroniser tous les tickers"** = Automatique, pour tous les tickers, avec sauvegarde systématique

**Recommandation** : Utilisez "Sync. Données" pour le travail quotidien sur un ticker spécifique, et "Synchroniser tous les tickers" pour une mise à jour globale hebdomadaire ou mensuelle.

