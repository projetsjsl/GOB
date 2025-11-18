# 🔧 Troubleshooting - Erreur 404 Webhook n8n

**Date**: 18 Novembre 2025  
**Problème**: Erreur 404 sur le webhook n8n `gob-sms-webhook-test`

---

## 🐛 Problème Identifié

L'interface admin affiche une erreur **404 Not Found** pour le webhook n8n :
```
https://projetsjsl.app.n8n.cloud/webhook/gob-sms-webhook-test
```

---

## ✅ Correction Appliquée

**Fichier**: `api/admin/sms-control.js`

**Problème**: La fonction `checkWebhook` utilisait `HEAD` pour vérifier le webhook, mais les webhooks n8n ne répondent qu'à `POST`.

**Solution**: Utilisation de `POST` avec un payload minimal pour vérifier que le webhook existe.

---

## 🔍 Diagnostic

### 1. Vérifier que le Workflow n8n est Activé

1. Accéder à n8n : https://projetsjsl.app.n8n.cloud
2. Aller dans **Workflows**
3. Chercher le workflow **"GOB Emma - SMS via Twilio"**
4. Vérifier que le toggle **Active** est **ON** (vert)

### 2. Vérifier le Chemin du Webhook

Le workflow doit avoir un nœud **Webhook** avec :
- **Path**: `gob-sms-webhook-test`
- **HTTP Method**: `POST`
- **Status**: Actif (icône verte)

### 3. Vérifier l'URL Complète

L'URL complète doit être :
```
https://projetsjsl.app.n8n.cloud/webhook/gob-sms-webhook-test
```

**Format**: `{N8N_WEBHOOK_BASE_URL}/webhook/{path}`

---

## 🚀 Solutions

### Solution 1 : Importer/Activer le Workflow

Si le workflow n'existe pas dans n8n :

1. **Importer le workflow** :
   - Dans n8n : **Workflows** → **Import from File**
   - Sélectionner : `n8n-workflows/sms-workflow.json`

2. **Activer le workflow** :
   - Cliquer sur le workflow importé
   - Activer le toggle **Active** (en haut à droite)

3. **Vérifier les webhooks** :
   - Le workflow doit avoir 2 webhooks :
     - `gob-sms-webhook-test` (pour tests)
     - `gob-sms-webhook` (pour production)

### Solution 2 : Vérifier la Configuration n8n

1. **Vérifier les credentials** :
   - Twilio credentials configurés
   - URL de l'API Emma configurée : `https://gobapps.com/api/adapters/sms`

2. **Tester le webhook manuellement** :
   ```bash
   curl -X POST https://projetsjsl.app.n8n.cloud/webhook/gob-sms-webhook-test \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "From=+15551234567&To=+15559876543&Body=TEST&MessageSid=test123"
   ```

   **Résultat attendu** :
   - ✅ `200 OK` ou `201 Created` → Webhook fonctionne
   - ❌ `404 Not Found` → Workflow non activé ou chemin incorrect

### Solution 3 : Vérifier les Variables d'Environnement

Dans l'interface admin (`/admin-jslai-dynamic.html` ou Dashboard → Admin JSLAI) :

1. **Vérifier `N8N_WEBHOOK_BASE_URL`** :
   ```
   https://projetsjsl.app.n8n.cloud
   ```

2. **Vérifier `EMMA_WEBHOOK_URL`** :
   ```
   https://projetsjsl.app.n8n.cloud/webhook/gob-sms-webhook-test
   ```

3. **Sauvegarder** la configuration

---

## 📊 Messages d'Erreur Améliorés

Après la correction, l'interface affichera des messages plus clairs :

### ✅ Webhook OK
```
200 OK - Webhook accessible
```

### ❌ Webhook Inexistant (404)
```
404 Not Found - Le webhook n'existe pas dans n8n. 
Vérifiez que le workflow est activé et que le chemin est correct.
```

### ❌ Timeout
```
Timeout - Le webhook n'a pas répondu dans les 5 secondes. 
Vérifiez que n8n est accessible.
```

### ❌ Erreur Réseau
```
Erreur réseau - Impossible d'atteindre n8n. 
Vérifiez l'URL: https://projetsjsl.app.n8n.cloud/webhook/gob-sms-webhook-test
```

---

## 🔄 Workflow n8n Requis

Le workflow doit contenir :

1. **Webhook SMS Test** (`gob-sms-webhook-test`)
   - Path: `gob-sms-webhook-test`
   - Method: `POST`

2. **Webhook Twilio** (`gob-sms-webhook`)
   - Path: `gob-sms-webhook`
   - Method: `POST`

3. **Extract SMS Data**
   - Extrait: `From`, `To`, `Body`, `MessageSid`

4. **Call SMS Adapter**
   - URL: `https://gobapps.com/api/adapters/sms`
   - Method: `POST`
   - Body: JSON avec données SMS

---

## 📝 Checklist de Vérification

- [ ] Workflow n8n importé (`n8n-workflows/sms-workflow.json`)
- [ ] Workflow activé dans n8n (toggle **Active** = ON)
- [ ] Webhook `gob-sms-webhook-test` existe et est actif
- [ ] URL correcte : `https://projetsjsl.app.n8n.cloud/webhook/gob-sms-webhook-test`
- [ ] Variables d'environnement configurées :
  - [ ] `N8N_WEBHOOK_BASE_URL`
  - [ ] `EMMA_WEBHOOK_URL`
- [ ] Test manuel du webhook réussit (curl ou Postman)
- [ ] Interface admin affiche "n8n OK" au lieu de "ERROR 404"

---

## 🎯 Test Rapide

Pour tester rapidement si le webhook fonctionne :

```bash
# Test direct du webhook
curl -X POST https://projetsjsl.app.n8n.cloud/webhook/gob-sms-webhook-test \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=+15551234567&To=+15559876543&Body=Test+Emma&MessageSid=test-$(date +%s)"
```

**Résultat attendu** :
- ✅ `200 OK` → Webhook fonctionne
- ❌ `404 Not Found` → Importer/activer le workflow dans n8n

---

## 📚 Documentation Associée

- `docs/MULTICANAL-SETUP.md` - Configuration complète multicanaux
- `n8n-workflows/sms-workflow.json` - Workflow à importer
- `integration-guide.md` - Guide d'intégration SMS

