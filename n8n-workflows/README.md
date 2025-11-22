# 📦 Workflows n8n pour Emma IA

## Workflow: Emma Dynamic Email Scheduler

**Fichier:** `emma-dynamic-email-scheduler.json`

### Description

Workflow intelligent qui:
1. S'exécute toutes les 5 minutes
2. Interroge l'API pour savoir quels prompts envoyer maintenant
3. Génère automatiquement les briefings
4. Envoie les emails aux destinataires configurés dans emma-config.html

### Architecture

```
[Schedule Trigger]
  Toutes les 5 minutes
        ↓
[HTTP Request]
  GET /api/prompt-delivery-schedule
  Récupère les prompts à envoyer maintenant
        ↓
[Code Node]
  Pour chaque prompt:
    - Génère le briefing via /api/briefing
    - Prépare les emails pour chaque destinataire
        ↓
[Send Email]
  Envoie via Resend
```

### 📥 Installation

#### Étape 1: Importer le Workflow

1. **Ouvrir n8n:**
   - Accéder à votre instance n8n (cloud ou self-hosted)
   - Cliquer sur le menu hamburger (☰) en haut à gauche

2. **Importer:**
   - Cliquer sur "Import from File" ou "Import Workflow"
   - Sélectionner le fichier `emma-dynamic-email-scheduler.json`
   - Cliquer sur "Import"

3. **Vérifier:**
   - Le workflow apparaît avec 4 nodes connectés
   - Nom: "Emma Dynamic Email Scheduler"

#### Étape 2: Configurer Resend

1. **Créer les credentials Resend:**
   - Dans n8n, aller dans "Credentials" (menu gauche)
   - Cliquer sur "Add Credential"
   - Chercher "Resend"
   - Entrer votre `RESEND_API_KEY`
   - Nommer: "Resend account"
   - Sauvegarder

2. **Lier au workflow:**
   - Ouvrir le workflow
   - Cliquer sur le node "Send Email via Resend"
   - Dans "Credential to connect with", sélectionner "Resend account"
   - Cliquer sur "Save"

#### Étape 3: Tester le Workflow

1. **Test manuel:**
   - Cliquer sur le node "Every 5 Minutes"
   - Cliquer sur "Execute Node" (bouton ▶)
   - Le workflow s'exécute une fois

2. **Vérifier les résultats:**
   - Node "Get Prompts To Send Now": Vérifier la réponse JSON
   - Node "Process Prompts": Vérifier le nombre d'emails générés
   - Node "Send Email": Vérifier les envois

3. **Check des logs:**
   - Ouvrir la console du node "Process Prompts"
   - Vous devriez voir: `Generated X emails to send`

#### Étape 4: Activer le Workflow

1. **Activer:**
   - En haut à droite, cliquer sur le toggle "Active"
   - Le workflow devient actif (switch devient vert)

2. **Vérification:**
   - Le workflow s'exécutera automatiquement toutes les 5 minutes
   - Surveillez les "Executions" (menu gauche) pour voir les runs

### ⚙️ Configuration

#### Changer la Fréquence d'Exécution

**Par défaut:** Toutes les 5 minutes (`*/5 * * * *`)

**Autres options:**

| Fréquence | Cron Expression | Usage |
|-----------|-----------------|-------|
| Toutes les 10 minutes | `*/10 * * * *` | Moins de checks, tolérance ±10 min |
| Toutes les heures | `0 * * * *` | Minimal, vérifie seulement aux heures pleines |
| Toutes les minutes | `* * * * *` | Maximum précision (overkill) |

**Modification:**
1. Cliquer sur le node "Every 5 Minutes"
2. Modifier "Cron Expression"
3. Sauvegarder

#### Personnaliser l'Email

**Modifier le "From":**
```javascript
// Dans le node "Send Email via Resend"
"fromEmail": "votre-email@votredomaine.com"
```

**Modifier le sujet par défaut:**
```javascript
// Dans le node "Process Prompts", ligne subject:
subject: briefing.subject || `📊 Votre Briefing - ${new Date().toLocaleDateString('fr-FR')}`
```

#### Ajouter des Logs Personnalisés

```javascript
// Dans le node "Process Prompts", ajouter:
console.log('Prompt:', prompt.prompt_id);
console.log('Recipients:', prompt.recipients.length);
console.log('Timezone:', prompt.schedule.timezone);
```

### 🧪 Testing

#### Test 1: Vérifier l'API

**Dans n8n:**
1. Cliquer sur le node "Get Prompts To Send Now"
2. Cliquer sur "Execute Node"
3. Vérifier la réponse dans l'onglet "Output"

**Réponse attendue:**
```json
{
  "success": true,
  "prompts_to_send": [...],
  "count": 0 ou plus,
  "checked_at": "2025-01-21T14:30:00Z"
}
```

#### Test 2: Simuler une Heure Spécifique

**Modifier temporairement l'URL:**
```
https://gob.vercel.app/api/prompt-delivery-schedule?check_time=09:00
```

**Résultat:** Retourne tous les prompts configurés pour 9h00

#### Test 3: Vérifier la Génération de Briefing

**Dans le Code node, ajouter:**
```javascript
console.log('Briefing generated:', briefing);
```

**Vérifier:** Les briefings contiennent `html_content` et `subject`

### 📊 Monitoring

#### Voir les Exécutions

1. **Menu Executions:**
   - Cliquer sur "Executions" (menu gauche)
   - Voir la liste de toutes les runs

2. **Détails d'une exécution:**
   - Cliquer sur une exécution
   - Voir le flow complet avec les données à chaque étape

3. **Filtrer:**
   - Filtrer par "Success" ou "Error"
   - Voir le nombre d'emails envoyés

#### Alertes en Cas d'Erreur

**Ajouter un node "Error Trigger":**
1. Créer un nouveau workflow ou ajouter dans le même
2. Ajouter un node "Error Trigger"
3. Connecter à un node "Send Email" ou "Slack"
4. Recevoir une notification en cas d'erreur

### 🔧 Troubleshooting

#### Problème: "No prompts to send"

**Causes:**
- Aucun prompt configuré pour cette heure
- `delivery_enabled` désactivé
- Jour de la semaine non sélectionné
- Aucun destinataire actif

**Solution:**
```bash
# Vérifier l'API manuellement
curl https://gob.vercel.app/api/prompt-delivery-schedule
```

#### Problème: "Briefing generation failed"

**Causes:**
- API /api/briefing en erreur
- GEMINI_API_KEY manquante
- Prompt content vide

**Solution:**
1. Vérifier les logs Vercel: `vercel logs`
2. Tester l'API directement:
```bash
curl -X POST https://gob.vercel.app/api/briefing \
  -H "Content-Type: application/json" \
  -d '{"type":"morning"}'
```

#### Problème: "Email not sent"

**Causes:**
- Credentials Resend incorrectes
- `fromEmail` non vérifié dans Resend
- `toEmail` invalide

**Solution:**
1. Vérifier les credentials Resend dans n8n
2. Vérifier le domaine dans Resend dashboard
3. Tester avec un email connu

#### Problème: "Workflow doesn't run automatically"

**Causes:**
- Workflow non activé (switch "Active" désactivé)
- n8n instance arrêtée (si self-hosted)

**Solution:**
1. Activer le workflow (toggle en haut à droite)
2. Vérifier que n8n est running
3. Vérifier les executions (menu gauche)

### 💡 Optimisations

#### Réduire les Appels API

**Si vous avez peu de prompts:**
```javascript
// Changer la fréquence à toutes les 10 minutes
"cronExpression": "*/10 * * * *"
```

#### Ajouter un Cache

**Dans le Code node, avant le fetch:**
```javascript
// Cache pour éviter de générer 2x le même briefing
const cache = {};
const cacheKey = `${prompt.prompt_id}_${new Date().toDateString()}`;

if (cache[cacheKey]) {
  briefing = cache[cacheKey];
} else {
  briefing = await fetch(...);
  cache[cacheKey] = briefing;
}
```

#### Batch Sending

**Si vous avez beaucoup de destinataires:**

Au lieu d'envoyer 1 email à la fois, grouper par prompt:
```javascript
// Modifier le Code node pour utiliser BCC
results.push({
  json: {
    to: prompt.recipients.map(r => r.email).join(','),
    // OU utiliser BCC
    bcc: prompt.recipients.map(r => r.email).join(','),
    subject: briefing.subject,
    html: briefing.html_content
  }
});
```

### 📈 Statistiques

**Ajouter un node de logging:**

Après "Send Email", ajouter un node "Postgres" ou "Supabase":
```sql
INSERT INTO email_logs (prompt_id, recipient, sent_at, status)
VALUES ($1, $2, $3, $4)
```

**Permet de:**
- Tracer tous les envois
- Analyser les taux d'ouverture
- Debugger les problèmes

### 🔐 Sécurité

#### Bonnes Pratiques

1. **Ne jamais hardcoder les credentials:**
   - Utiliser le système de credentials n8n
   - Ne pas mettre d'API keys dans le code

2. **Valider les emails:**
   - Le Code node vérifie déjà `recipient.active`
   - Ajouter une validation regex si besoin

3. **Rate limiting:**
   - Resend a des limites d'envoi
   - Surveiller les quotas

### 🎯 Cas d'Usage

#### Cas 1: Briefing Morning (9h, Lun-Ven)

**Configuration emma-config:**
- Prompt: briefing_morning
- Heure: 09:00
- Jours: Lun-Ven
- Destinataires: 5 personnes

**Résultat:** 5 emails envoyés à 9h00-9h05 chaque jour de semaine

#### Cas 2: Multiple Prompts (Différentes Heures)

**Configuration emma-config:**
- briefing_morning → 09:00
- briefing_midday → 12:00
- briefing_evening → 18:00

**Résultat:** Le même workflow gère les 3 envois automatiquement

#### Cas 3: Multi-Timezone

**Configuration emma-config:**
- Prompt A → 09:00 America/Montreal
- Prompt B → 09:00 Europe/Paris

**Résultat:** Envois à 9h locale pour chaque timezone

### 📚 Ressources

- **Documentation complète:** `docs/N8N_DYNAMIC_SCHEDULE_GUIDE.md`
- **Guide démarrage:** `docs/QUICK_START_EMAIL_DELIVERY.md`
- **API Reference:** `docs/PROMPT_DELIVERY_N8N_GUIDE.md`

### 🆘 Support

**En cas de problème:**

1. Vérifier les logs n8n (Executions)
2. Tester l'API manuellement
3. Vérifier la config dans emma-config.html
4. Consulter les docs

### 📝 Changelog

**Version 1.0** (2025-01-21)
- Initial release
- 4 nodes: Schedule, HTTP, Code, Email
- Support multi-prompts
- Support multi-timezones
- Gestion automatique des destinataires actifs

---

**Auteur:** Claude Code
**Licence:** MIT
**Contact:** Support via GitHub Issues
