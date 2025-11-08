# 📋 Guide : Activer/Désactiver le Mode Preview dans n8n

## 🎯 Objectif

Ce guide explique comment basculer entre le **mode preview** (test sans envoi) et le **mode send** (envoi réel) dans le workflow n8n.

## 🔍 Localisation des Paramètres

Les paramètres se trouvent dans le node **"Workflow Configuration"** du workflow n8n.

### 📍 Comment trouver le node

1. Ouvrez votre workflow n8n : **"Emma Newsletter - Automated Multi-API Financial News Distribution"**
2. Cherchez le node **"Workflow Configuration"** (icône ⚙️)
3. Cliquez sur le node pour l'ouvrir

## ⚙️ Paramètres à Modifier

Dans le node **"Workflow Configuration"**, vous trouverez deux paramètres importants :

### 1. `preview_mode` (Mode Preview)

- **Type** : Boolean (true/false)
- **Valeur `true`** : Mode preview activé → **AUCUN EMAIL NE SERA ENVOYÉ**
- **Valeur `false`** : Mode preview désactivé → Les emails peuvent être envoyés si `approved=true`

### 2. `approved` (Approbation)

- **Type** : Boolean (true/false)
- **Valeur `true`** : Email approuvé → **L'EMAIL SERA ENVOYÉ** (si `preview_mode=false`)
- **Valeur `false`** : Email non approuvé → **AUCUN EMAIL NE SERA ENVOYÉ**

## 🚀 Scénarios d'Utilisation

### ✅ Scénario 1 : Mode PREVIEW (Test sans envoi)

**Configuration :**
```
preview_mode = true
approved = false (ou true, peu importe)
```

**Résultat :**
- ✅ Le briefing est généré
- ✅ Vous pouvez voir le preview dans les logs
- ❌ **AUCUN EMAIL N'EST ENVOYÉ**

**Quand utiliser :**
- Pour tester un nouveau prompt
- Pour vérifier le formatage avant l'envoi
- Pour déboguer le workflow

---

### ✅ Scénario 2 : Mode SEND (Envoi réel)

**Configuration :**
```
preview_mode = false
approved = true
```

**Résultat :**
- ✅ Le briefing est généré
- ✅ **L'EMAIL EST ENVOYÉ** aux destinataires configurés dans Supabase
- ✅ Les destinataires sont récupérés depuis `/api/email-recipients` selon le type de briefing

**Quand utiliser :**
- Pour les briefings automatiques (matin, midi, soir)
- Pour envoyer un briefing personnalisé après validation

---

### ⚠️ Scénario 3 : Bloqué (Sécurité)

**Configuration :**
```
preview_mode = true
approved = true
```

**OU**

```
preview_mode = false
approved = false
```

**Résultat :**
- ✅ Le briefing est généré
- ❌ **AUCUN EMAIL N'EST ENVOYÉ** (bloqué par sécurité)

**Pourquoi :**
- Protection contre les envois accidentels
- Le node "Generate HTML Newsletter" vérifie ces paramètres avant l'envoi

---

## 📝 Instructions Pas à Pas

### Pour activer le MODE SEND (envoi réel) :

1. **Ouvrez le workflow n8n**
2. **Trouvez le node "Workflow Configuration"**
3. **Cliquez sur le node pour l'éditer**
4. **Modifiez les valeurs :**
   - `preview_mode` : Changez `true` → `false`
   - `approved` : Changez `false` → `true`
5. **Sauvegardez le node** (bouton "Save" ou Ctrl+S)
6. **Réexécutez le workflow** depuis le trigger approprié

### Pour activer le MODE PREVIEW (test) :

1. **Ouvrez le workflow n8n**
2. **Trouvez le node "Workflow Configuration"**
3. **Cliquez sur le node pour l'éditer**
4. **Modifiez les valeurs :**
   - `preview_mode` : Changez `false` → `true`
   - `approved` : Peut rester `false` ou `true`
5. **Sauvegardez le node**
6. **Réexécutez le workflow**

---

## 🎨 Formatage des Emails

Les emails utilisent automatiquement les **standards visuels centralisés** depuis `config/theme-colors.json` :

- ✅ Couleurs du thème GOB (indigo/violet)
- ✅ Gradients spécifiques par type (matin=orange, midi=bleu, soir=violet)
- ✅ Typographie cohérente
- ✅ Responsive et compatible email clients

**Aucune action requise** - Le formatage est automatique via le node "Generate HTML Newsletter".

---

## 🔗 Destinataires

Les destinataires sont maintenant **automatiquement récupérés depuis Supabase** via `/api/email-recipients` :

- ✅ **Mode preview** : Utilise l'email de preview configuré dans Supabase
- ✅ **Mode send** : Utilise les destinataires actifs selon le type de briefing (matin/midi/soir/custom)

**Gestion des destinataires :**
- Via le dashboard web : Section "📧 Gestion des Destinataires Email"
- Via l'API : `/api/email-recipients`

---

## ⚡ Raccourci Rapide

### Pour ENVOYER immédiatement :
```
Workflow Configuration:
  preview_mode = false
  approved = true
```

### Pour TESTER sans envoyer :
```
Workflow Configuration:
  preview_mode = true
  approved = false
```

---

## 🛡️ Sécurité

Le workflow inclut une **double vérification de sécurité** :

1. **Node "Generate HTML Newsletter"** : Vérifie `preview_mode` et `approved` avant de générer l'HTML
2. **Node "Check Approval"** : Vérifie à nouveau avant l'envoi

Si les paramètres ne sont pas corrects, le workflow **bloque l'envoi** et affiche une erreur explicite.

---

## 📞 Support

Si vous avez des questions ou rencontrez des problèmes :
1. Vérifiez les logs d'exécution dans n8n
2. Vérifiez que les destinataires sont bien configurés dans Supabase
3. Vérifiez que `RESEND_API_KEY` est bien configuré dans n8n

---

**Dernière mise à jour :** Décembre 2024

