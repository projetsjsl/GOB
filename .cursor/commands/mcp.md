# Configuration MCP Browser - GOB Dashboard

## Activation du Browser Automation

Pour utiliser les tests visuels automatisés, le MCP Browser doit être activé :

1. **Ouvrir Cursor Settings** → Features → MCP
2. **Activer** `cursor-ide-browser` (Browser Automation)
3. **Redémarrer** l'agent si nécessaire

## Outils MCP Browser Disponibles

| Outil | Description |
|-------|-------------|
| `browser_navigate` | Naviguer vers une URL |
| `browser_snapshot` | Capturer l'état de la page (éléments, refs) |
| `browser_click` | Cliquer sur un élément (nécessite ref) |
| `browser_type` | Taper du texte dans un champ |
| `browser_hover` | Survoler un élément |
| `browser_take_screenshot` | Prendre une capture d'écran |
| `browser_console_messages` | Lire les logs console |
| `browser_wait_for` | Attendre (temps ou texte) |
| `browser_tabs` | Gérer les onglets (list/new/close/select) |
| `browser_press_key` | Appuyer sur une touche |
| `browser_select_option` | Sélectionner dans un dropdown |

## Workflow de Test Visuel

**⚠️ Toujours utiliser `position: "side"` pour que l'utilisateur voie la navigation !**

```
# 1. Naviguer vers le dashboard (SIDE = visible à côté de l'éditeur)
mcp_cursor-ide-browser_browser_navigate(url: "http://localhost:5173", position: "side")

# 2. Obtenir l'état de la page et les refs des éléments
mcp_cursor-ide-browser_browser_snapshot()

# 3. Cliquer sur un élément (utiliser ref du snapshot)
mcp_cursor-ide-browser_browser_click(element: "Description", ref: "ref-xxx")

# 4. Vérifier la console pour erreurs
mcp_cursor-ide-browser_browser_console_messages()

# 5. Prendre un screenshot
mcp_cursor-ide-browser_browser_take_screenshot(filename: "test-screenshot.png")
```

**Important** : Le paramètre `position: "side"` ouvre le browser dans un panneau latéral
visible par l'utilisateur, permettant de suivre chaque étape de navigation en temps réel.

## URLs à Tester

| Page | URL |
|------|-----|
| Login | `http://localhost:5173/login.html` |
| Dashboard | `http://localhost:5173/beta-combined-dashboard.html` |
| 3p1 Components | `http://localhost:5173/3p1/index.html` |

## Vérifications Obligatoires

1. **Page charge** : Pas d'écran blanc
2. **Console propre** : Pas d'erreurs rouges (warnings OK)
3. **Navigation** : Onglets cliquables et fonctionnels
4. **Données** : Affichées (pas de loading infini)
5. **Interactions** : Boutons, dropdowns, expandables

## Intégration avec /st et //

Les commandes `/st` et `//` incluent automatiquement les tests visuels.
Voir section 8 de `/st` pour les détails du workflow complet.

## Troubleshooting

| Problème | Solution |
|----------|----------|
| `Tool not found` | Activer MCP Browser dans Cursor Settings |
| `ERR_CONNECTION_REFUSED` | Démarrer le serveur (`npm run dev`) |
| `Snapshot vide` | Attendre le chargement (`browser_wait_for`) |
| `ref invalide` | Refaire un `browser_snapshot` |
