# 📘 Guide d'Utilisation et Méthodologie - Finance Pro 3p1

**Version:** 2.0  
**Dernière mise à jour:** Décembre 2025  
**Application:** Finance Pro 3p1 (GOB Dashboard)

---

## Table des Matières

1. [Introduction](#introduction)
2. [Sources des Données](#sources-des-données)
3. [Méthodologie de Calcul](#méthodologie-de-calcul)
4. [Guide d'Utilisation Step-by-Step](#guide-dutilisation-step-by-step)
5. [Métriques et Indicateurs](#métriques-et-indicateurs)
6. [Fonctionnalités Avancées](#fonctionnalités-avancées)
7. [Bonnes Pratiques](#bonnes-pratiques)
8. [FAQ](#faq)

---

## Introduction

Finance Pro 3p1 est un outil d'aide à la décision pour l'investissement fondamental. Il permet de construire des scénarios de valorisation personnalisés pour chaque société en projetant les fondamentaux (Bénéfices, Cash Flow, Dividendes) sur un horizon de 5 ans.

### Principes Fondamentaux

- **Triangulation de la Valeur** : Utilisation de 4 métriques complémentaires (EPS, CF, BV, DIV) pour calculer une valeur cible moyenne
- **Validation Historique** : Toutes les hypothèses sont comparées aux données historiques
- **Transparence Totale** : Chaque calcul est expliqué et vérifiable
- **Flexibilité** : Possibilité d'exclure/inclure des métriques selon votre analyse

---

## Sources des Données

### 🟢 Données Officielles (Vert) - Source: Financial Modeling Prep (FMP) API

Les données affichées en **vert** proviennent directement de l'API Financial Modeling Prep et sont considérées comme des données officielles auditées.

#### Données Historiques Annuelles

| Métrique | Description | Source FMP | Fréquence |
|----------|-------------|------------|-----------|
| **BPA (EPS)** | Bénéfice net par action | `income-statement` (annual) | Annuelle (auditée) |
| **CFA (Cash Flow)** | Flux de trésorerie opérationnel par action | `cash-flow-statement` (annual) | Annuelle |
| **BV (Book Value)** | Valeur comptable par action | `balance-sheet-statement` (annual) | Annuelle |
| **DIV (Dividende)** | Somme des dividendes versés par année fiscale | `key-metrics` + `financial-growth` | Annuelle |
| **Prix Haut/Bas** | Prix maximum et minimum observés durant l'année | `historical-price-full` | Quotidien (agrégé annuel) |

#### Données Actuelles

| Métrique | Description | Source FMP | Mise à jour |
|----------|-------------|------------|-------------|
| **Prix Actuel** | Dernier prix de clôture | `quote` | Temps réel |
| **P/E Actuel** | Ratio Prix/Bénéfice actuel | `key-metrics` | Quotidien |
| **P/CF Actuel** | Ratio Prix/Cash Flow actuel | `key-metrics` | Quotidien |
| **P/BV Actuel** | Ratio Prix/Valeur Comptable actuel | `key-metrics` | Quotidien |
| **Yield Actuel** | Rendement en dividendes actuel | `key-metrics` | Quotidien |
| **ROE** | Return on Equity | `key-metrics` | Quotidien |
| **ROA** | Return on Assets | `key-metrics` | Quotidien |
| **Beta** | Volatilité relative au marché | `key-metrics` | Quotidien |

#### Données ValueLine (Supabase)

Les métriques ValueLine sont stockées dans Supabase et servent de référence pour l'initialisation :

| Métrique | Description | Source |
|----------|-------------|--------|
| **Security Rank** | Cote de sécurité ValueLine (1-5) | Supabase `tickers` |
| **Earnings Predictability** | Prédictibilité des bénéfices | Supabase `tickers` |
| **Price Growth Persistence** | Persistance de la croissance du prix | Supabase `tickers` |
| **Price Stability** | Stabilité du prix | Supabase `tickers` |

> ⚠️ **Note importante** : Les métriques ValueLine sont en lecture seule dans l'interface et ne peuvent être modifiées que via Supabase pour garantir la cohérence multi-utilisateurs.

### 🟠 Projections Basées sur Hypothèses (Orange)

Les données affichées en **orange** sont des projections calculées automatiquement basées sur vos hypothèses et l'historique disponible.

#### Auto-Remplissage Intelligent

Lors de l'ajout d'un nouveau ticker ou de la synchronisation, le système calcule automatiquement :

1. **Taux de croissance historiques (CAGR)** :
   - Calculés sur toute la période disponible
   - Limités à 0-20% pour éviter les valeurs aberrantes
   - Utilisés comme point de départ pour les hypothèses

2. **Ratios cibles moyens** :
   - P/E moyen historique (filtrage des valeurs aberrantes)
   - P/CF moyen historique
   - P/BV moyen historique
   - Yield moyen historique

3. **Année de base** :
   - Sélectionnée automatiquement (dernière année avec données valides)
   - Modifiable manuellement dans l'en-tête

#### Validation et Limites

Toutes les hypothèses sont validées avec des limites raisonnables :

| Paramètre | Limite Min | Limite Max | Raison |
|-----------|------------|------------|--------|
| Taux de croissance | -50% | +50% | Éviter les projections irréalistes |
| P/E Cible | 1x | 100x | Plage de P/E historiquement observée |
| P/CF Cible | 1x | 100x | Plage de P/CF raisonnable |
| P/BV Cible | 0.5x | 50x | Plage de P/BV raisonnable |
| Yield Cible | 0.1% | 20% | Rendement de dividende réaliste |

---

## Méthodologie de Calcul

### 1. Sélection de l'Année de Base

L'année de base (`baseYear`) est cruciale car elle sert d'ancrage pour toutes les projections.

**Logique de sélection** :
```typescript
const baseYearData = data.find(d => d.year === assumptions.baseYear) || data[data.length - 1];
const baseEPS = baseYearData?.earningsPerShare || 0;
```

**Recommandation** : Utilisez l'année la plus récente avec des données complètes, ou l'année estimée N+1 si disponible.

### 2. Calcul des Valeurs Projetées (5 ans)

Pour chaque métrique (EPS, CF, BV, DIV), la valeur projetée à 5 ans est calculée avec la formule de croissance composée :

```
Valeur Projetée (An 5) = Valeur Base × (1 + Taux de Croissance / 100) ^ 5
```

**Exemple** :
- EPS Base (2024) : 5.00$
- Taux de croissance : 10% / an
- EPS Projeté (2029) : 5.00 × (1.10)⁵ = 8.05$

**Validation** :
- Le taux de croissance est limité entre -50% et +50%
- Les valeurs négatives ou nulles sont gérées automatiquement

### 3. Calcul des Prix Cibles

Chaque métrique génère un prix cible indépendant :

#### A. Prix Cible EPS (Méthode P/E)

```
Prix Cible EPS = EPS Projeté (An 5) × P/E Cible
```

**Exemple** :
- EPS Projeté : 8.05$
- P/E Cible : 20x
- Prix Cible EPS : 8.05 × 20 = 161.00$

#### B. Prix Cible Cash Flow (Méthode P/CF)

```
Prix Cible CF = CF Projeté (An 5) × P/CF Cible
```

**Exemple** :
- CF Projeté : 10.00$
- P/CF Cible : 15x
- Prix Cible CF : 10.00 × 15 = 150.00$

#### C. Prix Cible Book Value (Méthode P/BV)

```
Prix Cible BV = BV Projeté (An 5) × P/BV Cible
```

**Exemple** :
- BV Projeté : 50.00$
- P/BV Cible : 3x
- Prix Cible BV : 50.00 × 3 = 150.00$

#### D. Prix Cible Dividende (Méthode Yield)

```
Prix Cible DIV = Dividende Projeté (An 5) / (Yield Cible / 100)
```

**Exemple** :
- Dividende Projeté : 3.00$
- Yield Cible : 2.5%
- Prix Cible DIV : 3.00 / 0.025 = 120.00$

### 4. Prix Cible Moyen (Triangulation)

Le prix cible final est la moyenne des prix cibles valides (métriques non exclues) :

```
Prix Cible Moyen = (Prix Cible EPS + Prix Cible CF + Prix Cible BV + Prix Cible DIV) / Nombre de Métriques Incluses
```

**Validation** :
- Seuls les prix cibles entre 10% et 5000% du prix actuel sont considérés valides
- Les métriques exclues (checkbox décochée) ne sont pas incluses dans le calcul
- Les valeurs aberrantes sont automatiquement détectées et exclues

### 5. Calcul du Rendement Total Projeté

Le rendement total combine l'appréciation du capital et les dividendes perçus :

#### A. Accumulation des Dividendes (5 ans)

```
Dividende An 1 = Dividende Base × (1 + Taux Croissance DIV / 100)
Dividende An 2 = Dividende An 1 × (1 + Taux Croissance DIV / 100)
...
Dividende Total = Somme des 5 années
```

**Exemple** :
- Dividende Base : 2.00$
- Taux de croissance : 5% / an
- Dividende An 1 : 2.10$
- Dividende An 2 : 2.21$
- Dividende An 3 : 2.32$
- Dividende An 4 : 2.43$
- Dividende An 5 : 2.55$
- **Dividende Total** : 11.61$

#### B. Rendement Total

```
Rendement Total = ((Prix Cible Moyen + Dividendes Totaux - Prix Actuel) / Prix Actuel) × 100
```

**Exemple** :
- Prix Actuel : 100.00$
- Prix Cible Moyen : 150.00$
- Dividendes Totaux : 11.61$
- Rendement Total : ((150.00 + 11.61 - 100.00) / 100.00) × 100 = **61.61%**

#### C. Rendement Annualisé (CAGR)

```
Rendement Annualisé = ((Prix Cible Moyen / Prix Actuel) ^ (1/5) - 1) × 100
```

**Exemple** :
- Prix Actuel : 100.00$
- Prix Cible Moyen : 150.00$
- Rendement Annualisé : ((150.00 / 100.00) ^ (1/5) - 1) × 100 = **8.45% / an**

### 6. Métrique JPEGY (Jean-Sebastien's P/E Adjusted for Growth & Yield)

Le JPEGY est une métrique propriétaire qui ajuste le P/E par la croissance et le rendement :

```
JPEGY = P/E Actuel / (Taux de Croissance EPS % + Yield %)
```

**Interprétation** :
- **JPEGY ≤ 0.5** : Très sous-évalué (vert pâle)
- **JPEGY 0.5 - 1.5** : Sous-évalué à raisonnable (vert foncé)
- **JPEGY 1.5 - 1.75** : Légèrement surévalué (jaune)
- **JPEGY 1.75 - 2.0** : Surévalué (orange)
- **JPEGY > 2.0** : Très surévalué (rouge)

**Exemple** :
- P/E Actuel : 25x
- Taux de croissance EPS : 10%
- Yield : 2%
- JPEGY : 25 / (10 + 2) = **2.08** (surévalué)

**Note** : Si (Croissance + Yield) ≤ 0.01%, le JPEGY ne peut pas être calculé et affiche "N/A".

### 7. Ratio 3:1 (Potentiel vs Risque)

Le ratio 3:1 mesure le potentiel de hausse par rapport au risque de baisse :

```
Ratio 3:1 = Potentiel de Hausse (%) / Risque de Baisse (%)
```

#### A. Potentiel de Hausse

```
Potentiel de Hausse = ((Prix Cible Moyen - Prix Actuel) / Prix Actuel) × 100
```

#### B. Risque de Baisse

```
Prix Plancher = Moyenne des Prix Bas Historiques × 0.9
Risque de Baisse = ((Prix Actuel - Prix Plancher) / Prix Actuel) × 100
```

**Interprétation** :
- **Ratio ≥ 3:1** : Favorable - Le potentiel est au moins 3x supérieur au risque
- **Ratio < 3:1**** : Défavorable - Le risque est élevé par rapport au potentiel

**Exemple** :
- Prix Actuel : 100.00$
- Prix Cible Moyen : 150.00$
- Prix Plancher : 80.00$
- Potentiel de Hausse : ((150 - 100) / 100) × 100 = 50%
- Risque de Baisse : ((100 - 80) / 100) × 100 = 20%
- **Ratio 3:1** : 50 / 20 = **2.5:1** (défavorable)

### 8. Zones de Prix Recommandées

Les zones d'achat, conservation et vente sont calculées dynamiquement :

#### A. Zone d'Achat (Vert)

```
Prix Plancher = Moyenne Prix Bas Historiques × 0.9
Limite d'Achat = Prix Plancher + (Prix Cible 5 ans - Prix Plancher) × 33%
```

**Recommandation** : ACHAT si Prix Actuel ≤ Limite d'Achat

#### B. Zone de Conservation (Jaune)

```
Limite de Conservation = Limite d'Achat < Prix Actuel < Limite de Vente
```

**Recommandation** : CONSERVER si Prix Actuel entre les deux limites

#### C. Zone de Vente (Rouge)

```
Limite de Vente = Prix Cible 5 ans × 0.95
```

**Recommandation** : VENDRE si Prix Actuel ≥ Limite de Vente

### 9. Détection Automatique des Valeurs Aberrantes

Le système détecte automatiquement les métriques avec des prix cibles aberrants :

**Méthode** :
1. Calcul de la médiane des prix cibles
2. Calcul de l'écart-type
3. Identification des valeurs > 2 écarts-types de la médiane
4. Exclusion automatique recommandée (checkbox décochée)

**Exemple** :
- Prix Cibles : [150, 155, 160, 500, 158]
- Médiane : 158
- Écart-type : ~140
- Valeur aberrante : 500 (détectée et exclue automatiquement)

---

## Guide d'Utilisation Step-by-Step

### Exemple Complet : Analyse d'Apple (AAPL)

#### Étape 1 : Ajouter un Ticker

1. Cliquez sur le bouton **"Ajouter"** dans la sidebar gauche
2. Entrez le symbole **"AAPL"** dans le champ de recherche
3. Sélectionnez "Apple Inc." dans les résultats
4. Cliquez sur **"Ajouter"**

**Résultat** : Le système charge automatiquement :
- ✅ Données historiques (10 dernières années)
- ✅ Prix actuel et métriques clés
- ✅ Hypothèses auto-remplies (CAGR historiques, ratios moyens)
- ✅ Métriques ValueLine (si disponibles dans Supabase)

#### Étape 2 : Vérifier les Données Historiques

1. Consultez le tableau **"Données Historiques"**
2. Vérifiez la cohérence des données :
   - Les ratios P/E, P/CF, P/BV sont-ils dans des plages raisonnables ?
   - Y a-t-il des années avec des valeurs aberrantes ?
3. Ajustez manuellement si nécessaire (cliquez sur une cellule pour éditer)

**Exemple AAPL** :
- Année 2023 : EPS = 6.11$, Prix = 150-200$
- P/E moyen historique : ~25x (cohérent pour une tech)
- Yield moyen : ~0.5% (faible, typique pour une tech en croissance)

#### Étape 3 : Sélectionner l'Année de Base

1. Dans l'en-tête, sélectionnez l'année de base (par défaut : dernière année avec données)
2. Pour AAPL, sélectionnez **2023** (dernière année complète)

**Impact** : Toutes les projections partiront de cette année de référence.

#### Étape 4 : Examiner les Hypothèses Auto-Remplies

1. Consultez la section **"ÉVALUATION PERSONNELLE (Projection 5 Ans)"**
2. Vérifiez les valeurs en orange (auto-remplies) :
   - **Croissance EPS** : 10.5% / an (CAGR historique)
   - **P/E Cible** : 25x (moyenne historique)
   - **Croissance CF** : 12.0% / an
   - **P/CF Cible** : 20x
   - etc.

3. **Ajustez selon votre analyse** :
   - Si vous pensez que la croissance va ralentir, réduisez le taux
   - Si vous pensez que le P/E va se contracter, réduisez le ratio cible

**Exemple AAPL - Ajustements** :
- Croissance EPS : 10.5% → **8%** (ralentissement attendu)
- P/E Cible : 25x → **22x** (compression des multiples)
- Croissance CF : 12% → **10%** (alignement avec EPS)

#### Étape 5 : Exclure/Inclure des Métriques

1. Utilisez les checkboxes à gauche de chaque métrique pour inclure/exclure
2. **Recommandation** : Excluez une métrique si :
   - Son prix cible est aberrant (détecté automatiquement)
   - Elle n'est pas pertinente pour ce type d'entreprise
   - Les données historiques sont incomplètes

**Exemple AAPL** :
- ✅ EPS : Inclus (métrique principale)
- ✅ CF : Inclus (cash flow important pour tech)
- ❌ BV : Exclu (peu pertinent pour tech avec actifs intangibles)
- ✅ DIV : Inclus (dividendes croissants)

#### Étape 6 : Analyser les Résultats

1. Consultez la section **"Rendement Espéré (5 ans)"** :
   - **Appréciation du Prix** : 15.3% / an
   - **Rendement Total Espéré** : 17.5% / an (incluant dividendes)
   - **Prix Projeté (5 ans)** : 543.61$ US

2. Vérifiez le **Ratio 3:1** :
   - Potentiel de Hausse : 50%
   - Risque de Baisse : 20%
   - Ratio : 2.5:1 (légèrement défavorable)

3. Consultez les **Zones de Prix Recommandées** :
   - Zone d'Achat : ≤ 180$
   - Zone de Conservation : 180$ - 516$
   - Zone de Vente : ≥ 516$
   - **Position Actuelle** : 266.59$ → **CONSERVER**

#### Étape 7 : Utiliser le KPI Dashboard

1. Cliquez sur l'onglet **"KPI"** en haut
2. Visualisez tous vos tickers dans une matrice de performance
3. Utilisez les filtres pour :
   - Filtrer par rendement (ex: > 20%)
   - Filtrer par JPEGY (ex: < 1.5)
   - Filtrer par recommandation (Achat/Conserver/Vendre)
   - Filtrer par secteur

**Exemple** : Filtrez pour voir uniquement les tickers avec :
- Rendement > 30%
- JPEGY < 1.5
- Recommandation = ACHAT

#### Étape 8 : Sauvegarder et Créer un Snapshot

1. Cliquez sur **"Sauvegarder"** dans l'en-tête
2. Le système crée automatiquement un snapshot avec :
   - Toutes les données historiques
   - Toutes les hypothèses
   - Les métriques calculées
   - La date et l'heure

3. Consultez l'historique dans la sidebar droite :
   - Cliquez sur un snapshot pour le charger (mode lecture seule)
   - Comparez différentes versions de votre analyse

#### Étape 9 : Synchroniser les Données

1. Cliquez sur **"Sync. Données"** pour mettre à jour un ticker spécifique
2. Ou utilisez **"Synchroniser tous les tickers"** pour une mise à jour en masse

**Comportement** :
- ✅ Les données auto-fetchées (`autoFetched: true`) sont mises à jour
- ✅ Les données manuelles (`autoFetched: false`) sont préservées
- ✅ Les nouvelles années sont ajoutées
- ✅ Les hypothèses sont recalculées (mais les exclusions sont préservées)

#### Étape 10 : Restaurer des Données

1. Cliquez sur **"Restaurer"** dans l'en-tête
2. Choisissez :
   - **"Charger le dernier snapshot"** : Restaure la dernière sauvegarde
   - **"Recalculer depuis FMP"** : Recharge les données FMP et réapplique les hypothèses

---

## Métriques et Indicateurs

### Métriques Principales

#### 1. Rendement Total Projeté (5 ans)

**Définition** : Rendement total incluant l'appréciation du capital et les dividendes.

**Formule** : `((Prix Cible Moyen + Dividendes Totaux - Prix Actuel) / Prix Actuel) × 100`

**Interprétation** :
- **> 50%** : Excellent potentiel (vert foncé)
- **20-50%** : Bon potentiel (vert pâle)
- **0-20%** : Potentiel modéré (jaune)
- **< 0%** : Potentiel négatif (rouge)

#### 2. JPEGY (P/E Ajusté)

**Définition** : Métrique propriétaire ajustant le P/E par la croissance et le rendement.

**Formule** : `P/E Actuel / (Croissance EPS % + Yield %)`

**Interprétation** : Voir section [Métrique JPEGY](#6-métrique-jpegy-jean-sebastiens-pe-adjusted-for-growth--yield)

#### 3. Ratio 3:1

**Définition** : Ratio du potentiel de hausse vs risque de baisse.

**Formule** : `Potentiel de Hausse (%) / Risque de Baisse (%)`

**Interprétation** :
- **≥ 3:1** : Favorable (vert)
- **1:1 - 3:1** : Modéré (jaune)
- **< 1:1** : Défavorable (rouge)

#### 4. Multiple 3 ans

**Définition** : Facteur de croissance sur 3 ans basé sur le taux de croissance EPS.

**Formule** : `(1 + Taux Croissance EPS / 100)³`

**Exemple** : Si croissance = 10%, Multiple 3 ans = 1.10³ = 1.33x

### Indicateurs Visuels

#### Matrice de Performance (KPI Dashboard)

- **Couleurs** : Basées sur le rendement total projeté
- **Icônes** :
  - ⭐ : Portefeuille
  - 👁️ : Watchlist
  - ✓ : Version approuvée
  - ⚠️ : Données invalides

#### Graphique X/Y (JPEGY vs Rendement)

- **Axe X** : JPEGY (0 à 5)
- **Axe Y** : Rendement Total Projeté (-50% à +200%)
- **Couleurs** : Basées sur le rendement

---

## Fonctionnalités Avancées

### 1. Gestion Multi-Tickers

- **Portefeuille** : Tickers principaux (⭐)
- **Watchlist** : Tickers surveillés (👁️)
- **Filtrage** : Par source, secteur, recommandation, JPEGY, rendement

### 2. Snapshots et Historique

- **Sauvegarde automatique** : À chaque modification importante
- **Versions historiques** : Accès à toutes les versions précédentes
- **Comparaison** : Chargez différentes versions pour comparer

### 3. Synchronisation Intelligente

- **Merge intelligent** : Préserve les modifications manuelles
- **Détection automatique** : Identifie les données auto-fetchées vs manuelles
- **Validation** : Vérifie la cohérence des données avant sauvegarde

### 4. Détection d'Aberrations

- **Automatique** : Détecte les prix cibles aberrants
- **Exclusion recommandée** : Décochage automatique des métriques problématiques
- **Feedback visuel** : Indication claire des métriques exclues

### 5. Matrices de Sensibilité

- **P/E vs Croissance EPS** : Visualise l'impact des variations
- **P/FCF vs Croissance CF** : Visualise l'impact des variations
- **Aide à la décision** : Comprendre la sensibilité aux hypothèses

---

## Bonnes Pratiques

### 1. Validation des Données

✅ **À faire** :
- Vérifier la cohérence des ratios historiques
- Comparer les hypothèses aux moyennes historiques
- Valider les données ValueLine si disponibles

❌ **À éviter** :
- Utiliser des taux de croissance > 20% sans justification
- Ignorer les données historiques incomplètes
- Faire confiance aveuglément aux auto-fill

### 2. Ajustement des Hypothèses

✅ **À faire** :
- Ajuster selon l'analyse sectorielle
- Considérer le cycle économique
- Prendre en compte les événements spécifiques à l'entreprise

❌ **À éviter** :
- Projeter indéfiniment les tendances passées
- Ignorer les changements structurels
- Utiliser des ratios cibles irréalistes

### 3. Utilisation des Métriques

✅ **À faire** :
- Utiliser la triangulation (4 métriques)
- Exclure les métriques non pertinentes
- Comparer avec les pairs du secteur

❌ **À éviter** :
- Se fier à une seule métrique
- Ignorer les valeurs aberrantes
- Comparer des entreprises de secteurs différents

### 4. Gestion des Snapshots

✅ **À faire** :
- Sauvegarder avant des changements majeurs
- Nommer les snapshots avec des dates/versions
- Comparer différentes scénarios (optimiste/pessimiste)

❌ **À éviter** :
- Supprimer des snapshots importants
- Ne jamais sauvegarder
- Ignorer l'historique

---

## FAQ

### Q1 : Pourquoi certaines métriques affichent "N/A" ?

**R** : Plusieurs raisons possibles :
- Données historiques incomplètes
- Calcul impossible (ex: JPEGY si croissance + yield ≤ 0.01%)
- Valeurs aberrantes détectées et exclues
- Synchronisation nécessaire

### Q2 : Comment interpréter un JPEGY de 0.0 ?

**R** : Un JPEGY de 0.0 indique que le calcul n'a pas pu être effectué. Vérifiez :
- Que l'EPS est valide (> 0.01)
- Que (Croissance + Yield) > 0.01%
- Que le P/E est valide (> 0)

### Q3 : Pourquoi le rendement projeté est-il de -100% ?

**R** : -100% indique des données invalides :
- Prix actuel ≤ 0
- Aucun prix cible valide
- Données non synchronisées

**Solution** : Cliquez sur "Sync. Données" pour récupérer les données FMP.

### Q4 : Comment exclure une métrique du calcul ?

**R** : Décochez la checkbox à gauche de la métrique dans la section "ÉVALUATION PERSONNELLE". La ligne devient grise et n'est plus incluse dans le prix cible moyen.

### Q5 : Les données ValueLine peuvent-elles être modifiées ?

**R** : Non, les métriques ValueLine sont en lecture seule dans l'interface pour garantir la cohérence multi-utilisateurs. Elles doivent être modifiées via Supabase.

### Q6 : Quelle est la différence entre "Sync. Données" et "Synchroniser tous les tickers" ?

**R** :
- **"Sync. Données"** : Met à jour uniquement le ticker actuellement sélectionné
- **"Synchroniser tous les tickers"** : Met à jour tous les tickers en masse (avec sauvegarde automatique)

### Q7 : Comment restaurer une version précédente ?

**R** : Cliquez sur "Restaurer" dans l'en-tête, puis choisissez :
- Charger le dernier snapshot
- Recalculer depuis FMP (avec préservation des exclusions)

### Q8 : Pourquoi certaines données sont-elles en orange ?

**R** : Les données en orange sont des projections basées sur vos hypothèses, pas des données officielles. Elles sont calculées automatiquement et peuvent être ajustées manuellement.

---

## Conclusion

Finance Pro 3p1 est un outil puissant pour l'analyse fondamentale, mais il nécessite une compréhension approfondie des principes d'investissement et de la méthodologie utilisée. Utilisez-le comme un outil d'aide à la décision, pas comme une garantie de performance.

**Rappel important** : Les projections sont basées sur des hypothèses et l'historique. Elles ne constituent pas une garantie de performance future. Toujours effectuer votre propre analyse approfondie avant de prendre des décisions d'investissement.

---

**Document créé le** : Décembre 2025  
**Dernière révision** : Décembre 2025  
**Version** : 2.0

