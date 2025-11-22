# 📅 Guide n8n: Planification Dynamique basée sur emma-config

## Concept

Au lieu de créer un Cron node pour chaque heure d'envoi, vous configurez **UN SEUL workflow** qui s'exécute régulièrement (ex: toutes les 5 minutes) et qui interroge l'API pour savoir quels prompts doivent être envoyés **maintenant**.

## Avantages

✅ **Configuration centralisée** - Tout se gère depuis emma-config.html
✅ **Pas de redéploiement n8n** - Changez les heures sans toucher aux workflows
✅ **Multi-fuseaux horaires** - Chaque prompt peut avoir son propre timezone
✅ **Flexibilité totale** - Ajoutez/retirez des prompts sans modifier n8n
✅ **Maintenance simplifiée** - Un seul workflow pour tous les envois

## Architecture

```
┌─────────────────────────────────────┐
│ emma-config.html                    │
│ - Prompt: briefing_morning          │
│ - Heure: 09:00                      │
│ - Timezone: America/Montreal        │
│ - Jours: Lun-Ven                    │
│ - Destinataires: 3 personnes        │
└─────────────────┬───────────────────┘
                  │
                  ↓ Sauvegarde
┌─────────────────────────────────────┐
│ Supabase (emma_config)              │
│ - prompt_id: briefing_morning       │
│ - delivery_schedule: {...}          │
│ - email_recipients: [...]           │
└─────────────────┬───────────────────┘
                  │
                  ↓ API Query (toutes les 5 min)
┌─────────────────────────────────────┐
│ n8n Workflow (Schedule Node)        │
│ Cron: */5 * * * *                   │
│   ↓                                 │
│ GET /api/prompt-delivery-schedule   │
│   ↓                                 │
│ Retour: Prompts à envoyer MAINTENANT│
│   ↓                                 │
│ Loop sur chaque prompt              │
│   ↓                                 │
│ Générer briefing + Envoyer emails   │
└─────────────────────────────────────┘
```

## Workflow n8n Complet

### Vue d'ensemble

```
[Schedule Trigger]
    ↓
[GET Prompts à Envoyer]
    ↓
[IF: Des prompts trouvés ?]
    ↓ YES
[Split Into Items]
    ↓
[Loop: Pour chaque prompt]
    ↓
[Générer Briefing]
    ↓
[Loop: Pour chaque destinataire]
    ↓
[Envoyer Email]
```

### 1. Schedule Trigger

**Node Type:** Schedule Trigger
**Configuration:**
```json
{
  "rule": {
    "interval": [
      {
        "field": "cronExpression",
        "expression": "*/5 * * * *"
      }
    ]
  }
}
```

**Explication:** S'exécute toutes les 5 minutes

**💡 Alternative:** Si vous préférez vérifier seulement aux heures pleines:
```json
{
  "cronExpression": "0 * * * *"
}
```

### 2. GET Prompts à Envoyer

**Node Type:** HTTP Request
**Name:** "Get Prompts To Send Now"
**Configuration:**
```json
{
  "method": "GET",
  "url": "https://gob.vercel.app/api/prompt-delivery-schedule",
  "authentication": "None",
  "options": {
    "response": {
      "response": {
        "fullResponse": false,
        "responseFormat": "json"
      }
    }
  }
}
```

**Réponse attendue:**
```json
{
  "success": true,
  "prompts_to_send": [
    {
      "prompt_id": "briefing_morning",
      "section": "briefing",
      "key": "morning",
      "recipients": [
        {"email": "daniel@example.com", "name": "Daniel", "active": true}
      ],
      "schedule": {
        "frequency": "daily",
        "time": "09:00",
        "timezone": "America/Montreal",
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
      },
      "prompt_content": "Génère un briefing matinal..."
    }
  ],
  "count": 1,
  "checked_at": "2025-01-21T14:05:00Z"
}
```

### 3. IF: Des prompts trouvés ?

**Node Type:** IF
**Name:** "Any Prompts To Send?"
**Configuration:**
```json
{
  "conditions": {
    "number": [
      {
        "value1": "={{ $json.count }}",
        "operation": "larger",
        "value2": 0
      }
    ]
  }
}
```

### 4. Split Into Items

**Node Type:** Split In Batches (ou Code)
**Name:** "Split Prompts"
**Configuration (Code):**
```javascript
const prompts = $input.item.json.prompts_to_send;

return prompts.map(prompt => ({
  json: prompt
}));
```

### 5. Loop: Pour chaque prompt

**Node Type:** Loop Over Items
**Name:** "For Each Prompt"

### 6. Générer Briefing

**Node Type:** HTTP Request
**Name:** "Generate Briefing"
**Configuration:**
```json
{
  "method": "POST",
  "url": "https://gob.vercel.app/api/briefing",
  "authentication": "None",
  "sendBody": true,
  "bodyParameters": {
    "parameters": [
      {
        "name": "type",
        "value": "={{ $json.key }}"
      },
      {
        "name": "custom_prompt",
        "value": "={{ $json.prompt_content }}"
      }
    ]
  }
}
```

### 7. Loop: Pour chaque destinataire

**Node Type:** Code
**Name:** "Split Recipients"
**Configuration:**
```javascript
const recipients = $input.item.json.recipients;
const briefingData = $input.item.json; // Conserver les données du briefing

return recipients.map(recipient => ({
  json: {
    to: recipient.email,
    name: recipient.name,
    subject: briefingData.subject || `📊 Briefing Emma IA`,
    html_content: briefingData.html_content,
    prompt_id: briefingData.prompt_id
  }
}));
```

### 8. Envoyer Email

**Node Type:** Resend (ou Send Email)
**Name:** "Send Email via Resend"
**Configuration:**
```json
{
  "resource": "email",
  "operation": "send",
  "fromEmail": "emma@gobapps.com",
  "toEmail": "={{ $json.to }}",
  "subject": "={{ $json.subject }}",
  "html": "={{ $json.html_content }}",
  "additionalFields": {}
}
```

## Workflow Simplifié (Version Courte)

Si vous voulez un workflow plus simple sans les loops complexes :

```javascript
// Node: "Process All"
// Type: Code

const response = $input.item.json;

if (response.count === 0) {
  console.log('No prompts to send at this time');
  return [];
}

const results = [];

for (const prompt of response.prompts_to_send) {
  // Générer le briefing
  const briefingResponse = await fetch('https://gob.vercel.app/api/briefing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: prompt.key,
      custom_prompt: prompt.prompt_content
    })
  });

  const briefing = await briefingResponse.json();

  // Envoyer à chaque destinataire
  for (const recipient of prompt.recipients) {
    if (recipient.active) {
      results.push({
        json: {
          to: recipient.email,
          name: recipient.name,
          subject: briefing.subject,
          html: briefing.html_content,
          prompt_id: prompt.prompt_id,
          sent_at: new Date().toISOString()
        }
      });
    }
  }
}

return results;
```

Ensuite, connectez directement à un node "Send Email" qui envoie à `{{ $json.to }}`.

## Configuration dans emma-config.html

### Exemple 1: Briefing Morning (9h, Lun-Ven)

```
Prompt ID: briefing_morning
Section: briefing
Key: morning

Destinataires:
- daniel@gobapps.com (actif)
- equipe@gobapps.com (actif)

Planification:
- Fréquence: Quotidien
- Heure: 09:00
- Timezone: America/Montreal
- Jours: Lun, Mar, Mer, Jeu, Ven

Envoi activé: ✅
```

**Résultat:** Le workflow n8n récupérera ce prompt à 9h00-9h05 (GMT-5) du lundi au vendredi et enverra 2 emails.

### Exemple 2: Rapport Hebdo (Vendredi 17h)

```
Prompt ID: custom_weekly_report
Section: custom
Key: weekly_report

Destinataires:
- investors@gobapps.com (actif)

Planification:
- Fréquence: Hebdomadaire
- Heure: 17:00
- Timezone: America/New_York
- Jours: Vendredi

Envoi activé: ✅
```

**Résultat:** Le workflow n8n récupérera ce prompt uniquement le vendredi entre 17h00-17h05 (GMT-5) et enverra 1 email.

### Exemple 3: Flash Info (Midi, tous les jours)

```
Prompt ID: briefing_midday
Section: briefing
Key: midday

Destinataires:
- traders@gobapps.com (actif)
- direction@gobapps.com (actif)

Planification:
- Fréquence: Quotidien
- Heure: 12:00
- Timezone: America/Montreal
- Jours: Lun, Mar, Mer, Jeu, Ven, Sam, Dim

Envoi activé: ✅
```

**Résultat:** Envoi quotidien à midi, 7 jours/7.

## Testing

### Test 1: Vérifier l'heure actuelle

```bash
curl "https://gob.vercel.app/api/prompt-delivery-schedule"
```

**Retour attendu:**
- Si 9h05 un mardi: retourne `briefing_morning` (s'il est configuré)
- Si 14h30: retourne `[]` (rien à envoyer)

### Test 2: Simuler une heure spécifique

```bash
curl "https://gob.vercel.app/api/prompt-delivery-schedule?check_time=09:00"
```

**Retour:** Tous les prompts configurés pour 9h00

### Test 3: Forcer un fuseau horaire

```bash
curl "https://gob.vercel.app/api/prompt-delivery-schedule?timezone=Europe/Paris"
```

**Retour:** Prompts basés sur l'heure de Paris

## Gestion des Fuseaux Horaires

L'API gère automatiquement les fuseaux horaires de chaque prompt :

**Exemple:**
- Prompt A: `time: 09:00, timezone: America/Montreal` → Envoyé à 9h Montréal (14h UTC)
- Prompt B: `time: 09:00, timezone: Europe/Paris` → Envoyé à 9h Paris (8h UTC)

Les deux peuvent être configurés pour "9h00" mais seront envoyés à des moments différents.

## Fenêtre de Tolérance

L'API a une **tolérance de ±5 minutes** pour éviter de manquer un envoi.

**Exemple:**
- Configuré pour 9h00
- Workflow vérifie à 9h03
- ✅ L'envoi se fait quand même (dans la fenêtre 8h55-9h05)

## Fréquence du Schedule Trigger

### Recommandations:

| Fréquence Check | Précision | Performance | Usage |
|-----------------|-----------|-------------|-------|
| Toutes les 5 min | ±5 min | Excellente | Recommandé |
| Toutes les 10 min | ±10 min | Excellente | Acceptable |
| Toutes les heures | ±1h | Excellente | Non recommandé |
| Toutes les minutes | ±1 min | Moyenne | Overkill |

**Recommandation:** `*/5 * * * *` (toutes les 5 minutes)

## Monitoring & Logs

### Dans n8n

Activer les logs pour voir:
- Nombre de prompts récupérés
- Emails envoyés
- Erreurs éventuelles

### Vérifier l'API

```bash
# Voir le debug de la dernière vérification
curl "https://gob.vercel.app/api/prompt-delivery-schedule" | jq '.debug'
```

**Retour:**
```json
{
  "check_time": "current",
  "forced_timezone": null,
  "total_prompts_checked": 12
}
```

## Troubleshooting

### Problème: "Aucun prompt retourné à l'heure prévue"

**Causes possibles:**
1. L'heure configurée ne correspond pas au fuseau horaire
2. Le jour n'est pas coché (ex: samedi non sélectionné)
3. `delivery_enabled` est désactivé
4. Aucun destinataire actif
5. Fenêtre de ±5 minutes dépassée

**Solution:**
```bash
# Tester avec l'heure exacte
curl "https://gob.vercel.app/api/prompt-delivery-schedule?check_time=09:00"
```

### Problème: "Envois multiples du même prompt"

**Cause:** Le workflow n8n s'exécute plusieurs fois dans la fenêtre de 5 minutes

**Solution:** Ajouter un node de déduplication ou ajuster la fréquence du cron

### Problème: "Timezone incorrect"

**Vérification:**
```javascript
// Dans n8n Code node
const now = new Date();
const options = { timeZone: 'America/Montreal', hour: '2-digit', minute: '2-digit', hour12: false };
const time = new Intl.DateTimeFormat('en-US', options).format(now);
console.log('Current time in Montreal:', time);
```

## Cas d'Usage Avancés

### Cas 1: Désactiver temporairement un envoi

**Dans emma-config.html:**
- Décocher "Envoi activé"
- Sauvegarder

**Résultat:** Le prompt n'apparaît plus dans l'API, aucun envoi

### Cas 2: Changer l'heure d'envoi

**Avant:** 09:00
**Après:** 10:30

**Étapes:**
1. Ouvrir emma-config.html
2. Sélectionner le prompt
3. Changer l'heure à 10:30
4. Sauvegarder

**Résultat:** Dès le lendemain, envoi à 10h30 (aucun changement dans n8n)

### Cas 3: Ajouter/Retirer des destinataires

**Étapes:**
1. Ouvrir emma-config.html
2. Ajouter ou retirer des emails
3. Sauvegarder

**Résultat:** Le prochain envoi utilisera la nouvelle liste

## Avantages vs Cron Statique

| Aspect | Cron Statique n8n | API Dynamique |
|--------|-------------------|---------------|
| Configuration | Dans n8n (technique) | Dans emma-config (visuel) |
| Modification | Redéploiement workflow | Changement immédiat |
| Multi-timezone | Complexe | Automatique |
| Ajout de prompt | Nouveau workflow | Ajout dans l'interface |
| Maintenance | Difficile | Facile |
| Scalabilité | Limitée | Illimitée |

## Template JSON n8n Complet

Voici un workflow n8n prêt à importer :

```json
{
  "name": "Emma Dynamic Email Scheduler",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "*/5 * * * *"
            }
          ]
        }
      },
      "name": "Every 5 Minutes",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "https://gob.vercel.app/api/prompt-delivery-schedule",
        "options": {}
      },
      "name": "Get Prompts To Send",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [450, 300]
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{ $json.count }}",
              "operation": "larger",
              "value2": 0
            }
          ]
        }
      },
      "name": "Any Prompts?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "jsCode": "const prompts = $input.item.json.prompts_to_send;\nreturn prompts.map(p => ({json: p}));"
      },
      "name": "Split Prompts",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [850, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://gob.vercel.app/api/briefing",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "type",
              "value": "={{ $json.key }}"
            },
            {
              "name": "custom_prompt",
              "value": "={{ $json.prompt_content }}"
            }
          ]
        }
      },
      "name": "Generate Briefing",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [1050, 200]
    },
    {
      "parameters": {
        "jsCode": "const recipients = $input.item.json.recipients;\nconst briefing = $input.item.json;\nreturn recipients.map(r => ({\n  json: {\n    to: r.email,\n    name: r.name,\n    subject: briefing.subject,\n    html: briefing.html_content\n  }\n}));"
      },
      "name": "Split Recipients",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1250, 200]
    },
    {
      "parameters": {
        "fromEmail": "emma@gobapps.com",
        "toEmail": "={{ $json.to }}",
        "subject": "={{ $json.subject }}",
        "html": "={{ $json.html }}"
      },
      "name": "Send Email",
      "type": "n8n-nodes-base.resend",
      "typeVersion": 1,
      "position": [1450, 200],
      "credentials": {
        "resendApi": {
          "id": "1",
          "name": "Resend account"
        }
      }
    }
  ],
  "connections": {
    "Every 5 Minutes": {
      "main": [[{"node": "Get Prompts To Send", "type": "main", "index": 0}]]
    },
    "Get Prompts To Send": {
      "main": [[{"node": "Any Prompts?", "type": "main", "index": 0}]]
    },
    "Any Prompts?": {
      "main": [[{"node": "Split Prompts", "type": "main", "index": 0}]]
    },
    "Split Prompts": {
      "main": [[{"node": "Generate Briefing", "type": "main", "index": 0}]]
    },
    "Generate Briefing": {
      "main": [[{"node": "Split Recipients", "type": "main", "index": 0}]]
    },
    "Split Recipients": {
      "main": [[{"node": "Send Email", "type": "main", "index": 0}]]
    }
  }
}
```

**Installation:** Copier ce JSON et importer dans n8n via "Import from File"

---

**Version:** 1.0
**Date:** 2025-01-21
**Support:** docs/PROMPT_DELIVERY_N8N_GUIDE.md
