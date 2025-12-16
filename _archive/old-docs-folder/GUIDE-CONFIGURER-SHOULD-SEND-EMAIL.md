# Guide: Configurer le node "Should Send Email?"

## 📍 Localisation

Le node **"Should Send Email?"** se trouve dans le workflow n8n, après **"Debug Before Switch"** et avant **"Generate HTML Newsletter"**.

## 🎯 Fonction

Ce node décide si l'email doit être envoyé ou affiché en preview selon les valeurs de `preview_mode` et `approved`.

## 🔧 Configuration dans n8n

### Étape 1: Ouvrir le node
1. Dans votre workflow n8n, trouvez le node **"Should Send Email?"**
2. Double-cliquez dessus pour l'ouvrir

### Étape 2: Ajouter la condition
1. Cliquez sur **"Add Condition"** ou **"Add Rule"**
2. Sélectionnez **"String"** comme type de condition
3. Configurez :
   - **Value 1**: `={{ $json.preview_mode === false && $json.approved === true ? 'send' : 'preview' }}`
   - **Operation**: `equals`
   - **Value 2**: `send`

### Étape 3: Sauvegarder
1. Cliquez sur **"Save"**
2. Vérifiez les connexions :
   - **TRUE** → "Generate HTML Newsletter" (Send Email)
   - **FALSE** → "Preview Display" (Preview Mode)

## 📊 Logique de routage

### ✅ TRUE (Send Email)
Condition remplie si :
- `preview_mode === false` **ET**
- `approved === true`

**Résultat** : L'email est envoyé via "Generate HTML Newsletter" → "Send Email via Resend"

### ❌ FALSE (Preview Mode)
Condition non remplie si :
- `preview_mode === true` **OU**
- `approved !== true`

**Résultat** : L'email est affiché en preview via "Preview Display"

## 🔄 Flux complet

```
Debug Before Switch
  ↓
Should Send Email?
  ├─ TRUE (preview_mode=false && approved=true)
  │   ↓
  │   Generate HTML Newsletter
  │   → Fetch Email Recipients
  │   → Process Recipients
  │   → Send Email via Resend
  │
  └─ FALSE (preview_mode=true || approved!=true)
      ↓
      Preview Display
      → Preview Stop
```

## 💡 Valeurs par défaut

Les valeurs `preview_mode` et `approved` sont définies dans les nodes de configuration :
- **Schedule Config** : `preview_mode: false`, `approved: true` (pour les briefings automatiques)
- **Webhook Config** : `preview_mode: false`, `approved: true`
- **Manual Config** : `preview_mode: true`, `approved: false` (par défaut pour les tests manuels)
- **Chat Config** : `preview_mode: true`, `approved: false` (pour les previews)

## ⚠️ Note importante

Si la condition ne s'affiche pas dans n8n, vous pouvez :
1. Supprimer et recréer le node IF
2. Ou utiliser une condition plus simple :
   - **Value 1**: `={{ $json.approved }}`
   - **Operation**: `equals`
   - **Value 2**: `true`
   
   (Mais cela ne prendra pas en compte `preview_mode`)

