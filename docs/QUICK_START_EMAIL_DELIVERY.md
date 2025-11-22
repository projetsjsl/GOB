# 🚀 Démarrage Rapide: Gestion des Destinataires Email par Prompt

## Étape 1: Activer dans Supabase (À FAIRE UNE SEULE FOIS)

### 1.1 Ouvrir Supabase SQL Editor
1. Aller sur https://supabase.com
2. Sélectionner votre projet GOB
3. Cliquer sur "SQL Editor" dans le menu de gauche

### 1.2 Exécuter le Script de Migration
1. Copier tout le contenu de `supabase-prompt-delivery-config.sql`
2. Coller dans le SQL Editor
3. Cliquer sur "Run" (ou Ctrl+Enter)

✅ **Vérification:**
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'emma_config'
AND column_name IN ('prompt_id', 'email_recipients', 'delivery_enabled');
```

Vous devriez voir 3 colonnes retournées.

### 1.3 Initialiser les Prompts Existants
```sql
UPDATE emma_config
SET
    prompt_id = section || '_' || key,
    prompt_number = ROW_NUMBER() OVER (ORDER BY section, key)
WHERE prompt_id IS NULL;
```

## Étape 2: Configurer un Prompt (Interface Web)

### 2.1 Accéder à l'Interface
Ouvrir: https://gob.vercel.app/emma-config

### 2.2 Sélectionner un Prompt
- Cliquer sur n'importe quel prompt dans la liste (ex: "briefing morning")
- L'éditeur s'ouvre à droite

### 2.3 Ouvrir la Section Email
- Défiler vers le bas
- Cliquer sur "📧 Destinataires Email & Planification"
- La section s'ouvre

### 2.4 Ajouter des Destinataires
1. Cliquer sur "+ Ajouter"
2. Entrer l'email (ex: votre.email@example.com)
3. Entrer le nom (optionnel)
4. Cliquer "✓ Ajouter"
5. Répéter pour chaque destinataire

### 2.5 Configurer la Planification
1. **Fréquence**: Sélectionner "Quotidien"
2. **Heure**: 09:00 (ou votre heure préférée)
3. **Fuseau horaire**: America/Montreal
4. **Jours**: Cocher Lun, Mar, Mer, Jeu, Ven

### 2.6 Activer l'Envoi
Cocher la case "Envoi activé" en haut à droite

### 2.7 Sauvegarder
Cliquer sur "💾 Enregistrer la configuration d'envoi"

✅ Message de succès: "✅ Configuration d'envoi sauvegardée"

## Étape 3: Tester (Optionnel)

### Test Immédiat depuis l'Interface
Cliquer sur "📤 Test" → Un email de test est envoyé immédiatement à tous les destinataires actifs

### Test via API
```bash
curl https://gob.vercel.app/api/prompt-delivery-config?prompt_id=briefing_morning
```

**Réponse attendue:**
```json
{
  "success": true,
  "config": {
    "prompt_id": "briefing_morning",
    "email_recipients": [
      {
        "email": "votre.email@example.com",
        "name": "Votre Nom",
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
    }
  }
}
```

## Étape 4: Intégrer avec n8n (Automatisation)

### 4.1 Créer un Workflow n8n

**Template de base:**

```
┌─────────────┐
│ Cron        │  Déclencheur quotidien à 9h
│ 0 9 * * 1-5 │
└──────┬──────┘
       │
       v
┌──────────────────┐
│ HTTP Request     │  GET config du prompt
│ GET /api/prompt- │
│ delivery-config  │
└──────┬───────────┘
       │
       v
┌──────────────────┐
│ Code             │  Filtrer destinataires actifs
│ Filter active    │
└──────┬───────────┘
       │
       v
┌──────────────────┐
│ HTTP Request     │  Générer le briefing
│ POST /api/       │
│ briefing         │
└──────┬───────────┘
       │
       v
┌──────────────────┐
│ Send Email       │  Envoyer via Resend
│ (Resend)         │
└──────────────────┘
```

### 4.2 Configuration du Nœud "HTTP Request" (Get Config)

```json
{
  "method": "GET",
  "url": "https://gob.vercel.app/api/prompt-delivery-config?prompt_id=briefing_morning",
  "authentication": "None",
  "options": {}
}
```

### 4.3 Configuration du Nœud "Code" (Filter)

```javascript
const config = $input.item.json.config;
const activeRecipients = config.email_recipients.filter(r => r.active);

return activeRecipients.map(recipient => ({
  json: {
    to: recipient.email,
    name: recipient.name,
    prompt_content: config.prompt_content
  }
}));
```

### 4.4 Configuration du Nœud "HTTP Request" (Generate Briefing)

```json
{
  "method": "POST",
  "url": "https://gob.vercel.app/api/briefing",
  "authentication": "None",
  "body": {
    "type": "morning",
    "custom_prompt": "={{ $json.prompt_content }}"
  }
}
```

### 4.5 Configuration du Nœud "Send Email" (Resend)

```json
{
  "resource": "email",
  "operation": "send",
  "fromEmail": "emma@gobapps.com",
  "toEmail": "={{ $json.to }}",
  "subject": "📊 Briefing Emma IA - {{ $now.format('DD/MM/YYYY') }}",
  "html": "={{ $json.html_content }}"
}
```

### 4.6 Activer le Workflow
Cliquer sur le switch "Active" en haut à droite de n8n

## Étape 5: Vérification

### ✅ Checklist Complète

- [ ] Script SQL exécuté dans Supabase
- [ ] Colonnes `prompt_id`, `email_recipients`, `delivery_enabled` existent
- [ ] Prompt_id initialisés (ex: briefing_morning)
- [ ] Au moins 1 destinataire ajouté dans emma-config.html
- [ ] Case "Envoi activé" cochée
- [ ] Configuration sauvegardée (message ✅)
- [ ] Test API retourne la config correctement
- [ ] Workflow n8n créé et actif (si automatisation)

### 🎉 C'est Prêt !

Vous pouvez maintenant:
- Gérer les destinataires depuis emma-config.html
- Tester l'envoi immédiatement avec le bouton "📤 Test"
- Automatiser avec n8n en utilisant l'API
- Créer des prompts personnalisés avec leur propre liste de destinataires

## Cas d'Usage Rapides

### Cas 1: Briefing Morning pour l'Équipe
```
Prompt: briefing_morning
Destinataires: equipe@gobapps.com, direction@gobapps.com
Fréquence: Quotidien à 9h (Lun-Ven)
```

### Cas 2: Rapport Hebdo pour les Investisseurs
```
Prompt: custom_weekly_investors
Destinataires: investors@gobapps.com
Fréquence: Hebdomadaire (Vendredi 17h)
Prompt personnalisé: "Génère un rapport hebdomadaire complet..."
```

### Cas 3: Alertes Urgentes (Manuel)
```
Prompt: custom_alerts
Destinataires: ceo@gobapps.com
Fréquence: Manuel
Usage: Cliquer "Test" quand alerte nécessaire
```

## Support & Troubleshooting

### Problème: "Config not found"
**Solution:** Vérifier que le prompt_id existe dans Supabase:
```sql
SELECT prompt_id, section, key FROM emma_config;
```

### Problème: "No recipients"
**Solution:** Ajouter au moins 1 destinataire actif dans emma-config.html

### Problème: "Email not sent"
**Solution:**
1. Vérifier RESEND_API_KEY dans Vercel env
2. Vérifier que le domaine est vérifié dans Resend
3. Checker les logs Vercel: `vercel logs`

### Problème: "n8n can't fetch config"
**Solution:**
1. Vérifier l'URL: https://gob.vercel.app/api/prompt-delivery-config
2. Tester dans le navigateur directement
3. Vérifier que delivery_enabled = true

## Documentation Complète

Pour des exemples avancés et configurations n8n:
👉 Consulter `docs/PROMPT_DELIVERY_N8N_GUIDE.md`

---

**Date:** 2025-01-21
**Version:** 1.0
**Support:** claude.ai/code
