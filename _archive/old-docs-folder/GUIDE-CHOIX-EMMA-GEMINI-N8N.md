# 📖 Guide : Choix entre Emma (Perplexity) et Gemini dans n8n

## 🎯 Vue d'ensemble

Le workflow n8n permet maintenant de choisir entre deux modèles d'IA :
- **Emma (Perplexity)** : Via l'API `/api/chat` qui utilise Perplexity avec fallback Gemini
- **Gemini** : Appel direct à l'API Gemini dans n8n

## 🔄 Structure du Flux

```
Determine Time-Based Prompt
  ↓
AI Model Config (choix: emma ou gemini)
  ↓
Prepare API Request
  ↓
Choose AI Model? (IF)
  ├─ TRUE → Call /api/chat (Emma) → Parse API Response
  └─ FALSE → Call Gemini API → Parse Gemini Response → Parse API Response
  ↓
Parse API Response (convergence)
  ↓
... (reste du workflow)
```

## ⚙️ Configuration

### Node "AI Model Config"

Ce node définit quel modèle utiliser :

**Paramètres** :
- `ai_model` : `"emma"` ou `"gemini"`

**Valeurs** :
- `"emma"` : Utilise Emma via `/api/chat` (Perplexity avec fallback Gemini)
- `"gemini"` : Utilise Gemini directement via l'API Google

**Exemple** :
```json
{
  "ai_model": "emma"
}
```

### Node "Choose AI Model?" (IF)

Ce node route le flux selon le choix :
- **TRUE** (`ai_model === 'emma'`) → Branche Emma
- **FALSE** (`ai_model === 'gemini'`) → Branche Gemini

## 📋 Détails des Nodes

### 1. Call /api/chat (Emma)

**URL** : `https://gob-projetsjsls-projects.vercel.app/api/chat`

**Méthode** : POST

**Body** :
```json
{
  "message": "...",
  "channel": "web",
  "userId": "n8n-automation"
}
```

**Avantages** :
- Utilise Perplexity (recherche web en temps réel)
- Fallback automatique vers Gemini si Perplexity échoue
- Accès aux outils Emma (function calling)
- Analyse financière avancée

### 2. Call Gemini API

**URL** : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`

**Méthode** : POST

**Query Parameters** :
- `key` : `{{ $env.GEMINI_API_KEY }}`

**Body** :
```json
{
  "contents": [{
    "parts": [{
      "text": "..."
    }]
  }],
  "generationConfig": {
    "temperature": 0.7,
    "topK": 40,
    "topP": 0.95,
    "maxOutputTokens": 2048
  }
}
```

**Avantages** :
- Appel direct, pas de dépendance sur `/api/chat`
- Plus rapide (pas de fallback)
- Contrôle total sur les paramètres Gemini

### 3. Parse Gemini Response

Ce node adapte la réponse Gemini au format attendu par le reste du workflow.

**Structure Gemini** :
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "..."
      }]
    }
  }]
}
```

**Format adapté** :
```json
{
  "newsletter_content": "...",
  "response": "...",
  "emma_model": "gemini",
  "emma_tools": [],
  "emma_execution_time": 0,
  "trigger_type": "...",
  "prompt_type": "...",
  "generated_at": "...",
  "preview_mode": ...,
  "approved": ...
}
```

## 🔧 Comment Changer de Modèle

### Méthode 1 : Dans n8n (Interface)

1. Ouvrez le workflow dans n8n
2. Trouvez le node **"AI Model Config"**
3. Modifiez la valeur de `ai_model` :
   - `"emma"` pour utiliser Emma (Perplexity)
   - `"gemini"` pour utiliser Gemini directement
4. Sauvegardez et testez

### Méthode 2 : Via Script

Modifiez le fichier `n8n-workflow-03lgcA4e9uRTtli1.json` :

```json
{
  "name": "AI Model Config",
  "parameters": {
    "assignments": {
      "assignments": [
        {
          "name": "ai_model",
          "value": "gemini",  // ou "emma"
          "type": "string"
        }
      ]
    }
  }
}
```

Puis importez le workflow dans n8n.

## 📊 Comparaison des Modèles

| Caractéristique | Emma (Perplexity) | Gemini Direct |
|----------------|-------------------|---------------|
| **Recherche Web** | ✅ Oui (Perplexity) | ❌ Non |
| **Function Calling** | ✅ Oui (via Emma) | ❌ Non |
| **Vitesse** | ⚠️ Plus lent (fallback) | ✅ Plus rapide |
| **Fiabilité** | ✅ Haute (fallback) | ⚠️ Moyenne |
| **Coût** | ⚠️ Plus élevé | ✅ Plus bas |
| **Outils Emma** | ✅ Disponibles | ❌ Non disponibles |

## 💡 Recommandations

### Utiliser Emma (Perplexity) quand :
- Vous avez besoin de données en temps réel
- Vous voulez utiliser les outils Emma (function calling)
- La fiabilité est prioritaire (fallback automatique)
- Vous avez besoin d'analyse financière avancée

### Utiliser Gemini Direct quand :
- Vous voulez une réponse rapide
- Vous n'avez pas besoin de recherche web
- Vous voulez réduire les coûts
- Vous testez des prompts simples

## 🚨 Notes Importantes

1. **Variable d'environnement** : `GEMINI_API_KEY` doit être configurée dans n8n pour la branche Gemini
2. **Format de réponse** : Les deux branches convergent vers "Parse API Response" avec le même format
3. **Métadonnées** : `emma_model` est défini à `"perplexity"` pour Emma et `"gemini"` pour Gemini
4. **Preview/Send** : Les valeurs `preview_mode` et `approved` sont préservées dans les deux branches

## 🔍 Dépannage

### Problème : Gemini ne répond pas

**Vérifications** :
1. `GEMINI_API_KEY` est configurée dans n8n
2. La clé API est valide
3. Le modèle `gemini-2.0-flash-exp` est disponible

### Problème : Emma ne répond pas

**Vérifications** :
1. L'URL `/api/chat` est accessible
2. Les credentials sont corrects
3. Le service Perplexity est opérationnel

### Problème : Le flux ne route pas correctement

**Vérifications** :
1. `ai_model` est bien défini dans "AI Model Config"
2. La condition dans "Choose AI Model?" est correcte
3. Les connexions sont correctes dans le workflow

