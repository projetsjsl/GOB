# 🔍 Diagnostic Complet - Emma Config (emma-config.html)

**Date**: 2025-11-22
**URL**: https://gobapps.com/emma-config.html
**Statut**: ⚠️ Erreurs multiples détectées

---

## 📊 Résumé Exécutif

Sur les 4 fonctionnalités principales de emma-config.html:
- ✅ **Prompts Management**: Fonctionne partiellement
- ❌ **Email Delivery & Scheduling**: Non fonctionnel (erreur 404)
- ✅ **Email Design**: Fonctionne
- ⚠️ **SMS Configuration**: Fonctionne (intégré dans Email Design)

---

## 🔴 PROBLÈME CRITIQUE #1: Prompt Delivery Config

### Erreur
```
GET /api/prompt-delivery-config?prompt_id=briefing_morning
→ 404: "Prompt not found or delivery not enabled"
```

### Cause Racine
La fonction RPC Supabase `get_prompt_delivery_config()` et la vue `prompt_delivery_configs` **n'ont jamais été créées** dans votre base de données Supabase.

### Impact
- ❌ Impossible de configurer les destinataires email pour les prompts
- ❌ Impossible de planifier les envois automatiques
- ❌ La section "📧 Destinataires Email & Planification" ne fonctionne pas
- ❌ Le bouton "Envoyer Maintenant" ne peut pas envoyer de briefings

### Solution
Exécuter le SQL corrigé dans Supabase SQL Editor:

**Fichier à exécuter**: `supabase-prompt-delivery-config-FIXED.sql`

**Étapes**:
1. Aller sur https://supabase.com
2. Sélectionner votre projet
3. Cliquer sur "SQL Editor" dans le menu gauche
4. Copier le contenu du fichier `supabase-prompt-delivery-config-FIXED.sql`
5. Coller et exécuter

**Ce que le SQL fait**:
- ✅ Ajoute les colonnes nécessaires à `emma_config`:
  - `prompt_id` (TEXT UNIQUE)
  - `prompt_number` (INTEGER)
  - `email_recipients` (JSONB)
  - `delivery_enabled` (BOOLEAN)
  - `delivery_schedule` (JSONB)
- ✅ Crée les index pour performance
- ✅ Crée la vue `prompt_delivery_configs`
- ✅ Crée la fonction RPC `get_prompt_delivery_config(p_prompt_id TEXT)`
- ✅ Accorde les permissions nécessaires

---

## 🟡 PROBLÈME #2: Incohérence de table (Admin Emma Config)

### Observation
`/api/admin/emma-config.js` utilise la table `emma_system_config` au lieu de `emma_config`.

### Code actuel
```javascript
const CONFIG_TABLE = 'emma_system_config';  // ❌ Incorrect
```

### Devrait être
```javascript
const CONFIG_TABLE = 'emma_config';  // ✅ Correct
```

### Impact
- ⚠️ Les données du frontend emma-config.html ne correspondent pas au backend
- ⚠️ Si la table `emma_system_config` n'existe pas, l'API retourne la config par défaut
- ⚠️ Les modifications ne sont pas persistées correctement

### Solution
Modifier `/api/admin/emma-config.js` ligne 17:
```javascript
const CONFIG_TABLE = 'emma_config';
```

---

## 🟢 FONCTIONNALITÉS QUI MARCHENT

### 1. Email Design API ✅
```bash
GET https://gobapps.com/api/email-design
→ 200 OK
```
Retourne la configuration complète du design (branding, colors, header, footer, sms).

### 2. Prompts List (partiel) ✅
```bash
GET https://gobapps.com/api/admin/emma-config
→ 200 OK
```
Retourne tous les prompts configurés (mais utilise mauvaise table).

### 3. Format Preview API (non testé mais code valide) ⚠️
```bash
POST https://gobapps.com/api/format-preview
Body: { text: "...", channel: "web|sms|email", briefingType: "morning" }
```
Cette API dépend de:
- `lib/channel-adapter.js` ✅ Existe
- `lib/design-config.js` ✅ Existe

---

## 📋 CHECKLIST DE CORRECTION

### Étape 1: Base de données Supabase ⭐ PRIORITÉ ABSOLUE
- [ ] Exécuter `supabase-prompt-delivery-config-FIXED.sql` dans Supabase SQL Editor
- [ ] Vérifier que la fonction existe:
  ```sql
  SELECT proname FROM pg_proc WHERE proname = 'get_prompt_delivery_config';
  ```
- [ ] Vérifier que la vue existe:
  ```sql
  SELECT * FROM prompt_delivery_configs LIMIT 5;
  ```

### Étape 2: Correction Backend
- [ ] Modifier `/api/admin/emma-config.js` ligne 17:
  ```javascript
  const CONFIG_TABLE = 'emma_config';  // au lieu de 'emma_system_config'
  ```

### Étape 3: Test End-to-End
- [ ] Tester GET `/api/prompt-delivery-config`
- [ ] Tester GET `/api/prompt-delivery-config?prompt_id=briefing_morning`
- [ ] Ouvrir https://gobapps.com/emma-config.html
- [ ] Sélectionner un prompt
- [ ] Ouvrir la section "📧 Destinataires Email & Planification"
- [ ] Ajouter un destinataire
- [ ] Configurer la planification
- [ ] Sauvegarder
- [ ] Vérifier que la config est bien enregistrée

### Étape 4: Configuration d'un prompt pour tests
Après avoir exécuté le SQL, ajouter un prompt test:
```sql
-- Dans Supabase SQL Editor
UPDATE emma_config
SET
    prompt_id = 'briefing_morning',
    prompt_number = 1,
    delivery_enabled = true,
    email_recipients = jsonb_build_array(
        jsonb_build_object(
            'email', 'votre-email@example.com',
            'name', 'Test User',
            'active', true,
            'priority', 1
        )
    ),
    delivery_schedule = jsonb_build_object(
        'frequency', 'daily',
        'time', '07:20',
        'timezone', 'America/Montreal',
        'days', jsonb_build_array('monday', 'tuesday', 'wednesday', 'thursday', 'friday')
    )
WHERE key = 'briefing_morning';
```

---

## 🎯 TESTS DE VALIDATION FINALE

### Test 1: API Prompt Delivery Config
```bash
# Liste tous les prompts actifs
curl https://gobapps.com/api/prompt-delivery-config

# Attendu: { success: true, prompts: [...], count: 1+ }
```

### Test 2: Récupérer config spécifique
```bash
curl https://gobapps.com/api/prompt-delivery-config?prompt_id=briefing_morning

# Attendu: { success: true, config: { ... } }
```

### Test 3: Interface Emma Config
1. Ouvrir https://gobapps.com/emma-config.html
2. Cliquer sur un prompt dans la liste
3. Cliquer sur "📧 Destinataires Email & Planification"
4. Vérifier que la section s'affiche sans erreur
5. Vérifier que les destinataires se chargent (si configurés)

---

## 📁 FICHIERS CONCERNÉS

### Backend (API)
- ✅ `/api/admin/emma-config.js` - Gestion configs (à corriger: ligne 17)
- ✅ `/api/email-design.js` - Design emails (fonctionne)
- ✅ `/api/format-preview.js` - Formatage preview (fonctionne)
- ✅ `/api/prompt-delivery-config.js` - Config delivery (fonctionne mais manque DB)

### Frontend
- ✅ `/public/emma-config.html` - Interface complète (code correct)

### Database
- ⭐ `supabase-prompt-delivery-config-FIXED.sql` - SQL à exécuter
- ❌ `supabase-prompt-delivery-config.sql` - Ancien (NE PAS UTILISER)

### Documentation
- ✅ `/docs/SETUP_PROMPT_DELIVERY.md` - Guide de setup

---

## 💡 RECOMMANDATIONS ADDITIONNELLES

### 1. Créer les prompts de briefing par défaut
Après avoir exécuté le SQL, créer les 3 briefings par défaut avec `delivery_enabled = true`:
- `briefing_morning` (prompt_number: 1)
- `briefing_midday` (prompt_number: 2)
- `briefing_evening` (prompt_number: 3)

### 2. Ajouter validation côté frontend
Dans `emma-config.html`, ajouter validation pour:
- Format email valide
- Au moins un destinataire actif avant envoi
- Heure de planification cohérente avec timezone

### 3. Logging et monitoring
Ajouter logs dans `/api/prompt-delivery-config.js` pour:
- Requêtes qui échouent
- Prompts introuvables
- Erreurs Supabase

---

## 📞 SUPPORT

Si vous rencontrez des erreurs après avoir appliqué les corrections:

### Erreur: "function get_prompt_delivery_config does not exist"
**Cause**: La fonction RPC n'a jamais été créée dans Supabase
**Solution**: Exécuter le SQL dans `supabase-prompt-delivery-config-FIXED.sql`

### Erreur: "column 'prompt_id' does not exist"
**Cause**: Les colonnes n'ont pas été ajoutées à `emma_config`
**Solution**: Exécuter le SQL dans `supabase-prompt-delivery-config-FIXED.sql`

### Erreur: "Prompt not found or delivery not enabled"
**Cause**: Aucun prompt n'a `delivery_enabled = true`
**Solution**: Exécuter l'UPDATE SQL ci-dessus (section "Configuration d'un prompt pour tests")

---

## ✅ STATUT FINAL (après corrections)

Une fois toutes les corrections appliquées:
- ✅ Base de données Supabase configurée
- ✅ Fonction RPC `get_prompt_delivery_config` créée
- ✅ Vue `prompt_delivery_configs` créée
- ✅ API endpoints fonctionnels
- ✅ Interface emma-config.html 100% opérationnelle

**TEMPS ESTIMÉ**: 10-15 minutes pour appliquer toutes les corrections
