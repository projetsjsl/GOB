# Flux Complet - Sélection AI Model

## Structure des connexions

```
Determine Time-Based Prompt
  ↓
⚙️ AI Model Selector (Change AI_MODEL)
  ↓ (définit ai_model: 'emma' ou 'gemini')
🔍 Debug Before Switch
  ↓ (passe ai_model au IF)
Choose AI Model (IF)
  ├─ TRUE (ai_model === "emma")
  │   ↓
  │   Prepare API Request
  │   ↓
  │   Call /api/chat (Emma)
  │   ↓
  │   Parse API Response
  │
  └─ FALSE (ai_model === "gemini")
      ↓
      Call Gemini API
      ↓
      Parse Gemini Response
      ↓
      Parse API Response
```

## Nodes et leurs connexions

### 1. Determine Time-Based Prompt
- **Sortie** → `⚙️ AI Model Selector (Change AI_MODEL)`

### 2. ⚙️ AI Model Selector (Change AI_MODEL)
- **Type**: Code node
- **Fonction**: Définit `ai_model` à `'emma'` ou `'gemini'`
- **Sortie** → `🔍 Debug Before Switch`

### 3. 🔍 Debug Before Switch
- **Type**: Code node
- **Fonction**: Affiche les valeurs de debug pour `ai_model`
- **Sortie** → `Choose AI Model (IF)`

### 4. Choose AI Model (IF)
- **Type**: IF node
- **Condition**: `ai_model === "emma"`
- **TRUE** → `Prepare API Request` (Emma)
- **FALSE** → `Call Gemini API` (Gemini)

### 5. Prepare API Request
- **Type**: Code node
- **Fonction**: Prépare la requête pour `/api/chat` (Emma)
- **Sortie** → `Call /api/chat (Emma)`

### 6. Call /api/chat (Emma)
- **Type**: HTTP Request node
- **Fonction**: Appelle l'API Emma
- **Sortie** → `Parse API Response`

### 7. Call Gemini API
- **Type**: HTTP Request node
- **Fonction**: Appelle directement l'API Gemini
- **Sortie** → `Parse Gemini Response`

### 8. Parse Gemini Response
- **Type**: Code node
- **Fonction**: Parse la réponse de Gemini
- **Sortie** → `Parse API Response`

### 9. Parse API Response
- **Type**: Code node
- **Fonction**: Parse la réponse finale (Emma ou Gemini)
- **Sortie** → Suite du workflow (Generate HTML Newsletter, etc.)

## Vérification

Pour vérifier que tout fonctionne:

1. **Ouvrez le workflow dans n8n**
2. **Vérifiez les connexions visuelles** entre les nodes
3. **Exécutez un test** avec le trigger manuel
4. **Vérifiez le node Debug** pour voir la valeur de `ai_model`
5. **Vérifiez le node IF** pour voir quelle branche a été utilisée

## Modification du modèle AI

Pour changer le modèle AI utilisé:

1. Ouvrez le node **"⚙️ AI Model Selector (Change AI_MODEL)"**
2. Modifiez la ligne: `const AI_MODEL = 'emma';`
3. Changez à `'emma'` ou `'gemini'`
4. Sauvegardez le workflow

## Notes importantes

- Le node IF est plus stable que le Switch pour cette utilisation
- Les valeurs doivent être exactement: `'emma'` ou `'gemini'` (minuscules)
- La comparaison est case-sensitive
- Les deux branches (Emma et Gemini) convergent vers `Parse API Response`

