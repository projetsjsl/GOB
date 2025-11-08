# 🚀 Guide - Trigger Manuel Amélioré avec AI Agent et Chat Trigger

## ✅ Nouveaux Nodes Ajoutés

### **1. AI Agent (Emma)**
- **Type** : HTTP Request Node
- **Fonction** : Node dédié pour appeler l'API Emma de manière claire et structurée
- **Position** : Entre "Prepare API Request" et "Parse API Response"
- **Avantage** : Séparation claire de la logique d'appel à Emma

### **2. Chat Trigger (Preview)**
- **Type** : Webhook Trigger
- **Fonction** : Permet de déclencher le workflow via une URL webhook pour prévisualisation
- **Path** : `/emma-newsletter/preview`
- **Avantage** : Facilite la visualisation avant confirmation

### **3. Generate HTML Preview**
- **Type** : Code Node
- **Fonction** : Génère une prévisualisation HTML interactive et complète de l'email
- **Avantage** : Visualisation exacte de l'email avant envoi

### **4. Serve Preview**
- **Type** : Respond to Webhook Node
- **Fonction** : Sert la prévisualisation HTML via le webhook
- **Avantage** : Permet d'accéder à la prévisualisation via URL

## 🎯 Utilisation

### **Méthode 1 : Manual Trigger Classique**

1. **Déclencher le workflow**
   - Cliquez sur **"Manual Trigger (Custom Prompt)"** dans n8n
   - Le workflow démarre avec les paramètres par défaut

2. **Modifier le prompt (optionnel)**
   - Ouvrez le nœud **"Custom Prompt Input"**
   - Modifiez le champ `custom_prompt` avec votre prompt personnalisé
   - Assurez-vous que :
     - `preview_mode` = `true`
     - `approved` = `false`

3. **Exécuter et prévisualiser**
   - Exécutez le workflow
   - Le contenu passe par **"AI Agent (Emma)"** pour génération
   - **"Generate HTML Preview"** crée une prévisualisation HTML
   - **"Preview Display"** affiche un résumé textuel
   - **"Preview Stop"** arrête l'exécution pour révision

4. **Approuver et envoyer**
   - Si satisfait, modifiez **"Custom Prompt Input"**
   - Changez `approved` de `false` à `true`
   - Réexécutez le workflow depuis **"Custom Prompt Input"**
   - L'email sera généré et envoyé

### **Méthode 2 : Chat Trigger (Webhook)**

1. **Obtenir l'URL du webhook**
   - Dans n8n, ouvrez le nœud **"Chat Trigger (Preview)"**
   - Copiez l'URL du webhook (ex: `https://votre-n8n.com/webhook/emma-newsletter/preview`)

2. **Envoyer une requête POST**
   ```json
   POST https://votre-n8n.com/webhook/emma-newsletter/preview
   Content-Type: application/json
   
   {
     "custom_prompt": "Votre prompt personnalisé ici",
     "prompt_type": "custom",
     "preview_mode": true,
     "approved": false
   }
   ```

3. **Recevoir la prévisualisation**
   - La réponse contiendra :
     - `preview_html` : HTML complet de la prévisualisation
     - `preview_url` : URL data pour visualiser directement
     - `subject` : Sujet de l'email
     - `metadata` : Métadonnées du briefing

4. **Visualiser la prévisualisation**
   - Ouvrez `preview_url` dans un navigateur
   - Vous verrez une page interactive avec :
     - Aperçu complet de l'email
     - Boutons "Approuver" et "Rejeter"
     - Métadonnées du briefing

5. **Approuver et envoyer**
   - Si satisfait, envoyez une nouvelle requête avec `approved: true`
   - Ou utilisez le Manual Trigger avec `approved: true`

## 📋 Structure du Flux

```
┌─────────────────────────────────────────────────────────┐
│  Manual Trigger (Custom Prompt)                         │
│  OU                                                      │
│  Chat Trigger (Preview)                                  │
└─────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Custom Prompt Input                                    │
│  - custom_prompt                                         │
│  - preview_mode (true/false)                            │
│  - approved (true/false)                                │
└─────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Fetch Prompts from API                                 │
└─────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Determine Time-Based Prompt                            │
└─────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Prepare API Request                                    │
└─────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  AI Agent (Emma) ⭐ NOUVEAU                              │
│  - Appel dédié à /api/chat                              │
│  - Structure claire                                      │
└─────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Parse API Response                                     │
└─────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Preview or Send? (Switch)                              │
└─────┬───────────────────────────────────────┬────────────┘
      │                                       │
      │ (preview_mode = true)                 │ (approved = true)
      ▼                                       ▼
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│  Generate HTML Newsletter       │  │  Generate HTML Newsletter       │
└─────────────────┬───────────────┘  └─────────────────┬───────────────┘
                  │                                     │
                  ▼                                     │
┌─────────────────────────────────────────────────────────┐
│  Generate HTML Preview ⭐ NOUVEAU                       │
│  - Génère prévisualisation HTML interactive             │
└─────┬───────────────────────────────────────┬───────────┘
      │                                       │
      │ (Chat Trigger)                        │ (Manual Trigger)
      ▼                                       ▼
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│  Serve Preview ⭐ NOUVEAU        │  │  Preview Display                │
│  - Retourne HTML via webhook    │  │  - Affiche résumé textuel       │
└─────────────────────────────────┘  └─────┬───────────────────────────┘
                                            │
                                            ▼
                                   ┌─────────────────────────────────┐
                                   │  Preview Stop                  │
                                   │  - Arrête pour révision        │
                                   └─────────────────────────────────┘
```

## 💡 Avantages

### **AI Agent (Emma)**
- ✅ Séparation claire de la logique d'appel à Emma
- ✅ Facilite le débogage et la maintenance
- ✅ Structure plus lisible du workflow

### **Chat Trigger (Preview)**
- ✅ Permet de déclencher depuis une application externe
- ✅ Facilite l'intégration avec d'autres systèmes
- ✅ Retourne directement la prévisualisation HTML

### **Generate HTML Preview**
- ✅ Visualisation exacte de l'email avant envoi
- ✅ Interface interactive avec boutons d'approbation
- ✅ Affiche toutes les métadonnées importantes

### **Serve Preview**
- ✅ Permet d'accéder à la prévisualisation via URL
- ✅ Facilite le partage et la révision
- ✅ Intégration facile avec d'autres outils

## 🔧 Configuration

### **Chat Trigger URL**
L'URL du webhook sera disponible dans n8n après activation :
```
https://votre-n8n.com/webhook/emma-newsletter/preview
```

### **Paramètres de la Requête POST**
```json
{
  "custom_prompt": "Votre prompt personnalisé",
  "prompt_type": "custom",
  "preview_mode": true,
  "approved": false,
  "tickers": ["GOOGL", "TSLA"]  // Optionnel
}
```

### **Réponse de la Requête**
```json
{
  "success": true,
  "preview_html": "<!DOCTYPE html>...",
  "preview_url": "data:text/html;charset=utf-8,...",
  "subject": "Newsletter Emma - Mise à jour du Personnalisée",
  "metadata": {
    "type": "custom",
    "model": "perplexity",
    "length": 1234
  }
}
```

## 🎨 Prévisualisation HTML

La prévisualisation HTML inclut :
- ✅ **Header** : Titre et description
- ✅ **Actions** : Boutons "Approuver" et "Rejeter"
- ✅ **Aperçu Email** : Iframe avec le rendu exact de l'email
- ✅ **Métadonnées** : Tableau avec toutes les informations importantes

## 📝 Notes

- Le **Chat Trigger** est optionnel - vous pouvez toujours utiliser le **Manual Trigger**
- La prévisualisation HTML est générée automatiquement après "Generate HTML Newsletter"
- Pour approuver, vous devez toujours modifier `approved` à `true` dans "Custom Prompt Input"
- Le **Chat Trigger** retourne la prévisualisation mais n'envoie pas l'email automatiquement

## 🔗 Prochaines Étapes

Pour une approbation encore plus fluide, vous pourriez :
1. Créer une interface web dédiée pour la prévisualisation
2. Ajouter un système de webhook pour l'approbation automatique
3. Intégrer avec un système de notifications

