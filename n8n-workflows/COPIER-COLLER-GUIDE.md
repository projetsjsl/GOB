# 📋 Guide: Ajouter les Nodes Emma dans un Workflow Existant

## Méthode 1: Copier-Coller JSON (Recommandé)

### Étape 1: Copier le JSON des Nodes

1. **Ouvrir le fichier:**
   - Ouvrir `emma-scheduler-nodes-only.json`

2. **Copier tout le contenu:**
   - Sélectionner tout (Ctrl+A ou Cmd+A)
   - Copier (Ctrl+C ou Cmd+C)

### Étape 2: Coller dans n8n

1. **Ouvrir votre workflow existant dans n8n**

2. **Cliquer dans la zone de canvas** (zone de travail)
   - Cliquer n'importe où sur l'espace vide
   - PAS sur un node existant

3. **Coller:**
   - Appuyer sur **Ctrl+V** (Windows/Linux) ou **Cmd+V** (Mac)
   - OU clic droit → "Paste"

4. **Résultat:**
   - Les 4 nouveaux nodes apparaissent sur votre canvas
   - Ils sont positionnés en bas (position Y: 500)
   - Vos nodes existants restent intacts
   - Les nouveaux nodes ne sont PAS connectés à vos nodes existants

### Étape 3: Positionner les Nodes

1. **Sélectionner les 4 nouveaux nodes:**
   - Cliquer + glisser pour créer une zone de sélection
   - OU Shift+clic sur chaque node

2. **Déplacer:**
   - Glisser les nodes où vous voulez
   - Les placer à côté de vos nodes existants

3. **Ajuster:**
   - Espacer les nodes si besoin
   - Les aligner verticalement ou horizontalement

### Étape 4: Configurer Resend

1. **Cliquer sur le node "Emma Send Email"**

2. **Configurer les credentials:**
   - Dans "Credential to connect with"
   - Sélectionner votre credential Resend existant
   - OU créer un nouveau si vous n'en avez pas

3. **Sauvegarder**

### Étape 5: (Optionnel) Connecter à vos Nodes

**Si vous voulez connecter ces nouveaux nodes à vos nodes existants:**

1. **Supprimer le trigger Schedule:**
   - Si vous voulez déclencher depuis un de vos nodes existants
   - Supprimer le node "Emma Schedule (Every 5 Min)"

2. **Connecter:**
   - Glisser une connexion depuis un de vos nodes existants
   - Vers le node "Get Emma Prompts To Send"

3. **OU Garder séparé:**
   - Laisser les nouveaux nodes indépendants
   - Ils fonctionnent en parallèle de vos nodes existants

## Méthode 2: Import Partiel via Interface n8n

### Étape 1: Créer un Workflow Temporaire

1. **Dans n8n:**
   - Créer un nouveau workflow vide
   - Cliquer sur "Import from File"
   - Sélectionner `emma-dynamic-email-scheduler.json`

2. **Le workflow s'ouvre avec les 4 nodes**

### Étape 2: Copier les Nodes

1. **Sélectionner tous les nodes:**
   - Ctrl+A (ou Cmd+A sur Mac)
   - Les 4 nodes sont sélectionnés

2. **Copier:**
   - Ctrl+C (ou Cmd+C)

### Étape 3: Coller dans votre Workflow

1. **Ouvrir votre workflow existant**
   - Aller dans votre workflow actuel

2. **Coller:**
   - Ctrl+V (ou Cmd+V)
   - Les 4 nodes apparaissent

3. **Supprimer le workflow temporaire**
   - Retourner au workflow temporaire
   - Le supprimer (il ne sert plus)

## Méthode 3: Recréer Manuellement (Si Copier-Coller ne Fonctionne Pas)

### Node 1: Schedule Trigger

1. **Ajouter un node:**
   - Cliquer sur "+" sur le canvas
   - Chercher "Schedule Trigger"
   - Ajouter

2. **Configurer:**
   - Mode: "Cron"
   - Cron Expression: `*/5 * * * *`
   - Renommer: "Emma Schedule (Every 5 Min)"

### Node 2: HTTP Request

1. **Ajouter un node:**
   - Chercher "HTTP Request"
   - Ajouter

2. **Configurer:**
   - Method: GET
   - URL: `https://gob.vercel.app/api/prompt-delivery-schedule`
   - Renommer: "Get Emma Prompts To Send"

3. **Connecter:**
   - Connecter depuis "Emma Schedule" vers ce node

### Node 3: Code

1. **Ajouter un node:**
   - Chercher "Code"
   - Ajouter

2. **Configurer:**
   - Copier le code depuis `emma-scheduler-nodes-only.json`
   - Dans le champ "jsCode"
   - Coller tout le code JavaScript
   - Renommer: "Emma Process & Generate"

3. **Connecter:**
   - Connecter depuis "Get Emma Prompts" vers ce node

### Node 4: Resend (Send Email)

1. **Ajouter un node:**
   - Chercher "Resend"
   - Ajouter

2. **Configurer:**
   - From Email: `emma@gobapps.com`
   - To Email: `={{ $json.to }}`
   - Subject: `={{ $json.subject }}`
   - Email Type: HTML
   - Message: `={{ $json.html }}`
   - Credentials: Sélectionner votre Resend account
   - Renommer: "Emma Send Email"

3. **Connecter:**
   - Connecter depuis "Emma Process & Generate" vers ce node

## Vérification

### ✅ Checklist Finale

Après avoir ajouté les nodes, vérifier:

- [ ] Les 4 nouveaux nodes sont visibles sur le canvas
- [ ] Vos nodes existants sont toujours là et intacts
- [ ] Les nouveaux nodes ne sont PAS connectés à vos anciens (sauf si vous le voulez)
- [ ] Le node "Emma Send Email" a les credentials Resend configurées
- [ ] Les positions des nodes sont correctes
- [ ] Le workflow se sauvegarde sans erreur

### 🧪 Test

1. **Tester juste les nouveaux nodes:**
   - Cliquer sur "Emma Schedule (Every 5 Min)"
   - Cliquer sur "Execute Node"
   - Vérifier que ça fonctionne

2. **Vérifier que vos anciens nodes fonctionnent toujours:**
   - Exécuter votre workflow existant
   - Tout doit marcher comme avant

## Positions des Nodes

Les nodes sont positionnés à:
- **X:** 240, 460, 680, 900
- **Y:** 500 (tous alignés horizontalement)

**Si vos nodes existants sont déjà sur Y=500:**
- Changer la position des nouveaux nodes
- Par exemple, mettre Y=700 ou Y=300
- Les placer au-dessus ou en-dessous

## Nommage

Les nodes ont des noms préfixés par "Emma" pour éviter les conflits:
- `Emma Schedule (Every 5 Min)`
- `Get Emma Prompts To Send`
- `Emma Process & Generate`
- `Emma Send Email`

**Vous pouvez renommer:**
- Clic droit sur le node → "Rename"
- Changer le nom comme vous voulez

## Cas d'Usage

### Cas 1: Workflow avec Déjà un Schedule

**Si vous avez déjà un Schedule Trigger:**

1. Supprimer le node "Emma Schedule (Every 5 Min)"
2. Connecter votre Schedule existant → "Get Emma Prompts To Send"

### Cas 2: Déclencher par un Webhook

**Si vous voulez déclencher manuellement:**

1. Supprimer le node "Emma Schedule"
2. Ajouter un node "Webhook" à la place
3. Connecter Webhook → "Get Emma Prompts To Send"

### Cas 3: Ajouter à un Workflow de Notifications

**Si vous avez un workflow qui gère déjà des emails:**

1. Supprimer le node "Emma Send Email"
2. Connecter "Emma Process & Generate" → votre node d'email existant

## Troubleshooting

### Problème: "Les nodes ne s'affichent pas après Ctrl+V"

**Solution:**
1. Vérifier que vous avez bien cliqué sur le canvas (zone vide)
2. Vérifier que le JSON est valide
3. Essayer la Méthode 2 (Import puis copier)

### Problème: "Les nodes écrasent mes nodes existants"

**Cela ne devrait PAS arriver** si vous utilisez Ctrl+V sur le canvas.

**Si ça arrive:**
1. Annuler (Ctrl+Z)
2. Recommencer en cliquant bien sur une zone vide
3. OU utiliser la Méthode 3 (recréer manuellement)

### Problème: "Les connexions sont cassées"

**C'est normal !** Les nouveaux nodes ne sont pas connectés aux anciens.

**Pour connecter:**
1. Glisser depuis un point de sortie (rond à droite d'un node)
2. Vers un point d'entrée (rond à gauche d'un node)

### Problème: "Credential not found"

**Le node Resend a besoin de credentials.**

**Solution:**
1. Cliquer sur le node "Emma Send Email"
2. Configurer "Credential to connect with"
3. Sélectionner votre Resend account

## Code JavaScript Complet

Si vous recréez manuellement le node Code, voici le code complet:

```javascript
const response = $input.item.json;

if (response.count === 0) {
  console.log('No prompts to send at this time');
  return [];
}

const results = [];

for (const prompt of response.prompts_to_send) {
  try {
    // Générer briefing
    const briefing = await fetch('https://gob.vercel.app/api/briefing', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        type: prompt.key,
        custom_prompt: prompt.prompt_content
      })
    }).then(r => r.json());

    if (!briefing.success) {
      console.error(`Failed to generate briefing for ${prompt.prompt_id}:`, briefing.error);
      continue;
    }

    // Envoyer à chaque destinataire actif
    for (const recipient of prompt.recipients) {
      if (recipient.active) {
        results.push({
          json: {
            to: recipient.email,
            name: recipient.name,
            subject: briefing.subject || `📊 Briefing Emma IA - ${new Date().toLocaleDateString('fr-FR')}`,
            html: briefing.html_content,
            prompt_id: prompt.prompt_id,
            prompt_name: `${prompt.section}_${prompt.key}`,
            sent_at: new Date().toISOString()
          }
        });
      }
    }
  } catch (error) {
    console.error(`Error processing prompt ${prompt.prompt_id}:`, error.message);
  }
}

console.log(`Generated ${results.length} emails to send`);
return results;
```

## Résumé

**Pour ajouter sans perdre vos nodes:**
1. ✅ Copier le contenu de `emma-scheduler-nodes-only.json`
2. ✅ Ouvrir votre workflow dans n8n
3. ✅ Ctrl+V sur le canvas (zone vide)
4. ✅ Configurer Resend credentials
5. ✅ Positionner les nodes où vous voulez
6. ✅ Connecter (ou pas) à vos nodes existants

**Les nouveaux nodes restent complètement séparés et ne touchent pas à vos nodes existants !**

---

**Besoin d'aide ?**
- Vérifier `README.md` pour la doc complète
- Tester avec le workflow standalone d'abord: `emma-dynamic-email-scheduler.json`
