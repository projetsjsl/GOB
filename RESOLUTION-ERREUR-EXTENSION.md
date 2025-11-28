# 🔧 Résolution: Erreur "Could not establish connection"

## 📊 Diagnostic

**Statut**: ✅ Tout est en place
- Serveur BrowserTools: ✅ Actif (port 3025)
- Extension Chrome: ✅ Installée
- Configuration MCP: ✅ Présente
- Chrome: ✅ En cours d'exécution

## ⚠️ Erreur Observée

```
Uncaught (in promise) Error: Could not establish connection. 
Receiving end does not exist.
```

**URL avec erreur**: `chrome://extensions/?errors=nkefgpcigdbgknmipcbcmlccfccfjgjj`

## ✅ Solution

### Étape 1: Recharger l'Extension

1. Allez dans `chrome://extensions/`
2. Trouvez **BrowserTools MCP** dans la liste
3. Cliquez sur l'icône de **rechargement** (🔄) sur l'extension
4. Attendez quelques secondes

### Étape 2: Vérifier que l'Extension est Activée

1. Dans `chrome://extensions/`
2. Vérifiez que le **toggle** de BrowserTools MCP est **ON** (vert)
3. Si OFF, activez-le

### Étape 3: Ouvrir Chrome DevTools

1. Ouvrez n'importe quelle page web dans Chrome
2. Clic droit → **Inspecter** (⌘⌥I)
3. Dans les DevTools, cherchez l'onglet **"BrowserTools"** ou **"BrowserToolsMCP"**
4. Si vous voyez le panneau, c'est bon! ✅

### Étape 4: Redémarrer le Serveur (si nécessaire)

Si l'erreur persiste:

```bash
# Arrêter le serveur actuel
kill $(lsof -t -i:3025)

# Relancer le serveur
./scripts/start-browser-tools-server.sh
```

Puis rechargez l'extension dans Chrome.

## 🔍 Vérification

### Test 1: Vérifier la Connexion

Dans le panneau BrowserTools DevTools, vous devriez voir:
- ✅ Statut de connexion au serveur
- ✅ Logs en temps réel
- ✅ Boutons fonctionnels

### Test 2: Tester dans Cursor

Une fois Cursor redémarré, testez:
```
"Peux-tu vérifier les logs de la console de cette page?"
```

## 📝 Notes

- L'erreur "Could not establish connection" peut apparaître au démarrage, c'est normal
- Les messages "Successfully updated server with URL" indiquent que la connexion fonctionne
- L'extension se reconnecte automatiquement après un rechargement

## 🐛 Si le Problème Persiste

1. **Fermez tous les Chrome**
2. **Redémarrez le serveur**:
   ```bash
   kill $(lsof -t -i:3025)
   ./scripts/start-browser-tools-server.sh
   ```
3. **Rouvrez Chrome personnel**:
   ```bash
   ./scripts/open-chrome-personal.sh chrome://extensions/
   ```
4. **Désinstallez et réinstallez l'extension**:
   - Dans `chrome://extensions/`, supprimez BrowserTools MCP
   - Rechargez l'extension depuis `/tmp/BrowserTools-extension/chrome-extension/`
5. **Ouvrez DevTools** sur une page web et vérifiez le panneau BrowserTools

## ✅ Statut Final

Une fois résolu, vous devriez voir:
- ✅ Extension activée dans `chrome://extensions/`
- ✅ Panneau BrowserTools visible dans Chrome DevTools
- ✅ Pas d'erreurs dans la console (ou erreurs mineures au démarrage)
- ✅ Connexion au serveur établie

