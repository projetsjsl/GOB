# 🔍 Panneau BrowserTools Non Visible dans DevTools

## ⚠️ Problème

Le panneau BrowserTools n'apparaît pas dans Chrome DevTools malgré l'extension installée.

## 🔍 Causes Possibles

### 1. Extension Non Rechargée Après Installation

**Solution**:
1. Allez dans `chrome://extensions/`
2. Trouvez **BrowserTools MCP 1.2.0**
3. Cliquez sur l'icône de **rechargement** (🔄)
4. Attendez 5-10 secondes
5. Fermez et rouvrez Chrome DevTools (⌘⌥I)
6. Cherchez l'onglet **"BrowserTools"** ou **"BrowserToolsMCP"**

### 2. Service Worker Non Actif

**Vérification**:
1. Dans `chrome://extensions/`
2. Trouvez **BrowserTools MCP 1.2.0**
3. Cliquez sur **"Examiner les vues service worker"**
4. Une fenêtre DevTools s'ouvre
5. Vérifiez qu'il n'y a pas d'erreurs critiques

**Si erreurs**:
- Notez les erreurs
- Rechargez l'extension
- Redémarrez Chrome

### 3. Extension Désactivée

**Vérification**:
1. Allez dans `chrome://extensions/`
2. Trouvez **BrowserTools MCP 1.2.0**
3. Vérifiez que le **toggle est ON** (vert)
4. Si OFF, activez-le

### 4. DevTools Non Redémarré

**Solution**:
1. Fermez complètement Chrome DevTools
2. Rouvrez Chrome DevTools (⌘⌥I)
3. Cherchez l'onglet **"BrowserTools"**

### 5. Extension Non Correctement Installée

**Vérification**:
1. Dans `chrome://extensions/`
2. Vérifiez que **BrowserTools MCP 1.2.0** apparaît dans la liste
3. Vérifiez qu'il n'y a pas d'erreurs (bouton "Erreurs" rouge)

**Si l'extension n'apparaît pas**:
- Réinstallez l'extension depuis `/tmp/BrowserTools-extension/chrome-extension/`

## ✅ Solution Étape par Étape

### Étape 1: Vérifier l'Extension

1. Ouvrez `chrome://extensions/`
2. Activez **"Mode développeur"** (toggle en haut à droite)
3. Trouvez **BrowserTools MCP 1.2.0**
4. Vérifiez:
   - ✅ Toggle **ON** (vert)
   - ✅ Pas d'erreurs (pas de bouton "Erreurs" rouge)
   - ✅ Extension chargée

### Étape 2: Recharger l'Extension

1. Dans `chrome://extensions/`
2. Trouvez **BrowserTools MCP 1.2.0**
3. Cliquez sur l'icône de **rechargement** (🔄)
4. Attendez 5-10 secondes

### Étape 3: Vérifier le Service Worker

1. Toujours dans `chrome://extensions/`
2. Trouvez **BrowserTools MCP 1.2.0**
3. Cliquez sur **"Examiner les vues service worker"**
4. Vérifiez qu'il n'y a pas d'erreurs dans la console qui s'ouvre

### Étape 4: Redémarrer Chrome DevTools

1. **Fermez complètement Chrome DevTools**
   - Cliquez sur la croix (X) ou appuyez sur Esc
2. **Rouvrez Chrome DevTools**
   - Clic droit sur la page → **Inspecter** (⌘⌥I)
   - OU: Menu → **Plus d'outils** → **Outils de développement**

### Étape 5: Chercher le Panneau BrowserTools

Dans Chrome DevTools, cherchez l'onglet **"BrowserTools"** ou **"BrowserToolsMCP"**:

1. **Regardez les onglets en haut de DevTools**:
   - Elements
   - Console
   - Sources
   - Network
   - **BrowserTools** ← Cherchez celui-ci!
   - Application
   - ...

2. **Si vous ne le voyez pas dans les onglets principaux**:
   - Regardez dans le menu **"More tools"** (trois points ⋮)
   - Cherchez "BrowserTools" dans la liste

3. **Si toujours invisible**:
   - Voir "Solution Alternative" ci-dessous

## 🔄 Solution Alternative: Réinstallation

Si le panneau n'apparaît toujours pas:

### 1. Désinstaller l'Extension

1. Allez dans `chrome://extensions/`
2. Trouvez **BrowserTools MCP 1.2.0**
3. Cliquez sur **"Supprimer"**
4. Confirmez la suppression

### 2. Réinstaller l'Extension

1. Assurez-vous que **"Mode développeur"** est activé
2. Cliquez sur **"Charger l'extension non empaquetée"**
3. Naviguez vers: `/tmp/BrowserTools-extension/chrome-extension/`
4. Sélectionnez le dossier
5. Vérifiez que l'extension apparaît

### 3. Redémarrer Chrome

1. Fermez complètement Chrome (⌘Q)
2. Rouvrez Chrome
3. Ouvrez Chrome DevTools (⌘⌥I)
4. Cherchez le panneau BrowserTools

## 🧪 Test de Vérification

Une fois le panneau visible:

1. Cliquez sur l'onglet **"BrowserTools"** dans DevTools
2. Vous devriez voir:
   - "Connected to browser-tools-server v1.2.0 at localhost:3025"
   - Des boutons (Capture Screenshot, Wipe All Logs, etc.)
   - Des paramètres

## 📋 Checklist Complète

- [ ] Extension BrowserTools MCP installée
- [ ] Extension activée (toggle ON)
- [ ] Extension rechargée (icône 🔄)
- [ ] Service worker actif (pas d'erreurs)
- [ ] Chrome DevTools redémarré
- [ ] Panneau BrowserTools visible dans DevTools

## 💡 Note Importante

Le panneau BrowserTools apparaît comme un **onglet dans Chrome DevTools**, pas comme une extension séparée.

Il devrait être visible parmi les onglets:
- Elements
- Console
- Sources
- Network
- **BrowserTools** ← Ici!
- Application
- ...

## 🆘 Si Rien Ne Fonctionne

1. Vérifiez les logs du serveur:
   ```bash
   tail -f /tmp/browser-tools-server.log
   ```

2. Vérifiez que le serveur est actif:
   ```bash
   lsof -i :3025
   ```

3. Redémarrez le serveur:
   ```bash
   ./scripts/fix-browser-tools-connection.sh
   ```

4. Contactez le support si le problème persiste

---

**🎯 Action Immédiate: Recharger l'extension et redémarrer Chrome DevTools!**

