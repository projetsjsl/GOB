# 📝 Admin - Prompts Questions Générales

**Date**: 18 Novembre 2025  
**Interface**: `/admin-jslai-dynamic.html` ou `/api/admin/emma-config`

---

## 🎯 Nouveaux Prompts Ajoutés

Les prompts pour questions générales sont maintenant **adaptés par canal** et disponibles dans l'interface admin :

### 1. **Identité d'Emma - Questions Générales**

#### `general_identity_sms` (SMS)
- **Description**: Identité d'Emma pour questions générales (SMS) - Analyste agile avec recherche active
- **Format**: Réponse concise (2-3 SMS max), données clés, sources courtes, emojis
- **Usage**: Utilisé automatiquement quand `context.user_channel === 'sms'`

#### `general_identity_web` (Web/Email)
- **Description**: Identité d'Emma pour questions générales (Web/Email) - Analyste agile avec recherche active
- **Format**: Réponse détaillée et complète, sources avec liens, structure claire
- **Usage**: Utilisé automatiquement pour Web, Email, Messenger

### 2. **Instructions - Questions Générales**

#### `general_instructions_sms` (SMS)
- **Description**: Instructions pour questions générales (SMS) - Recherche active obligatoire
- **Contenu**: Instructions critiques pour recherche active d'informations réelles via Perplexity
- **Format**: SMS concis avec données clés

#### `general_instructions_web` (Web/Email)
- **Description**: Instructions pour questions générales (Web/Email) - Recherche active obligatoire
- **Contenu**: Instructions critiques pour recherche active d'informations réelles via Perplexity
- **Format**: Web/Email détaillé avec sources complètes

---

## 🔧 Modification via Interface Admin

### Accès à l'Interface

1. **Via Dashboard**:
   ```
   https://[votre-domaine]/admin-jslai-dynamic.html
   ```

2. **Via API Directe**:
   ```bash
   # Récupérer un prompt
   GET /api/admin/emma-config?section=prompts&key=general_identity_sms
   
   # Modifier un prompt
   PUT /api/admin/emma-config
   {
     "section": "prompts",
     "key": "general_identity_sms",
     "value": "Nouveau prompt..."
   }
   ```

### Étapes pour Modifier

1. **Ouvrir l'interface admin** (`/admin-jslai-dynamic.html`)
2. **Filtrer par section**: Sélectionner "📝 Prompts"
3. **Rechercher**: Taper "general" dans la recherche
4. **Sélectionner le prompt** à modifier:
   - `general_identity_sms` - Pour SMS
   - `general_identity_web` - Pour Web/Email
   - `general_instructions_sms` - Instructions SMS
   - `general_instructions_web` - Instructions Web/Email
5. **Modifier** le contenu dans l'éditeur
6. **Sauvegarder** (bouton "💾 Sauvegarder")

### Exemple de Modification

**Avant** (dans l'interface admin):
```
Tu es Emma, une ANALYSTE INTELLIGENTE polyvalente...
```

**Après modification** (exemple):
```
Tu es Emma, une ANALYSTE INTELLIGENTE polyvalente qui utilise Perplexity 
pour chercher activement des informations RÉELLES et RÉCENTES sur le web.

🎯 TON RÔLE (SMS):
- Tu es une ANALYSTE qui RECHERCHE et SYNTHÉTISE des informations...
```

---

## 📊 Structure dans Supabase

Les prompts sont stockés dans la table `emma_system_config` :

```sql
SELECT * FROM emma_system_config 
WHERE section = 'prompts' 
AND key LIKE 'general_%';
```

**Résultat attendu**:
- `prompts.general_identity` (déprécié)
- `prompts.general_identity_sms` ✅
- `prompts.general_identity_web` ✅
- `prompts.general_instructions_sms` ✅
- `prompts.general_instructions_web` ✅

---

## 🔄 Utilisation dans le Code

Le code dans `api/emma-agent.js` utilise automatiquement ces prompts selon le canal :

```javascript
// Ligne ~2391
const cfaIdentity = !isGeneralNonFinancial && intentData && [...]
    ? `${CFA_SYSTEM_PROMPT.identity}...`
    : isGeneralNonFinancial
    ? (userChannel === 'sms' 
        ? `Tu es Emma, une ANALYSTE INTELLIGENTE...` // ← Utilise general_identity_sms
        : `Tu es Emma, une ANALYSTE INTELLIGENTE...`) // ← Utilise general_identity_web
    : `Tu es Emma, l'assistante financière...`;

// Ligne ~2423
const generalInstructions = isGeneralNonFinancial ? (userChannel === 'sms' ? `
🎯 INSTRUCTIONS POUR QUESTION GÉNÉRALE (HORS FINANCE) - MODE SMS:
...` // ← Utilise general_instructions_sms
: `
🎯 INSTRUCTIONS POUR QUESTION GÉNÉRALE (HORS FINANCE) - MODE WEB/EMAIL:
...` // ← Utilise general_instructions_web
```

**Note**: Actuellement, les prompts sont hardcodés dans le code. Pour utiliser les prompts depuis Supabase, il faudrait intégrer `lib/emma-config-loader.js` dans `_buildChatPrompt()`.

---

## 🚀 Migration Future (Optionnel)

Pour utiliser les prompts depuis Supabase au lieu du code hardcodé :

1. **Modifier `api/emma-agent.js`**:
   ```javascript
   import { loadEmmaConfig } from '../lib/emma-config-loader.js';
   
   // Dans _buildChatPrompt()
   const emmaConfig = await loadEmmaConfig();
   const generalIdentitySMS = emmaConfig.prompts?.general_identity_sms?.value || '...';
   const generalIdentityWeb = emmaConfig.prompts?.general_identity_web?.value || '...';
   ```

2. **Avantages**:
   - ✅ Modification sans redéploiement
   - ✅ A/B testing facile
   - ✅ Historique des versions
   - ✅ Rollback rapide

3. **Inconvénients**:
   - ⚠️ Latence supplémentaire (appel Supabase)
   - ⚠️ Dépendance à Supabase

---

## 📝 Checklist pour Modifications Futures

- [ ] Accéder à `/admin-jslai-dynamic.html`
- [ ] Filtrer par section "📝 Prompts"
- [ ] Rechercher "general" pour trouver les prompts
- [ ] Sélectionner le prompt à modifier (SMS ou Web)
- [ ] Modifier le contenu
- [ ] Tester avec une question générale (ex: "Météo à Rimouski")
- [ ] Vérifier que la réponse est directe et contient des données réelles
- [ ] Sauvegarder dans Supabase
- [ ] Documenter les changements

---

## 🎯 Points Clés à Retenir

1. **Deux versions par prompt**: SMS (concis) et Web/Email (détaillé)
2. **Recherche active obligatoire**: Les prompts forcent Perplexity à chercher des informations réelles
3. **Pas de réponses génériques**: Interdiction de "Je peux t'aider avec..."
4. **Données réelles**: Toujours fournir des données concrètes, chiffres, sources
5. **Adaptation automatique**: Le code sélectionne automatiquement la bonne version selon le canal

---

## 📚 Documentation Associée

- `EMMA-AGILE-ANALYSTE.md` - Documentation complète de l'approche agile
- `PERPLEXITY-FIRST-APPROACH.md` - Philosophie Perplexity First
- `docs/ADMIN_JSLai_SETUP.md` - Guide de configuration admin

