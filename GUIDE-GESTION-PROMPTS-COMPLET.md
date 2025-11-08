# 📝 Guide Complet - Gestion des Prompts de Briefing

## ✅ Fonctionnalités Implémentées

### 1. **Interface de Gestion dans Emma En Direct** 📊
- **Localisation** : Onglet "Emma En Direct" → Section "Gestion des Prompts de Briefing"
- **Fonctionnalités** :
  - ✅ Voir les prompts actuels (morning, midday, evening)
  - ✅ Modifier les prompts directement dans l'interface
  - ✅ Éditer le nom, le ton, la longueur et le prompt complet
  - ✅ Sauvegarder les modifications via l'API
  - ✅ Recharger les prompts depuis GitHub

### 2. **API Endpoint `/api/briefing-prompts`** 🔌
- **GET** `/api/briefing-prompts` - Récupère tous les prompts
- **GET** `/api/briefing-prompts?type=morning|midday|evening` - Récupère un prompt spécifique
- **PUT/POST** `/api/briefing-prompts` - Modifie un prompt
- **Synchronisation** : Les modifications sont sauvegardées dans `config/briefing-prompts.json`

### 3. **Workflow n8n Amélioré** 🔄

#### **Pour les Briefings Automatisés** (Schedule Trigger)
- ✅ Récupère automatiquement les prompts depuis `/api/briefing-prompts`
- ✅ Utilise toujours la dernière version depuis GitHub
- ✅ Aucune modification nécessaire dans n8n

#### **Pour le Trigger Manuel** (Manual Trigger)
- ✅ **Nœud "Custom Prompt Input"** amélioré pour édition facile
  - Champ `custom_prompt` : Modifiez votre prompt personnalisé ici
  - Champ `preview_mode` : `true` pour prévisualiser, `false` pour envoyer directement
  - Champ `approved` : `false` par défaut, passez à `true` pour approuver l'envoi

- ✅ **Nœud "Preview or Send?"** (Switch)
  - Route vers "Preview Display" si `preview_mode = true` et `approved = false`
  - Route vers "Generate HTML Newsletter" si `approved = true` ou `preview_mode = false`

- ✅ **Nœud "Preview Display"**
  - Affiche un aperçu formaté du briefing
  - Montre les métadonnées (modèle, outils, temps d'exécution, longueur)
  - Affiche les 500 premiers caractères du contenu

- ✅ **Nœud "Preview Stop"**
  - Arrête l'exécution et affiche le message de prévisualisation
  - Instructions pour approuver et envoyer

## 🎯 Comment Utiliser

### **Modifier les Prompts depuis Emma En Direct**

1. Ouvrez l'onglet **"Emma En Direct"** dans le dashboard
2. Allez à la section **"Gestion des Prompts de Briefing"**
3. Sélectionnez l'onglet du type de briefing (🌅 Matin, ☀️ Midi, 🌙 Soir)
4. Modifiez les champs :
   - **Nom** : Nom du briefing
   - **Ton** : Style du briefing (ex: "énergique, professionnel")
   - **Longueur** : Longueur cible (ex: "200-300 mots")
   - **Prompt** : Le prompt complet
5. Cliquez sur **"💾 Sauvegarder"**
6. Les modifications sont synchronisées avec GitHub et n8n

### **Utiliser le Trigger Manuel dans n8n**

#### **Étape 1 : Prévisualisation**
1. Dans n8n, cliquez sur **"Manual Trigger (Custom Prompt)"**
2. Ouvrez le nœud **"Custom Prompt Input"**
3. Modifiez le champ `custom_prompt` avec votre prompt personnalisé
4. Assurez-vous que :
   - `preview_mode` = `true`
   - `approved` = `false`
5. Exécutez le workflow
6. Consultez la prévisualisation dans **"Preview Stop"**

#### **Étape 2 : Approuver et Envoyer**
1. Si vous êtes satisfait de la prévisualisation :
2. Modifiez le nœud **"Custom Prompt Input"**
3. Changez `approved` de `false` à `true`
4. Réexécutez le workflow depuis **"Custom Prompt Input"**
5. Le briefing sera généré et envoyé par email

### **Astuce : Tester Plusieurs Versions**
1. Modifiez le prompt dans **"Custom Prompt Input"**
2. Laissez `preview_mode = true` et `approved = false`
3. Exécutez pour voir la prévisualisation
4. Si vous n'êtes pas satisfait, modifiez le prompt et réexécutez
5. Répétez jusqu'à obtenir le résultat souhaité
6. Puis passez `approved = true` pour envoyer

## 🔄 Flux de Données

```
┌─────────────────────────────────────────────────────────┐
│  GESTION DES PROMPTS                                    │
└─────────────────────────────────────────────────────────┘
         │
         ├─→ Emma En Direct (Interface Web)
         │   └─→ Modifie → /api/briefing-prompts → GitHub
         │
         └─→ n8n Workflow
             ├─→ Schedule Trigger → Fetch Prompts from API → Briefing
             └─→ Manual Trigger → Custom Prompt Input → Preview/Send
```

## 📋 Structure des Prompts

Chaque prompt contient :
- **name** : Nom du briefing (ex: "Emma En Direct - Matin")
- **prompt** : Le prompt complet pour Emma
- **tone** : Style du briefing (ex: "énergique, professionnel, optimiste")
- **length** : Longueur cible (ex: "200-300 mots")
- **tools_priority** : Liste des outils à utiliser en priorité
- **email_config** : Configuration de l'email (sujet, expéditeur, etc.)

## ⚠️ Notes Importantes

1. **Synchronisation** : Les modifications dans Emma En Direct sont immédiatement sauvegardées dans GitHub. n8n récupère les prompts à chaque exécution.

2. **Trigger Manuel** : Le trigger manuel permet de tester des prompts personnalisés sans affecter les briefings automatisés.

3. **Prévisualisation** : Toujours prévisualiser avant d'envoyer pour éviter les erreurs.

4. **Backup** : Les prompts sont sauvegardés dans `config/briefing-prompts.json` dans GitHub, donc vous avez toujours un historique via Git.

## 🐛 Dépannage

### Les modifications ne s'appliquent pas dans n8n
- Vérifiez que le nœud "Fetch Prompts from API" est bien connecté
- Vérifiez l'URL de l'API dans le nœud (doit être `https://gob-projetsjsls-projects.vercel.app/api/briefing-prompts`)

### La prévisualisation ne fonctionne pas
- Vérifiez que `preview_mode = true` dans "Custom Prompt Input"
- Vérifiez que `approved = false` dans "Custom Prompt Input"
- Vérifiez que le nœud "Preview or Send?" est bien connecté

### L'envoi ne fonctionne pas
- Vérifiez que `approved = true` dans "Custom Prompt Input"
- Vérifiez que le nœud "Preview or Send?" route vers "Generate HTML Newsletter"

