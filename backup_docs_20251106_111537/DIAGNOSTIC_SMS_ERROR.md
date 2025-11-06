# 🔍 Diagnostic: Erreur SMS Emma IA

## Symptôme
❌ SMS reçu: `"Désolé, une erreur est survenue. Réessayez dans quelques instants."`

## Tests Effectués

### ✅ Test 1: Webhook Twilio
- **Status**: OK
- Le webhook est correctement configuré sur `https://gobapps.com/api/adapters/sms`
- Twilio envoie bien les SMS au serveur

### ❌ Test 2: API Chat
- **Status**: ÉCHEC
- Erreur: `Access denied`
- Endpoint testé: `https://gobapps.com/api/chat`

### ❌ Test 3: Emma Agent
- **Status**: ÉCHEC
- Erreur: `Access denied`
- Endpoint testé: `https://gobapps.com/api/emma-agent`

## 🎯 Causes Possibles

### Cause #1: Protection Vercel
**Probabilité: ÉLEVÉE**

Vercel pourrait bloquer les requêtes POST pour des raisons de sécurité (anti-bot, rate limiting).

**Comment vérifier:**
1. Allez sur: https://vercel.com/projetsjsls-projects/gob/logs
2. Filtrez par `/api/chat` ou `/api/adapters/sms`
3. Cherchez les erreurs 403 ou "Access denied"

**Solution si confirmé:**
- Vérifier les paramètres de sécurité Vercel
- Désactiver temporairement le Firewall Vercel
- Whitelist l'IP de Twilio

---

### Cause #2: Variable d'environnement manquante
**Probabilité: ÉLEVÉE**

Emma Agent nécessite `PERPLEXITY_API_KEY` (ligne 1834 dans emma-agent.js).

**Comment vérifier:**
1. Allez sur: https://vercel.com/projetsjsls-projects/gob/settings/environment-variables
2. Vérifiez que ces variables existent:
   - ✅ `GEMINI_API_KEY`
   - ✅ `PERPLEXITY_API_KEY` ⚠️ **CRITIQUE**
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `TWILIO_ACCOUNT_SID`
   - ✅ `TWILIO_AUTH_TOKEN`
   - ✅ `TWILIO_PHONE_NUMBER`

**Solution si manquante:**
```bash
# Ajouter dans Vercel:
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxx
```

Puis redéployer.

---

### Cause #3: Erreur dans le code SMS adapter
**Probabilité: MOYENNE**

L'adaptateur SMS (`/api/adapters/sms.js`) pourrait avoir un bug lors de l'appel à `/api/chat`.

**Comment vérifier:**
Regarder les logs Vercel pour voir exactement où l'erreur se produit:
```
[SMS Adapter] Webhook Twilio reçu
[SMS Adapter] SMS de +1234567890: "Test"
[SMS Adapter] Erreur appel /api/chat: <ERREUR ICI>
```

---

### Cause #4: Supabase non configuré
**Probabilité: MOYENNE**

Si `SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY` sont manquants, `/api/chat` échoue.

**Comment vérifier:**
Testez une connexion Supabase directement depuis Vercel logs.

---

## 🚀 Plan d'Action Immédiat

### Étape 1: Vérifier les Logs Vercel (PRIORITAIRE)

**C'est la clé pour identifier le problème exact!**

1. Allez sur: https://vercel.com/projetsjsls-projects/gob/logs
2. Activez le mode "Live" (en haut à droite)
3. Envoyez un SMS test à votre numéro Twilio
4. Observez les logs en temps réel

**Cherchez spécifiquement:**
- `[SMS Adapter] Erreur appel /api/chat:`
- `PERPLEXITY_API_KEY is not configured`
- `GEMINI_API_KEY not configured`
- `SUPABASE_URL`
- Stack trace de l'erreur

**Screenshot les logs et partagez-les pour diagnostic précis.**

---

### Étape 2: Vérifier les Variables d'Environnement

Allez sur: https://vercel.com/projetsjsls-projects/gob/settings/environment-variables

**Cochez que ces variables existent ET ont une valeur:**

```bash
☐ GEMINI_API_KEY            # Google Gemini
☐ PERPLEXITY_API_KEY        # Perplexity (OBLIGATOIRE pour Emma Agent!)
☐ SUPABASE_URL              # Supabase
☐ SUPABASE_SERVICE_ROLE_KEY # Supabase
☐ TWILIO_ACCOUNT_SID        # Twilio
☐ TWILIO_AUTH_TOKEN         # Twilio
☐ TWILIO_PHONE_NUMBER       # Twilio
```

**Si une variable est manquante, ajoutez-la et redéployez!**

---

### Étape 3: Tester manuellement l'API Chat

Depuis votre machine locale (ou un outil comme Postman):

```bash
curl -X POST https://gobapps.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test",
    "userId": "test-user",
    "channel": "web"
  }'
```

**Réponses possibles:**

1. **Si succès** (200 OK):
   ```json
   {
     "success": true,
     "response": "Bonjour! Comment puis-je vous aider?",
     ...
   }
   ```
   → Le problème vient de l'adaptateur SMS

2. **Si erreur 503**:
   ```json
   {
     "error": "PERPLEXITY_API_KEY non configurée"
   }
   ```
   → Ajoutez `PERPLEXITY_API_KEY` dans Vercel

3. **Si "Access denied"**:
   → Protection Vercel activée (voir Cause #1)

4. **Si erreur 500**:
   → Regardez les logs Vercel pour l'erreur exacte

---

### Étape 4: Test Simplifié (Bypass Emma Agent)

Si le problème persiste, créons un endpoint de test simplifié pour isoler le problème.

**Créer `/api/test-sms-simple.js`:**
```javascript
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/xml');
  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>✅ Test réussi! Le serveur fonctionne.</Message>
</Response>`);
}
```

Puis configurer Twilio webhook vers:
```
https://gobapps.com/api/test-sms-simple
```

**Si ça marche:** Le problème vient de Emma Agent ou de la chaîne d'appels
**Si ça échoue:** Le problème vient de Vercel ou Twilio

---

## 📊 Checklist de Diagnostic

Cochez au fur et à mesure:

```
☐ 1. Logs Vercel consultés en temps réel
☐ 2. Variables d'environnement vérifiées (toutes présentes)
☐ 3. PERPLEXITY_API_KEY confirmée présente
☐ 4. GEMINI_API_KEY confirmée présente
☐ 5. Test curl /api/chat effectué
☐ 6. Supabase tables créées (user_profiles, conversation_history)
☐ 7. Redéploiement Vercel effectué après ajout de variables
☐ 8. Test endpoint simplifié effectué
```

---

## 🔧 Solutions Rapides par Scénario

### Scénario A: "PERPLEXITY_API_KEY non configurée"
```bash
# Dans Vercel Environment Variables:
PERPLEXITY_API_KEY=pplx-xxxxxxxxxx

# Puis redéployer
git commit --allow-empty -m "redeploy"
git push origin main
```

### Scénario B: "Access denied" persistant
1. Désactiver Vercel Firewall (Settings → Security)
2. Ou whitelister les IPs Twilio
3. Ou utiliser Vercel Edge Config pour contourner

### Scénario C: Erreur Supabase
```sql
-- Dans Supabase SQL Editor:
-- Exécuter tout le contenu de supabase-multichannel-setup.sql
```

### Scénario D: Timeout
Augmenter le timeout dans `vercel.json`:
```json
{
  "functions": {
    "api/chat.js": {
      "maxDuration": 60
    }
  }
}
```

---

## 📞 Prochaines Étapes

**IMMÉDIATEMENT:**
1. ✅ Consultez les logs Vercel en live pendant un SMS test
2. ✅ Vérifiez PERPLEXITY_API_KEY dans Vercel
3. ✅ Partagez le message d'erreur exact des logs

**Envoyez-moi:**
- Screenshot des logs Vercel lors d'un SMS test
- Liste des variables d'environnement présentes (sans les valeurs!)
- Réponse du test curl `/api/chat`

Avec ces infos, je pourrai identifier le problème exact en 30 secondes! 🚀

---

**Dernière mise à jour:** 2025-11-03
**Status:** En attente des logs Vercel pour diagnostic précis
