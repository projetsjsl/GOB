# Guide : Réduire les N/A et Actualiser Tous les Profils

## 🎯 Objectif

Réduire le nombre de tickers affichant "N/A" dans le KPI Dashboard en synchronisant et nettoyant les profils.

## 📊 Causes des N/A

Les tickers affichent "N/A" pour JPEGY et "-100%" pour le rendement lorsque :

1. **Profils non synchronisés** : Pas encore chargés depuis l'API FMP
   - Solution : Synchroniser depuis Supabase puis actualiser depuis FMP

2. **Données invalides** :
   - Prix actuel invalide (≤ 0)
   - EPS = 0 ou invalide
   - Croissance EPS + Yield ≤ 0.01%
   - Aucune donnée financière valide

3. **Fonds mutuels** : Maintenant automatiquement filtrés

4. **Tickers obsolètes** : Données trop anciennes ou corrompues

## ✅ Solutions

### Option 1 : Synchronisation en Masse (RECOMMANDÉ)

**Dans l'application Finance Pro 3p1 :**

1. Ouvrez la sidebar (menu hamburger)
2. Cliquez sur **"Sync Tous les Tickers"** (bouton vert)
3. Confirmez la synchronisation
4. Attendez la fin du processus (peut prendre plusieurs minutes)

**Ce que fait la synchronisation :**
- ✅ Crée un snapshot de sauvegarde avant chaque sync
- ✅ Met à jour les données depuis FMP
- ✅ Préserve vos modifications manuelles
- ✅ Recalcule les hypothèses automatiquement
- ✅ Détecte et exclut les métriques aberrantes

### Option 2 : Nettoyage des Profils Invalides

**Script à exécuter dans la console du navigateur :**

```javascript
// 1. Charger la library
const STORAGE_KEY = 'finance_pro_profiles';
const library = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

// 2. Identifier les profils problématiques
const problematicProfiles = [];
for (const [symbol, profile] of Object.entries(library)) {
  const currentPrice = profile.assumptions?.currentPrice || 0;
  const baseYearData = profile.data?.find(d => d.year === profile.assumptions?.baseYear) || profile.data?.[profile.data.length - 1];
  const baseEPS = baseYearData?.earningsPerShare || 0;
  
  // Vérifier si le profil est invalide
  if (currentPrice <= 0 || 
      !baseEPS || baseEPS <= 0.01 ||
      !profile.data || profile.data.length === 0) {
    problematicProfiles.push({
      symbol,
      reason: currentPrice <= 0 ? 'Prix invalide' : 
              baseEPS <= 0.01 ? 'EPS invalide' : 
              'Pas de données'
    });
  }
}

console.log(`📊 Profils problématiques trouvés: ${problematicProfiles.length}`);
problematicProfiles.forEach(p => console.log(`  • ${p.symbol}: ${p.reason}`));

// 3. Optionnel : Supprimer les profils invalides
// ⚠️ ATTENTION : Cette action est irréversible
if (confirm(`Supprimer ${problematicProfiles.length} profils invalides ?`)) {
  const cleaned = {};
  for (const [symbol, profile] of Object.entries(library)) {
    if (!problematicProfiles.find(p => p.symbol === symbol)) {
      cleaned[symbol] = profile;
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  console.log(`✅ ${problematicProfiles.length} profils supprimés`);
  location.reload(); // Recharger la page
}
```

### Option 3 : Synchronisation Individuelle

Pour chaque ticker avec N/A :

1. Sélectionnez le ticker dans la sidebar
2. Cliquez sur **"Synchroniser"** (bouton avec icône de rafraîchissement)
3. Confirmez si des modifications manuelles existent
4. Attendez la fin de la synchronisation

## 🔄 Processus Recommandé

### Étape 1 : Nettoyer les Fonds Mutuels (AUTOMATIQUE)
✅ Déjà fait - Les fonds mutuels sont automatiquement supprimés au chargement

### Étape 2 : Synchroniser Tous les Tickers
1. Ouvrez Finance Pro 3p1
2. Sidebar → **"Sync Tous les Tickers"**
3. Attendez la fin (peut prendre 5-15 minutes selon le nombre de tickers)

### Étape 3 : Vérifier les Résultats
1. Allez dans l'onglet **"KPI"**
2. Vérifiez le nombre de N/A restants
3. Les tickers avec N/A après sync sont probablement :
   - Des fonds mutuels non détectés
   - Des tickers avec données vraiment invalides
   - Des tickers obsolètes

### Étape 4 : Nettoyer les Profils Invalides (Optionnel)
Si des N/A persistent après la synchronisation :
1. Utilisez le script de nettoyage ci-dessus
2. Ou supprimez manuellement les tickers problématiques

## 📈 Résultats Attendus

Après la synchronisation en masse :
- ✅ Tous les profils valides auront des données à jour
- ✅ JPEGY calculable pour la plupart des tickers
- ✅ Rendements projetés réalistes
- ✅ Moins de N/A dans le dashboard

## ⚠️ Notes Importantes

1. **Temps de traitement** : La synchronisation en masse peut prendre plusieurs minutes
2. **Sauvegarde automatique** : Un snapshot est créé avant chaque sync
3. **Préservation des données** : Vos modifications manuelles sont préservées
4. **Fonds mutuels** : Sont automatiquement exclus (ne peuvent pas être analysés)

## 🐛 Dépannage

### Si la synchronisation échoue pour certains tickers :
- Vérifiez la console pour les messages d'erreur
- Certains tickers peuvent être obsolètes ou invalides
- Utilisez le script de nettoyage pour les identifier

### Si trop de N/A persistent :
- Vérifiez que les tickers ne sont pas des fonds mutuels
- Vérifiez que les données FMP sont disponibles
- Certains tickers peuvent nécessiter une synchronisation manuelle

