# Guide: Configurer le Node IF "Choose AI Model"

## Problème résolu

Le node Switch causait des freezes lors de la modification. Il a été remplacé par un node **IF** plus stable.

## Configuration actuelle

Le node **"Choose AI Model (IF)"** est configuré avec:

```
Type: IF
Condition: ai_model === "emma"

value1: ={{ $json.ai_model }}
operation: equals
value2: emma
```

## Si les valeurs ne s'affichent pas dans n8n

Si vous ouvrez le node et que les champs `value1` et `value2` sont vides, suivez ces étapes:

### Option 1: Réinitialiser le node

1. Ouvrez le node **"Choose AI Model (IF)"**
2. Cliquez sur **"Add Condition"** ou **"Reset"**
3. Configurez manuellement:
   - **Value 1**: `={{ $json.ai_model }}`
   - **Operation**: `equals`
   - **Value 2**: `emma`
4. Sauvegardez

### Option 2: Recréer le node

1. Supprimez le node **"Choose AI Model (IF)"**
2. Ajoutez un nouveau node **IF**
3. Nommez-le: **"Choose AI Model (IF)"**
4. Configurez:
   - **Value 1**: `={{ $json.ai_model }}`
   - **Operation**: `equals`
   - **Value 2**: `emma`
5. Connectez:
   - **TRUE** → **Prepare API Request** (Emma)
   - **FALSE** → **Call Gemini API** (Gemini)

## Vérification

Pour vérifier que le node fonctionne:

1. Exécutez le workflow
2. Ouvrez le node **"🔍 Debug Before Switch"** (juste avant le IF)
3. Vérifiez que `_debug_ai_model` contient `"emma"` ou `"gemini"`
4. Ouvrez le node **"Choose AI Model (IF)"**
5. Vérifiez quelle branche a reçu des données:
   - **TRUE** = Emma sera utilisé
   - **FALSE** = Gemini sera utilisé

## Structure du flux

```
⚙️ AI Model Selector (Change AI_MODEL)
  ↓ (définit ai_model: 'emma' ou 'gemini')
🔍 Debug Before Switch
  ↓ (passe ai_model au IF)
Choose AI Model (IF)
  ├─ TRUE (ai_model === "emma") → Prepare API Request → Call /api/chat (Emma)
  └─ FALSE (ai_model === "gemini") → Call Gemini API → Parse Gemini Response
```

## Notes importantes

- Le node IF est plus stable que le Switch pour cette utilisation
- Les valeurs doivent être exactement: `={{ $json.ai_model }}` et `emma`
- La comparaison est case-sensitive (majuscules/minuscules importantes)
- Si vous modifiez `AI_MODEL` dans le node **"⚙️ AI Model Selector"**, le IF détectera automatiquement le changement

