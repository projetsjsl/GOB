# 🚀 Comment Activer le Mode SEND dans n8n

## ⚡ Raccourci Rapide

Pour **ENVOYER** les emails (mode SEND) :

1. **Ouvrez votre workflow n8n** : "Emma Newsletter - Automated Multi-API Financial News Distribution"
2. **Trouvez le node "Workflow Configuration"** (icône ⚙️)
3. **Modifiez ces 2 valeurs** :
   - `preview_mode` : **`false`** (au lieu de `true`)
   - `approved` : **`true`** (au lieu de `false`)
4. **Sauvegardez** le node
5. **Réexécutez** le workflow

---

## 📍 Localisation Exacte

**Node à modifier** : `Workflow Configuration`

**Paramètres à changer** :
```
preview_mode = false  ← Changez de true à false
approved = true       ← Changez de false à true
```

---

## ✅ Vérification

Après modification, le workflow :
- ✅ **ENVERRA** les emails aux destinataires configurés dans Supabase
- ✅ Utilisera les destinataires actifs selon le type de briefing (matin/midi/soir)
- ✅ Les destinataires sont récupérés automatiquement depuis `/api/email-recipients`

---

## 🔄 Pour Revenir en Mode PREVIEW (Test)

Pour **TESTER** sans envoyer :

1. Dans le même node "Workflow Configuration"
2. Modifiez :
   - `preview_mode` : **`true`**
   - `approved` : **`false`**

---

## 📋 Guide Complet

Pour plus de détails, consultez : **`docs/GUIDE-MODE-PREVIEW-N8N.md`**

---

**Note** : Les emails utilisent maintenant automatiquement les standards visuels centralisés (couleurs, gradients, typographie) depuis `config/theme-colors.json`.

