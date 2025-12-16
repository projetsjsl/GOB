# 🚨 URGENT: Twilio Authentication Error

**Date**: 06/11/2025  
**Erreur**: `RestException [Error]: Authenticate` (Code 20003)  
**Impact**: ❌ **SMS ne fonctionnent PAS** (ni envoi, ni réception)

---

## ❌ Erreur dans les Logs:

```
[SMS Adapter] Erreur Twilio: RestException [Error]: Authenticate
status: 401, code: 20003
moreInfo: 'https://www.twilio.com/docs/errors/20003'
```

**Signification**: Les credentials Twilio sur Vercel sont **invalides ou manquants**.

---

## 🔍 Diagnostic:

### Vérifier les Variables d'Environnement Vercel:

1. Va sur: **https://vercel.com**
2. Sélectionne projet **GOB**
3. **Settings** → **Environment Variables**
4. Vérifie que ces 3 variables existent:

```
TWILIO_ACCOUNT_SID     = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN      = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER    = +1234567890
```

---

## ✅ Solutions:

### Solution 1: Vérifier les Credentials Twilio

1. **Va sur Twilio Console**: https://console.twilio.com
2. **Account Info** (en haut à droite)
3. **Copie**:
   - **Account SID**: `ACxxxxx...`
   - **Auth Token**: Click "View" puis copie

### Solution 2: Mettre à Jour les Variables Vercel

#### Via Dashboard Vercel:
1. **Vercel** → **GOB** → **Settings** → **Environment Variables**
2. **Modifier ou Ajouter**:
   ```
   TWILIO_ACCOUNT_SID     = [Ton Account SID]
   TWILIO_AUTH_TOKEN      = [Ton Auth Token]
   TWILIO_PHONE_NUMBER    = [Ton numéro Twilio format: +1234567890]
   ```
3. **Scope**: Production, Preview, Development (cocher les 3)
4. **Save**
5. **Redéployer**: Deployments → Latest → "Redeploy"

#### Via CLI:
```bash
# Ajouter les variables
vercel env add TWILIO_ACCOUNT_SID
# Coller la valeur

vercel env add TWILIO_AUTH_TOKEN
# Coller la valeur

vercel env add TWILIO_PHONE_NUMBER
# Coller le numéro (format: +1234567890)

# Redéployer
vercel --prod
```

---

## 🧪 Test Après Fix:

### Étape 1: Attends 5 minutes (redéploiement)

### Étape 2: Envoie un SMS test
```
"test"
```

### Étape 3: Vérifie la réception
Tu devrais recevoir:
```
🔍 Message reçu! Emma analyse ta demande... 
Je reviens dans quelques instants! ⏳
```

---

## 📊 Vérification des Credentials:

### Format Correct:

```bash
# Account SID (commence par AC)
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcd

# Auth Token (32 caractères)
TWILIO_AUTH_TOKEN=1234567890abcdef1234567890abcdef

# Phone Number (format international avec +)
TWILIO_PHONE_NUMBER=+15551234567
```

### ❌ Erreurs Communes:

1. **Espaces** dans les valeurs
2. **Quotes** autour des valeurs (pas nécessaire sur Vercel)
3. **Numéro sans +** (doit être +15551234567)
4. **Auth Token expiré** (regénérer sur Twilio Console)
5. **Variables dans mauvais scope** (doit être Production)

---

## 🔒 Sécurité:

⚠️ **JAMAIS** commit les credentials dans Git!
✅ **TOUJOURS** utiliser les Environment Variables Vercel

---

## 📝 Checklist Fix:

- [ ] Vérifier Account SID sur Twilio Console
- [ ] Vérifier Auth Token sur Twilio Console
- [ ] Vérifier Phone Number sur Twilio Console
- [ ] Mettre à jour TWILIO_ACCOUNT_SID sur Vercel
- [ ] Mettre à jour TWILIO_AUTH_TOKEN sur Vercel
- [ ] Mettre à jour TWILIO_PHONE_NUMBER sur Vercel
- [ ] Scope = Production ✅
- [ ] Redéployer Vercel
- [ ] Attendre 5 minutes
- [ ] Tester SMS
- [ ] Vérifier logs Vercel (pas d'erreur 401)

---

## 🚀 Après le Fix:

Les logs devraient montrer:
```
[SMS Adapter] Webhook Twilio reçu ✅
[SMS Adapter] SMS de +14183185826: "test" ✅
[SMS Adapter] SMS de confirmation envoyé ✅
[SMS Adapter] 3 SMS envoyés avec succès ✅
```

Au lieu de:
```
❌ [SMS Adapter] Erreur Twilio: RestException [Error]: Authenticate
```

---

## 💡 Liens Utiles:

- **Twilio Console**: https://console.twilio.com
- **Twilio Error 20003**: https://www.twilio.com/docs/errors/20003
- **Vercel Env Vars**: https://vercel.com/docs/concepts/projects/environment-variables

---

## ✅ Résumé:

**Problème**: Credentials Twilio invalides sur Vercel  
**Solution**: Mettre à jour les 3 variables d'environnement  
**Temps**: 5-10 minutes (update + redeploy)  
**Priorité**: 🚨 **CRITIQUE** (SMS ne fonctionnent pas sans ça)

---

**Fixe ça en priorité!** 🔥

