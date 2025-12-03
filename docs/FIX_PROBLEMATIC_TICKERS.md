# Guide de Correction des Tickers Problématiques

## Tickers avec Erreurs de Chargement

Les tickers suivants ont rencontré des erreurs lors du chargement depuis l'API FMP :

### Tickers Canadiens avec Classes d'Actions

1. **BBD.B** - Bombardier Inc. (Class B)
   - Formats essayés : `BBD-B`, `BBD.B`, `BBD-B.TO`
   - Action : Le système essaiera automatiquement ces variantes

2. **GIB.A** - CGI Inc. (Class A)
   - Formats essayés : `GIB-A`, `GIB.A`, `GIB-A.TO`
   - Action : Le système essaiera automatiquement ces variantes

3. **ATD.B** - Alimentation Couche-Tard Inc. (Class B)
   - Formats essayés : `ATD-B`, `ATD.B`, `ATD-B.TO`
   - Action : Le système essaiera automatiquement ces variantes

4. **TECK.B** - Teck Resources Limited (Class B)
   - Formats essayés : `TECK-B`, `TECK.B`, `TECK-B.TO`
   - Action : Le système essaiera automatiquement ces variantes

5. **RCI.B** - Rogers Communications Inc. (Class B)
   - Formats essayés : `RCI-B`, `RCI.B`, `RCI-B.TO`
   - Action : Le système essaiera automatiquement ces variantes

### Tickers Canadiens Standards

6. **IFC** - Intact Financial Corporation
   - Formats essayés : `IFC.TO`, `IFC`
   - Action : Le système essaiera automatiquement ces variantes

7. **GWO** - Great-West Lifeco Inc.
   - Formats essayés : `GWO.TO`, `GWO`
   - Action : Le système essaiera automatiquement ces variantes

8. **MRU** - Metro Inc.
   - Formats essayés : `MRU.TO`, `MRU`
   - Action : Le système essaiera automatiquement ces variantes

### Tickers Spéciaux

9. **BRK.B** - Berkshire Hathaway Inc. (Class B)
   - Formats essayés : `BRK-B`, `BRK.B`, `BRKB`
   - Note : FMP peut utiliser un format différent selon la bourse
   - Action : Le système essaiera automatiquement ces variantes

10. **ABX** - Barrick Gold Corporation
    - Formats essayés : `ABX.TO`, `ABX`, `GOLD`
    - Note : Barrick Gold peut maintenant être listé sous GOLD
    - Action : Le système essaiera automatiquement ces variantes

## Solution Implémentée

### Système de Fallback Automatique

L'API `/api/fmp-company-data` a été améliorée pour :

1. **Essayer le symbole original** d'abord
2. **Essayer les variantes connues** si le symbole original échoue
3. **Essayer avec suffixe .TO** pour les symboles canadiens
4. **Essayer sans suffixe de classe** (.A, .B) si nécessaire
5. **Retourner un message d'erreur informatif** avec toutes les variantes essayées

### Comment Réessayer

1. **Automatique** : Le système réessayera automatiquement lors du prochain chargement
2. **Manuel** : Utilisez le bouton "Synchroniser" dans l'application Finance Pro
3. **Vérification** : Les logs de la console afficheront le symbole réellement utilisé par FMP

### Si le Problème Persiste

Si un ticker ne charge toujours pas après ces corrections :

1. **Vérifier le symbole sur FMP** : https://financialmodelingprep.com/
2. **Essayer le symbole exact** utilisé par FMP (peut différer)
3. **Vérifier si le ticker est disponible** sur FMP (certains peuvent ne pas être supportés)
4. **Contacter le support** avec le symbole exact et le message d'erreur complet

## Format des Symboles FMP

FMP utilise différents formats selon la bourse :

- **NYSE/NASDAQ US** : `BRK-B`, `AAPL`
- **TSX (Toronto)** : `BBD-B.TO`, `GWO.TO`
- **Classes d'actions** : Utilise souvent des tirets (`-`) au lieu de points (`.`)

Le système de fallback gère automatiquement ces conversions.

