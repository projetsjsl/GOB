# 📖 Explication du Code du Node "⚙️ AI Model Selector"

## 🔍 Structure du Code

Le code du node est divisé en plusieurs parties :

### 1. **Commentaires et Instructions** (lignes 1-20)
```javascript
// ═══════════════════════════════════════════════════════════
// 🤖 SÉLECTEUR DE MODÈLE IA - MODIFIEZ ICI ⚙️
// ═══════════════════════════════════════════════════════════
//
// 👇 MODIFIEZ LA VALEUR CI-DESSOUS 👇
//
const AI_MODEL = 'emma';
//
// Options disponibles:
//   - 'emma'    → Utilise Emma (Perplexity) via /api/chat
//   - 'gemini'  → Utilise Gemini directement
//
// ═══════════════════════════════════════════════════════════
```
**Rôle** : Instructions pour vous guider - vous pouvez les ignorer, elles ne sont pas exécutées.

---

### 2. **Variable de Configuration** (ligne ~10)
```javascript
const AI_MODEL = 'emma';
```
**Rôle** : C'est ici que vous modifiez le choix du modèle.
- `'emma'` → Utilise Emma
- `'gemini'` → Utilise Gemini

---

### 3. **Récupération des Données d'Entrée** (ligne ~22)
```javascript
const items = $input.all();
```
**Rôle** : Récupère toutes les données qui arrivent dans ce node depuis le node précédent.
- `$input` = données d'entrée de n8n
- `.all()` = récupère tous les éléments

**Exemple** : Si le node précédent envoie des données avec `prompt_type: 'morning'`, `selected_prompt: '...'`, etc., cette ligne les récupère.

---

### 4. **Transformation et Retour des Données** (lignes 24-32)
```javascript
return items.map(item => ({
  json: {
    ...item.json,
    ai_model: AI_MODEL,
    _model_info: AI_MODEL === 'emma' 
      ? '🤖 Emma (Perplexity) - Recherche web en temps réel' 
      : '✨ Gemini Direct - Réponse rapide'
  }
}));
```

**Rôle** : Transforme les données et ajoute `ai_model` pour le node suivant.

#### Détail ligne par ligne :

**`return items.map(item => ({`**
- `return` = renvoie les données au node suivant
- `items.map()` = parcourt chaque élément d'entrée
- `item => ({` = pour chaque élément, crée un nouvel objet

**`json: {`**
- Format n8n : les données doivent être dans un objet `{ json: { ... } }`
- C'est le format standard de n8n pour passer des données entre nodes

**`...item.json,`**
- `...` = "spread operator" - copie toutes les propriétés existantes
- `item.json` = données du node précédent (prompt_type, selected_prompt, etc.)
- **Rôle** : Préserve toutes les données existantes

**`ai_model: AI_MODEL,`**
- Ajoute la propriété `ai_model` avec la valeur choisie ('emma' ou 'gemini')
- **Rôle** : C'est cette valeur que le Switch "🤖 Choose AI Model" va lire

**`_model_info: AI_MODEL === 'emma' ? '...' : '...'`**
- Ajoute une info descriptive (optionnel, pour le débogage)
- **Rôle** : Aide à voir quel modèle est utilisé dans les logs

**`}))`**
- Ferme les objets et le map

---

## 🎯 Résumé Simple

Le code fait 3 choses :

1. **Récupère** les données du node précédent (`$input.all()`)
2. **Ajoute** `ai_model: 'emma'` (ou `'gemini'`) aux données
3. **Renvoie** les données au node suivant dans le format n8n (`{ json: { ... } }`)

## 💡 Pourquoi le Format `{ json: { ... } }` ?

C'est le format standard de n8n. Chaque node doit retourner ses données dans ce format :
```javascript
{
  json: {
    propriete1: valeur1,
    propriete2: valeur2,
    ...
  }
}
```

Le node suivant peut alors accéder aux données via `$json.propriete1`.

## 🔍 Exemple Concret

**Données d'entrée** (depuis "Determine Time-Based Prompt") :
```json
{
  "json": {
    "prompt_type": "morning",
    "selected_prompt": "Génère un briefing matinal...",
    "tickers": "GOOGL, TSLA"
  }
}
```

**Après le node "⚙️ AI Model Selector"** :
```json
{
  "json": {
    "prompt_type": "morning",
    "selected_prompt": "Génère un briefing matinal...",
    "tickers": "GOOGL, TSLA",
    "ai_model": "emma",  ← AJOUTÉ
    "_model_info": "🤖 Emma (Perplexity) - Recherche web en temps réel"
  }
}
```

Le node suivant ("🤖 Choose AI Model") lit `ai_model` et route vers Emma ou Gemini.

## ✅ En Résumé

- **La partie JSON** (`return items.map(item => ({ json: { ... } }))`) = Format n8n pour passer les données
- **`...item.json`** = Préserve les données existantes
- **`ai_model: AI_MODEL`** = Ajoute votre choix (emma/gemini)
- **Le node suivant** lit `ai_model` et route automatiquement

Vous n'avez besoin de modifier que `const AI_MODEL = 'emma';` - le reste du code fait le travail automatiquement !

