# 📝 Guide de Modification - Dashboard GOB

## 🎯 Principe : Une Seule Source de Vérité

**TOUS les fichiers dashboard sont dans `public/js/dashboard/`**

Le serveur sert **UNIQUEMENT** depuis `public/` - c'est votre source unique.

## ✏️ Comment Modifier un Fichier

### 1. Modifier le fichier source
```bash
# Éditez directement dans public/
public/js/dashboard/components/tabs/MarketsEconomyTab.js
```

### 2. Redémarrer le serveur
```bash
npm run server
```

Le serveur synchronise automatiquement vers `dist/` au démarrage.

### 3. Tester
Ouvrez `http://localhost:10000/beta-combined-dashboard.html`

## 🔄 Synchronisation Manuelle (si nécessaire)

Si vous modifiez plusieurs fichiers et voulez synchroniser manuellement :

```bash
npm run sync:dashboard
```

## 📂 Structure des Fichiers

```
public/js/dashboard/          ← MODIFIEZ ICI (source unique)
├── components/
│   └── tabs/
│       ├── MarketsEconomyTab.js
│       ├── AskEmmaTab.js
│       └── ...
├── dashboard-main.js
└── utils.js

dist/js/dashboard/            ← Copie automatique (ne pas modifier)
└── (synchronisé automatiquement)
```

## ⚠️ Règles Importantes

1. **NE JAMAIS modifier directement dans `dist/`** - vos changements seront écrasés
2. **Toujours modifier dans `public/`** - c'est la source de vérité
3. **Redémarrer le serveur après modifications** pour voir les changements
4. **Forcer le rechargement du navigateur** (Ctrl+Shift+R ou Cmd+Shift+R)

## 🐛 Dépannage

### Le serveur ne voit pas mes modifications
1. Vérifiez que vous avez modifié dans `public/`
2. Redémarrez le serveur : `npm run server`
3. Forcez le rechargement du navigateur (Ctrl+Shift+R)

### Erreur "file not found"
1. Vérifiez que le fichier existe dans `public/js/dashboard/`
2. Vérifiez le chemin dans `beta-combined-dashboard.html`

### Cache persistant
Le serveur envoie déjà des headers `no-cache`, mais si le problème persiste :
- Utilisez un paramètre de cache : `?t=${Date.now()}`
- Ou videz le cache du navigateur

## 🚀 Workflow Recommandé

```bash
# 1. Modifier le fichier
vim public/js/dashboard/components/tabs/MarketsEconomyTab.js

# 2. Redémarrer le serveur
npm run server

# 3. Tester dans le navigateur
# http://localhost:10000/beta-combined-dashboard.html
```

## 📋 Checklist Avant de Pousser sur GitHub

- [ ] Tous les fichiers modifiés sont dans `public/`
- [ ] Le serveur démarre sans erreur
- [ ] Tous les onglets fonctionnent
- [ ] Pas d'erreurs dans la console du navigateur
- [ ] Les modifications sont testées visuellement

---

**Rappel : `public/` = Source unique, `dist/` = Copie automatique**

