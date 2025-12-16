# Setup Guide - Prompt Delivery System

## Problème

Erreur 404 sur `/api/prompt-delivery-config?prompt_id=briefing_evening`

**Cause:** La fonction RPC `get_prompt_delivery_config` n'existe pas dans Supabase OU utilise des colonnes qui n'existent pas.

## Solution

### Étape 1: Exécuter le SQL Corrigé

1. **Ouvrir Supabase SQL Editor:**
   - Aller sur https://supabase.com
   - Sélectionner votre projet
   - Cliquer sur "SQL Editor" dans le menu gauche

2. **Copier le contenu du fichier:**
   ```
   supabase-prompt-delivery-config-FIXED.sql
   ```

3. **Coller dans SQL Editor et exécuter**

### Étape 2: Vérifier l'Installation

Exécuter ces commandes SQL pour vérifier:

```sql
-- 1. Vérifier que la fonction existe
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'get_prompt_delivery_config';

-- 2. Vérifier que la vue existe
SELECT * FROM prompt_delivery_configs LIMIT 5;

-- 3. Tester la fonction RPC
SELECT * FROM get_prompt_delivery_config('briefing_evening');
```

### Étape 3: Créer un Prompt de Test (Optionnel)

Si vous voulez tester immédiatement:

```sql
INSERT INTO emma_config (
    key,
    value,
    description,
    prompt_id,
    prompt_number,
    delivery_enabled,
    email_recipients,
    delivery_schedule
)
VALUES (
    'briefing_evening',
    jsonb_build_object('prompt', 'Test evening briefing'),
    'Test evening briefing',
    'briefing_evening',
    1,
    true,
    jsonb_build_array(
        jsonb_build_object(
            'email', 'votre-email@example.com',
            'name', 'Test User',
            'active', true,
            'priority', 1
        )
    ),
    jsonb_build_object(
        'frequency', 'daily',
        'time', '20:05',
        'timezone', 'America/Montreal',
        'days', jsonb_build_array('monday', 'tuesday', 'wednesday', 'thursday', 'friday')
    )
)
ON CONFLICT (key) DO UPDATE SET
    prompt_id = EXCLUDED.prompt_id,
    delivery_enabled = EXCLUDED.delivery_enabled,
    email_recipients = EXCLUDED.email_recipients,
    delivery_schedule = EXCLUDED.delivery_schedule;
```

### Étape 4: Tester l'API

Après avoir exécuté le SQL:

```bash
# Test 1: Liste tous les prompts actifs
curl https://gobapps.com/api/prompt-delivery-config

# Test 2: Récupérer un prompt spécifique
curl https://gobapps.com/api/prompt-delivery-config?prompt_id=briefing_evening
```

**Résultat attendu (Test 2):**
```json
{
  "success": true,
  "config": {
    "key": "briefing_evening",
    "prompt_id": "briefing_evening",
    "email_recipients": [...],
    "delivery_schedule": {...}
  }
}
```

## Différences entre Ancien et Nouveau SQL

### Ancien (BROKEN)
- Utilisait colonne `section` qui n'existe pas
- Vue: `SELECT section, key FROM emma_config`
- Fonction: `ec.section, ec.key`
- Update: `prompt_id = section || '_' || key`

### Nouveau (FIXED)
- Utilise seulement `key`
- Vue: `SELECT key FROM emma_config`
- Fonction: `ec.key`
- Update: `prompt_id = key`
- Recherche par `prompt_id` OU `key`

## Fichiers Concernés

- ✅ `supabase-prompt-delivery-config-FIXED.sql` - SQL corrigé à exécuter
- ❌ `supabase-prompt-delivery-config.sql` - Ancien SQL (NE PAS UTILISER)
- ✅ `api/prompt-delivery-config.js` - API endpoint (fonctionne avec nouveau SQL)

## Troubleshooting

### Erreur: "function get_prompt_delivery_config does not exist"

**Cause:** La fonction RPC n'a jamais été créée dans Supabase

**Solution:** Exécuter le SQL dans `supabase-prompt-delivery-config-FIXED.sql`

### Erreur: "column 'section' does not exist"

**Cause:** Vous avez exécuté l'ancien SQL avec `section`

**Solution:** Exécuter le SQL corrigé qui utilise seulement `key`

### API retourne 404 mais SQL fonctionne

**Cause:** Le prompt n'a pas `delivery_enabled = true`

**Solution:**
```sql
UPDATE emma_config
SET delivery_enabled = true
WHERE key = 'briefing_evening';
```

### API retourne 500

**Cause:** Erreur Supabase (permissions, connexion)

**Solution:** Vérifier les logs Vercel et les credentials Supabase

## Statut Final

Après avoir exécuté le SQL corrigé:
- ✅ Fonction RPC `get_prompt_delivery_config` créée
- ✅ Vue `prompt_delivery_configs` créée
- ✅ Colonnes ajoutées à `emma_config`
- ✅ Index créés pour performance
- ✅ Permissions accordées

**API ready to use!**
