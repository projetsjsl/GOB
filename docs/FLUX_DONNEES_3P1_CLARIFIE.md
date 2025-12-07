# 🔄 Flux de Données Clarifié - Finance Pro 3p1

## ❓ Question

**"Donc on charge de Supabase, on ajoute de FMP, on synchronise de FMP et on sauvegarde dans Supabase ?"**

## ✅ Réponse : NON - Flux Optimisé

Le flux est maintenant **beaucoup plus simple** :

---

## 📊 Flux Réel (Optimisé)

### **1. À L'OUVERTURE** (Chargement Initial)

```
┌─────────────────────────────────────────┐
│  OUVERTURE DE L'APPLICATION             │
└─────────────────────────────────────────┘

1. Charger tickers depuis Supabase (tickers)
   └─ Liste des tickers actifs

2. Créer profils "squelettes" (affichage instantané)
   └─ Nom, secteur, métriques ValueLine

3. Charger données depuis Supabase (snapshots)
   ├─ Si snapshot existe → ✅ UTILISER (PAS de FMP)
   └─ Si snapshot manquant → ⚠️ Charger FMP + Sauvegarder dans Supabase

4. Charger prix depuis ticker_price_cache
   └─ Prix à jour (mise à jour toutes les 5 min)
```

**Résultat** :
- ✅ **Si snapshot existe** : Pas d'appel FMP (tout vient de Supabase)
- ⚠️ **Si snapshot manquant** : 1 appel FMP + sauvegarde dans Supabase (pour éviter de recharger FMP la prochaine fois)

---

### **2. SYNCHRONISATION** (Action Utilisateur)

```
┌─────────────────────────────────────────┐
│  UTILISATEUR CLIQUE "SYNCHRONISER"       │
└─────────────────────────────────────────┘

1. Sauvegarder snapshot "Avant" dans Supabase
   └─ Backup de la version actuelle

2. Charger nouvelles données depuis FMP
   └─ Données à jour depuis l'API

3. Merge intelligent
   ├─ Préserver données manuelles (autoFetched: false)
   ├─ Remplacer données auto-fetchées (autoFetched: true)
   └─ Ajouter nouvelles années

4. Recalculer assumptions (cases orange)

5. Sauvegarder snapshot "Après" dans Supabase
   └─ Nouvelle version (is_current: true)
```

**Résultat** :
- ✅ Version précédente sauvegardée (historique)
- ✅ Nouvelles données FMP intégrées
- ✅ Nouveau snapshot créé dans Supabase

---

## 🎯 Logique de Décision

### **Quand charger depuis FMP ?**

| Situation | Source | Action |
|-----------|--------|--------|
| **Ouverture + Snapshot existe** | ✅ Supabase | Utiliser snapshot (PAS de FMP) |
| **Ouverture + Pas de snapshot** | ⚠️ FMP | Charger FMP + Sauvegarder dans Supabase |
| **Synchronisation manuelle** | ⚠️ FMP | Charger FMP + Sauvegarder dans Supabase |
| **Mise à jour prix** | ✅ Supabase (cache) | Prix uniquement (PAS de FMP) |

---

## 🔄 Cycle de Vie des Données

### **Première Fois (Nouveau Ticker)**

```
1. Ouverture
   └─ Pas de snapshot → FMP → Supabase (snapshot) → LocalStorage

2. Ouvertures suivantes
   └─ Snapshot existe → Supabase → LocalStorage (PAS de FMP)
```

### **Synchronisation**

```
1. Utilisateur clique "Synchroniser"
   └─ Supabase (backup) → FMP → Merge → Supabase (nouveau) → LocalStorage
```

### **Mise à Jour Prix**

```
1. Automatique (toutes les 5 min)
   └─ Supabase (cache prix) → LocalStorage (currentPrice uniquement)
```

---

## ✅ Avantages du Flux Optimisé

1. **Performance** : Pas de FMP inutile si snapshot existe
2. **Coûts** : Moins d'appels FMP (réduction API costs)
3. **Egress** : Moins de données transférées depuis Supabase
4. **UX** : Affichage instantané, mise à jour progressive
5. **Fiabilité** : Données préservées même si FMP échoue

---

## 📋 Résumé

**À l'ouverture** :
- ✅ Charge depuis Supabase (snapshots)
- ⚠️ FMP seulement si snapshot manquant
- ✅ Sauvegarde dans Supabase si chargement FMP (pour éviter de recharger FMP la prochaine fois)

**Synchronisation** :
- ✅ Charge depuis FMP (données à jour)
- ✅ Sauvegarde dans Supabase (nouveau snapshot)

**Mise à jour prix** :
- ✅ Charge depuis Supabase (cache prix)
- ❌ PAS de FMP nécessaire

---

## 🎯 Conclusion

**NON**, on ne charge pas systématiquement depuis FMP à l'ouverture.

**OUI**, on charge depuis Supabase d'abord, et on utilise FMP seulement si nécessaire.

**OUI**, on sauvegarde dans Supabase après un chargement FMP pour éviter de recharger FMP la prochaine fois.

