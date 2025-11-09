# Guide: Choisir entre Emma (Perplexity) et Gemini

## 📍 Localisation du sélecteur

Le node **"⚙️ AI Model Selector (Change AI_MODEL)"** se trouve dans le workflow n8n, juste après **"Determine Time-Based Prompt"**.

## 🔧 Comment modifier

### Étape 1: Ouvrir le node
1. Dans votre workflow n8n, trouvez le node **"⚙️ AI Model Selector (Change AI_MODEL)"**
2. Double-cliquez dessus pour l'ouvrir

### Étape 2: Modifier la variable
Dans le code JavaScript, vous verrez cette ligne :

```javascript
const AI_MODEL = 'emma';
```

**Pour utiliser Emma (Perplexity) :**
```javascript
const AI_MODEL = 'emma';
```

**Pour utiliser Gemini directement :**
```javascript
const AI_MODEL = 'gemini';
```

### Étape 3: Sauvegarder
1. Cliquez sur **"Save"** ou **"Execute Node"** pour sauvegarder
2. Le changement prend effet immédiatement

## 📊 Différences entre les deux modèles

### 🤖 Emma (Perplexity) - `'emma'`
- ✅ **Recherche web en temps réel** via Perplexity
- ✅ **Actualités financières à jour**
- ✅ **Données de marché précises**
- ✅ **Analyse contextuelle des événements**
- ⏱️ Temps de réponse : ~10-30 secondes
- 💰 Coût : Utilise l'API Perplexity (payant)

**Recommandé pour :**
- Briefings financiers quotidiens
- Analyses de marché en temps réel
- Actualités et événements récents

### ✨ Gemini Direct - `'gemini'`
- ⚡ **Réponse rapide** (pas de recherche web)
- ✅ **Analyse générale** basée sur les connaissances du modèle
- ⏱️ Temps de réponse : ~2-5 secondes
- 💰 Coût : Utilise l'API Gemini (gratuit jusqu'à certaines limites)

**Recommandé pour :**
- Réponses rapides sans recherche web
- Analyses générales
- Tests et développement

## 🔄 Flux du workflow

Quand vous changez `AI_MODEL`, le workflow route automatiquement :

```
⚙️ AI Model Selector (Change AI_MODEL)
  ↓ (définit ai_model: 'emma' ou 'gemini')
Choose AI Model (IF)
  ├─ TRUE (ai_model === "emma")
  │   ↓
  │   Prepare API Request → Call /api/chat (Emma) → Parse API Response
  │
  └─ FALSE (ai_model === "gemini")
      ↓
      Call Gemini API → Parse Gemini Response → Parse API Response
```

## 💡 Astuce

Pour tester rapidement, vous pouvez :
1. Mettre `'gemini'` pour des tests rapides
2. Mettre `'emma'` pour la production avec données en temps réel

## ⚠️ Note importante

Le changement prend effet immédiatement pour toutes les exécutions suivantes du workflow. Les exécutions en cours continuent avec le modèle précédemment sélectionné.

