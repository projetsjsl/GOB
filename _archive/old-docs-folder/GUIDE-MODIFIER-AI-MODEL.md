# 📖 Guide : Comment Modifier le Modèle IA dans n8n

## ✅ Oui, vous pouvez modifier directement dans le code !

Le node **"⚙️ AI Model Selector (Change AI_MODEL)"** est un node Code où vous pouvez modifier directement la valeur.

## 🔧 Comment Modifier

### Dans n8n :

1. **Ouvrez le node** "⚙️ AI Model Selector (Change AI_MODEL)"
2. **Trouvez la ligne** : `const AI_MODEL = 'gemini';`
3. **Modifiez la valeur** :
   - `'emma'` → Utilise Emma (Perplexity) - **Recommandé pour l'analyse financière**
   - `'gemini'` → Utilise Gemini directement - **Plus rapide**
4. **Sauvegardez** le node
5. **Exécutez** le workflow

## 📋 Exemple de Modification

**Actuellement** :
```javascript
const AI_MODEL = 'gemini';
```

**Pour utiliser Emma** :
```javascript
const AI_MODEL = 'emma';
```

## 💡 Recommandations

### Utilisez `'emma'` quand :
- ✅ Vous avez besoin de données financières en temps réel
- ✅ Vous voulez des actualités de marché à jour
- ✅ Vous avez besoin d'analyse contextuelle des événements
- ✅ Vous voulez utiliser les outils Emma (function calling)

### Utilisez `'gemini'` quand :
- ⚡ Vous voulez une réponse rapide
- ⚡ Vous n'avez pas besoin de recherche web
- ⚡ Vous testez des prompts simples
- ⚡ Vous voulez réduire les coûts

## 🔍 Vérification

Après modification :

1. **Exécutez** le workflow
2. **Ouvrez** le node "🤖 Choose AI Model" (Switch)
3. **Vérifiez** dans "Execution Data" :
   - Si `ai_model = "emma"` → Route "🤖 Emma (Perplexity)" devrait avoir des données
   - Si `ai_model = "gemini"` → Route "✨ Gemini Direct" devrait avoir des données

## ⚠️ Notes Importantes

1. **Guillemets** : Utilisez des guillemets simples `'emma'` ou `'gemini'`
2. **Sensibilité à la casse** : Utilisez exactement `'emma'` ou `'gemini'` (minuscules)
3. **Sauvegarde** : N'oubliez pas de sauvegarder le node après modification
4. **Test** : Testez toujours après modification pour vérifier que ça fonctionne

## 🎯 Pour Votre Cas Actuel

Vous avez actuellement `AI_MODEL = 'gemini'`, ce qui signifie que le workflow utilise **Gemini directement**.

Si vous voulez utiliser **Emma (Perplexity)** pour une meilleure analyse financière, changez à :
```javascript
const AI_MODEL = 'emma';
```

