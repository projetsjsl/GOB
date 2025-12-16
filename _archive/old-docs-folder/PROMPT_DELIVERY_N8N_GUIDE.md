# Guide: Intégration n8n avec la Gestion des Destinataires Email par Prompt

## Vue d'ensemble

Chaque prompt Emma peut maintenant avoir sa propre liste de destinataires email et sa planification d'envoi personnalisée. Ces configurations sont stockées dans Supabase et accessibles via une API dédiée pour n8n.

## Architecture

```
emma-config.html → /api/prompt-delivery-config → Supabase (emma_config table)
                                                       ↓
                                                   n8n workflows
```

### Identifiants de Prompt

Chaque prompt possède:
- **prompt_id**: Identifiant unique au format `section_key` (ex: `briefing_morning`, `custom_weekly_report`)
- **prompt_number**: Numéro séquentiel unique (ex: 1, 2, 3...)

Ces identifiants sont générés automatiquement lors de la création du prompt.

## Configuration dans emma-config.html

### 1. Sélectionner un Prompt

1. Ouvrir `https://gob.vercel.app/emma-config`
2. Sélectionner un prompt dans la liste
3. Cliquer sur "📧 Destinataires Email & Planification"

### 2. Configurer les Destinataires

**Ajouter un destinataire:**
- Cliquer sur "+ Ajouter"
- Entrer l'email et le nom (optionnel)
- Cliquer sur "✓ Ajouter"

**Gérer les destinataires:**
- Cocher/décocher pour activer/désactiver
- Cliquer sur "🗑️ Retirer" pour supprimer
- Les destinataires inactifs restent dans la liste mais ne recevront pas d'emails

### 3. Planification

**Fréquence:**
- `manual`: Envoi manuel uniquement (via n8n ou bouton Test)
- `daily`: Quotidien
- `weekly`: Hebdomadaire
- `monthly`: Mensuel

**Paramètres:**
- **Heure**: Heure d'envoi (format 24h)
- **Fuseau horaire**: America/Montreal, America/New_York, Europe/Paris, etc.
- **Jours**: Sélectionner les jours (visible si daily ou weekly)

### 4. Activer l'Envoi

Cocher "Envoi activé" pour que le prompt soit visible dans n8n.

### 5. Sauvegarder

Cliquer sur "💾 Enregistrer la configuration d'envoi"

## API pour n8n

### Endpoint: `/api/prompt-delivery-config`

#### GET - Liste tous les prompts configurés

```http
GET /api/prompt-delivery-config
```

**Réponse:**
```json
{
  "success": true,
  "prompts": [
    {
      "prompt_id": "briefing_morning",
      "prompt_number": 1,
      "section": "briefing",
      "key": "morning",
      "email_recipients": [
        {
          "email": "daniel@example.com",
          "name": "Daniel",
          "active": true,
          "priority": 1
        }
      ],
      "delivery_enabled": true,
      "delivery_schedule": {
        "frequency": "daily",
        "time": "09:00",
        "timezone": "America/Montreal",
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
      },
      "metadata": "...",
      "updated_at": "2025-01-21T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### GET - Config d'un prompt spécifique

```http
GET /api/prompt-delivery-config?prompt_id=briefing_morning
```

**Réponse:**
```json
{
  "success": true,
  "config": {
    "prompt_id": "briefing_morning",
    "prompt_number": 1,
    "section": "briefing",
    "key": "morning",
    "email_recipients": [...],
    "delivery_schedule": {...},
    "prompt_content": "Génère un briefing matinal..."
  }
}
```

#### POST - Mettre à jour la config (utilisé par emma-config.html)

```http
POST /api/prompt-delivery-config
Content-Type: application/json

{
  "section": "briefing",
  "key": "morning",
  "email_recipients": [...],
  "delivery_enabled": true,
  "delivery_schedule": {...}
}
```

## Workflows n8n

### Exemple 1: Envoi Quotidien de Briefing Morning

```
[Cron: 9:00 daily] → [HTTP Request: GET prompt config] → [Filter: only active recipients]
                                                              ↓
[Send Email via Resend] ← [Generate Briefing via /api/briefing] ← [Split recipients]
```

**Configuration du nœud HTTP Request:**
```json
{
  "method": "GET",
  "url": "https://gob.vercel.app/api/prompt-delivery-config?prompt_id=briefing_morning"
}
```

**Configuration du nœud Filter (Code):**
```javascript
// Filtrer uniquement les destinataires actifs
const config = $input.item.json.config;
const activeRecipients = config.email_recipients.filter(r => r.active);

return activeRecipients.map(recipient => ({
  json: {
    to: recipient.email,
    name: recipient.name,
    prompt_id: config.prompt_id,
    prompt_content: config.prompt_content
  }
}));
```

**Configuration du nœud Briefing Generation:**
```json
{
  "method": "POST",
  "url": "https://gob.vercel.app/api/briefing",
  "body": {
    "type": "{{ $json.prompt_id.split('_')[1] }}",
    "custom_prompt": "{{ $json.prompt_content }}"
  }
}
```

**Configuration du nœud Send Email (Resend):**
```json
{
  "from": "emma@gobapps.com",
  "to": "{{ $json.to }}",
  "subject": "📊 Briefing Emma IA - {{ $now.format('DD/MM/YYYY') }}",
  "html": "{{ $json.html_content }}"
}
```

### Exemple 2: Liste Dynamique de Tous les Prompts Actifs

```
[Webhook Manual] → [GET all prompts] → [Filter enabled] → [Loop each prompt] → [Send to recipients]
```

**Configuration du nœud GET:**
```json
{
  "method": "GET",
  "url": "https://gob.vercel.app/api/prompt-delivery-config"
}
```

**Configuration du nœud Filter:**
```javascript
// Ne garder que les prompts avec delivery_enabled = true
const prompts = $input.item.json.prompts;
return prompts.filter(p => p.delivery_enabled).map(p => ({ json: p }));
```

### Exemple 3: Envoi par Fréquence (daily, weekly, monthly)

**Nœud Cron pour Daily:**
```json
{
  "cronExpression": "0 {{ config.delivery_schedule.time.split(':')[0] }} * * *",
  "timezone": "{{ config.delivery_schedule.timezone }}"
}
```

**Nœud Cron pour Weekly:**
```json
{
  "cronExpression": "0 9 * * MON-FRI",
  "timezone": "America/Montreal"
}
```

**Filtre des jours (Code):**
```javascript
const schedule = $input.item.json.config.delivery_schedule;
const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });

// Vérifier si aujourd'hui est dans les jours configurés
if (schedule.days.includes(today)) {
  return $input.item;
} else {
  return null; // Skip
}
```

## Fonction Supabase Helper

Le schema inclut une fonction SQL helper pour faciliter les requêtes:

```sql
SELECT * FROM get_prompt_delivery_config('briefing_morning');
```

Retourne directement la config du prompt avec:
- prompt_id
- prompt_number
- section
- key
- email_recipients
- delivery_schedule
- prompt_content

## Vue Supabase

La vue `prompt_delivery_configs` affiche tous les prompts configurés pour envoi:

```sql
SELECT * FROM prompt_delivery_configs;
```

Utilisable dans n8n via le nœud Supabase directement.

## Schéma de Données (Supabase)

### Table: `emma_config`

Colonnes ajoutées:
- `prompt_id` TEXT UNIQUE - Identifiant unique (section_key)
- `prompt_number` INTEGER - Numéro séquentiel
- `email_recipients` JSONB - Liste des destinataires
- `delivery_enabled` BOOLEAN - Envoi activé/désactivé
- `delivery_schedule` JSONB - Planification

### Structure `email_recipients`:

```json
[
  {
    "email": "daniel@example.com",
    "name": "Daniel",
    "active": true,
    "priority": 1
  }
]
```

### Structure `delivery_schedule`:

```json
{
  "frequency": "daily|weekly|monthly|manual",
  "time": "09:00",
  "timezone": "America/Montreal",
  "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
}
```

## Migration

Pour activer cette fonctionnalité sur un projet existant:

1. **Exécuter le script SQL dans Supabase:**
   ```bash
   # Copier le contenu de supabase-prompt-delivery-config.sql
   # Exécuter dans Supabase SQL Editor
   ```

2. **Vérifier que les colonnes sont créées:**
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'emma_config'
   AND column_name IN ('prompt_id', 'prompt_number', 'email_recipients', 'delivery_enabled', 'delivery_schedule');
   ```

3. **Mettre à jour les prompts existants:**
   ```sql
   UPDATE emma_config
   SET
       prompt_id = section || '_' || key,
       prompt_number = ROW_NUMBER() OVER (ORDER BY section, key)
   WHERE prompt_id IS NULL;
   ```

4. **Tester l'endpoint API:**
   ```bash
   curl https://gob.vercel.app/api/prompt-delivery-config
   ```

## Exemples d'Usage

### Cas 1: Briefing Morning pour 3 personnes

**Config dans emma-config.html:**
- Prompt: `briefing_morning`
- Destinataires:
  - daniel@example.com (actif)
  - sophie@example.com (actif)
  - marc@example.com (inactif)
- Fréquence: Daily
- Heure: 09:00
- Jours: Lun-Ven

**Workflow n8n:**
1. Cron à 9h du lundi au vendredi
2. GET config pour `briefing_morning`
3. Filtrer les actifs (daniel, sophie)
4. Générer le briefing via `/api/briefing`
5. Envoyer 2 emails (daniel + sophie)

### Cas 2: Rapport Hebdomadaire Personnalisé

**Config dans emma-config.html:**
- Créer un nouveau prompt: `custom_weekly_portfolio`
- Destinataires: investisseurs@example.com
- Fréquence: Weekly
- Heure: 17:00
- Jours: Vendredi
- Prompt: "Génère un rapport hebdomadaire complet sur le portefeuille..."

**Workflow n8n:**
1. Cron tous les vendredis à 17h
2. GET config pour `custom_weekly_portfolio`
3. Générer le rapport via `/api/briefing` avec custom_prompt
4. Envoyer à investisseurs@example.com

### Cas 3: Envoi Manuel (Testing)

**Via emma-config.html:**
1. Configurer le prompt
2. Cliquer sur "📤 Test"
3. Emma génère et envoie immédiatement aux destinataires actifs

**Via n8n:**
1. Webhook manuel déclenché
2. Sélectionner le prompt_id
3. Générer et envoyer

## Dépannage

### La config n'apparaît pas dans n8n

✅ Vérifier:
- `delivery_enabled` est coché dans emma-config.html
- La sauvegarde a réussi (message ✅)
- L'endpoint API retourne bien le prompt: `GET /api/prompt-delivery-config?prompt_id=XXX`

### Les emails ne sont pas envoyés

✅ Vérifier:
- Au moins un destinataire est actif (coché)
- La planification correspond au moment actuel
- Le workflow n8n est activé
- Les variables d'environnement Resend sont configurées

### Le prompt_id est null

✅ Exécuter:
```sql
UPDATE emma_config
SET prompt_id = section || '_' || key
WHERE prompt_id IS NULL;
```

## Support

Pour toute question ou problème:
1. Vérifier les logs Vercel: `vercel logs`
2. Vérifier les données Supabase: `SELECT * FROM emma_config WHERE section = 'XXX'`
3. Tester l'endpoint API directement
4. Consulter les logs n8n pour les workflows

---

**Version:** 1.0
**Date:** 2025-01-21
**Auteur:** Claude Code
