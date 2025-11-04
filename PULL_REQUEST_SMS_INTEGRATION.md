# Pull Request: Configure Twilio SMS Integration for Emma IA

## 🎯 Objectif

Configurer l'intégration SMS Twilio pour permettre à Emma IA de répondre via SMS.

---

## 📝 Changements Effectués

### 1. Configuration Twilio ✅
- ✅ Webhook Twilio configuré sur `https://gobapps.com/api/adapters/sms`
- ✅ SMS Adapter fonctionnel et testé

### 2. Corrections Base de Données ✅

#### Fix UUID Génération
- **Fichier** : `lib/conversation-manager.js`
- **Commit** : `b39d6cc`
- **Problème résolu** : `invalid input syntax for type uuid: "session_1762214827411_9x7nbos93"`
- **Solution** : `generateSessionId()` utilise maintenant `crypto.randomUUID()` au lieu d'une string custom

#### Fix Foreign Key Constraint
- **Script SQL** : `supabase-fix-conversation-fkey.sql`
- **Commit** : `44934b5`
- **Problème résolu** : `violates foreign key constraint "conversation_history_user_id_fkey"`
- **Solution** : Changement de référence `users` table → `user_profiles` table

### 3. Amélioration Debug ✅
- **Fichier** : `api/chat.js`
- **Commit** : `f9e49f0`
- **Ajout** : Logging détaillé pour diagnostiquer les erreurs Emma Agent
- **Bénéfice** : Permet de voir la réponse complète d'Emma Agent en cas d'erreur

### 4. Documentation Complète ✅
- ✅ `SETUP_INSTRUCTIONS_TWILIO_SMS.md` - Guide complet de configuration Twilio + Supabase
- ✅ `DIAGNOSTIC_SMS_ERROR.md` - Guide de diagnostic des erreurs SMS
- ✅ `FIX_SMS_FOREIGN_KEY.md` - Guide pour corriger la contrainte foreign key

---

## 🧪 Tests et Validation

### Statut des Composants

| Composant | Status | Détails |
|-----------|--------|---------|
| ✅ Twilio Webhook | **Fonctionne** | Messages reçus et envoyés avec succès |
| ✅ SMS Adapter | **Fonctionne** | Parse et traite les webhooks Twilio |
| ✅ User Manager | **Fonctionne** | Utilisateurs créés dans `user_profiles` |
| ✅ Conversation Manager | **Fonctionne** | UUID fix appliqué avec succès |
| ✅ Foreign Key Constraint | **Fonctionne** | Après exécution du script SQL |
| 🔄 Emma Agent | **En investigation** | Clés API présentes, debug en cours |

### Logs de Test (Dernière Exécution)

```
[SMS Adapter] Webhook Twilio reçu
[SMS Adapter] SMS de +14183185826: "Test"
[Chat API] Requête reçue - Canal: sms, User: +14183185826
[User Manager] Utilisateur existant trouvé: cc583758-a6d2-43d3-83bc-76aa636900b3
[Chat API] User profile ID: cc583758-a6d2-43d3-83bc-76aa636900b3
[Conversation Manager] Conversation existante: 2d48abac-11b2-46cb-98df-cdfc38c7f80b
[Chat API] Conversation ID: 2d48abac-11b2-46cb-98df-cdfc38c7f80b
[Chat API] Historique: 0 messages
[Chat API] Appel emma-agent...
✅ Tout fonctionne jusqu'à Emma Agent
```

---

## 📋 Checklist

- [x] Webhook Twilio configuré sur gobapps.com
- [x] UUID fix appliqué et testé
- [x] Foreign key fix créé (script SQL)
- [x] Logging détaillé ajouté pour debug
- [x] Documentation complète créée
- [ ] Emma Agent debug en cours (logging détaillé ajouté pour diagnostic)

---

## 🚀 Instructions de Déploiement

### ⚠️ IMPORTANT : Prérequis Supabase

**Avant de merger cette PR**, exécuter ce script SQL dans Supabase SQL Editor :

**Fichier** : `/supabase-fix-conversation-fkey.sql`

**Étapes** :
1. Aller sur https://app.supabase.com
2. Sélectionner le projet GOB
3. Cliquer sur **SQL Editor**
4. Copier tout le contenu de `supabase-fix-conversation-fkey.sql`
5. Coller et **Run**

**Ce script fait** :
- Supprime l'ancienne contrainte `conversation_history_user_id_fkey` vers `users`
- Convertit `user_id` en UUID
- Crée une nouvelle contrainte vers `user_profiles`
- Recrée les vues `channel_statistics` et `recent_multichannel_activity`

### Variables d'Environnement Vercel

Vérifier que ces variables existent dans Vercel :

```
✅ TWILIO_ACCOUNT_SID
✅ TWILIO_AUTH_TOKEN
✅ TWILIO_PHONE_NUMBER
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
✅ GEMINI_API_KEY
✅ PERPLEXITY_API_KEY
```

---

## 🐛 Problème En Cours d'Investigation

### Emma Agent - Unsuccessful Response

**Symptôme** :
```
[Chat API] Erreur appel emma-agent: Emma agent returned unsuccessful response
```

**Status** :
- ✅ Toutes les clés API sont présentes dans Vercel
- ✅ Le logging détaillé a été ajouté dans ce commit
- 🔄 Prochain déploiement révélera l'erreur exacte

**Actions prises** :
- Ajout de `console.error` avec JSON complet de la réponse Emma Agent
- Le prochain test SMS affichera l'erreur spécifique dans les logs

**Prochaines étapes** :
1. Attendre le déploiement de cette PR
2. Envoyer un SMS test
3. Consulter les logs Vercel pour voir la réponse détaillée d'Emma
4. Corriger le problème spécifique identifié

---

## 📚 Fichiers Modifiés

### Code
- `lib/conversation-manager.js` - Fix UUID generation (crypto.randomUUID)
- `api/chat.js` - Ajout logging détaillé Emma Agent

### SQL
- `supabase-fix-conversation-fkey.sql` - Script de correction foreign key

### Documentation
- `SETUP_INSTRUCTIONS_TWILIO_SMS.md` - Guide setup complet
- `DIAGNOSTIC_SMS_ERROR.md` - Guide diagnostic erreurs
- `FIX_SMS_FOREIGN_KEY.md` - Guide correction SQL

---

## 🔗 Liens Utiles

- **Twilio Console** : https://console.twilio.com
- **Vercel Logs** : https://vercel.com/projetsjsls-projects/gob/logs
- **Supabase Dashboard** : https://app.supabase.com
- **Vercel Settings** : https://vercel.com/projetsjsls-projects/gob/settings

---

## 📊 Commits de cette PR

1. `8beee5c` - docs: Add Twilio SMS configuration and Supabase setup instructions
2. `b39d6cc` - fix: Generate proper UUID for session_id in conversation manager
3. `44934b5` - fix: Add SQL script to fix conversation_history foreign key constraint
4. `b1f31fc` - docs: Add guide to fix conversation_history foreign key constraint
5. `f9e49f0` - debug: Add detailed Emma Agent error logging to diagnose SMS issues

---

## ✅ Prêt pour Review

Cette PR corrige tous les problèmes de base de données identifiés et met en place l'infrastructure SMS complète. Le debug final d'Emma Agent sera facilité par le logging détaillé ajouté.

**Reviewers** : @projetsjsl

**Labels suggérés** : `enhancement`, `sms`, `twilio`, `bug-fix`, `documentation`
