# 🚀 Installation Extension Chrome BrowserTools

**Guide rapide pour installer l'extension Chrome BrowserTools MCP**

## ⚠️ IMPORTANT: Chrome Personnel vs Chrome Cursor

**Cursor utilise un Chrome séparé** pour ses outils de navigation. Vous devez installer l'extension dans **votre Chrome personnel**, pas celui de Cursor.

### Comment distinguer:
- **Chrome Cursor**: Utilisé automatiquement par Cursor pour les outils de navigation
- **Chrome Personnel**: Votre Chrome normal avec vos extensions, signets, etc.

## 📍 Emplacement de l'extension

L'extension est déjà téléchargée et décompressée dans:
```
/tmp/BrowserTools-extension/chrome-extension/
```

## 🔧 Étapes d'installation

### 1. Ouvrir Chrome Personnel (IMPORTANT!)

**Méthode A - Script automatique** (recommandé):
```bash
./scripts/open-chrome-personal.sh chrome://extensions/
```

**Méthode B - Manuel**:
1. Ouvrez **votre Chrome personnel** (pas celui de Cursor)
2. Allez sur: `chrome://extensions/`
   - OU: Menu (⋮) → **Extensions** → **Gérer les extensions**

### 2. Activer le Mode Développeur

1. En haut à droite de la page `chrome://extensions/`
2. Activez le **toggle "Mode développeur"**
3. Vous devriez voir de nouveaux boutons apparaître

### 3. Charger l'extension

1. Cliquez sur le bouton **"Charger l'extension non empaquetée"**
2. Dans la fenêtre de sélection de fichiers:
   - Naviguez vers: `/tmp/BrowserTools-extension/chrome-extension/`
   - **OU** collez directement ce chemin dans la barre de recherche
3. Cliquez sur **"Sélectionner"** ou **"Ouvrir"**

### 4. Vérifier l'installation

Vous devriez voir apparaître:
- **BrowserTools MCP** dans la liste des extensions
- Un **ID unique** pour l'extension
- Le statut **"Activé"** (toggle vert)

## ✅ Vérification

### Test rapide

1. Ouvrez n'importe quelle page web dans Chrome
2. Clic droit → **"Inspecter"** (ou ⌘⌥I)
3. Dans les DevTools, cherchez l'onglet **"BrowserTools"** ou **"BrowserToolsMCP"**
4. Si vous voyez le panneau BrowserTools, l'installation est réussie! ✅

### Fonctionnalités du panneau BrowserTools

Dans le panneau DevTools BrowserTools, vous pouvez:
- 📸 **Capture manuelle**: Prendre un screenshot
- 📁 **Chemin de sauvegarde**: Définir où sauvegarder les screenshots
- 🗑️ **Wipe Logs**: Effacer tous les logs
- ⚙️ **Paramètres**: Modifier les limites de taille des logs

## 🐛 Dépannage

### ⚠️ "Je ne peux pas charger l'extension"

**Problème**: Vous essayez d'installer dans le mauvais Chrome (celui de Cursor)

**Solution**:
1. Fermez tous les Chrome ouverts
2. Utilisez le script: `./scripts/open-chrome-personal.sh chrome://extensions/`
3. OU ouvrez Chrome manuellement (pas via Cursor)
4. Vérifiez que vous voyez vos extensions habituelles (c'est le bon Chrome)

### L'extension n'apparaît pas

1. Vérifiez que vous utilisez **votre Chrome personnel** (pas celui de Cursor)
2. Vérifiez que vous avez bien sélectionné le dossier `chrome-extension/` (pas le parent)
3. Vérifiez que le dossier existe: `ls -la /tmp/BrowserTools-extension/chrome-extension/`
4. Redémarrez Chrome et réessayez

### Erreur "Manifest invalide"

1. Vérifiez que tous les fichiers sont présents:
   ```bash
   ls -la /tmp/BrowserTools-extension/chrome-extension/
   ```
2. Vous devriez voir: `manifest.json`, `background.js`, `devtools.html`, etc.

### L'onglet BrowserTools n'apparaît pas dans DevTools

1. Fermez et rouvrez les DevTools
2. Vérifiez que l'extension est activée dans `chrome://extensions/`
3. Rafraîchissez la page web

## 📸 Capture d'écran de référence

Après installation réussie, vous devriez voir dans `chrome://extensions/`:

```
┌─────────────────────────────────────────┐
│ BrowserTools MCP                       │
│ ID: abcdefghijklmnopqrstuvwxyz123456   │
│ [ON]                                    │
│ Détails | Erreurs                      │
└─────────────────────────────────────────┘
```

## 🎉 Prochaines étapes

Une fois l'extension installée:

1. ✅ **Serveur BrowserTools**: Déjà lancé sur le port 3025
2. ✅ **Configuration MCP**: Déjà créée dans `.cursor/mcp.json`
3. ⏳ **Extension Chrome**: À installer (cette étape)
4. ⏳ **Redémarrer Cursor**: Pour charger la configuration MCP
5. ⏳ **Ouvrir DevTools**: Sur une page web pour activer les logs

## 🔗 Liens utiles

- **Documentation complète**: `BROWSERTOOLS-INSTALLATION.md`
- **Résumé**: `BROWSERTOOLS-RESUME.md`
- **Vérification**: `./scripts/verify-browser-tools-installation.sh`

