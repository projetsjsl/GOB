# Analyse des Limites Restrictives dans les Prompts d'Emma

## 🔍 Vue d'ensemble

Analyse des restrictions excessives dans les prompts système d'Emma qui peuvent limiter sa capacité à répondre de manière adaptée et naturelle.

---

## ❌ LIMITES TROP RESTRICTIVES IDENTIFIÉES

### 1. **Comparaisons Historiques OBLIGATOIRES (NON NÉGOCIABLE)**

**Localisation**: `emma-agent.js` lignes 1867-1870, 2910-2954

**Restriction actuelle**:
```
❌ ❌ ❌ COMPARAISONS HISTORIQUES OBLIGATOIRES (5 ans minimum) - NON NÉGOCIABLE ❌ ❌ ❌
• CHAQUE ratio DOIT avoir: valeur actuelle vs moyenne 5 ans vs secteur
• ❌ INTERDIT: Mentionner un ratio sans comparaison historique
```

**Problème**:
- Si données historiques non disponibles → Emma ne peut pas répondre correctement
- Force des comparaisons même quand non pertinentes
- Peut générer des réponses frustrantes ("je ne peux pas répondre car pas de données historiques")
- Trop rigide pour questions simples (ex: "prix AAPL")

**Impact**: 
- Questions simples deviennent complexes inutilement
- Réponses peuvent être bloquées si données manquantes
- Frustration utilisateur si Emma refuse de répondre

**Recommandation**:
```
✅ COMPARAISONS HISTORIQUES RECOMMANDÉES (quand disponibles):
• Si données historiques disponibles → TOUJOURS comparer vs 5 ans et secteur
• Si données historiques PARTIELLES → Comparer avec ce qui est disponible
• Si AUCUNE donnée historique → Fournir ratio actuel avec contexte sectoriel si possible
• Pour questions simples (prix, ratio unique) → Comparaison optionnelle
```

---

### 2. **Minimum 8-12 Ratios OBLIGATOIRES**

**Localisation**: `emma-agent.js` ligne 1866, `emma-cfa-prompt.js` ligne 32

**Restriction actuelle**:
```
- Minimum 8-12 ratios financiers par analyse
```

**Problème**:
- Trop pour questions simples ("prix AAPL", "P/E de MSFT")
- Force des analyses complètes même pour questions ciblées
- Peut générer des réponses trop longues pour SMS
- Utilisateur peut vouloir juste 1-2 ratios spécifiques

**Impact**:
- Réponses surchargées pour questions simples
- Temps de réponse plus long
- Coût API plus élevé (tokens)

**Recommandation**:
```
✅ Ratios selon contexte:
• Question simple (prix, 1 ratio) → 1-2 ratios suffisants
• Question ciblée (fondamentaux) → 4-6 ratios pertinents
• Analyse complète → 8-12 ratios (actuel)
• SMS → 3-5 ratios clés maximum
```

---

### 3. **Interdiction de Demander des Clarifications**

**Localisation**: `emma-agent.js` ligne 1931

**Restriction actuelle**:
```
8. ❌ NE JAMAIS demander de clarifications - fournis directement l'analyse
```

**Problème**:
- Questions ambiguës ne peuvent pas être clarifiées
- Emma doit deviner l'intention (risque d'erreur)
- Exemple: "analyse Apple" → Apple Inc. (AAPL) ou Apple REIT?
- Peut générer des réponses sur le mauvais sujet

**Impact**:
- Réponses potentielles sur mauvais sujet
- Frustration si Emma répond à côté
- Pas de possibilité de corriger l'ambiguïté

**Recommandation**:
```
✅ Clarifications intelligentes (quand nécessaire):
• Si question ambiguë (ex: "Apple" peut être AAPL ou REIT) → Demander clarification
• Si ticker invalide/inexistant → Suggérer corrections possibles
• Si demande trop vague → Proposer options spécifiques
• Pour questions claires → Répondre directement (actuel)
```

---

### 4. **Interdiction de Dire "Aucune Donnée Disponible"**

**Localisation**: `emma-agent.js` lignes 1916, 1930

**Restriction actuelle**:
```
→ Ne JAMAIS dire "aucune donnée disponible" sans avoir cherché via Perplexity
7. ❌ NE JAMAIS dire "aucune donnée disponible" si des outils ont retourné des données (même partielles)
```

**Problème**:
- Force Emma à répondre même sans données fiables
- Peut générer des réponses basées sur suppositions
- Utilisateur peut préférer savoir qu'il n'y a pas de données
- Transparence compromise

**Impact**:
- Réponses potentiellement incorrectes si données manquantes
- Manque de transparence
- Confiance utilisateur compromise

**Recommandation**:
```
✅ Transparence sur disponibilité des données:
• Si données complètes disponibles → Analyser normalement
• Si données partielles → Mentionner "données partielles, analyse basée sur..."
• Si AUCUNE donnée après recherche Perplexity → Dire clairement "Je n'ai pas trouvé de données récentes sur [X]. Vérifiez le ticker/nom exact."
• Toujours être transparent sur les limites
```

---

### 5. **Focus Géographique Restrictif**

**Localisation**: `emma-agent.js` lignes 1807-1819

**Restriction actuelle**:
```
- ❌ ÉVITER: Immobilier français, marchés européens de niche sauf si explicitement demandé
⚠️ NE JAMAIS parler d'immobilier français ou de marchés européens de niche sauf si l'utilisateur le demande explicitement.
```

**Problème**:
- Limite la capacité à répondre sur marchés internationaux
- Utilisateur peut avoir besoin d'infos sur Europe/Asie
- Trop restrictif pour questions globales
- Peut bloquer des réponses pertinentes

**Impact**:
- Réponses incomplètes pour questions internationales
- Limite l'utilité pour investisseurs globaux
- Peut frustrer utilisateurs intéressés par autres marchés

**Recommandation**:
```
✅ Focus adaptatif:
• Par défaut: Priorité marchés US/CA (actuel)
• Si question explicite sur autre marché → Répondre complètement
• Si contexte international dans question → Inclure perspective globale
• Ne PAS bloquer les réponses, mais prioriser US/CA
```

---

### 6. **Questions Suggérées OBLIGATOIRES**

**Localisation**: `emma-agent.js` lignes 2967-3033

**Restriction actuelle**:
```
💡 QUESTIONS SUGGÉRÉES INTELLIGENTES (OBLIGATOIRE EN FIN DE RÉPONSE) 💡:
• 🎯 TOUJOURS terminer ta réponse par 3-5 questions suggérées PERTINENTES
```

**Problème**:
- Inapproprié pour questions simples/fermées
- Peut être redondant si question déjà complète
- SMS: Ajoute longueur inutile
- Peut frustrer si utilisateur veut juste une réponse directe

**Impact**:
- Réponses plus longues que nécessaire
- Peut sembler "vendeur" ou trop proactif
- SMS: Consomme caractères précieux

**Recommandation**:
```
✅ Questions suggérées contextuelles:
• Questions simples/fermées (prix, ratio) → Pas de questions suggérées
• Questions ouvertes/analyses → 2-3 questions pertinentes
• SMS → Questions suggérées optionnelles (seulement si pertinent)
• Analyses complètes → 3-5 questions (actuel)
```

---

### 7. **Longueurs Minimales Excessives**

**Localisation**: `emma-agent.js` lignes 2080, 2821, `emma-cfa-prompt.js` ligne 60

**Restriction actuelle**:
```
- Analyses complètes: 800-1200 mots minimum
- Analyses ciblées: 400-600 mots
- Briefings: 1500-2000 mots minimum
- Analyses: 2000-3000 mots MINIMUM (3000-5000 mots pour analyses complexes)
```

**Problème**:
- Trop long pour SMS (limite 7500 caractères = ~1500 mots)
- Force des réponses longues même pour questions simples
- Peut générer du "remplissage" pour atteindre minimum
- Utilisateur peut préférer réponses concises

**Impact**:
- SMS: Risque de troncature
- Réponses trop longues pour questions simples
- Coût API plus élevé
- Temps de réponse plus long

**Recommandation**:
```
✅ Longueurs adaptatives:
• Questions simples (prix, 1 ratio) → 50-150 mots
• Questions ciblées → 200-400 mots
• Analyses complètes → 800-1200 mots (actuel OK)
• SMS → 200-400 mots (concis mais complet)
• Briefings → 1000-1500 mots (au lieu de 1500-2000)
```

---

### 8. **Interdiction Absolue de JSON/Code**

**Localisation**: `emma-agent.js` lignes 1895-1900, multiples occurrences

**Restriction actuelle**:
```
1. ❌ ❌ ❌ ABSOLUMENT INTERDIT DE COPIER DU JSON/CODE DANS TA RÉPONSE ❌ ❌ ❌
   - ❌ INTERDIT: Afficher "{\\"price\\": 245.67}" ou tout autre JSON/code
```

**Problème**:
- ✅ Cette restriction est JUSTIFIÉE et doit rester
- Empêche les réponses techniques/incompréhensibles
- Nécessaire pour UX conversationnelle

**Impact**: ✅ Positif - Garder cette restriction

**Recommandation**: ✅ **MAINTENIR** cette restriction

---

### 9. **Interdiction de Comparer avec Autres Titres**

**Localisation**: `emma-cfa-prompt.js` ligne 33

**Restriction actuelle**:
```
- Comparer avec moyennes sectorielles et historique 5 ans (mais NE PAS comparer avec d'autres titres spécifiques sauf si explicitement demandé)
```

**Problème**:
- Limite les analyses comparatives utiles
- Utilisateur peut vouloir comparer AAPL vs MSFT
- Analyses comparatives sont très utiles en finance
- Trop restrictif pour questions "comparer X et Y"

**Impact**:
- Réponses incomplètes pour comparaisons
- Manque d'utilité pour analyses relatives

**Recommandation**:
```
✅ Comparaisons adaptatives:
• Si question demande comparaison explicite → Comparer avec titres spécifiques
• Si question générale → Comparer avec secteur/historique (actuel)
• Détecter intent "comparative_analysis" → Autoriser comparaisons directes
```

---

### 10. **Validation FreshDataGuard Trop Stricte**

**Localisation**: `emma-agent.js` lignes 1468-1526

**Restriction actuelle**:
```
_validateFreshData() - Rejette réponses sans sources pour certains intents
```

**Problème**:
- Peut rejeter des réponses valides mais sans format de source détecté
- Patterns de détection de sources peuvent être trop stricts
- Retry automatique peut générer réponses redondantes

**Impact**:
- Réponses valides rejetées
- Latence augmentée (retry)
- Frustration si retry échoue

**Recommandation**:
```
✅ Validation plus flexible:
• Accepter réponses avec données chiffrées même sans format [SOURCE:]
• Patterns de détection plus larges (URLs, noms de sources, dates)
• Retry seulement si vraiment aucune source détectée
• Accepter sources implicites (données récentes = source récente)
```

---

## 📊 RÉSUMÉ DES RECOMMANDATIONS

| Restriction | Sévérité | Impact | Recommandation |
|-------------|----------|--------|----------------|
| Comparaisons historiques obligatoires | 🔴 Élevée | Bloque réponses si données manquantes | ✅ Assouplir: Recommandé quand disponible |
| Minimum 8-12 ratios | 🟡 Moyenne | Réponses trop longues | ✅ Adapter selon question |
| Interdiction clarifications | 🟡 Moyenne | Ambiguïtés non résolues | ✅ Autoriser clarifications intelligentes |
| Interdiction "aucune donnée" | 🟡 Moyenne | Manque transparence | ✅ Autoriser avec transparence |
| Focus géographique | 🟢 Faible | Limite international | ✅ Prioriser US/CA mais permettre autres |
| Questions suggérées obligatoires | 🟡 Moyenne | Longueur inutile | ✅ Contextuel selon question |
| Longueurs minimales | 🔴 Élevée | SMS tronqués, réponses longues | ✅ Adapter selon question/canal |
| Interdiction JSON | ✅ OK | Nécessaire | ✅ **MAINTENIR** |
| Interdiction comparaisons titres | 🟡 Moyenne | Limite analyses comparatives | ✅ Autoriser si demandé explicitement |
| Validation sources stricte | 🟡 Moyenne | Rejette réponses valides | ✅ Assouplir patterns |

---

## 🎯 PLAN D'ACTION PRIORITAIRE

### Priorité 1 (Critique) 🔴
1. **Assouplir comparaisons historiques** - Permettre réponses même sans données historiques
2. **Adapter longueurs minimales** - Réduire pour SMS et questions simples
3. **Assouplir validation sources** - Patterns plus flexibles

### Priorité 2 (Important) 🟡
4. **Adapter nombre de ratios** - Selon complexité question
5. **Autoriser clarifications intelligentes** - Pour questions ambiguës
6. **Questions suggérées contextuelles** - Pas toujours obligatoires

### Priorité 3 (Amélioration) 🟢
7. **Focus géographique adaptatif** - Permettre autres marchés si demandé
8. **Autoriser comparaisons titres** - Si demandé explicitement
9. **Transparence sur données manquantes** - Autoriser mention si vraiment aucune donnée

---

## 💡 PRINCIPE DIRECTEUR

**"Adaptabilité > Rigidité"**

Les prompts doivent guider Emma, pas la contraindre. Emma doit pouvoir:
- S'adapter à la complexité de la question
- Répondre même avec données partielles
- Clarifier quand nécessaire
- Être transparente sur les limites
- Varier la longueur selon le contexte
