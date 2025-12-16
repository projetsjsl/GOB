# 🟠 Explication des Cases Orange - ÉVALUATION PERSONNELLE

## 📊 Vue d'Ensemble

Dans la section **"ÉVALUATION PERSONNELLE (Projection 5 Ans)"**, vous avez **4 métriques** :
1. **BPA (EPS)** - Bénéfice par action
2. **CFA (Cash Flow)** - Flux de trésorerie par action
3. **BV (Book Value)** - Valeur comptable par action
4. **DIV (Dividend)** - Dividende par action

Chaque métrique a :
- ☑️ Une **checkbox** (inclure/exclure)
- 🟠 Des **cases orange** (champs modifiables)

---

## 🟠 Que sont les "Cases Orange" ?

Les **cases orange** sont les **champs de saisie modifiables** avec un fond orange (`bg-orange-50`). Il y en a **2 par métrique** :

### 1. **Croissance %** (Case orange)
- **Ce que c'est** : Le taux de croissance annuel que vous prévoyez pour cette métrique sur 5 ans
- **Exemple** : Si vous mettez `8.5%`, cela signifie que vous prévoyez une croissance de 8.5% par an pendant 5 ans
- **Calcul** : `Valeur 5 ans = Valeur actuelle × (1 + Croissance%)^5`

### 2. **Ratio Cible** (Case orange)
- **Ce que c'est** : Le ratio de valorisation que vous prévoyez dans 5 ans
- **Pour BPA** : Ratio P/E cible (ex: 28.9x)
- **Pour CFA** : Ratio P/CF cible (ex: 20.2x)
- **Pour BV** : Ratio P/BV cible (ex: 6x)
- **Pour DIV** : Rendement (Yield) cible (ex: 1.18%)

---

## ☑️ Que signifie "Inclure" vs "Exclure" ?

### ☑️ **Incluse** (Checkbox cochée)
- ✅ La métrique **participe au calcul** du prix cible moyen
- ✅ Les cases orange sont **actives** (vous pouvez les modifier)
- ✅ La ligne est **normale** (fond blanc/vert)
- ✅ Le **Prix Cible** est calculé et inclus dans la moyenne

### ☐ **Exclue** (Checkbox décochée)
- ❌ La métrique **ne participe PAS** au calcul du prix cible moyen
- ❌ Les cases orange sont **désactivées** (grisées, non modifiables)
- ❌ La ligne est **grisée** (fond gris, opacité 50%)
- ❌ Le **Prix Cible** est affiché mais **ignoré** dans la moyenne

---

## 📊 Exemple Concret avec Votre Tableau

Voici votre tableau avec les explications :

| Métrique | Actuel | Croissance % 🟠 | 5 Ans (Proj) | Ratio Cible 🟠 | Prix Cible |
|----------|--------|----------------|--------------|----------------|------------|
| **BPA** | 12.29 | **8.88%** | 18.81 | **28.9x** | 543.61 $ |
| **CFA** | 18.36 | **7.30%** | 26.11 | **20.2x** | 527.44 $ |
| **BV** | 51.59 | **13.41%** | 96.78 | **6x** | 580.70 $ |
| **DIV** | 5.92 | **13.09%** | 10.95 | **1.18%** | 928.14 $ |

### 🔍 Détail de chaque ligne :

#### 1. **BPA (EPS)**
- **Actuel** : 12.29 $ (valeur actuelle du bénéfice par action)
- **Croissance % 🟠** : 8.88% (vous prévoyez 8.88% de croissance par an)
- **5 Ans (Proj)** : 18.81 $ (calculé : 12.29 × (1.0888)^5 = 18.81)
- **Ratio Cible 🟠** : 28.9x (vous prévoyez un P/E de 28.9 dans 5 ans)
- **Prix Cible** : 543.61 $ (calculé : 18.81 × 28.9 = 543.61)

#### 2. **CFA (Cash Flow)**
- **Actuel** : 18.36 $ (valeur actuelle du cash flow par action)
- **Croissance % 🟠** : 7.30% (vous prévoyez 7.30% de croissance par an)
- **5 Ans (Proj)** : 26.11 $ (calculé : 18.36 × (1.0730)^5 = 26.11)
- **Ratio Cible 🟠** : 20.2x (vous prévoyez un P/CF de 20.2 dans 5 ans)
- **Prix Cible** : 527.44 $ (calculé : 26.11 × 20.2 = 527.44)

#### 3. **BV (Book Value)**
- **Actuel** : 51.59 $ (valeur comptable actuelle par action)
- **Croissance % 🟠** : 13.41% (vous prévoyez 13.41% de croissance par an)
- **5 Ans (Proj)** : 96.78 $ (calculé : 51.59 × (1.1341)^5 = 96.78)
- **Ratio Cible 🟠** : 6x (vous prévoyez un P/BV de 6 dans 5 ans)
- **Prix Cible** : 580.70 $ (calculé : 96.78 × 6 = 580.70)

#### 4. **DIV (Dividend)**
- **Actuel** : 5.92 $ (dividende annuel actuel par action)
- **Croissance % 🟠** : 13.09% (vous prévoyez 13.09% de croissance par an)
- **5 Ans (Proj)** : 10.95 $ (calculé : 5.92 × (1.1309)^5 = 10.95)
- **Ratio Cible 🟠** : 1.18% (vous prévoyez un rendement de 1.18% dans 5 ans)
- **Prix Cible** : 928.14 $ (calculé : 10.95 / 0.0118 = 928.14)

---

## 🎯 Calcul du Prix Cible Moyen

Le **Prix Cible Moyen** est calculé en faisant la **moyenne** des prix cibles des métriques **INCLUSES** (checkbox cochée).

### Exemple 1 : Toutes les métriques incluses ☑️

```
Prix Cible Moyen = (543.61 + 527.44 + 580.70 + 928.14) / 4
                 = 2599.89 / 4
                 = 649.97 $
```

### Exemple 2 : DIV exclue ☐ (les 3 autres incluses ☑️)

Si vous décochez la checkbox de DIV :
- BPA : 543.61 $ ✅ (inclus)
- CFA : 527.44 $ ✅ (inclus)
- BV : 580.70 $ ✅ (inclus)
- DIV : 928.14 $ ❌ (exclu - ignoré)

```
Prix Cible Moyen = (543.61 + 527.44 + 580.70) / 3
                 = 1651.75 / 3
                 = 550.58 $
```

**Note** : Le prix cible de DIV (928.14 $) est toujours affiché mais **n'est pas inclus** dans la moyenne.

---

## 🟠 Pourquoi les Cases sont Orange ?

Les cases orange indiquent que ce sont des **champs modifiables** (inputs). Vous pouvez :
- ✅ **Modifier** la croissance % selon vos prévisions
- ✅ **Modifier** le ratio cible selon vos hypothèses
- ✅ **Voir** les valeurs calculées automatiquement (5 Ans, Prix Cible)

### Couleurs dans le tableau :
- 🟢 **Vert** : Valeurs calculées automatiquement (Actuel, 5 Ans, Prix Cible)
- 🟠 **Orange** : Champs modifiables par vous (Croissance %, Ratio Cible)
- ⚪ **Blanc/Gris** : En-têtes et séparateurs

---

## ⚙️ Comment Modifier les Cases Orange ?

### 1. **Cliquez** dans la case orange
### 2. **Tapez** votre nouvelle valeur
### 3. **Appuyez** sur Entrée ou cliquez ailleurs
### 4. Les valeurs **5 Ans (Proj)** et **Prix Cible** sont **recalculées automatiquement**

### Exemple : Modifier la croissance BPA

**Avant** :
- Croissance % : 8.88%
- 5 Ans (Proj) : 18.81
- Prix Cible : 543.61 $

**Vous modifiez** la croissance à **10%** :

**Après** :
- Croissance % : 10% 🟠 (modifié)
- 5 Ans (Proj) : 19.80 (recalculé : 12.29 × 1.10^5)
- Prix Cible : 572.42 $ (recalculé : 19.80 × 28.9)

---

## 🚫 Que se passe-t-il si vous Excluez une Métrique ?

### Visuellement :
- ✅ La ligne devient **grisée** (opacité 50%, fond gris)
- ✅ Les cases orange deviennent **grises** et **désactivées** (non modifiables)
- ✅ La checkbox est **décochée** ☐
- ✅ Le prix cible est toujours affiché mais **grisé**

### Dans le calcul :
- ❌ Le prix cible de cette métrique **n'est PAS inclus** dans la moyenne
- ❌ Seules les métriques **incluses** (checkbox cochée ☑️) participent au calcul

### Exemple : Exclure BV

**Avant** (toutes incluses) :
```
Prix Cible Moyen = (543.61 + 527.44 + 580.70 + 928.14) / 4 = 649.97 $
```

**Après** (BV exclue) :
```
Prix Cible Moyen = (543.61 + 527.44 + 928.14) / 3 = 666.40 $
```

**Note** : Le prix cible de BV (580.70 $) est toujours visible mais grisé et ignoré.

---

## 💡 Cas d'Usage : Quand Exclure une Métrique ?

### ✅ Inclure une métrique quand :
- Vous avez **confiance** dans les données historiques
- La métrique est **pertinente** pour ce type d'entreprise
- Vous voulez **pondérer** votre évaluation avec plusieurs méthodes

### ❌ Exclure une métrique quand :
- Les données sont **incomplètes** ou **peu fiables**
- La métrique n'est **pas pertinente** (ex: BV pour une entreprise de services)
- Vous voulez **simplifier** votre évaluation (ex: utiliser seulement BPA et CFA)
- Le prix cible calculé est **aberrant** (ex: 928.14 $ pour DIV semble trop élevé)

---

## 📝 Résumé

| Élément | Description |
|---------|-------------|
| **Cases Orange** | Champs modifiables (Croissance % et Ratio Cible) |
| **Checkbox ☑️** | Inclure/exclure la métrique du calcul |
| **Incluse ☑️** | Métrique participante au prix cible moyen, cases orange actives |
| **Exclue ☐** | Métrique ignorée dans le calcul, cases orange désactivées |
| **Prix Cible Moyen** | Moyenne des prix cibles des métriques **incluses** uniquement |

---

## 🎯 Exemple Final Complet

**Scénario** : Vous voulez exclure DIV car le prix cible (928.14 $) semble trop élevé.

1. **Décochez** la checkbox de DIV ☐
2. La ligne DIV devient **grisée**
3. Les cases orange de DIV deviennent **désactivées**
4. Le **Prix Cible Moyen** est recalculé **sans** DIV :
   ```
   Nouveau Prix Cible Moyen = (543.61 + 527.44 + 580.70) / 3 = 550.58 $
   ```

**Résultat** : Votre évaluation est maintenant basée sur 3 métriques (BPA, CFA, BV) au lieu de 4, ce qui peut donner une évaluation plus conservatrice.

---

## ✅ Checklist

- [ ] Les cases orange sont les champs **modifiables** (Croissance % et Ratio Cible)
- [ ] La checkbox ☑️ détermine si la métrique **participe au calcul**
- [ ] Une métrique exclue ☐ a ses cases orange **désactivées** et est **ignorée** dans la moyenne
- [ ] Le Prix Cible Moyen est la **moyenne** des prix cibles des métriques **incluses** uniquement
- [ ] Vous pouvez modifier les cases orange pour ajuster vos hypothèses
- [ ] Les valeurs calculées (5 Ans, Prix Cible) se mettent à jour **automatiquement**

