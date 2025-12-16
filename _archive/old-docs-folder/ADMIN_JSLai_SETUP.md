# Admin JSLai - Guide de Configuration

## 📋 Vue d'ensemble

L'interface **Admin JSLai** permet de gérer la configuration système d'Emma IA sans avoir à modifier le code ou redéployer. Vous pouvez modifier :
- **Prompts système** (identité CFA, identité générale, instructions)
- **Variables** (max tokens, température, récence)
- **Directives** (autoriser clarifications, longueur adaptative, ratios min)
- **Routage** (keywords Perplexity seul vs APIs requises)

## 🚀 Installation

### 1. Base de données Supabase

Exécutez le script SQL pour créer la table de configuration :

```bash
# Via Supabase Dashboard ou CLI
psql -h [host] -U [user] -d [database] -f supabase-emma-admin-setup.sql
```

Ou copiez-collez le contenu de `supabase-emma-admin-setup.sql` dans l'éditeur SQL de Supabase.

### 2. Variables d'environnement

Ajoutez dans Vercel (ou `.env.local` pour développement) :

```bash
# Token d'authentification pour l'API admin (générer un token sécurisé)
ADMIN_API_KEY=your-secure-admin-token-here

# Supabase (déjà configuré normalement)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Accès à l'interface

L'interface est accessible à :
```
https://[votre-domaine]/admin-jslai.html
```

## 🔐 Authentification

L'API admin nécessite un token d'authentification. Deux méthodes :

### Méthode 1 : Token dans localStorage
1. Ouvrir la console du navigateur
2. Exécuter : `localStorage.setItem('admin_token', 'your-admin-token')`
3. Recharger la page

### Méthode 2 : Prompt au chargement
L'interface demandera le token au chargement si non présent dans localStorage.

## 📊 Structure de la Configuration

### Sections disponibles

#### 1. **Prompts** (`prompts`)
- `cfa_identity` : Identité et qualifications d'Emma pour analyses financières
- `general_identity` : Identité d'Emma pour questions générales
- `system_instructions` : Instructions système générales

#### 2. **Variables** (`variables`)
- `max_tokens_default` : Nombre max de tokens par défaut (4000)
- `max_tokens_briefing` : Nombre max de tokens pour briefings (10000)
- `temperature` : Température pour génération (0.0-1.0, défaut: 0.1)
- `recency_default` : Filtre de récence par défaut (day/week/month/year)

#### 3. **Directives** (`directives`)
- `allow_clarifications` : Permettre clarifications (boolean)
- `adaptive_length` : Longueur adaptative (boolean)
- `require_sources` : Exiger citations (boolean)
- `min_ratios_simple` : Ratios min pour questions simples (number)
- `min_ratios_comprehensive` : Ratios min pour analyses complètes (number)

#### 4. **Routage** (`routing`)
- `use_perplexity_only_keywords` : Keywords déclenchant Perplexity seul (array)
- `require_apis_keywords` : Keywords nécessitant APIs (array)

## 🔧 Utilisation

### Modifier un Prompt

1. Aller dans l'onglet **"📝 Prompts Système"**
2. Modifier le texte dans le textarea
3. Cliquer sur **"💾 Sauvegarder"**
4. La modification est immédiatement active (pas de redéploiement nécessaire)

### Modifier une Variable

1. Aller dans l'onglet **"⚙️ Variables"**
2. Modifier la valeur
3. Cliquer sur **"💾 Sauvegarder"**

### Modifier une Directive

1. Aller dans l'onglet **"🎯 Directives"**
2. Activer/désactiver les toggles ou modifier les valeurs
3. Cliquer sur **"💾 Sauvegarder"**

### Sauvegarder Tout

Cliquer sur **"💾 Sauvegarder Tout"** dans le header pour sauvegarder toutes les modifications en une fois.

## 🔄 Intégration avec Emma

L'API `/api/admin/emma-config` est utilisée par Emma pour charger la configuration. Emma charge la config au démarrage et peut être rechargée dynamiquement.

### Chargement dans Emma

```javascript
// Dans emma-agent.js
async _loadSystemConfig() {
    try {
        const response = await fetch('/api/admin/emma-config?section=prompts');
        const data = await response.json();
        
        if (data.config) {
            this.systemConfig = data.config;
            console.log('✅ Configuration système chargée');
        }
    } catch (error) {
        console.warn('⚠️ Erreur chargement config, utilisation valeurs par défaut');
        this.systemConfig = getDefaultConfig();
    }
}
```

## 🛡️ Sécurité

### Recommandations

1. **Token Admin Fort** : Utilisez un token long et aléatoire
   ```bash
   # Générer un token sécurisé
   openssl rand -hex 32
   ```

2. **HTTPS Obligatoire** : Ne jamais exposer l'API admin en HTTP

3. **Restriction IP** (optionnel) : Limiter l'accès à certaines IPs dans Vercel

4. **Audit Log** : La table `emma_system_config` enregistre `updated_by` et `updated_at`

5. **Backup** : Exporter régulièrement la configuration depuis Supabase

## 📝 Exemples

### Modifier l'identité CFA

```javascript
// Via l'interface ou API directe
POST /api/admin/emma-config
{
  "action": "set",
  "section": "prompts",
  "key": "cfa_identity",
  "value": "Tu es Emma, CFA® - Analyste Financière Senior..."
}
```

### Modifier max tokens

```javascript
POST /api/admin/emma-config
{
  "action": "set",
  "section": "variables",
  "key": "max_tokens_default",
  "value": 5000,
  "type": "number"
}
```

### Activer longueur adaptative

```javascript
POST /api/admin/emma-config
{
  "action": "set",
  "section": "directives",
  "key": "adaptive_length",
  "value": true,
  "type": "boolean"
}
```

## 🔍 Dépannage

### L'interface ne charge pas la config

1. Vérifier que Supabase est configuré
2. Vérifier que la table `emma_system_config` existe
3. Vérifier les logs de l'API dans Vercel

### Les modifications ne s'appliquent pas

1. Vérifier que le token admin est correct
2. Vérifier les logs de l'API
3. Vérifier que Emma recharge la config (peut nécessiter redémarrage)

### Erreur 401 (Non autorisé)

1. Vérifier que `ADMIN_API_KEY` est défini dans Vercel
2. Vérifier que le token dans localStorage correspond
3. Vérifier les headers de la requête

## 📚 API Reference

### GET - Récupérer la configuration

```bash
GET /api/admin/emma-config
GET /api/admin/emma-config?section=prompts
GET /api/admin/emma-config?section=prompts&key=cfa_identity

Headers:
  Authorization: Bearer [ADMIN_API_KEY]
```

### POST - Sauvegarder la configuration

```bash
POST /api/admin/emma-config

Headers:
  Authorization: Bearer [ADMIN_API_KEY]
  Content-Type: application/json

Body:
{
  "action": "set",
  "section": "prompts",
  "key": "cfa_identity",
  "value": "...",
  "type": "string"  // optionnel: string, number, boolean, json
}
```

### DELETE - Supprimer la configuration

```bash
DELETE /api/admin/emma-config?section=prompts&key=cfa_identity

Headers:
  Authorization: Bearer [ADMIN_API_KEY]
```

## ✅ Statut

**Terminé** - Interface Admin JSLai opérationnelle.

---

*Dernière mise à jour : Novembre 2025*
