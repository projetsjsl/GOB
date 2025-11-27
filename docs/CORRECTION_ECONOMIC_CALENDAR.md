# 🔧 Correction EconomicCalendarTab - Séparation des effets

**Date**: 2025-01-27  
**Bug**: Setters appelés dans useEffect sans dépendances appropriées

---

## Problème identifié

Le `useEffect` qui charge les données du calendrier appelait également les setters de filtres (`setFilterTicker`, `setFilterTickerGroup`, `setFilterLargeCapOnly`) de manière synchrone, mais ces setters n'étaient pas dans le tableau de dépendances.

**Problèmes**:
1. Les setters sont stables (pas besoin dans dépendances), mais le pattern était confus
2. Les setters étaient appelés avec `if (isMounted)` alors qu'ils sont synchrones (toujours `true`)
3. Mélange de responsabilités: reset de filtres + chargement de données dans le même effet

---

## Solution appliquée

**Séparation en deux `useEffect` distincts**:

1. **Premier `useEffect`**: Reset des filtres lors du changement d'onglet
   - Dépend uniquement de `activeSubTab`
   - Appels synchrones des setters (pas besoin de `isMounted`)
   - Responsabilité claire: gestion des filtres

2. **Deuxième `useEffect`**: Chargement des données
   - Dépend uniquement de `activeSubTab`
   - Gestion async avec `isMounted` et `AbortController`
   - Responsabilité claire: chargement de données

---

## Code avant

```javascript
React.useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;
    
    const fetchData = async () => { /* ... */ };
    
    // Reset ticker filters (synchrone mais avec isMounted inutile)
    if (isMounted) {
        setFilterTicker('all');
        setFilterTickerGroup('all');
        setFilterLargeCapOnly(activeSubTab === 'earnings');
    }
    
    fetchData();
    
    return () => { /* cleanup */ };
}, [activeSubTab]);
```

---

## Code après

```javascript
// Reset ticker filters when switching tabs (séparé pour éviter stale closures)
React.useEffect(() => {
    setFilterTicker('all');
    setFilterTickerGroup('all');
    setFilterLargeCapOnly(activeSubTab === 'earnings');
}, [activeSubTab]);

// Charger les données au changement d'onglet
React.useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;
    
    const fetchData = async () => { /* ... */ };
    
    fetchData();
    
    return () => {
        isMounted = false;
        abortController.abort();
    };
}, [activeSubTab]);
```

---

## Avantages

✅ **Séparation des responsabilités**: Chaque effet a un rôle clair  
✅ **Pas de stale closures**: Les setters sont dans un effet dédié  
✅ **Pattern stable**: Les setters de `useState` sont stables, pas besoin dans dépendances  
✅ **Code plus lisible**: Intentions claires pour chaque effet  
✅ **Pas de vérification inutile**: `isMounted` retiré des appels synchrones  

---

## Validation

- ✅ Les setters sont stables (pas besoin dans dépendances)
- ✅ Chaque effet a une responsabilité unique
- ✅ Pas de race conditions
- ✅ Pattern conforme aux bonnes pratiques React

