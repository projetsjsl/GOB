# 📧 CONFIGURATION EMAIL AUTOMATISATION - EMMA EN DIRECT

**Date** : 15 octobre 2025  
**Statut** : ✅ **SYSTÈME PRÊT POUR AUTOMATISATION**  
**Protection** : 🛡️ **GUARDRAILS ACTIVÉS**

---

## 🎯 **VOTRE ROUTINE EMAIL DU MATIN**

### **📅 HORAIRE PROGRAMMÉ :**
- **Briefing Matinal** : 8h00 EST (13h00 UTC) - Lundi à Vendredi
- **Briefing Midi** : 12h00 EST (17h00 UTC) - Lundi à Vendredi  
- **Briefing Clôture** : 16h30 EST (21h30 UTC) - Lundi à Vendredi

### **📧 EMAIL DE DESTINATION :**
Actuellement configuré pour : `your-email@example.com` (à personnaliser)

---

## 🔧 **CONFIGURATION REQUISE**

### **1. Variables d'environnement Vercel :**

**Ajouter dans Vercel → Settings → Environment Variables :**

```
RESEND_FROM_EMAIL = briefing@your-domain.com
RESEND_TO_EMAIL = votre-email@example.com
CRON_SECRET = votre-secret-securise
```

### **2. Configuration Supabase :**

**Dans votre projet Supabase "gob-watchlist" :**

1. **Exécuter le script SQL :**
   ```sql
   -- Remplacer 'your-email@example.com' par votre vraie adresse email
   -- Remplacer 'your-vercel-app.vercel.app' par 'gobapps.com'
   ```

2. **Modifier les adresses email dans le script :**
   - Ligne 121 : `'your-email@example.com'` → votre email
   - Ligne 132 : `'your-email@example.com'` → votre email  
   - Ligne 143 : `'your-email@example.com'` → votre email

---

## 🚀 **MÉTHODES D'AUTOMATISATION DISPONIBLES**

### **MÉTHODE 1 : Supabase Schedule (RECOMMANDÉE)**

**Avantages :**
- ✅ Automatisation native dans Supabase
- ✅ Pas de limite de requêtes
- ✅ Gestion des abonnés
- ✅ Logs détaillés

**Configuration :**
1. **Exécuter** `supabase-schedule-briefings.sql` dans Supabase
2. **Modifier** les adresses email dans le script
3. **Activer** l'extension `pg_cron` dans Supabase

### **MÉTHODE 2 : Vercel Cron (ALTERNATIVE)**

**Configuration :**
1. **Ajouter** dans `vercel.json` :
   ```json
   "crons": [
     {
       "path": "/api/briefing-cron?type=morning&secret=YOUR_SECRET",
       "schedule": "0 13 * * 1-5"
     }
   ]
   ```

### **MÉTHODE 3 : Service externe (n8n, Zapier, etc.)**

**Configuration :**
- **URL** : `https://gobapps.com/api/briefing-cron`
- **Méthode** : POST
- **Body** : `{"type": "morning", "secret": "YOUR_SECRET"}`

---

## 📋 **ÉTAPES DE CONFIGURATION COMPLÈTE**

### **Étape 1 : Configurer les variables d'environnement**

**Dans Vercel Dashboard :**
1. **Settings** → **Environment Variables**
2. **Ajouter** :
   ```
   RESEND_FROM_EMAIL = briefing@your-domain.com
   RESEND_TO_EMAIL = votre-email@example.com
   CRON_SECRET = votre-secret-securise-123
   ```
3. **Sélectionner** : ✅ Production, ✅ Preview, ✅ Development
4. **Save** et **Redéployer**

### **Étape 2 : Configurer Supabase (Méthode recommandée)**

**Dans votre projet Supabase :**
1. **SQL Editor** → **New Query**
2. **Copier** le contenu de `supabase-schedule-briefings.sql`
3. **Modifier** les adresses email (lignes 121, 132, 143)
4. **Exécuter** le script
5. **Vérifier** que les cron jobs sont créés

### **Étape 3 : Tester le système**

**Test manuel :**
```bash
# Test de génération de briefing
curl -X POST "https://gobapps.com/api/briefing-cron" \
  -H "Content-Type: application/json" \
  -d '{"type": "morning", "secret": "YOUR_SECRET"}'
```

**Test Supabase :**
```sql
SELECT test_briefing_system();
```

---

## 🔍 **VÉRIFICATION DU FONCTIONNEMENT**

### **1. Vérifier les variables d'environnement :**

```bash
# Test de l'API Briefing Cron
curl https://gobapps.com/api/briefing-cron
```

**Résultat attendu :**
```json
{
  "status": "healthy",
  "message": "Briefing Cron API opérationnel"
}
```

### **2. Vérifier la configuration email :**

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

### **3. Vérifier les cron jobs Supabase :**

```sql
SELECT * FROM get_active_cron_jobs();
```

**Résultat attendu :**
```
jobid | schedule    | command                    | jobname
------|-------------|----------------------------|------------------
1     | 0 13 * * 1-5| SELECT send_morning_briefing()| emma-morning-briefing
2     | 0 17 * * 1-5| SELECT send_noon_briefing()   | emma-noon-briefing  
3     | 30 21 * * 1-5| SELECT send_close_briefing() | emma-close-briefing
```

---

## 📊 **MONITORING ET LOGS**

### **Vérifier les briefings générés :**

```sql
SELECT * FROM briefings 
ORDER BY generated_at DESC 
LIMIT 10;
```

### **Vérifier les abonnés :**

```sql
SELECT * FROM briefing_subscribers;
```

### **Vérifier les logs d'envoi :**

```sql
SELECT * FROM briefings 
WHERE target_email = 'votre-email@example.com'
ORDER BY generated_at DESC;
```

---

## 🚨 **DÉPANNAGE**

### **Problèmes courants :**

**❌ Email non reçu :**
1. Vérifier `RESEND_TO_EMAIL` dans Vercel
2. Vérifier `RESEND_API_KEY` dans Vercel
3. Vérifier les logs Supabase
4. Vérifier le dossier spam

**❌ Briefing non généré :**
1. Vérifier les cron jobs : `SELECT * FROM get_active_cron_jobs();`
2. Vérifier les logs : `SELECT * FROM briefings ORDER BY generated_at DESC;`
3. Tester manuellement : `SELECT send_morning_briefing();`

**❌ Erreur de connexion :**
1. Vérifier que Supabase est connecté
2. Vérifier que l'API Briefing Cron répond
3. Vérifier les variables d'environnement

---

## 🎯 **RÉSUMÉ DE CONFIGURATION**

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

**Votre routine email du matin sera automatiquement générée et envoyée !** 📧✨

---

## 📞 **SUPPORT**

En cas de problème :
1. **Vérifier** les logs Supabase
2. **Tester** manuellement les endpoints
3. **Consulter** cette documentation
4. **Contacter** l'équipe de support

**Le système est prêt pour l'automatisation complète !** 🚀
