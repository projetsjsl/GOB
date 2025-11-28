# ✅ Quelle Extension Utiliser?

## 🎯 La Bonne Extension

**✅ BrowserTools MCP 1.2.0**
- **ID**: `nkefgpcigdbgknmipcbcmlccfccfjgjj`
- **Description**: "MCP tool for AI code editors to capture data from a browser such as console logs, network requests, screenshots and more"
- **Version**: 1.2.0
- **Source**: AgentDesk AI (@agentdeskai/browser-tools-mcp)
- **Emplacement**: `/tmp/BrowserTools-extension/chrome-extension/`

**C'est celle-ci que vous devez utiliser!** ✅

## ❌ L'Autre Extension

**❌ Browser MCP - Automate your browser ... 1.3.4**
- **Avertissement**: "Extension non approuvée par la navigation sécurisée"
- **Version**: 1.3.4
- **Source**: Différente (probablement une autre extension MCP)

**Cette extension peut causer des conflits. Il est recommandé de la désactiver ou la supprimer.**

## 🔧 Actions Recommandées

### 1. Garder BrowserTools MCP 1.2.0 Actif

- ✅ Toggle **ON** (bleu)
- ✅ C'est l'extension que nous avons installée
- ✅ Correspond à la configuration MCP dans `.cursor/mcp.json`

### 2. Désactiver ou Supprimer "Browser MCP"

**Option A - Désactiver** (recommandé pour tester):
1. Dans `chrome://extensions/`
2. Trouvez "Browser MCP - Automate your browser ..."
3. Désactivez le toggle (OFF)

**Option B - Supprimer** (si vous êtes sûr):
1. Dans `chrome://extensions/`
2. Trouvez "Browser MCP - Automate your browser ..."
3. Cliquez sur "Supprimer"

## 🔍 Vérification

### Comment Vérifier que c'est la Bonne Extension?

1. **Nom exact**: "BrowserTools MCP" (pas "Browser MCP")
2. **Version**: 1.2.0
3. **Description**: Contient "MCP tool for AI code editors to capture data from a browser"
4. **ID**: `nkefgpcigdbgknmipcbcmlccfccfjgjj`

### Test

1. Ouvrez Chrome DevTools sur une page web (⌘⌥I)
2. Cherchez l'onglet **"BrowserTools"** ou **"BrowserToolsMCP"**
3. Si vous voyez le panneau BrowserTools, c'est la bonne extension! ✅

## ⚠️ Résolution des Erreurs

Si vous voyez le bouton "Erreurs" en rouge sur BrowserTools MCP:

1. **Cliquez sur "Erreurs"** pour voir les détails
2. **Rechargez l'extension** (icône 🔄)
3. **Vérifiez que le serveur est actif**: `lsof -i :3025`
4. **Redémarrez le serveur si nécessaire**: `./scripts/start-browser-tools-server.sh`

Les erreurs "Could not establish connection" sont normales au démarrage et devraient se résoudre automatiquement.

## 📚 Documentation

- **Installation**: `BROWSERTOOLS-INSTALLATION.md`
- **Résolution erreurs**: `RESOLUTION-ERREUR-EXTENSION.md`
- **Diagnostic**: `./scripts/diagnose-browser-tools.sh`

