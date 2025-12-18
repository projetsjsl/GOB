# 📊 Guide de Configuration Excel

Ce guide explique comment créer et configurer le classeur Excel pour l'analyse des performances sectorielles.

## 📋 Structure du Classeur

### 1. Onglet "Parameters"

#### Configuration

| Cellule | Contenu | Format |
|---------|---------|--------|
| A1 | `URL Serveur:` | Texte |
| B1 | `http://localhost:5000` | Texte (modifiable) |
| A2 | `Dernière mise à jour:` | Texte |
| B2 | `=NOW()` | Date/Heure (mise à jour automatique) |
| A3 | `Horizon:` | Texte |
| B3 | Liste déroulante (A, B, C, D, E, F, G, H, I, J) | Validation de données |
| A4 | `Instructions:` | Texte |
| B4 | Instructions d'utilisation | Texte multiligne |

#### Création de la Liste Déroulante (Cellule B3)

1. Sélectionner la cellule B3
2. `Données > Validation des données`
3. Autoriser : `Liste`
4. Source : `A,B,C,D,E,F,G,H,I,J`
5. OK

#### Ajout d'un Bouton pour la Macro (Excel Desktop)

1. `Développeur > Insérer > Bouton (Formulaires)`
2. Dessiner le bouton dans la feuille
3. Sélectionner la macro `UpdateIndices`
4. Renommer le bouton : "Mettre à jour les données"

#### Instructions à Ajouter (Cellule B4)

```
1. Excel Desktop : Cliquer sur le bouton "Mettre à jour" ou exécuter la macro UpdateIndices (Alt+F8)
2. Excel Online : Aller dans Automatisation > Scripts > UpdateIndicesScript > Exécuter
3. Vérifier que l'URL du serveur (B1) est correcte
4. Sélectionner l'horizon souhaité (B3)
```

### 2. Onglet "RawData_SP500"

#### Structure

| Colonne | En-tête | Format |
|---------|---------|--------|
| A | `Timeframe` | Texte |
| B | `Sector` | Texte |
| C | `Performance` | Pourcentage (0.00%) |

#### Configuration

- Ligne 1 : En-têtes (gras, centré)
- Colonnes A-C : Données (remplies par la macro/script)
- Format automatique : Les performances en pourcentage

### 3. Onglet "Current_SP500"

#### Structure

- Ligne 1 : En-têtes des horizons (Rank A, Rank B, ..., Rank J)
- Colonne A : Liste des secteurs
- Matrice B2:J11 : Performances par secteur et horizon

#### Configuration

- Ligne 1 : En-têtes (gras, centré, format pourcentage)
- Colonne A : Secteurs (format texte)
- Matrice : Format pourcentage (0.00%)
- Mise en forme conditionnelle : Couleurs pour valeurs positives/négatives

#### Formule pour la Mise en Forme Conditionnelle

1. Sélectionner la plage B2:J11
2. `Accueil > Mise en forme conditionnelle > Règles de mise en surbrillance des cellules`
3. Règle 1 : `Supérieur à 0` → Vert clair
4. Règle 2 : `Inférieur à 0` → Rouge clair

### 4. Onglet "MSCI_World"

#### Structure

| Colonne | Contenu |
|---------|---------|
| A | Secteur |
| B | Pondération (%) |
| C | Performance (formule) |
| D | Contribution (formule) |

#### Pondérations (Colonne B)

| Secteur | Pondération |
|---------|-------------|
| Technologie de l'information | 26.9 |
| Financiers | 16.7 |
| Industriels | 11.4 |
| Consommation discrétionnaire | 10.1 |
| Santé | 9.12 |
| Services de communication | 8.48 |
| Consommation courante | 5.75 |
| Énergie | 3.52 |
| Matériaux | 3.15 |
| Services publics | 2.65 |
| Immobilier | 1.97 |

#### Formules

**Colonne C - Performance** (exemple pour la ligne 2) :
```excel
=IFERROR(INDEX(Current_SP500!$B$2:$K$100, 
  MATCH(A2, Current_SP500!$A$2:$A$100, 0), 
  MATCH("Rank " & Parameters!$B$3 & ": Real-Time Performance", Current_SP500!$1:$1, 0)), 0)
```

**Colonne D - Contribution** :
```excel
=B2/100 * C2
```

**Cellule Total (exemple B13)** :
```excel
=SUM(D2:D12)
```

### 5. Onglet "SPTSX"

#### Structure Identique à MSCI_World

#### Pondérations (Colonne B)

| Secteur | Pondération |
|---------|-------------|
| Financiers | 33.0 |
| Énergie | 17.1 |
| Industriels | 12.6 |
| Technologie de l'information | 10.1 |
| Matériaux | 11.4 |
| Consommation courante | 4.0 |
| Consommation discrétionnaire | 3.3 |
| Services de communication | 2.4 |
| Immobilier | 2.0 |
| Services publics | 3.8 |
| Santé | 0.3 |

#### Formules Identiques à MSCI_World

### 6. Onglet "Weighted_Performance"

#### Structure

| Colonne | Contenu |
|---------|---------|
| A | Indice |
| B | Performance Pondérée |
| C | Date de Calcul |

#### Données

| Indice | Performance | Date |
|--------|-------------|------|
| S&P 500 | Formule | =NOW() |
| MSCI World | Formule | =NOW() |
| S&P/TSX | Formule | =NOW() |

#### Formules

**S&P 500** (moyenne simple des secteurs) :
```excel
=AVERAGE(Current_SP500!B2:B11)
```

**MSCI World** :
```excel
=MSCI_World!B13
```

**S&P/TSX** :
```excel
=SPTSX!B13
```

### 7. Onglet "Dashboard"

#### Structure

Tableau récapitulatif avec :
- Indice
- Performance pour l'horizon sélectionné
- Variation depuis le dernier horizon
- Graphique de comparaison

#### Formules

**Performance S&P 500** :
```excel
=Weighted_Performance!B2
```

**Performance MSCI World** :
```excel
=Weighted_Performance!B3
```

**Performance S&P/TSX** :
```excel
=Weighted_Performance!B4
```

#### Graphique

1. Sélectionner les données (A1:B4)
2. `Insertion > Graphique > Colonnes`
3. Titre : "Performances des Indices"
4. Axe Y : "Performance (%)"

## 🔧 Configuration Avancée

### Mapping des Secteurs

Si les noms de secteurs d'Alpha Vantage ne correspondent pas exactement aux pondérations, créer un onglet "SectorMapping" avec :

| Alpha Vantage | Standard |
|---------------|----------|
| Communication Services | Services de communication |
| Consumer Discretionary | Consommation discrétionnaire |
| ... | ... |

Puis utiliser VLOOKUP dans les formules.

### Actualisation Automatique

Pour actualiser automatiquement toutes les heures :

1. `Données > Connexions`
2. Ajouter une connexion
3. Configurer l'actualisation automatique : Toutes les heures

## ✅ Checklist de Vérification

- [ ] Tous les onglets sont créés
- [ ] Les formules sont correctes
- [ ] Les formats de cellules sont appliqués (pourcentages)
- [ ] La liste déroulante fonctionne (Parameters B3)
- [ ] La macro VBA est importée (Excel Desktop)
- [ ] Le script TypeScript est enregistré (Excel Online)
- [ ] Les liens vers les autres onglets fonctionnent
- [ ] Le graphique s'affiche correctement
- [ ] Les mises en forme conditionnelles sont appliquées

## 🐛 Dépannage

### Les formules retournent #N/A

- Vérifier que les noms de secteurs correspondent exactement
- Vérifier que l'onglet Current_SP500 contient des données
- Vérifier les références de cellules

### Les pourcentages ne s'affichent pas correctement

- Sélectionner les cellules
- `Format de cellule > Pourcentage > 2 décimales`

### Le graphique ne se met pas à jour

- Vérifier que les formules dans Weighted_Performance sont correctes
- Actualiser le graphique : Clic droit > Actualiser















