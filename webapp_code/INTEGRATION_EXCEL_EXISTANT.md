# 📊 Intégration avec le Classeur Excel Existant

Si vous avez déjà un classeur Excel `Index_Sector_Dashboard.xlsx`, voici comment l'intégrer avec cette solution.

## 🔄 Étapes d'Intégration

### 1. Vérifier la Structure du Classeur

Assurez-vous que votre classeur contient au minimum :
- Un onglet `Parameters` (ou équivalent) pour la configuration
- Un onglet pour les données brutes (ex: `RawData_SP500`)
- Un onglet pour les données formatées (ex: `Current_SP500`)

### 2. Adapter la Macro VBA

Si les noms de vos onglets diffèrent, modifiez les constantes dans `UpdateIndices.bas` :

```vba
' Modifier ces lignes selon vos noms d'onglets
Const SHEET_PARAMETERS As String = "Parameters"  ' Votre nom d'onglet
Const SHEET_RAW_DATA As String = "RawData_SP500" ' Votre nom d'onglet
Const SHEET_CURRENT As String = "Current_SP500"  ' Votre nom d'onglet
```

### 3. Adapter le Script TypeScript

De même, modifiez les constantes dans `UpdateIndicesScript.ts` :

```typescript
const SHEET_PARAMETERS = "Parameters";  // Votre nom d'onglet
const SHEET_RAW_DATA = "RawData_SP500"; // Votre nom d'onglet
const SHEET_CURRENT = "Current_SP500";  // Votre nom d'onglet
```

### 4. Configurer l'URL du Serveur

Dans votre onglet `Parameters` (ou équivalent), ajoutez :
- **Cellule B1** : URL du serveur (ex: `http://localhost:5000`)
- **Cellule B3** : Horizon sélectionné (A, B, C, D, E, F, G, H, I, ou J)

### 5. Adapter les Formules

Si votre structure de données diffère, adaptez les formules dans vos onglets :

#### Exemple pour MSCI_World

Si vos secteurs sont dans une colonne différente :

```excel
' Au lieu de :
=INDEX(Current_SP500!$B$2:$K$100, MATCH(A2, Current_SP500!$A$2:$A$100, 0), ...)

' Utiliser votre structure :
=INDEX(VotreOnglet!$B$2:$K$100, MATCH(A2, VotreOnglet!$A$2:$A$100, 0), ...)
```

### 6. Tester la Connexion

1. Démarrer le serveur :
   ```bash
   cd webapp_code
   npm start
   ```

2. Tester l'API :
   ```bash
   curl http://localhost:5000/api/health
   curl http://localhost:5000/api/sector
   ```

3. Dans Excel, exécuter la macro ou le script

## 🔧 Mapping des Données

### Structure des Données Retournées

L'API `/api/sector` retourne un JSON avec cette structure :

```json
{
  "success": true,
  "data": {
    "Rank A: Real-Time Performance": {
      "Communication Services": "0.5",
      "Consumer Discretionary": "-0.3",
      ...
    },
    "Rank B: 1 Day Performance": {
      ...
    },
    ...
  }
}
```

### Mapping des Secteurs

Les secteurs Alpha Vantage sont automatiquement mappés :

| Alpha Vantage | Standard |
|---------------|----------|
| Communication Services | Services de communication |
| Consumer Discretionary | Consommation discrétionnaire |
| Consumer Staples | Consommation courante |
| Energy | Énergie |
| Financials | Financiers |
| Health Care | Santé |
| Industrials | Industriels |
| Information Technology | Technologie de l'information |
| Materials | Matériaux |
| Real Estate | Immobilier |
| Utilities | Services publics |

## 📝 Exemple d'Adaptation Complète

### Si votre onglet s'appelle "Donnees" au lieu de "RawData_SP500"

**Dans UpdateIndices.bas :**
```vba
Const SHEET_RAW_DATA As String = "Donnees"
```

**Dans UpdateIndicesScript.ts :**
```typescript
const SHEET_RAW_DATA = "Donnees";
```

### Si votre structure de colonnes est différente

**Dans UpdateRawData (VBA) :**
```vba
' Si vos colonnes sont D, E, F au lieu de A, B, C
ws.Cells(row, 4).Value = rankKey      ' Colonne D
ws.Cells(row, 5).Value = sectorName    ' Colonne E
ws.Cells(row, 6).Value = rankData(sectorName) ' Colonne F
```

**Dans updateRawData (TypeScript) :**
```typescript
// Si vos colonnes sont D, E, F (index 3, 4, 5)
const timeframeCell = worksheet.getCell(row - 1, 3); // Colonne D
const sectorCell = worksheet.getCell(row - 1, 4);   // Colonne E
const performanceCell = worksheet.getCell(row - 1, 5); // Colonne F
```

## 🎯 Points d'Attention

1. **Noms de secteurs** : Vérifiez que les noms correspondent exactement entre Alpha Vantage et vos pondérations

2. **Format des données** : Les performances sont en pourcentage (ex: "0.5" = 0.5%)

3. **Horizons temporels** : Les horizons A à J correspondent aux différents rangs de l'API

4. **Gestion des erreurs** : La macro/script affiche des messages d'erreur clairs en cas de problème

## 🐛 Dépannage

### Les données ne se mettent pas à jour

1. Vérifier que le serveur est démarré
2. Vérifier l'URL dans Parameters!B1
3. Vérifier les noms des onglets dans le code
4. Vérifier les logs du serveur

### Erreur "Onglet non trouvé"

- Vérifier que les noms des onglets correspondent exactement (sensible à la casse)
- Vérifier les constantes dans le code VBA/TypeScript

### Les formules ne fonctionnent pas

- Vérifier que les références de cellules sont correctes
- Vérifier que les noms d'onglets dans les formules correspondent

## ✅ Checklist d'Intégration

- [ ] Structure du classeur vérifiée
- [ ] Noms d'onglets adaptés dans le code
- [ ] URL du serveur configurée
- [ ] Macro VBA ou script TypeScript adapté
- [ ] Formules Excel adaptées si nécessaire
- [ ] Test de connexion réussi
- [ ] Données mises à jour correctement
- [ ] Formules calculent correctement

## 📞 Support

Si vous rencontrez des difficultés d'intégration :
1. Vérifier la structure de votre classeur
2. Comparer avec la structure attendue dans `docs/EXCEL_SETUP.md`
3. Adapter le code selon vos besoins spécifiques


















