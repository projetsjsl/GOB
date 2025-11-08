# 📧 Guide de Gestion des Destinataires Email

## Vue d'ensemble

L'interface de gestion des destinataires email permet de configurer les adresses qui recevront les briefings automatisés selon le type (matin, midi, soir, personnalisé) et de définir une adresse spécifique pour les previews.

## Accès à l'interface

1. Ouvrez le dashboard : `https://gob.vercel.app` (ou votre URL Vercel)
2. Allez dans l'onglet **"Emma En Direct"**
3. Faites défiler jusqu'à la section **"📧 Gestion des Destinataires Email"**

## Fonctionnalités

### 1. Email pour Previews

**Localisation** : En haut de l'interface

**Fonction** : Définit l'adresse email qui recevra les emails de prévisualisation lors des tests manuels dans n8n.

**Utilisation** :
- Entrez l'adresse email dans le champ
- Cette adresse sera utilisée automatiquement lorsque `preview_mode=true` dans n8n

### 2. Gestion par Type de Briefing

**Types disponibles** :
- 🌅 **Matin** : Briefings du matin
- ☀️ **Midi** : Briefings de mi-journée
- 🌙 **Soir** : Briefings de clôture
- 📝 **Personnalisé** : Briefings avec prompts personnalisés

**Pour chaque type** :

#### Activer/Désactiver un type
- Utilisez la case à cocher **"Activer les envois pour ce type"**
- Si désactivé, aucun email ne sera envoyé pour ce type, même si des destinataires sont configurés

#### Ajouter une adresse email
1. Cliquez sur l'onglet du type souhaité (Matin, Midi, Soir, Personnalisé)
2. Dans la section "Ajouter une adresse", entrez :
   - **Email** : L'adresse email (requis)
   - **Label** : Un nom descriptif (optionnel, ex: "Email principal", "Équipe Finance")
3. Cliquez sur **"Ajouter"**

#### Activer/Désactiver une adresse
- Utilisez la case à cocher à côté de chaque adresse
- Les adresses désactivées ne recevront pas d'emails, mais restent dans la liste

#### Supprimer une adresse
- Cliquez sur le bouton **"Supprimer"** à côté de l'adresse

### 3. Sauvegarder les modifications

1. Après avoir effectué vos modifications, cliquez sur **"💾 Sauvegarder"**
2. Un message de confirmation apparaîtra
3. Les modifications sont immédiatement synchronisées avec `config/email-recipients.json`

### 4. Recharger la configuration

- Cliquez sur **"🔄 Recharger"** pour récupérer la dernière version depuis le serveur

## Structure de la Configuration

La configuration est stockée dans `config/email-recipients.json` :

```json
{
  "preview_email": {
    "address": "preview@example.com",
    "description": "Adresse email pour recevoir les previews"
  },
  "recipients": {
    "morning": {
      "enabled": true,
      "addresses": [
        {
          "email": "user1@example.com",
          "label": "Email principal",
          "enabled": true
        }
      ]
    },
    "midday": { ... },
    "evening": { ... },
    "custom": { ... }
  }
}
```

## Intégration avec n8n

Le workflow n8n utilise automatiquement cette configuration :

1. **Pour les previews** : Utilise `preview_email.address`
2. **Pour les envois automatiques** : Utilise les adresses actives du type correspondant :
   - Briefing matin → `recipients.morning.addresses` (où `enabled=true`)
   - Briefing midi → `recipients.midday.addresses` (où `enabled=true`)
   - Briefing soir → `recipients.evening.addresses` (où `enabled=true`)
   - Briefing personnalisé → `recipients.custom.addresses` (où `enabled=true`)

### Utilisation dans n8n

Le workflow n8n peut récupérer les destinataires via l'API :

```javascript
// Exemple dans un Code node n8n
const briefingType = $json.briefing_type; // 'morning', 'midday', 'evening', 'custom'
const previewMode = $json.preview_mode;

let recipients = [];

if (previewMode === true) {
  // Mode preview : utiliser l'email de preview
  const previewResponse = await fetch('https://gob-projetsjsls-projects.vercel.app/api/email-recipients');
  const previewData = await previewResponse.json();
  recipients = [previewData.config.preview_email.address];
} else {
  // Mode envoi : utiliser les destinataires du type
  const response = await fetch('https://gob-projetsjsls-projects.vercel.app/api/email-recipients');
  const data = await response.json();
  const typeConfig = data.config.recipients[briefingType];
  
  if (typeConfig && typeConfig.enabled) {
    recipients = typeConfig.addresses
      .filter(addr => addr.enabled)
      .map(addr => addr.email);
  }
}

return { recipients };
```

## API Endpoint

### GET `/api/email-recipients`

Récupère la configuration complète des destinataires.

**Réponse** :
```json
{
  "success": true,
  "config": {
    "preview_email": { ... },
    "recipients": { ... }
  }
}
```

### PUT `/api/email-recipients`

Met à jour la configuration des destinataires.

**Body** :
```json
{
  "preview_email": {
    "address": "new-preview@example.com"
  },
  "recipients": {
    "morning": {
      "enabled": true,
      "addresses": [...]
    },
    ...
  }
}
```

## Bonnes Pratiques

1. **Testez toujours en mode preview** avant d'envoyer à tous les destinataires
2. **Utilisez des labels descriptifs** pour identifier facilement chaque adresse
3. **Désactivez plutôt que supprimer** si vous voulez temporairement exclure une adresse
4. **Vérifiez régulièrement** que les adresses sont toujours valides**

## Dépannage

### Les emails ne sont pas envoyés

1. Vérifiez que le type de briefing est **activé** (case à cocher en haut)
2. Vérifiez que au moins une adresse est **activée** (case à cocher à côté de l'adresse)
3. Vérifiez les logs n8n pour voir quelles adresses sont utilisées

### Les previews ne fonctionnent pas

1. Vérifiez que `preview_email.address` est configuré
2. Vérifiez que `preview_mode=true` dans n8n
3. Vérifiez que le workflow n8n récupère bien l'email de preview depuis l'API

### Erreur "Failed to load email recipients configuration"

1. Vérifiez que `config/email-recipients.json` existe
2. Vérifiez que le fichier JSON est valide
3. Vérifiez les permissions du fichier

## Support

Pour toute question ou problème, consultez :
- Les logs n8n dans l'onglet "Executions"
- Les logs du serveur Vercel
- Le fichier `config/email-recipients.json` directement dans GitHub

