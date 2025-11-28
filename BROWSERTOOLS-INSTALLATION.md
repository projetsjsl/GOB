# 🚀 Installation BrowserTools MCP

**Date**: 27 novembre 2025  
**Objectif**: Ajouter des fonctionnalités avancées de navigation et de debugging

## 📋 Prérequis

✅ **Vérifiés**:
- Node.js installé: `/Users/projetsjsl/.nvm/versions/node/v20.19.5/bin/npx`
- macOS (darwin 25.0.0)
- Cursor installé

## 🔧 Étapes d'Installation

### 1. Configuration MCP dans Cursor

**IMPORTANT**: Créez manuellement le fichier suivant car il est protégé:

**Fichier**: `.cursor/mcp.json`

**Contenu**:
```json
{
  "mcpServers": {
    "browser-tools": {
      "command": "npx",
      "args": [
        "-y",
        "@agentdeskai/browser-tools-mcp@1.2.0"
      ],
      "enabled": true
    }
  }
}
```

**Instructions**:
1. Ouvrez Cursor
2. Allez dans **Settings** (⌘,)
3. Allez dans **Features** → **MCP Servers**
4. Cliquez sur **Add new MCP server**
5. Configurez:
   - **Name**: `browser-tools`
   - **Type**: `command`
   - **Command**: `npx`
   - **Args**: `-y`, `@agentdeskai/browser-tools-mcp@1.2.0`
6. Activez le serveur (toggle ON)
7. Redémarrez Cursor si nécessaire

### 2. Téléchargement de l'Extension Chrome

**✅ Extension déjà téléchargée et décompressée dans**: `/tmp/BrowserTools-extension/chrome-extension/`

**Si vous devez le refaire**:

**Option A - Téléchargement direct**:
```bash
# Télécharger l'extension
curl -L https://github.com/AgentDeskAI/browser-tools-mcp/releases/download/v1.2.0/BrowserTools-1.2.0-extension.zip -o /tmp/BrowserTools-extension.zip

# Décompresser
cd /tmp
unzip BrowserTools-extension.zip -d BrowserTools-extension
```

**Option B - Clone du repo**:
```bash
cd ~/Downloads
git clone https://github.com/AgentDeskAI/browser-tools-mcp.git
# L'extension se trouve dans: browser-tools-mcp/chrome-extension/
```

### 3. Installation de l'Extension Chrome

1. Ouvrez Chrome
2. Allez dans **chrome://extensions/**
3. Activez **Mode développeur** (toggle en haut à droite)
4. Cliquez sur **Charger l'extension non empaquetée**
5. **Sélectionnez le dossier**: `/tmp/BrowserTools-extension/chrome-extension/`
   - Ou si vous avez cloné le repo: `~/Downloads/browser-tools-mcp/chrome-extension/`
6. Vérifiez que **BrowserToolsMCP** apparaît dans la liste avec un ID

### 4. Lancement du Serveur BrowserTools

**Option A - Script automatique** (recommandé):
```bash
./scripts/start-browser-tools-server.sh
```

**Option B - Commande manuelle**:
```bash
npx @agentdeskai/browser-tools-server@1.2.0
```

**⚠️ Important**: Lancez cette commande dans un **terminal séparé** et laissez-la tourner en arrière-plan.

**Note**: Le serveur tourne sur le port **3025**. Assurez-vous qu'aucun autre processus n'utilise ce port.

**Pour vérifier le port**:
```bash
lsof -i :3025
```

**Pour tuer un processus sur le port**:
```bash
kill -9 $(lsof -t -i:3025)
```

### 5. Configuration Chrome DevTools

1. Ouvrez n'importe quelle page web dans Chrome
2. Clic droit → **Inspecter** (ou ⌘⌥I)
3. Les logs seront maintenant accessibles via MCP

**Panneau BrowserTools**:
- Capture manuelle de screenshot
- Définir le chemin de sauvegarde (défaut: `Downloads/mcp-screenshots`)
- Effacer les logs
- Modifier les limites de taille des logs

## ✅ Fonctionnalités Disponibles

Une fois installé, BrowserTools MCP permet:

### 🔍 Debugging Avancé
- **Console logs et erreurs**: Accès aux logs de la console
- **XHR network requests/responses**: Voir toutes les requêtes réseau
- **DOM elements sélectionnés**: Accès aux éléments sélectionnés

### 📸 Screenshots
- Capture d'écran avec auto-paste dans Cursor
- Sauvegarde automatique dans `Downloads/mcp-screenshots`

### 🔬 Audits
- **Lighthouse scans**: SEO, Performance, Code Quality
- **NextJS-specific SEO audit**: Audit spécialisé Next.js
- **Debugger Mode**: Mode debug avec plusieurs outils
- **Audit Mode**: Audit complet de l'application web

## 🧪 Test de l'Installation

### Test 1: Vérifier la connexion MCP
1. Dans Cursor, ouvrez la console MCP
2. Vérifiez que `browser-tools` apparaît avec un cercle vert ✅
3. Vérifiez que tous les outils sont listés

### Test 2: Tester les logs
1. Ouvrez Chrome avec DevTools ouvert
2. Naviguez vers une page web
3. Dans Cursor, demandez: "Peux-tu vérifier les logs de la console?"
4. Les logs devraient être accessibles

### Test 3: Tester les screenshots
1. Naviguez vers une page web
2. Dans Cursor, demandez: "Peux-tu prendre un screenshot de cette page?"
3. Le screenshot devrait être sauvegardé dans `Downloads/mcp-screenshots`

## 🐛 Dépannage

### Problème: Le serveur MCP ne se connecte pas
**Solution**:
1. Vérifiez que le serveur `browser-tools-server` est lancé
2. Vérifiez le port 3025: `lsof -i :3025`
3. Redémarrez Cursor
4. Vérifiez les logs MCP: `tail -n 20 -F ~/Library/Application\ Support/Cursor/**/*MCP.log`

### Problème: Les screenshots ne s'affichent pas
**Solution**:
1. Vérifiez le chemin dans le panneau BrowserTools DevTools
2. Par défaut: `Downloads/mcp-screenshots`
3. Créez le dossier si nécessaire: `mkdir -p ~/Downloads/mcp-screenshots`

### Problème: Pas de logs visibles
**Solution**:
1. Assurez-vous que Chrome DevTools est ouvert
2. Fermez les autres onglets avec DevTools ouvert
3. Rafraîchissez la page

### Problème: Trop de logs
**Solution**:
1. Fermez les autres onglets avec DevTools ouvert
2. BrowserTools capture les logs de tous les onglets

### Problème: Les logs disparaissent
**Solution**:
- Les logs sont effacés à chaque rafraîchissement de page
- Utilisez le bouton "Wipe Logs" dans le panneau BrowserTools pour effacer manuellement

## 📚 Documentation

- **Documentation officielle**: https://browsertools.agentdesk.ai/installation
- **GitHub**: https://github.com/AgentDeskAI/browser-tools-mcp
- **Support**: Contact [@tedx_ai](https://x.com/tedx_ai) sur X

## 🎯 Commandes Utiles

```bash
# Lancer le serveur BrowserTools
npx @agentdeskai/browser-tools-server@1.2.0

# Vérifier le port 3025
lsof -i :3025

# Tuer le processus sur le port 3025
kill -9 $(lsof -t -i:3025)

# Voir les logs MCP de Cursor
tail -n 20 -F ~/Library/Application\ Support/Cursor/**/*MCP.log
```

## ✅ Checklist d'Installation

- [ ] Fichier `.cursor/mcp.json` créé et configuré
- [ ] Extension Chrome installée et activée
- [ ] Serveur `browser-tools-server` lancé
- [ ] Chrome DevTools ouvert sur une page
- [ ] Connexion MCP vérifiée dans Cursor
- [ ] Test de logs réussi
- [ ] Test de screenshot réussi

## 🎉 Statut

Une fois toutes les étapes complétées, BrowserTools MCP sera opérationnel et vous pourrez utiliser des commandes comme:

- "Peux-tu vérifier les logs de la console?"
- "Prends un screenshot de cette page"
- "Entre en mode debugger"
- "Fais un audit SEO et performance de cette page"
- "Vérifie les requêtes réseau pour voir ce qui ne fonctionne pas"

