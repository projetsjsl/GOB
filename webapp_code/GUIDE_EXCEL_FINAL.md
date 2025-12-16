# 📊 Guide Excel - Configuration et Utilisation

## ✅ Déploiement Vercel Terminé

Le code a été poussé sur GitHub. Vercel va automatiquement déployer les endpoints.

**URL de production** : `https://gob.vercel.app`

## 📋 Configuration Excel - Étapes Détaillées

### ÉTAPE 1 : Configurer l'URL du Serveur

1. **Ouvrir votre classeur Excel** (`Index_Sector_Dashboard.xlsx` ou votre classeur)

2. **Aller dans l'onglet `Parameters`**

3. **Dans la cellule B1**, remplacer `http://localhost:5000` par :
   ```
   https://gob.vercel.app
   ```

4. **Vérifier la cellule B3** : Elle doit contenir un horizon (A, B, C, D, E, F, G, H, I, ou J)
   - Si vide, sélectionner **B** (1 Day Performance)

### ÉTAPE 2 : Mettre à Jour la Macro VBA (Excel Desktop)

#### Si vous utilisez Excel Desktop (Windows/Mac) :

1. **Ouvrir l'éditeur VBA** : `Alt+F11` (Windows) ou `Fn+Option+F11` (Mac)

2. **Trouver le module `UpdateIndices`** :
   - Dans l'explorateur de projet (à gauche)
   - Double-cliquer sur `UpdateIndices`

3. **Modifier la constante SERVER_URL** :
   - Chercher la ligne : `Const SERVER_URL As String = "http://localhost:5000"`
   - Remplacer par : `Const SERVER_URL As String = "https://gob.vercel.app"`

4. **Sauvegarder** : `Ctrl+S` (Windows) ou `Cmd+S` (Mac)

5. **Fermer l'éditeur VBA** : `Alt+Q` (Windows) ou `Cmd+Q` (Mac)

#### Alternative : Modifier directement dans Excel

Si vous avez un bouton "Mettre à jour" dans l'onglet Parameters :
- Le bouton utilisera automatiquement l'URL dans `Parameters!B1`
- Pas besoin de modifier la macro si elle lit depuis cette cellule

### ÉTAPE 3 : Mettre à Jour le Script TypeScript (Excel Online)

#### Si vous utilisez Excel Online :

1. **Ouvrir Excel Online** et votre classeur

2. **Aller dans `Automatisation`** (menu du haut)

3. **Cliquer sur `Scripts`** ou `Nouveau script`

4. **Trouver le script `UpdateIndicesScript`**

5. **Modifier la constante SERVER_URL** :
   - Chercher : `const SERVER_URL = "http://localhost:5000";`
   - Remplacer par : `const SERVER_URL = "https://gob.vercel.app";`

6. **Enregistrer** le script

### ÉTAPE 4 : Tester la Connexion

#### Excel Desktop :

1. **Aller dans l'onglet `Parameters`**

2. **Exécuter la macro** :
   - `Alt+F8` → Sélectionner `UpdateIndices` → `Exécuter`
   - OU cliquer sur le bouton "Mettre à jour" si configuré

3. **Vérifier** :
   - Un message devrait apparaître : "Données mises à jour avec succès!"
   - L'onglet `RawData_SP500` devrait contenir des données
   - L'onglet `Current_SP500` devrait être rempli
   - La cellule `Parameters!B2` devrait afficher la date/heure de mise à jour

#### Excel Online :

1. **Aller dans `Automatisation > Scripts`**

2. **Sélectionner `UpdateIndicesScript`**

3. **Cliquer sur `Exécuter`**

4. **Vérifier** les mêmes onglets que ci-dessus

### ÉTAPE 5 : Vérifier les Données

1. **Onglet `RawData_SP500`** :
   - Colonne A : Timeframe (Rank A, Rank B, etc.)
   - Colonne B : Secteur
   - Colonne C : Performance (format pourcentage)
   - Devrait contenir plusieurs lignes de données

2. **Onglet `Current_SP500`** :
   - Ligne 1 : En-têtes des horizons (Rank A à Rank J)
   - Colonne A : Liste des secteurs
   - Matrice : Performances par secteur et horizon
   - Les cellules devraient être formatées en pourcentage

3. **Onglet `MSCI_World`** :
   - Colonne C : Performances (formules)
   - Colonne D : Contributions (calculées)
   - Cellule D13 : Performance totale pondérée

4. **Onglet `SPTSX`** :
   - Même structure que MSCI_World
   - Cellule D13 : Performance totale pondérée

5. **Onglet `Dashboard`** :
   - Devrait afficher les performances des 3 indices
   - Mise à jour selon l'horizon sélectionné dans Parameters!B3

## 🔧 Dépannage

### Erreur : "Impossible de récupérer les données du serveur"

**Solutions :**
1. Vérifier que Vercel est déployé : `curl https://gob.vercel.app/api/sector`
2. Vérifier l'URL dans `Parameters!B1` (doit être `https://gob.vercel.app`)
3. Vérifier votre connexion Internet
4. Attendre quelques minutes si le déploiement vient d'être fait

### Erreur : "Quota Alpha Vantage dépassé"

**Solutions :**
1. Attendre 1 minute (limite : 5 appels/minute)
2. Vérifier les logs Vercel pour voir le nombre d'appels
3. Le cache dure 60 secondes, donc les appels répétés ne devraient pas poser problème

### Les données ne se mettent pas à jour

**Solutions :**
1. Vérifier que la macro/script utilise bien l'URL de `Parameters!B1`
2. Vérifier les logs Vercel (Dashboard Vercel → Deployments → Logs)
3. Tester l'API directement : `curl https://gob.vercel.app/api/sector`

### Erreur VBA : "User-defined type not defined"

**Solutions :**
1. Vérifier que la référence "Microsoft XML, v6.0" est ajoutée :
   - `Alt+F11` → `Tools > References`
   - Cocher "Microsoft XML, v6.0"
2. Vérifier que `JsonConverter.bas` est importé

## 📊 Utilisation Quotidienne

### Mettre à Jour les Données

1. **Ouvrir le classeur Excel**
2. **Aller dans l'onglet `Parameters`**
3. **Sélectionner l'horizon souhaité** (cellule B3) :
   - **A** : Real-Time Performance
   - **B** : 1 Day Performance (recommandé pour usage quotidien)
   - **C** : 5 Day Performance
   - **D** : 1 Month Performance
   - **E** : 3 Month Performance
   - **F** : Year-to-Date (YTD)
   - **G** : 1 Year Performance
   - **H** : 3 Year Performance
   - **I** : 5 Year Performance
   - **J** : 10 Year Performance
4. **Exécuter la macro** (Excel Desktop) ou **le script** (Excel Online)
5. **Consulter le Dashboard** pour voir les performances

### Consulter les Performances

1. **Onglet `Dashboard`** : Vue d'ensemble des 3 indices
2. **Onglet `Weighted_Performance`** : Détails des performances pondérées
3. **Onglet `MSCI_World`** ou `SPTSX` : Contributions par secteur

## ✅ Checklist Finale

- [ ] URL configurée dans `Parameters!B1` : `https://gob.vercel.app`
- [ ] Horizon sélectionné dans `Parameters!B3` (ex: B)
- [ ] Macro VBA mise à jour (Excel Desktop) OU Script TypeScript mis à jour (Excel Online)
- [ ] Test de mise à jour réussi
- [ ] Données visibles dans `RawData_SP500`
- [ ] Matrice remplie dans `Current_SP500`
- [ ] Performances calculées dans `MSCI_World` et `SPTSX`
- [ ] Dashboard affiche les données

## 🎉 C'est Prêt !

Votre classeur Excel est maintenant connecté à l'API Vercel et peut récupérer les données sectorielles en temps réel !

**Rappel :** Les données sont mises en cache pendant 60 secondes pour respecter les limites de l'API Alpha Vantage. Vous pouvez mettre à jour toutes les minutes sans problème.














