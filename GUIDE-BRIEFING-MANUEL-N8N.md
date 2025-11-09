# 🎯 Guide - Génération Manuelle des Briefings dans n8n

## ✅ Modifications Apportées

### 1. **Nœud "🎯 Manual Briefing Selector (MODIFIEZ ICI)"**
- **Ancien nom** : "Custom Prompt Input"
- **Nouvelle fonctionnalité** : Permet de sélectionner manuellement le type de briefing (matin/midi/soir)
- **Localisation** : Après "Manual Trigger (Custom Prompt)"

### 2. **Nœud "Determine Time-Based Prompt" Amélioré**
- **Priorité 1** : Prompt personnalisé (si `custom_prompt` est fourni)
- **Priorité 2** : Type de briefing sélectionné manuellement (`briefing_type` ou `prompt_type`)
- **Priorité 3** : Détermination automatique selon l'heure (pour Schedule Trigger)

### 3. **Prompts depuis GitHub**
- ✅ Tous les prompts sont récupérés depuis `/api/briefing-prompts`
- ✅ Les prompts proviennent de `config/briefing-prompts.json` sur GitHub
- ✅ Aucun prompt stocké dans n8n - toujours synchronisé avec GitHub

## 🚀 Comment Utiliser

### **Méthode 1 : Générer un Briefing Spécifique (Matin/Midi/Soir)**

1. **Ouvrir le nœud "🎯 Manual Briefing Selector (MODIFIEZ ICI)"**
   - Cliquez sur le nœud dans n8n
   - Vous verrez les champs suivants :

2. **Modifier les paramètres** :
   ```json
   briefing_type: "matin"      // Options: "matin", "midi", "soir" (ou "morning", "midday", "evening")
   custom_prompt: ""           // Laisser vide pour utiliser le prompt depuis GitHub
   preview_mode: true          // true = prévisualisation, false = envoi direct
   approved: false             // false = prévisualisation, true = approuvé pour envoi
   ```
   **Note** : `prompt_type` est généré automatiquement à partir de `briefing_type` (plus besoin de le définir manuellement)

3. **Choisir le type de briefing** :
   - **Matin** : `briefing_type: "matin"` (ou `"morning"`)
   - **Midi** : `briefing_type: "midi"` (ou `"midday"`)
   - **Soir** : `briefing_type: "soir"` (ou `"evening"`)

4. **Exécuter le workflow** :
   - Cliquez sur "Execute Workflow" depuis "Manual Trigger (Custom Prompt)"
   - Le workflow va :
     1. Récupérer les prompts depuis GitHub via `/api/briefing-prompts`
     2. Sélectionner le prompt correspondant au type choisi
     3. Générer le briefing avec Emma
     4. Afficher la prévisualisation (si `preview_mode: true`)

5. **Approuver et envoyer** (si satisfait) :
   - Modifiez le nœud "🎯 Manual Briefing Selector"
   - Changez `preview_mode: false` et `approved: true`
   - Réexécutez le workflow

### **Méthode 2 : Utiliser un Prompt Personnalisé**

1. **Ouvrir le nœud "🎯 Manual Briefing Selector"**

2. **Remplir le prompt personnalisé** :
   ```json
   briefing_type: "morning"    // Peut être n'importe quelle valeur
   custom_prompt: "Votre prompt personnalisé ici..."
   preview_mode: true
   approved: false
   ```
   **Note** : `prompt_type` sera automatiquement défini à `"custom"` quand `custom_prompt` est fourni

3. **Exécuter le workflow**

### **Méthode 3 : Briefings Automatisés (Schedule Trigger)**

Les briefings automatisés continuent de fonctionner normalement :
- **7h20 Montréal** → Briefing Matin
- **11h50 Montréal** → Briefing Midi
- **16h20 Montréal** → Briefing Soir

Les prompts sont automatiquement récupérés depuis GitHub à chaque exécution.

## 📋 Exemples de Configuration

### **Exemple 1 : Tester le Briefing Matin**
```json
{
  "briefing_type": "matin",
  "prompt_type": "matin",
  "custom_prompt": "",
  "preview_mode": true,
  "approved": false
}
```

### **Exemple 2 : Tester le Briefing Midi**
```json
{
  "briefing_type": "midi",
  "prompt_type": "midi",
  "custom_prompt": "",
  "preview_mode": true,
  "approved": false
}
```

### **Exemple 3 : Tester le Briefing Soir**
```json
{
  "briefing_type": "soir",
  "prompt_type": "soir",
  "custom_prompt": "",
  "preview_mode": true,
  "approved": false
}
```

### **Exemple 4 : Envoyer Directement (Sans Prévisualisation)**
```json
{
  "briefing_type": "matin",
  "prompt_type": "matin",
  "custom_prompt": "",
  "preview_mode": false,
  "approved": true
}
```

> **Note** : Vous pouvez aussi utiliser les mots anglais (`"morning"`, `"midday"`, `"evening"`) - les deux formats sont acceptés et convertis automatiquement.

## 🔄 Flux de Données

```
Manual Trigger
    ↓
🎯 Manual Briefing Selector (MODIFIEZ ICI)
    ↓
Merge Triggers
    ↓
Fetch Prompts from API (GitHub)
    ↓
Get Active Tickers
    ↓
Determine Time-Based Prompt
    ├─→ Si custom_prompt → Utilise le prompt personnalisé
    ├─→ Si briefing_type → Utilise le prompt depuis GitHub
    └─→ Sinon → Détermine selon l'heure (Schedule Trigger)
    ↓
⚙️ AI Model Selector
    ↓
Switch (Emma / Gemini)
    ↓
Generate Briefing
    ↓
Preview / Send
```

## ✅ Avantages

1. **Synchronisation avec GitHub** : Les prompts sont toujours à jour depuis `config/briefing-prompts.json`
2. **Test Facile** : Testez chaque briefing individuellement sans attendre le schedule
3. **Flexibilité** : Utilisez les prompts GitHub ou créez vos propres prompts
4. **Sécurité** : Mode prévisualisation par défaut pour éviter les envois accidentels

## ⚠️ Notes Importantes

1. **Les prompts viennent de GitHub** : Modifiez les prompts dans `config/briefing-prompts.json` sur GitHub, pas dans n8n
2. **Mode Prévisualisation** : Par défaut, `preview_mode: true` pour éviter les envois accidentels
3. **Approbation Requise** : Pour envoyer, vous devez mettre `approved: true` ET `preview_mode: false`
4. **Types Valides** : Utilisez `"matin"`, `"midi"`, ou `"soir"` (ou `"morning"`, `"midday"`, `"evening"`) pour `briefing_type` - les deux formats sont acceptés

## 🐛 Dépannage

### **Erreur : "Les prompts depuis GitHub ne sont pas disponibles"**
- Vérifiez que le nœud "Fetch Prompts from API" est bien connecté
- Vérifiez l'URL de l'API : `https://gob-projetsjsls-projects.vercel.app/api/briefing-prompts`
- Vérifiez que le fichier `config/briefing-prompts.json` existe sur GitHub

### **Le mauvais prompt est utilisé**
- Vérifiez que `briefing_type` correspond au type souhaité (matin/midi/soir ou morning/midday/evening)
- Vérifiez que `custom_prompt` est vide si vous voulez utiliser le prompt depuis GitHub
- Vérifiez les logs dans n8n pour voir quel prompt a été sélectionné
- Les mots français sont automatiquement convertis en anglais pour l'API

### **Le briefing ne s'envoie pas**
- Vérifiez que `preview_mode: false` ET `approved: true`
- Vérifiez que le nœud "Should Send Email?" route vers "Generate HTML Newsletter"
- Consultez les logs pour voir les valeurs de `preview_mode` et `approved`

