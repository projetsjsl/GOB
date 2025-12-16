# Migration Briefing n8n - Centralisation des Prompts

**Date**: 2025-01-16  
**Status**: ✅ Complété

## 🎯 Objectif

Centraliser tous les prompts et fonctions dans GitHub, avec n8n qui appelle les endpoints du projet au lieu d'appeler directement les APIs externes (Perplexity/Gemini).

## ✅ Changements Implémentés

### 1. Nouveau Endpoint `/api/briefing`

**Fichier**: `api/briefing.js`

- Lit les prompts depuis `config/briefing-prompts.json`
- Récupère les tickers depuis Supabase (comme `/api/chat`)
- Appelle `/api/emma-agent` avec `output_mode: 'briefing'`
- Applique le template HTML selon le type (morning/midday/evening)
- Retourne contenu formaté (texte + HTML)

**Usage**:
```bash
GET /api/briefing?type=morning|midday|evening
POST /api/briefing
Body: { type: 'morning'|'midday'|'evening', tickers?: string[] }
```

**Réponse**:
```json
{
  "success": true,
  "type": "morning",
  "subject": "Emma En Direct - Matinée du 16/01/2025",
  "content": "...",
  "html_content": "<!DOCTYPE html>...",
  "metadata": {
    "tickers": ["GOOGL", "AAPL", ...],
    "tools_used": [...],
    "execution_time_ms": 12345,
    "generated_at": "2025-01-16T11:20:00.000Z"
  }
}
```

### 2. Templates HTML par Type

**Fichier**: `lib/email-templates.js`

Chaque type a son propre template avec design adapté:
- **Morning**: Couleurs chaudes (orange/jaune) 🌅
- **Midday**: Couleurs bleues (professionnel) ☀️
- **Evening**: Couleurs violettes (élégant) 🌆

### 3. Confirmations d'Envoi par Email

**Fichier**: `lib/briefing-confirmation.js`

Envoie automatiquement un email de confirmation à l'admin après l'envoi d'un briefing, similaire aux confirmations SMS.

**Configuration**:
- Variable d'environnement: `ADMIN_EMAIL` (défaut: `projetsjsl@gmail.com`)

### 4. Workflow n8n Simplifié

**Fichier**: `n8n-workflow-simplified.json`

**Avant**: 22 nodes (prompts hardcodés, appels directs Perplexity/Gemini, parsing, etc.)  
**Après**: 6 nodes (Schedule → Determine Type → Call /api/briefing → Send Email → Send Confirmation → Log)

**Flow**:
```
Schedule Trigger (7h20/11h50/16h20 Montréal)
    ↓
Determine Briefing Type (selon heure UTC)
    ↓
Call /api/briefing?type=morning|midday|evening
    ↓
Send Email via Resend (avec HTML déjà formaté)
    ↓
Send Confirmation Email (à l'admin)
    ↓
Log to Supabase
```

### 5. Amélioration `/api/emma-n8n.js`

L'action `briefing` utilise maintenant aussi `config/briefing-prompts.json` au lieu de prompts hardcodés.

## 📋 Configuration Requise

### Variables d'Environnement Vercel

```bash
# Requis
RESEND_API_KEY=re_xxxxx
ADMIN_EMAIL=projetsjsl@gmail.com  # Pour confirmations

# Optionnel
BRIEFING_RECIPIENTS=email1@example.com,email2@example.com  # Défaut: projetsjsl@gmail.com
```

### Variables d'Environnement n8n

```bash
RESEND_API_KEY=re_xxxxx
BRIEFING_RECIPIENTS=email1@example.com,email2@example.com
ADMIN_EMAIL=projetsjsl@gmail.com
```

## 🚀 Migration du Workflow n8n

### Étape 1: Importer le nouveau workflow

1. Aller sur https://projetsjsl.app.n8n.cloud
2. Créer un nouveau workflow
3. Importer `n8n-workflow-simplified.json`
4. Configurer les variables d'environnement dans n8n

### Étape 2: Configurer les variables

Dans n8n → Settings → Variables d'environnement:
- `RESEND_API_KEY`: Clé API Resend
- `BRIEFING_RECIPIENTS`: Liste des destinataires (séparés par virgule)
- `ADMIN_EMAIL`: Email pour confirmations

### Étape 3: Tester

1. Utiliser "Manual Trigger" pour tester
2. Vérifier que `/api/briefing` est appelé correctement
3. Vérifier que l'email est envoyé
4. Vérifier que la confirmation est reçue

### Étape 4: Activer le Schedule

Une fois testé, activer le Schedule Trigger pour les horaires:
- 7h20 Montréal (11h20 UTC) → Morning
- 11h50 Montréal (15h50 UTC) → Midday
- 16h20 Montréal (20h20 UTC) → Evening

## 🧪 Tests

### Tester l'endpoint localement

```bash
node test-briefing-endpoint.js morning
node test-briefing-endpoint.js midday
node test-briefing-endpoint.js evening
```

### Tester via curl

```bash
curl "http://localhost:3000/api/briefing?type=morning"
```

## 📊 Avantages

1. **Centralisation**: Tous les prompts dans `config/briefing-prompts.json` (versionnés)
2. **Maintenance**: Modifier les prompts sans toucher n8n
3. **Cohérence**: Utilise Emma Agent avec tous ses outils et améliorations
4. **Fallback automatique**: Perplexity → Gemini si timeout/erreur
5. **Templates HTML**: Design adapté par type
6. **Confirmations**: Email de confirmation automatique
7. **Simplicité**: Workflow n8n beaucoup plus simple (6 nodes vs 22)

## 🔧 Résolution des Erreurs n8n

Les erreurs d'exécution n8n devraient être résolues car:
- ✅ Plus d'appels directs aux APIs (timeout/erreurs gérées par Emma Agent)
- ✅ Fallback automatique Perplexity → Gemini
- ✅ Gestion d'erreurs améliorée dans `/api/emma-agent`
- ✅ Timeouts adaptatifs selon le type de requête

## 📝 Fichiers Modifiés/Créés

### Nouveaux fichiers:
- `api/briefing.js` - Endpoint dédié pour briefings
- `lib/email-templates.js` - Templates HTML par type
- `lib/briefing-confirmation.js` - Confirmations email
- `n8n-workflow-simplified.json` - Workflow n8n simplifié
- `test-briefing-endpoint.js` - Script de test

### Fichiers modifiés:
- `api/emma-n8n.js` - Utilise maintenant `config/briefing-prompts.json`

### Fichiers existants (non modifiés):
- `config/briefing-prompts.json` - Prompts (déjà complet)

## 🎨 Templates HTML

Chaque type a son propre design:
- **Morning**: Gradient orange/jaune, emoji 🌅
- **Midday**: Gradient bleu, emoji ☀️
- **Evening**: Gradient violet, emoji 🌆

Les templates sont responsive et compatibles avec les clients email modernes.

## 📧 Confirmations Email

Après chaque envoi de briefing, un email de confirmation est envoyé à l'admin avec:
- Type de briefing
- Sujet envoyé
- Destinataires
- Message ID Resend
- Timestamp
- Métadonnées (tickers, temps d'exécution)

## 🔄 Prochaines Étapes

1. Importer le workflow simplifié dans n8n
2. Configurer les variables d'environnement
3. Tester avec Manual Trigger
4. Activer le Schedule Trigger
5. Monitorer les confirmations email

