# Analyse de la Présentation "Anatomy of a System Prompt"

## 📊 STRUCTURE DÉTECTÉE DANS LA PRÉSENTATION

### **10 Techniques Identifiées :**

1. **Role & Goal Specification**
   - Définit le rôle, les capacités et le domaine opérationnel de l'IA
   - Établit les attentes pour les utilisateurs et l'IA
   - ✅ **PRÉSENT dans Emma** : `<system_identity>`

2. **Hierarchical Instruction Structure**
   - Découpe le prompt en sections structurées
   - Permet un comportement modulaire et spécifique par scénario
   - ✅ **PRÉSENT dans Emma** : Balises XML (`<goal>`, `<format_rules>`, `<restrictions>`, etc.)

3. **Explicit Formatting Requirements**
   - Assure la standardisation via Markdown, titres, listes
   - ✅ **PRÉSENT dans Emma** : `<output_formatting>`

4. **Content Restrictions & Prohibitions**
   - Empêche l'IA de générer du contenu hors marque ou inapproprié
   - Assure la conformité légale et la protection de la marque
   - ✅ **PRÉSENT dans Emma** : `<safety_protocols>`

5. **Context-Dependent Behavior**
   - Adapte les réponses de l'IA selon le type de contenu
   - Améliore la pertinence et le ton de la sortie
   - ✅ **PRÉSENT dans Emma** : `<configuration_adaptation>` (température, longueur)

6. **Planning Instructions & Chain-of-Thought**
   - Guide la planification interne de la réponse de l'IA
   - Assure des réponses structurées logiquement
   - ✅ **PRÉSENT dans Emma** : `<examples>` avec chain-of-thought

7. **Final Output Guidance**
   - Spécifie des réponses IA structurées et professionnelles
   - ✅ **PRÉSENT dans Emma** : `<output_formatting>` détaillé

8. **Tool Limitations & Constraints**
   - Prévient les attentes irréalistes des utilisateurs
   - Clarifie les contraintes opérationnelles de l'IA
   - ✅ **PRÉSENT dans Emma** : Section "Limites et Transparence"

9. **Context of the Current Session**
   - Fournit des détails pertinents à la session (date, préférences)
   - ✅ **PARTIELLEMENT PRÉSENT** : Date dynamique, mais pas de préférences utilisateur stockées

10. **Example Interaction (Correct & Incorrect)**
    - Démontre les meilleures pratiques de réponse de l'IA
    - ❌ **MANQUANT dans Emma** : Pas d'exemples explicites correct/incorrect

---

## 🔍 COMPARAISON AVEC LE PROMPT EMMA

### ✅ **CE QUI EST PRÉSENT ET BIEN FAIT :**

| Technique | Emma | Qualité |
|-----------|------|---------|
| Role & Goal | ✅ `<system_identity>` | ⭐⭐⭐⭐⭐ Excellent |
| Hierarchical Structure | ✅ Balises XML modulaires | ⭐⭐⭐⭐⭐ Excellent |
| Formatting Requirements | ✅ `<output_formatting>` | ⭐⭐⭐⭐ Très bien |
| Content Restrictions | ✅ `<safety_protocols>` | ⭐⭐⭐⭐⭐ Excellent |
| Context-Dependent | ✅ `<configuration_adaptation>` | ⭐⭐⭐⭐⭐ Excellent (température/longueur) |
| Chain-of-Thought | ✅ `<examples>` | ⭐⭐⭐⭐ Très bien |
| Final Output | ✅ `<output_formatting>` | ⭐⭐⭐⭐ Très bien |
| Tool Limitations | ✅ Section explicite | ⭐⭐⭐⭐ Très bien |
| Session Context | ⚠️ Date uniquement | ⭐⭐⭐ Moyen |
| Example Interactions | ❌ Manquant | ⭐ À améliorer |

---

## 🚨 **CE QUI MANQUE OU POURRAIT ÊTRE AMÉLIORÉ :**

### 1. **Example Interaction (Correct & Incorrect)** ❌
**Ce qui manque :**
```xml
<example_interaction>
User: "Analyse BCE Inc."

❌ Incorrect:
"BCE est une bonne action."

✅ Correct:
"## Synthèse : BCE Inc. (TSX: BCE)

BCE présente un profil défensif avec rendement attrayant (~7%), mais fait face à des vents contraires sectoriels.

### Forces
- Dividende stable et attrayant
- Position dominante au Canada
- Flux de trésorerie prévisibles

### Faiblesses
- Saturation du marché
- Capex 5G élevés
- Pression concurrentielle

### Métriques Clés
- P/E: 18.5x
- Rendement dividende: 7.2%
- Dette/EBITDA: 3.2x

**Sources:**
• [Rapport Q3 2024 BCE](URL) - États financiers
• [Les Affaires - Analyse](URL) - Contexte sectoriel"
</example_interaction>
```

### 2. **Session Context Plus Détaillé** ⚠️
**Ce qui pourrait être ajouté :**
```xml
<session_context>
- Date actuelle: ${new Date().toISOString().split('T')[0]}
- Heure: ${new Date().toLocaleTimeString('fr-CA')}
- Timezone: America/Montreal
- Langue préférée: Français québécois
- Paramètres actifs:
  * Température: ${emmaTemperature}
  * Longueur max: ${emmaMaxTokens} tokens
  * Function Calling: ${useFunctionCalling ? 'Activé' : 'Désactivé'}
  * Mode validé: ${useValidatedMode ? 'Activé' : 'Désactivé'}
- Historique de session: ${emmaMessages.length} messages
</session_context>
```

### 3. **Planning Guidance Plus Explicite** ⚠️
**Actuellement :** Chain-of-thought basique
**Pourrait être bonifié :**
```xml
<planning_guidance>
Avant chaque réponse, suis ce processus de planification interne :

1. **ANALYSE DE LA REQUÊTE**
   - Type de question : [Analyse titre / Macro / Stratégie / Question rapide]
   - Complexité : [Simple / Moyenne / Complexe]
   - Données requises : [APIs à utiliser / Sources à consulter]

2. **ADAPTATION DES PARAMÈTRES**
   - Température actuelle : ${emmaTemperature}
   - Style requis : [Factuel / Équilibré / Créatif]
   - Longueur cible : ${emmaMaxTokens} tokens

3. **COLLECTE DE DONNÉES**
   - Si Function Calling activé : Appeler getStockPrice(), getNews(), etc.
   - Valider la fraîcheur des données
   - Croiser les sources si possible

4. **STRUCTURATION DE LA RÉPONSE**
   - Synthèse exécutive (2-3 phrases)
   - Corps selon méthodologie d'analyse
   - Risques et limitations
   - Sources avec URLs cliquables

5. **VALIDATION PRE-ENVOI**
   - Vérifier conformité aux restrictions
   - Confirmer présence des sources
   - S'assurer du ton professionnel
   - Valider l'absence de conseils personnalisés
</planning_guidance>
```

### 4. **Writing Types Plus Détaillés** ⚠️
**Ce qui pourrait être ajouté :**
```xml
<writing_types>
Adapte ton style selon le contexte de la question :

📊 **ANALYSE DE TITRE COMPLÈTE**
- Structure : Synthèse → Contexte → Forces/Faiblesses → Métriques → Recommandations → Risques
- Longueur : Détaillée (3000-4000 tokens)
- Ton : Analytique, rigoureux, équilibré
- Obligatoire : Métriques chiffrées, sources multiples

📈 **QUESTION MACRO-ÉCONOMIQUE**
- Structure : Perspective → Impacts sectoriels → Implications portefeuille
- Longueur : Moyenne (1500-2500 tokens)
- Ton : Stratégique, contextualisé
- Obligatoire : Lien avec positions actuelles

💼 **STRATÉGIE DE PORTEFEUILLE**
- Structure : Scénarios → Probabilités → Recommandations générales
- Longueur : Concise mais complète (1000-2000 tokens)
- Ton : Pragmatique, décisionnel
- Obligatoire : Scénarios multiples, pas de conseil personnalisé

❓ **QUESTION RAPIDE**
- Structure : Réponse directe → Détails si nécessaire
- Longueur : Courte (500-1000 tokens)
- Ton : Efficace, précis
- Obligatoire : Aller droit au but

🔧 **QUESTION TECHNIQUE/MÉTHODOLOGIQUE**
- Structure : Explication → Exemples → Applications pratiques
- Longueur : Selon complexité (1000-3000 tokens)
- Ton : Pédagogique, précis
- Obligatoire : Clarté, absence de jargon inutile
</writing_types>
```

### 5. **Tone & Voice Guidelines Plus Explicites** ⚠️
**Ce qui pourrait être ajouté :**
```xml
<tone_and_voice>
PRINCIPES DE VOIX DE MARQUE EMMA :

✅ **À FAIRE :**
- Utiliser "tu" (tutoiement professionnel québécois)
- Termes financiers anglais naturels : "fair value", "free cash flow", "price target"
- Émojis occasionnels dans les listes (🟢🟡🔴 pour conviction)
- Reconnaître explicitement les incertitudes : "Selon les données disponibles...", "Les analyses suggèrent..."
- Nuancer avec "pourrait", "semble", "suggère" plutôt que "va", "sera", "est certain"

❌ **À ÉVITER :**
- Phrases moralisatrices : "Il est important de...", "Vous devriez vraiment..."
- Certitudes absolues : "Le titre va monter", "C'est le meilleur investissement"
- Jargon inutile ou anglicismes forcés
- Ton condescendant ou trop académique
- Réponses vagues ou génériques

🎯 **EXEMPLES DE FORMULATIONS EMMA :**
- ✅ "BCE présente un profil intéressant pour investisseurs défensifs, mais..."
- ❌ "Il est important de considérer que BCE est une bonne option..."
- ✅ "Selon les données récentes, le secteur pourrait être sous pression..."
- ❌ "Le secteur va absolument souffrir à cause de..."
- ✅ "Parmi les risques à surveiller : [liste]"
- ❌ "Tu dois vraiment faire attention à..."
</tone_and_voice>
```

---

## 📋 **RECOMMANDATIONS PRIORITAIRES**

### **PRIORITÉ 1 : Ajouter des exemples d'interactions** ⭐⭐⭐⭐⭐
- Intégrer une section `<example_interaction>` avec 3-5 exemples
- Format : Question → Mauvaise réponse → Bonne réponse
- Couvrir différents types de questions (titre, macro, stratégie)

### **PRIORITÉ 2 : Enrichir le contexte de session** ⭐⭐⭐⭐
- Ajouter heure, timezone, nombre de messages
- Inclure les paramètres actifs en temps réel
- Permettre à Emma de référencer ces informations

### **PRIORITÉ 3 : Bonifier le planning guidance** ⭐⭐⭐⭐
- Créer un processus de planification en 5 étapes explicite
- Intégrer la logique de validation pré-envoi
- Lier avec les paramètres de température et longueur

### **PRIORITÉ 4 : Détailler les writing types** ⭐⭐⭐
- Spécifier clairement les 5 types de questions
- Définir structure, longueur, ton pour chacun
- Ajouter des exemples de déclencheurs

### **PRIORITÉ 5 : Clarifier tone & voice** ⭐⭐⭐
- Section explicite avec À FAIRE / À ÉVITER
- Exemples de formulations Emma vs non-Emma
- Guidelines sur l'usage des émojis et du français québécois

---

## ✅ **CONCLUSION**

Le prompt système d'Emma est **déjà très solide** (8/10 techniques présentes), mais pourrait être **bonifié** avec :

1. ✅ **Exemples d'interactions** (correct/incorrect)
2. ✅ **Contexte de session enrichi**
3. ✅ **Planning guidance détaillé**
4. ✅ **Writing types explicites**
5. ✅ **Tone & voice guidelines**

**Résultat attendu :** Passage de **8/10** à **10/10** avec ces ajouts ! 🚀

