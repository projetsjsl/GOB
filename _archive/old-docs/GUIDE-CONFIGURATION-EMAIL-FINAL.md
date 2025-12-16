# 📧 GUIDE CONFIGURATION EMAIL FINAL - EMMA EN DIRECT

**Date** : 15 octobre 2025  
**Statut** : ✅ **SYSTÈME PRÊT POUR CONFIGURATION**  
**Protection** : 🛡️ **GUARDRAILS ACTIVÉS**

---

## 🎯 **VOTRE ROUTINE EMAIL AUTOMATIQUE**

### **📅 Horaires programmés :**
- **🌅 Briefing Matinal** : 8h00 EST (13h00 UTC) - Lundi à Vendredi
- **☀️ Briefing Midi** : 12h00 EST (17h00 UTC) - Lundi à Vendredi  
- **🌆 Briefing Clôture** : 16h30 EST (21h30 UTC) - Lundi à Vendredi

### **📧 Contenu des emails :**
- Données de marché en temps réel
- Actualités financières récentes
- Analyse technique et fondamentale
- Performance de votre watchlist
- Calendrier des résultats
- Événements économiques

---

## 🚀 **CONFIGURATION AUTOMATIQUE (RECOMMANDÉE)**

### **Étape 1 : Configuration automatique**

```bash
# Exécuter le script de configuration
./setup-email-automation.sh
```

**Ce script va :**
- ✅ Vérifier que le système est opérationnel
- ✅ Tester la connexion Supabase
- ✅ Demander votre adresse email
- ✅ Envoyer un email de test
- ✅ Générer le script SQL personnalisé
- ✅ Fournir les instructions Vercel

---

## 🔧 **CONFIGURATION MANUELLE**

### **Étape 1 : Variables d'environnement Vercel**

**Dans Vercel Dashboard :**
1. **Settings** → **Environment Variables**
2. **Ajouter ces variables :**

```
RESEND_FROM_EMAIL = briefing@your-domain.com
RESEND_TO_EMAIL = votre-email@example.com
CRON_SECRET = votre-secret-securise-123
```

3. **Sélectionner** : ✅ Production, ✅ Preview, ✅ Development
4. **Save** et **Redéployer**

### **Étape 2 : Configuration Supabase**

**Dans votre projet Supabase "gob-watchlist" :**

1. **SQL Editor** → **New Query**
2. **Copier** le contenu de `supabase-schedule-briefings.sql`
3. **Modifier** les adresses email :
   - Ligne 121 : `'your-email@example.com'` → votre email
   - Ligne 132 : `'your-email@example.com'` → votre email  
   - Ligne 143 : `'your-email@example.com'` → votre email
4. **Exécuter** le script
5. **Vérifier** que les cron jobs sont créés

### **Étape 3 : Test du système**

```bash
# Test complet du système email
./test-email-briefing.sh votre-email@example.com
```

---

## 📋 **VÉRIFICATION DU FONCTIONNEMENT**

### **1. Test des APIs principales :**

```bash
# Vérifier que Supabase est connecté
curl https://gobapps.com/api/supabase-watchlist | jq '.source'
# Doit retourner "supabase"

# Vérifier l'API Briefing Cron
curl https://gobapps.com/api/briefing-cron | jq '.status'
# Doit retourner "healthy"

# Vérifier l'API AI Services
curl https://gobapps.com/api/ai-services | jq '.status'
# Doit retourner "healthy"
```

### **2. Test d'envoi d'email :**

```bash
# Test d'envoi d'email
curl -X POST "https://gobapps.com/api/ai-services" \
  -H "Content-Type: application/json" \
  -d '{
    "service": "resend",
    "to": "votre-email@example.com",
    "subject": "Test Emma En Direct",
    "html": "<h1>Test réussi !</h1>"
  }'
```

### **3. Test de génération de briefing :**

```bash
# Test de génération de briefing
curl -X POST "https://gobapps.com/api/ai-services" \
  -H "Content-Type: application/json" \
  -d '{
    "service": "openai",
    "prompt": "Génère un briefing matinal Emma En Direct",
    "marketData": {"timestamp": "'$(date)'", "source": "test"},
    "news": "Actualités de test"
  }'
```

---

## 🔍 **MONITORING ET SURVEILLANCE**

### **Vérifier les briefings générés :**

```sql
-- Dans Supabase SQL Editor
SELECT * FROM briefings 
ORDER BY generated_at DESC 
LIMIT 10;
```

### **Vérifier les abonnés :**

```sql
-- Dans Supabase SQL Editor
SELECT * FROM briefing_subscribers;
```

### **Vérifier les cron jobs actifs :**

```sql
-- Dans Supabase SQL Editor
SELECT * FROM get_active_cron_jobs();
```

### **Test manuel d'un briefing :**

```sql
-- Dans Supabase SQL Editor
SELECT send_morning_briefing();
```

---

## 🚨 **DÉPANNAGE**

### **Problèmes courants :**

**❌ Email non reçu :**
1. Vérifier `RESEND_TO_EMAIL` dans Vercel
2. Vérifier `RESEND_API_KEY` dans Vercel
3. Vérifier le dossier spam
4. Tester avec `./test-email-briefing.sh`

**❌ Briefing non généré :**
1. Vérifier les cron jobs : `SELECT * FROM get_active_cron_jobs();`
2. Vérifier les logs : `SELECT * FROM briefings ORDER BY generated_at DESC;`
3. Tester manuellement : `SELECT send_morning_briefing();`

**❌ Erreur de connexion :**
1. Vérifier que Supabase est connecté
2. Vérifier que l'API Briefing Cron répond
3. Vérifier les variables d'environnement
4. Utiliser `./verify-guardrails.sh`

---

## 🛡️ **PROTECTION DU SYSTÈME**

### **Guardrails activés :**
- ✅ **Protection des fichiers critiques**
- ✅ **Script de vérification** (`verify-guardrails.sh`)
- ✅ **Documentation de protection**
- ✅ **Procédures de modification sécurisées**

### **Fichiers protégés :**
- `api/supabase-watchlist.js` - Connexion Supabase
- `api/ai-services.js` - Services IA unifiés
- `vercel.json` - Configuration serverless
- Variables d'environnement - Configuration critique

---

## 📊 **RÉSUMÉ DE CONFIGURATION**

### **Pour recevoir vos emails automatiquement :**

1. **✅ Variables Vercel configurées** :
   - `RESEND_FROM_EMAIL`
   - `RESEND_TO_EMAIL` (votre email)
   - `CRON_SECRET`

2. **✅ Supabase configuré** :
   - Script SQL exécuté
   - Adresses email modifiées
   - Cron jobs actifs

3. **✅ Test réussi** :
   - API Briefing Cron opérationnelle
   - Email de test envoyé
   - Cron jobs visibles dans Supabase

### **Horaires de réception :**
- **🌅 Matin** : 8h00 EST (Lundi-Vendredi)
- **☀️ Midi** : 12h00 EST (Lundi-Vendredi)
- **🌆 Clôture** : 16h30 EST (Lundi-Vendredi)

---

## 🎉 **RÉSULTAT FINAL**

**Votre routine email du matin sera :**
- ✅ **Automatiquement générée** à 8h00 EST
- ✅ **Envoyée à votre email** configuré
- ✅ **Riche en contenu** (marché, actualités, analyse)
- ✅ **Personnalisée** pour votre watchlist
- ✅ **Fiable** avec système de fallback
- ✅ **Protégée** par des guardrails

**Le système Emma En Direct est maintenant prêt pour l'automatisation complète !** 🚀

---

## 📞 **SUPPORT**

En cas de problème :
1. **Consulter** cette documentation
2. **Utiliser** les scripts de test
3. **Vérifier** les logs Supabase
4. **Contacter** l'équipe de support

**Votre routine email du matin sera active dès la configuration terminée !** 📧✨
