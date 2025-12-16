# 📝 Gestion Centralisée des Prompts de Briefing

## ✅ Implémentation Complétée

### 1. Endpoint API `/api/briefing-prompts`
- **Fichier**: `api/briefing-prompts.js`
- **Fonctionnalités**:
  - `GET /api/briefing-prompts` - Récupère tous les prompts
  - `GET /api/briefing-prompts?type=morning|midday|evening` - Récupère un prompt spécifique
  - `PUT /api/briefing-prompts` - Modifie un prompt
  - `POST /api/briefing-prompts` - Même fonction que PUT (compatibilité)

### 2. Workflow n8n Mis à Jour
- **Fichier**: `n8n-workflow-03lgcA4e9uRTtli1.json`
- **Modifications**:
  - ✅ Ajout du nœud "Fetch Prompts from API" qui récupère les prompts depuis `/api/briefing-prompts`
  - ✅ Modification du nœud "Determine Time-Based Prompt" pour utiliser les prompts de l'API
  - ✅ Suppression du nœud "Prompts Configuration" obsolète
  - ✅ Connexions mises à jour : Merge Triggers → Fetch Prompts from API → Determine Time-Based Prompt

### 3. Configuration Vercel
- **Fichier**: `vercel.json`
- ✅ Ajout de `api/briefing-prompts.js` dans la section `functions` avec timeout de 10s

## 🔄 Flux de Données

```
GitHub (config/briefing-prompts.json)
    ↓
/api/briefing-prompts (API Endpoint)
    ↓
n8n Workflow (Fetch Prompts from API)
    ↓
Determine Time-Based Prompt
    ↓
Generate Briefing
```

## 📋 Prochaines Étapes

### Interface de Gestion dans Emma En Direct
- [ ] Ajouter une section "Gestion des Prompts" dans `EmailBriefingsTab`
- [ ] Créer un formulaire d'édition pour chaque type de briefing (morning/midday/evening)
- [ ] Permettre la modification et la sauvegarde des prompts via l'API
- [ ] Afficher un aperçu du prompt actuel
- [ ] Ajouter une validation avant sauvegarde

## 🎯 Avantages

1. **Centralisation**: Tous les prompts dans `config/briefing-prompts.json`
2. **Synchronisation**: n8n utilise toujours la dernière version depuis GitHub
3. **Maintenance**: Modification des prompts sans toucher n8n
4. **Cohérence**: Un seul point de vérité pour tous les prompts

## 📝 Notes Techniques

- L'API `/api/briefing-prompts` lit et écrit directement dans `config/briefing-prompts.json`
- Le workflow n8n récupère les prompts à chaque exécution
- Un fallback est prévu si l'API échoue
- Les prompts sont validés avant sauvegarde

