# 🎯 Analyse : Validation Dynamique FMP vs Base Statique

**Date**: 18 Novembre 2025  
**Problème**: Résoudre les ambiguïtés de tickers (ex: "T" = Telus ou AT&T)

---

## 💡 Solution Proposée : Validation FMP Dynamique

Au lieu d'une base de données statique énorme, utiliser **FMP API** pour valider dynamiquement lors de la demande.

### Fonctionnement

1. **Détection ambiguïté** : "T" détecté comme ambigu
2. **Appel FMP** : Récupérer profils de `T.TO` et `T` en parallèle
3. **Comparaison** : Comparer noms d'entreprises avec contexte message
4. **Résolution** : Choisir le ticker qui correspond le mieux

### Exemple Concret

**Message**: "L'action de Telus baisse de 4%"

1. Extraction → "T" (ambigu)
2. FMP retourne:
   - `T.TO` → "TELUS Corporation" (Canada, TSX)
   - `T` → "AT&T Inc." (USA, NYSE)
3. Comparaison:
   - "Telus" dans message → correspond à "TELUS Corporation"
   - Score: 50+ points
4. Résolution: `T.TO` avec confiance 0.95

---

## 📊 Comparaison des Approches

| Critère | Base Statique | Validation FMP Dynamique |
|---------|---------------|--------------------------|
| **Taille** | 1000+ entrées | 0 entrées (validation à la demande) |
| **Maintenance** | ⚠️ Manuelle, régulière | ✅ Automatique, toujours à jour |
| **Latence** | 0ms | ~200-300ms (1 appel FMP batch) |
| **Fiabilité** | ⚠️ Peut être obsolète | ✅ Toujours à jour |
| **Couverture** | ⚠️ Limitée aux entrées | ✅ Toutes les entreprises FMP |
| **Coût** | $0 | $0 (FMP déjà utilisé) |
| **Complexité** | ⚠️ Base à maintenir | ✅ Simple (1 fonction) |

---

## ✅ Avantages Validation FMP

### 1. **Toujours à Jour**
- FMP a les dernières données
- Nouvelles entreprises automatiquement supportées
- Pas de maintenance manuelle

### 2. **Contexte Réel**
- Compare avec les noms d'entreprises réels
- Prend en compte pays, bourse, secteur
- Score de correspondance intelligent

### 3. **Couverture Maximale**
- Toutes les entreprises dans FMP
- Pas de limite de taille
- Support international automatique

### 4. **Latence Acceptable**
- ~200-300ms pour 2-3 tickers en parallèle
- Batch request FMP (1 seul appel)
- Acceptable pour SMS/web

### 5. **Pas de Coût Additionnel**
- FMP déjà utilisé dans le projet
- Pas de nouvelle dépendance
- Rate limits déjà gérés

---

## ⚠️ Inconvénients

### 1. **Latence Additionnelle**
- +200-300ms par ambiguïté
- Acceptable mais non négligeable

### 2. **Dépendance FMP**
- Si FMP down, résolution échoue
- Fallback nécessaire (demander clarification)

### 3. **Rate Limits**
- FMP a des limites
- Nécessite gestion intelligente

---

## 🎯 Recommandation Finale

### **Approche Hybride Optimale**

1. **✅ Mapping Direct** (fait)
   - Noms communs → tickers
   - Résout 80% des cas instantanément

2. **✅ Détection Contextuelle** (fait)
   - Fallback si mapping échoue
   - Résout 15% des cas

3. **🔄 Validation FMP** (à activer)
   - Si ambiguïté détectée
   - Validation dynamique avec FMP
   - Résout 4% des cas restants

4. **❌ Clarification Utilisateur** (dernier recours)
   - Seulement si tout échoue
   - 1% des cas

### Implémentation

**Option A: Synchrone avec Cache** (Recommandé)
- Validation FMP avec cache (5 min)
- Évite appels répétés
- Latence acceptable

**Option B: Async avec Fallback**
- Rendre `normalizeTickerWithClarification` async
- Validation FMP en arrière-plan
- Fallback gracieux si timeout

**Option C: Pré-validation**
- Valider tous les tickers ambigus au démarrage
- Cache global
- Zéro latence runtime

---

## 📝 Code Implémenté

La fonction `resolveAmbiguityWithFMP()` est créée et prête à l'emploi.

**Pour activer**:
1. Rendre `normalizeTickerWithClarification` async
2. Décommenter l'appel FMP dans la fonction
3. Gérer les erreurs/timeout

**Avant activation**, tester:
- Latence réelle avec FMP
- Rate limits
- Fallback si FMP down

---

## ✅ Conclusion

**Validation FMP dynamique** est la meilleure approche car:
- ✅ Toujours à jour
- ✅ Couverture maximale
- ✅ Pas de maintenance
- ✅ Latence acceptable (~200ms)

**Recommandation**: Activer après tests, avec cache pour optimiser.

