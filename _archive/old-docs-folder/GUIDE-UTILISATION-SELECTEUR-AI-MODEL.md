# 📖 Guide : Comment Utiliser le Sélecteur AI Model dans n8n

## 🎯 Vue d'ensemble

Le workflow n8n permet de choisir facilement entre **Emma (Perplexity)** et **Gemini Direct** via un sélecteur visuel.

## 🔧 Configuration Simple

### Étape 1 : Ouvrir le node "⚙️ AI Model (emma/gemini)"

1. Dans votre workflow n8n, trouvez le node **"⚙️ AI Model (emma/gemini)"**
2. Cliquez dessus pour l'ouvrir

### Étape 2 : Modifier la valeur `ai_model`

Dans le node "⚙️ AI Model (emma/gemini)", vous verrez un champ **"ai_model"** :

**Pour utiliser Emma (Perplexity)** :
- Modifiez la valeur à : `emma`
- Ou laissez la valeur par défaut (déjà `emma`)

**Pour utiliser Gemini Direct** :
- Modifiez la valeur à : `gemini`

### Étape 3 : Le Switch route automatiquement

Le node **"🤖 Choose AI Model"** (Switch) va automatiquement :
- Si `ai_model = "emma"` → Route vers **"🤖 Emma (Perplexity)"** → Prepare API Request → Call /api/chat (Emma)
- Si `ai_model = "gemini"` → Route vers **"✨ Gemini Direct"** → Call Gemini API

## 📋 Structure Visuelle dans n8n

```
Determine Time-Based Prompt
  ↓
⚙️ AI Model (emma/gemini)  ← MODIFIEZ ICI : "emma" ou "gemini"
  ↓
🤖 Choose AI Model (Switch)
  ├─ 🤖 Emma (Perplexity) → Prepare API Request → Call /api/chat (Emma)
  └─ ✨ Gemini Direct → Call Gemini API
```

## 🖼️ Dans l'Interface n8n

### Node "⚙️ AI Model (emma/gemini)"

Quand vous ouvrez ce node, vous verrez :

**Parameters** :
- **Assignments** :
  - `ai_model` : `emma` (ou `gemini`)

**Pour modifier** :
1. Cliquez sur le champ `ai_model`
2. Tapez `emma` ou `gemini`
3. Sauvegardez

### Node "🤖 Choose AI Model" (Switch)

Ce node affiche deux routes nommées :

1. **"🤖 Emma (Perplexity)"** 
   - Condition : `ai_model === "emma"`
   - Route vers : Prepare API Request → Call /api/chat (Emma)

2. **"✨ Gemini Direct"**
   - Condition : `ai_model === "gemini"`
   - Route vers : Call Gemini API

## 💡 Exemples d'Utilisation

### Exemple 1 : Utiliser Emma (Par défaut)

1. Ouvrez "⚙️ AI Model (emma/gemini)"
2. Vérifiez que `ai_model = "emma"` (valeur par défaut)
3. Exécutez le workflow
4. Le Switch route vers "🤖 Emma (Perplexity)"

### Exemple 2 : Utiliser Gemini

1. Ouvrez "⚙️ AI Model (emma/gemini)"
2. Modifiez `ai_model` à `"gemini"`
3. Exécutez le workflow
4. Le Switch route vers "✨ Gemini Direct"

## 🔍 Vérification

Pour vérifier quelle route est prise :

1. Exécutez le workflow
2. Ouvrez le node "🤖 Choose AI Model"
3. Regardez les **Execution Data** :
   - Si la route "🤖 Emma (Perplexity)" a des données → Emma est utilisé
   - Si la route "✨ Gemini Direct" a des données → Gemini est utilisé

## ⚠️ Notes Importantes

1. **Valeur par défaut** : `"emma"` (Emma/Perplexity)
2. **Sensibilité à la casse** : Utilisez exactement `"emma"` ou `"gemini"` (minuscules)
3. **Pas de guillemets dans n8n** : Tapez simplement `emma` ou `gemini` (n8n ajoute les guillemets automatiquement)

## 🚨 Dépannage

### Le Switch ne route pas correctement

**Vérifications** :
1. La valeur dans "⚙️ AI Model (emma/gemini)" est exactement `"emma"` ou `"gemini"` (sans espaces)
2. Le node "🤖 Choose AI Model" a bien les deux routes configurées
3. Les connexions sont correctes dans le workflow

### Comment voir quelle route est prise

1. Exécutez le workflow
2. Cliquez sur "🤖 Choose AI Model"
3. Regardez l'onglet "Execution Data"
4. Vous verrez quelle route a reçu des données

## 📸 Capture d'Écran (Référence)

Dans l'interface n8n, vous devriez voir :

- **Node "⚙️ AI Model (emma/gemini)"** : Un node Set avec le champ `ai_model`
- **Node "🤖 Choose AI Model"** : Un node Switch avec deux routes nommées visibles

## ✅ Résumé Rapide

**Pour changer de modèle** :
1. Ouvrez "⚙️ AI Model (emma/gemini)"
2. Modifiez `ai_model` à `emma` ou `gemini`
3. Sauvegardez
4. Exécutez le workflow

**C'est tout !** Le Switch route automatiquement vers la bonne branche.

