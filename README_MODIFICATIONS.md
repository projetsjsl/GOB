# 🎯 Guide Rapide - Modifications Dashboard

## ✅ Architecture Simplifiée

**UNE SEULE SOURCE DE VÉRITÉ : `public/js/dashboard/`**

Le serveur sert **uniquement** depuis `public/` - modifiez toujours là.

## 🚀 Modification Rapide

```bash
# 1. Modifier le fichier
vim public/js/dashboard/components/tabs/MarketsEconomyTab.js

# 2. Redémarrer le serveur
npm run server

# 3. Tester
# Ouvrir http://localhost:10000/beta-combined-dashboard.html
```

## 📋 Règles d'Or

1. ✅ **Modifier dans `public/`** - Source unique
2. ✅ **Redémarrer le serveur** après modification
3. ✅ **Forcer le rechargement** navigateur (Ctrl+Shift+R)
4. ❌ **NE JAMAIS modifier `dist/`** - Écrasé automatiquement

## 🔧 Commandes Utiles

```bash
# Démarrer le serveur
npm run server

# Synchroniser manuellement (si besoin)
npm run sync:dashboard

# Voir les logs du serveur
tail -f /tmp/server.log
```

## 🐛 Problèmes Courants

**Le serveur ne voit pas mes changements ?**
→ Redémarrer le serveur + Forcer rechargement navigateur

**Erreur "file not found" ?**
→ Vérifier que le fichier existe dans `public/js/dashboard/`

**Cache persistant ?**
→ Le serveur envoie déjà `no-cache`, mais utilisez `?t=${Date.now()}` si besoin

---

**Rappel : `public/` = Source, `dist/` = Copie automatique**

