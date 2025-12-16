# 🔍 Guide de Débogage : Switch Preview/Send

## Problème
Le workflow continue d'aller vers "preview" au lieu de "send" même avec `preview_mode=false` et `approved=true`.

## 🔧 Étapes de Débogage

### 1. Vérifier les valeurs dans "Debug Before Switch"

Le node "Debug Before Switch" a été ajouté juste avant "Preview or Send?". 

**Dans n8n** :
1. Exécutez le workflow
2. Ouvrez le node **"Debug Before Switch"**
3. Regardez les **logs d'exécution** (onglet "Execution Data")
4. Vérifiez les valeurs affichées :
   - `preview_mode` : doit être `false` (pas `"false"` ni `true`)
   - `approved` : doit être `true` (pas `"true"` ni `false`)

### 2. Vérifier les valeurs dans "Parse API Response"

**Dans n8n** :
1. Ouvrez le node **"Parse API Response"**
2. Regardez les **logs d'exécution**
3. Cherchez les lignes qui commencent par `📊 Parse API Response - Valeurs finales:`
4. Vérifiez que les valeurs sont correctes

### 3. Vérifier le node de configuration utilisé

Selon le trigger utilisé, vérifiez le bon node :

- **Schedule Trigger** → Vérifiez **"Schedule Config"**
  - `preview_mode` doit être `false`
  - `approved` doit être `true`

- **Webhook Trigger** → Vérifiez **"Webhook Config"**
  - `preview_mode` doit être `false`
  - `approved` doit être `true`

- **Manual Trigger** → Vérifiez **"Manual Config"**
  - Par défaut : `preview_mode = true`, `approved = false` (preview)
  - Pour envoyer : `preview_mode = false`, `approved = true`

### 4. Vérifier la logique du switch

**Dans n8n** :
1. Ouvrez le node **"Preview or Send?"**
2. Vérifiez les conditions :
   - **Preview** : `($json.preview_mode === true || $json.preview_mode === 'true') || ($json.approved !== true && $json.approved !== 'true')`
   - **Send** : `($json.preview_mode === false || $json.preview_mode === 'false') && ($json.approved === true || $json.approved === 'true')`

### 5. Test manuel des valeurs

Si les valeurs semblent correctes mais le switch ne fonctionne pas, testez manuellement :

1. Ouvrez **"Debug Before Switch"**
2. Modifiez le code pour forcer les valeurs :
```javascript
const items = $input.all();
const data = items[0].json;

// FORCER les valeurs pour test
const testData = {
  ...data,
  preview_mode: false,
  approved: true
};

console.log('🔍 TEST FORCÉ:');
console.log('   preview_mode:', testData.preview_mode);
console.log('   approved:', testData.approved);
console.log('   Condition Send:', testData.preview_mode === false && testData.approved === true);

return [{ json: testData }];
```

3. Réexécutez et vérifiez si ça va vers "send"

## 🛠️ Solution Alternative : Utiliser un IF au lieu d'un Switch

Si le switch continue de ne pas fonctionner, on peut remplacer par un node IF :

1. **Supprimer** le node "Preview or Send?" (Switch)
2. **Ajouter** un node "IF" avec cette condition :
   ```
   preview_mode === false && approved === true
   ```
3. **TRUE** → Branche "send" (Generate HTML Newsletter)
4. **FALSE** → Branche "preview" (Preview Display)

## 📋 Checklist de Vérification

- [ ] "Schedule Config" a `preview_mode = false` et `approved = true`
- [ ] "Webhook Config" a `preview_mode = false` et `approved = true`
- [ ] "Manual Config" a les valeurs souhaitées
- [ ] Les valeurs sont des **booleans** (pas des strings)
- [ ] "Parse API Response" préserve les valeurs
- [ ] "Debug Before Switch" affiche les bonnes valeurs
- [ ] Le switch a la bonne logique

## 🚨 Si le problème persiste

1. **Vérifiez les logs complets** dans n8n (onglet "Executions")
2. **Prenez une capture d'écran** des valeurs dans "Debug Before Switch"
3. **Vérifiez** s'il y a d'autres nodes qui modifient `preview_mode` ou `approved`

