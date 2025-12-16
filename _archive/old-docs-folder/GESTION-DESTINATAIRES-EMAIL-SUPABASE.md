# 📧 Gestion des Destinataires Email (Supabase)

## Vue d'ensemble

L'interface de gestion des destinataires email utilise maintenant **Supabase** pour stocker une liste unique d'emails avec des colonnes de cases à cocher pour indiquer quels emails doivent recevoir chaque type de briefing.

## 🗄️ Structure Supabase

### Table `email_recipients`

```sql
CREATE TABLE email_recipients (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  label TEXT,
  morning BOOLEAN DEFAULT false,      -- Recevoir briefings du matin
  midday BOOLEAN DEFAULT false,       -- Recevoir briefings de midi
  evening BOOLEAN DEFAULT false,      -- Recevoir briefings du soir
  custom BOOLEAN DEFAULT false,       -- Recevoir briefings personnalisés
  is_preview BOOLEAN DEFAULT false,   -- Email pour previews (tests)
  active BOOLEAN DEFAULT true,        -- Email actif
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## 🚀 Installation

### 1. Créer la table dans Supabase

Exécutez le script SQL dans votre Supabase Dashboard :

```bash
# Fichier: supabase-email-recipients-setup.sql
```

**Étapes** :
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Copiez-collez le contenu de `supabase-email-recipients-setup.sql`
5. Cliquez sur **Run**

### 2. Vérifier la configuration

Assurez-vous que ces variables d'environnement sont configurées dans Vercel :
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 📋 Utilisation de l'Interface

### Accès

1. Ouvrez le dashboard : `https://gob-projetsjsls-projects.vercel.app`
2. Allez dans l'onglet **"Emma En Direct"**
3. Faites défiler jusqu'à **"📧 Gestion des Destinataires Email"**

### Interface

L'interface affiche un **tableau** avec :

| Email | Label | 🌅 Matin | ☀️ Midi | 🌙 Soir | 📝 Perso | 📬 Preview | Actions |
|-------|-------|----------|---------|---------|----------|------------|---------|
| user@example.com | Email principal | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | Activer/Supprimer |

### Fonctionnalités

#### 1. Ajouter un destinataire

1. Entrez l'email dans le champ "email@example.com"
2. (Optionnel) Entrez un label pour identifier l'email
3. Cliquez sur **"➕ Ajouter"**
4. Le destinataire apparaît dans le tableau avec toutes les cases décochées

#### 2. Cocher/Décocher les types

- **Cochez** les cases dans les colonnes (🌅 Matin, ☀️ Midi, 🌙 Soir, 📝 Perso) pour indiquer quels emails doivent recevoir chaque type de briefing
- Les modifications sont **sauvegardées automatiquement** dans Supabase

#### 3. Email de Preview

- Utilisez le **dropdown** en haut pour sélectionner l'email qui recevra les previews
- Seul un email peut être marqué comme preview à la fois
- L'email sélectionné est automatiquement coché dans la colonne "📬 Preview"

#### 4. Activer/Désactiver un email

- Cliquez sur **"Désactiver"** pour désactiver un email sans le supprimer
- Les emails désactivés apparaissent en gris (opacité réduite)
- Cliquez sur **"Activer"** pour réactiver

#### 5. Supprimer un destinataire

- Cliquez sur **"Supprimer"** à côté de l'email
- Confirmez la suppression
- L'email est définitivement supprimé de Supabase

### Statistiques

En bas du tableau, vous voyez le nombre de destinataires actifs pour chaque type :
- 🌅 Matin: X
- ☀️ Midi: X
- 🌙 Soir: X
- 📝 Perso: X

## 🔌 Intégration avec n8n

Le workflow n8n utilise automatiquement les destinataires depuis Supabase via l'API `/api/email-recipients`.

### Récupération des destinataires actifs

```javascript
// Dans n8n (Code node)
const briefingType = $json.briefing_type; // 'morning', 'midday', 'evening', 'custom'
const previewMode = $json.preview_mode;

let recipients = [];

if (previewMode === true) {
  // Mode preview : utiliser l'email de preview
  const previewResponse = await fetch('https://gob-projetsjsls-projects.vercel.app/api/email-recipients');
  const previewData = await previewResponse.json();
  recipients = [previewData.preview_email];
} else {
  // Mode envoi : utiliser les destinataires actifs du type
  const response = await fetch('https://gob-projetsjsls-projects.vercel.app/api/email-recipients');
  const data = await response.json();
  
  recipients = data.recipients
    .filter(r => r.active && r[briefingType])
    .map(r => r.email);
}

return { recipients };
```

## 📡 API Endpoints

### GET `/api/email-recipients`

Récupère tous les destinataires depuis Supabase.

**Réponse** :
```json
{
  "success": true,
  "recipients": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "label": "Email principal",
      "morning": true,
      "midday": true,
      "evening": true,
      "custom": false,
      "is_preview": true,
      "active": true
    }
  ],
  "preview_email": "user@example.com"
}
```

### POST `/api/email-recipients`

Ajoute un nouveau destinataire.

**Body** :
```json
{
  "email": "new@example.com",
  "label": "Nouvel email",
  "morning": false,
  "midday": false,
  "evening": false,
  "custom": false,
  "is_preview": false
}
```

### PUT `/api/email-recipients`

Met à jour un destinataire existant.

**Body** :
```json
{
  "id": "uuid",
  "morning": true,
  "midday": false,
  "evening": true,
  "custom": true,
  "is_preview": false,
  "active": true
}
```

### DELETE `/api/email-recipients?id=uuid`

Supprime un destinataire.

## 🔄 Migration depuis l'ancien système

Si vous aviez des emails dans `config/email-recipients.json`, vous pouvez les migrer :

1. L'API utilise un **fallback** vers `config/email-recipients.json` si Supabase n'est pas disponible
2. Pour migrer manuellement, ajoutez chaque email via l'interface
3. L'ancien fichier JSON reste comme backup

## ✅ Avantages de Supabase

- ✅ **Centralisé** : Une seule liste d'emails
- ✅ **Flexible** : Cases à cocher par type
- ✅ **Persistant** : Données stockées dans la base de données
- ✅ **Scalable** : Facile d'ajouter de nouveaux types
- ✅ **Interface claire** : Tableau avec toutes les informations visibles

## 🐛 Dépannage

### Les emails ne s'affichent pas

1. Vérifiez que la table `email_recipients` existe dans Supabase
2. Vérifiez que `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont configurés dans Vercel
3. Vérifiez les logs de l'API dans Vercel

### Les modifications ne se sauvegardent pas

1. Vérifiez la console du navigateur pour les erreurs
2. Vérifiez que Supabase est accessible
3. Vérifiez les permissions de la table (RLS si activé)

### Erreur "Cet email existe déjà"

- Chaque email doit être unique dans la table
- Si vous voulez réutiliser un email, supprimez d'abord l'ancien

