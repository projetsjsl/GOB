# 🐛 Correction Race Condition - progressCounterRef

**Date:** 27 novembre 2025  
**Fichier:** `public/3p1/App.tsx`  
**Fonction:** `handleBulkSyncAllTickers`

---

## 🐛 Problème Identifié

### Race Condition avec `progressCounterRef`

**Problème:**
- `progressCounterRef` est réinitialisé à 0 au début de `handleBulkSyncAllTickers` (ligne 852)
- Il est incrémenté avec `batchCompleted` pendant le traitement (ligne 1050)
- Un timeout de 3 secondes nettoie `isBulkSyncing` après la fin (ligne 1078-1082)
- **Race condition:** Si un utilisateur démarre une nouvelle sync pendant que le timeout de 3 secondes est encore en attente:
  - Le timeout précédent est nettoyé (ligne 844-848)
  - `progressCounterRef` est réinitialisé à 0 (ligne 852)
  - Mais si un batch de la sync précédente termine juste après le reset, sa mise à jour de progression peut s'appliquer à la nouvelle sync
  - Cela cause une incohérence dans l'UI où `progressCounterRef.current` peut "sauter" pendant l'état intermédiaire

---

## ✅ Solution Implémentée

### 1. **ID de Session pour Isoler les Synchronisations**

Ajout d'un `syncSessionIdRef` qui incrémente à chaque nouvelle synchronisation:

```typescript
const syncSessionIdRef = useRef<number>(0);
```

### 2. **Vérification de Session lors des Mises à Jour**

Avant de mettre à jour la progression, vérifier que la mise à jour appartient à la session actuelle:

```typescript
if (syncSessionIdRef.current === currentSessionId) {
    const newCurrent = progressCounterRef.current + batchCompleted;
    progressCounterRef.current = newCurrent;
    setBulkSyncProgress(prev => ({ ...prev, current: newCurrent }));
} else {
    // Ignorer les mises à jour en retard d'une session précédente
    console.warn(`⚠️ Mise à jour de progression ignorée`);
}
```

### 3. **Protection du Timeout de Nettoyage**

Le timeout vérifie que sa session est toujours active avant de réinitialiser l'état:

```typescript
const timeoutSessionId = currentSessionId;
bulkSyncTimeoutRef.current = setTimeout(() => {
    if (syncSessionIdRef.current === timeoutSessionId) {
        // Réinitialiser seulement si cette session est toujours active
        setIsBulkSyncing(false);
        setBulkSyncProgress({ current: 0, total: 0 });
    } else {
        // Une nouvelle sync a démarré, ne pas réinitialiser
        console.log(`⏭️ Timeout ignoré`);
    }
}, 3000);
```

### 4. **Ordre d'Exécution Corrigé**

1. **Nettoyer le timeout précédent** (ligne 844-848)
2. **Incrémenter l'ID de session** (nouveau)
3. **Réinitialiser `progressCounterRef`** (ligne 852)
4. **Démarrer la nouvelle sync**

---

## 🎯 Avantages de la Solution

1. ✅ **Isolation des Sessions:** Chaque sync a son propre ID, empêchant les mises à jour croisées
2. ✅ **Protection contre les Mises à Jour en Retard:** Les mises à jour de batches en retard sont ignorées si elles appartiennent à une session précédente
3. ✅ **Timeout Sécurisé:** Le timeout ne réinitialise l'état que si sa session est toujours active
4. ✅ **Pas de Changement d'API:** La solution est transparente pour le reste du code

---

## 📝 Fichiers Modifiés

- `public/3p1/App.tsx`
  - Ajout de `syncSessionIdRef` (ligne ~828)
  - Incrémentation de l'ID de session au début de `handleBulkSyncAllTickers` (ligne ~850)
  - Vérification de session lors des mises à jour de progression (ligne ~1050)
  - Protection du timeout de nettoyage (ligne ~1078)

---

## ✅ Statut

- ✅ Race condition corrigée
- ✅ Tests de cohérence UI passés
- ✅ Pas de régression détectée

