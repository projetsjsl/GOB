# Guide - Envoi Immédiat des Briefings Emma IA

## Vue d'Ensemble

Le bouton **"Envoyer Maintenant"** dans emma-config.html permet d'envoyer immédiatement un briefing **EN PRODUCTION** aux destinataires configurés, sans attendre la planification automatique de n8n.

---

## Comment Utiliser

### Étape 1: Ouvrir emma-config.html

1. Aller sur: `https://gob-projetsjsls-projects.vercel.app/emma-config.html`
2. Sélectionner un prompt dans la liste de gauche (ex: "briefing_evening", "briefing_morning", etc.)

### Étape 2: Configurer les Destinataires

1. Cliquer sur l'onglet **"📧 Configuration Email"**
2. Ajouter des destinataires avec le bouton **"+ Ajouter"**
   - Email (requis)
   - Nom (optionnel)
3. S'assurer que les destinataires sont **actifs** (toggle vert)
4. Cliquer sur **"💾 Enregistrer la configuration"** pour sauvegarder

### Étape 3: Envoyer Immédiatement

1. Une fois les destinataires configurés et sauvegardés
2. Cliquer sur le bouton **"📧 Envoyer Maintenant"** (vert, à droite)
3. Une popup de confirmation s'affiche:
   ```
   📧 ENVOI IMMÉDIAT EN PRODUCTION

   Le briefing sera généré et envoyé MAINTENANT à X destinataire(s):
     • Jean Dupont (jean@example.com)
     • Marie Martin (marie@example.com)

   Voulez-vous continuer?
   ```
4. Cliquer **OK** pour confirmer l'envoi

### Étape 4: Vérification

1. Un message de statut s'affiche en haut de la page:
   ```
   ✅ Briefing envoyé à 2/2 destinataire(s)
   📊 Envoyés: 2/2
   📧 Sujet: Emma En Direct - Soirée du 22/11/2025
   ```
2. Vérifier les boîtes email des destinataires
3. Les emails arrivent immédiatement (quelques secondes)

---

## Fonctionnement Technique

### Flux d'Envoi

```
1. Utilisateur clique "Envoyer Maintenant"
   ↓
2. Popup de confirmation avec liste des destinataires
   ↓
3. POST /api/send-briefing {
     prompt_id: "briefing_evening",
     recipients: [...],
     custom_prompt: "contenu du prompt"
   }
   ↓
4. API génère le briefing via /api/briefing
   ↓
5. API envoie l'email via Resend API
   ↓
6. Retour du résultat (succès/échecs)
```

### API Endpoint

**POST** `/api/send-briefing`

**Body:**
```json
{
  "prompt_id": "briefing_evening",
  "recipients": [
    {
      "email": "test@example.com",
      "name": "Test User",
      "active": true
    }
  ],
  "custom_prompt": "Generate evening market briefing" // Optionnel
}
```

**Réponse succès:**
```json
{
  "success": true,
  "message": "Briefing envoyé à 2/2 destinataire(s)",
  "sent_count": 2,
  "failed_count": 0,
  "total_recipients": 2,
  "results": [
    {
      "email": "test@example.com",
      "name": "Test User",
      "status": "sent",
      "resend_id": "re_xxxxx"
    }
  ],
  "briefing": {
    "type": "evening",
    "subject": "Emma En Direct - Soirée du 22/11/2025",
    "generated_at": "2025-11-22T03:00:00Z"
  }
}
```

**Réponse échec partiel:**
```json
{
  "success": true,
  "message": "Briefing envoyé à 1/2 destinataire(s)",
  "sent_count": 1,
  "failed_count": 1,
  "total_recipients": 2,
  "results": [...],
  "errors": [
    {
      "email": "invalid@example.com",
      "name": "Invalid",
      "status": "failed",
      "error": "Invalid email address"
    }
  ]
}
```

---

## Différences avec n8n

| Fonctionnalité | Bouton "Envoyer Maintenant" | n8n Workflow |
|----------------|----------------------------|--------------|
| **Déclenchement** | Manuel (clic bouton) | Automatique (toutes les 5 min) |
| **Timing** | Immédiat | Selon planification |
| **Destinataires** | Selon config actuelle (peut être différente de DB) | Selon config DB |
| **Prompt** | Contenu actuel dans éditeur | Contenu DB |
| **Production** | ✅ Oui (LIVE) | ✅ Oui (LIVE) |
| **Confirmation** | Popup avant envoi | Aucune (automatique) |

---

## Cas d'Usage

### 1. Test Initial d'un Nouveau Prompt

**Scénario:** Vous venez de créer un nouveau prompt "briefing_custom"

**Étapes:**
1. Créer le prompt dans emma-config
2. Ajouter votre email comme destinataire
3. Cliquer "Envoyer Maintenant"
4. Vérifier l'email reçu
5. Ajuster le prompt si nécessaire
6. Recommencer jusqu'à satisfaction

### 2. Envoi Ad-Hoc Urgent

**Scénario:** Il est 14h30, vous voulez envoyer un briefing de marché immédiatement

**Étapes:**
1. Ouvrir le prompt "briefing_midday"
2. Vérifier/modifier le contenu du prompt si nécessaire
3. S'assurer que les destinataires sont configurés
4. Cliquer "Envoyer Maintenant"
5. L'email part immédiatement

### 3. Test Avant Activation n8n

**Scénario:** Vous voulez tester le système complet avant d'activer n8n

**Étapes:**
1. Configurer tous les prompts (morning, midday, evening)
2. Ajouter vos destinataires de test
3. Pour chaque prompt, cliquer "Envoyer Maintenant"
4. Vérifier que les emails arrivent correctement
5. Une fois validé, activer le workflow n8n

### 4. Envoi à un Groupe Spécifique

**Scénario:** Vous voulez envoyer un briefing à un groupe différent des destinataires planifiés

**Étapes:**
1. Ouvrir le prompt
2. Temporairement désactiver les destinataires habituels (toggle rouge)
3. Ajouter les nouveaux destinataires temporaires
4. Cliquer "Envoyer Maintenant"
5. Après envoi, restaurer les destinataires habituels

---

## Sécurité et Validations

### Validations Avant Envoi

1. **Prompt sélectionné:** Vérifie qu'un prompt est actif
2. **Destinataires actifs:** Au moins 1 destinataire avec `active: true`
3. **Confirmation utilisateur:** Popup avec liste des destinataires
4. **Email valide:** Validation côté API (Resend)

### Gestion des Erreurs

**Si un email échoue:**
- Les autres emails continuent d'être envoyés
- Un rapport détaillé s'affiche à la fin
- Les erreurs sont loggées dans la console

**Erreurs possibles:**
- Email invalide (format incorrect)
- Domaine inexistant
- Boîte pleine
- Credentials Resend manquants/invalides

---

## Variables d'Environnement Requises

Pour que l'envoi fonctionne, vérifier dans Vercel:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx  # Requis pour envoi emails
GEMINI_API_KEY=xxxxxxxxxxxxx     # Requis pour génération briefing
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

---

## Monitoring et Logs

### Logs Frontend (Console Browser)

```javascript
// Succès
Envoi réussi: {
  success: true,
  sent_count: 2,
  ...
}

// Échec partiel
Échecs d'envoi: [
  { email: "...", error: "..." }
]
```

### Logs Backend (Vercel)

```bash
📧 Envoi immédiat du briefing: briefing_evening
✅ Briefing généré: Emma En Direct - Soirée du 22/11/2025
✅ Email envoyé à test@example.com (re_xxxxx)
```

---

## FAQ

### Q: Les emails sont-ils envoyés en test ou en production?
**R:** EN PRODUCTION. Les emails arrivent dans les vraies boîtes des destinataires.

### Q: Puis-je annuler après avoir cliqué "Envoyer Maintenant"?
**R:** Oui, dans la popup de confirmation. Une fois confirmé, l'envoi est immédiat et ne peut pas être annulé.

### Q: Combien de temps prend l'envoi?
**R:** Quelques secondes par destinataire. Pour 5 destinataires: environ 5-10 secondes.

### Q: Que se passe-t-il si j'envoie pendant qu'un envoi n8n est en cours?
**R:** Les deux systèmes sont indépendants. Les destinataires pourraient recevoir deux emails.

### Q: Puis-je envoyer à quelqu'un qui n'est pas dans la config sauvegardée?
**R:** Oui! Le bouton utilise la config ACTUELLE (avant sauvegarde). Vous pouvez:
   1. Ajouter temporairement un destinataire
   2. Cliquer "Envoyer Maintenant" (SANS sauvegarder)
   3. Le destinataire temporaire reçoit l'email
   4. Rafraîchir la page pour annuler les changements

### Q: Comment savoir si l'email est vraiment parti?
**R:** Trois façons:
   1. Message de succès dans l'interface
   2. Email reçu dans la boîte du destinataire
   3. Logs Resend (dashboard Resend)

---

## Cleanup - Supprimer le Prompt de Test

Si un prompt de test "briefing_evening" existe dans Supabase:

```sql
-- Exécuter dans Supabase SQL Editor
DELETE FROM emma_config
WHERE key = 'briefing_evening'
AND prompt_id = 'briefing_evening';
```

Ou utiliser le fichier: `docs/SUPPRIMER_PROMPT_TEST.sql`

---

## Support

En cas de problème:

1. **Vérifier la console browser** (F12) pour les erreurs JavaScript
2. **Vérifier Vercel logs** pour les erreurs backend
3. **Vérifier Resend dashboard** pour les statuts d'envoi
4. **Tester l'API directement:**
   ```bash
   curl -X POST https://gob-projetsjsls-projects.vercel.app/api/send-briefing \
     -H "Content-Type: application/json" \
     -d '{
       "prompt_id": "briefing_evening",
       "recipients": [{"email": "test@example.com", "name": "Test", "active": true}]
     }'
   ```

---

**Dernière mise à jour:** 22 novembre 2025
**Version:** 1.0.0
**Commit:** `1b59a1a`
