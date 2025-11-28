# 🔧 Résolution: "MCP failed to use browser"

## ⚠️ Erreur Observée

**Message**: "MCP failed to use browser"

Cette erreur indique que le serveur MCP BrowserTools ne peut pas communiquer avec l'extension Chrome.

## 🔍 Causes Possibles

### 1. Chrome DevTools Non Ouvert
- L'extension nécessite Chrome DevTools ouvert sur une page web
- Sans DevTools, l'extension ne peut pas capturer de données

### 2. Extension Non Connectée
- L'extension BrowserTools MCP n'est pas connectée au serveur
- Le service worker de l'extension n'est pas actif

### 3. Serveur Non Accessible
- Le serveur BrowserTools n'est pas lancé
- Le port 3025 n'est pas accessible

### 4. Extension Désactivée
- L'extension BrowserTools MCP est désactivée dans Chrome

## ✅ Solutions

### Solution 1: Ouvrir Chrome DevTools (OBLIGATOIRE)

**C'est la cause la plus fréquente!**

1. **Ouvrez Chrome** (votre Chrome personnel, pas celui de Cursor)
2. **Naviguez vers une page web** (n'importe quelle page)
3. **Ouvrez Chrome DevTools**:
   - Clic droit → **Inspecter** (⌘⌥I)
   - OU: Menu → **Plus d'outils** → **Outils de développement**
4. **Vérifiez le panneau BrowserTools**:
   - Dans DevTools, cherchez l'onglet **"BrowserTools"** ou **"BrowserToolsMCP"**
   - Si vous le voyez, c'est bon! ✅

**Sans DevTools ouvert, les outils MCP ne peuvent pas fonctionner!**

### Solution 2: Vérifier que l'Extension est Active

1. Allez dans `chrome://extensions/`
2. Trouvez **BrowserTools MCP 1.2.0**
3. Vérifiez que le **toggle est ON** (vert)
4. Si OFF, activez-le

### Solution 3: Recharger l'Extension

1. Dans `chrome://extensions/`
2. Trouvez **BrowserTools MCP 1.2.0**
3. Cliquez sur l'icône de **rechargement** (🔄)
4. Attendez 5-10 secondes

### Solution 4: Vérifier le Serveur

```bash
# Vérifier que le serveur est actif
lsof -i :3025

# Si pas actif, le relancer
./scripts/start-browser-tools-server.sh
```

### Solution 5: Redémarrer Complètement

1. **Arrêter le serveur**:
   ```bash
   kill $(lsof -t -i:3025)
   ```

2. **Fermer Chrome complètement** (⌘Q)

3. **Relancer le serveur**:
   ```bash
   ./scripts/start-browser-tools-server.sh
   ```

4. **Rouvrir Chrome**

5. **Ouvrir Chrome DevTools** sur une page web (⌘⌥I)

6. **Recharger l'extension** dans `chrome://extensions/`

## 🧪 Test de Vérification

### Test 1: Vérifier la Connexion

Dans Cursor, testez:
```
"Peux-tu vérifier les logs de la console?"
```

**Si ça fonctionne**: ✅ Tout est OK
**Si erreur "MCP failed to use browser"**: ❌ Chrome DevTools n'est pas ouvert

### Test 2: Vérifier le Panneau BrowserTools

1. Ouvrez Chrome DevTools sur une page web
2. Cherchez l'onglet **"BrowserTools"**
3. **Si visible**: ✅ Extension connectée
4. **Si invisible**: ❌ Extension non connectée

### Test 3: Vérifier les Logs du Serveur

```bash
tail -f /tmp/browser-tools-server.log
```

Vous devriez voir des messages comme:
```
Received current URL update request: {...}
```

**Si vous voyez ces messages**: ✅ L'extension communique avec le serveur
**Si aucun message**: ❌ L'extension n'est pas connectée

## 📋 Checklist de Résolution

- [ ] Chrome DevTools est ouvert sur une page web
- [ ] Extension BrowserTools MCP est activée (toggle ON)
- [ ] Serveur BrowserTools est actif (port 3025)
- [ ] Panneau BrowserTools visible dans DevTools
- [ ] Extension rechargée récemment

## 💡 Point Important

**L'erreur "MCP failed to use browser" apparaît TOUJOURS si Chrome DevTools n'est pas ouvert!**

C'est la condition **OBLIGATOIRE** pour que les outils MCP fonctionnent.

## ✅ Solution Rapide

**La solution la plus rapide**:

1. Ouvrez Chrome
2. Naviguez vers une page web
3. Ouvrez Chrome DevTools (⌘⌥I)
4. Testez à nouveau dans Cursor

**C'est tout!** Les outils MCP devraient maintenant fonctionner.

## 🔧 Script de Diagnostic

```bash
./scripts/diagnose-browser-tools.sh
```

Ce script vérifie:
- Configuration MCP
- Serveur BrowserTools
- Extension Chrome
- Connexion

## 📚 Documentation

- **Installation**: `BROWSERTOOLS-INSTALLATION.md`
- **Résolution erreurs**: `RESOLUTION-ERREUR-CONNEXION.md`
- **Test MCP**: `TEST-MCP-SERVER-RESULTAT.md`

---

**🎯 Solution la plus probable: Ouvrir Chrome DevTools sur une page web!**

