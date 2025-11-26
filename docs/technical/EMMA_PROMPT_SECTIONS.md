# Gestion Dynamique des Sections de Prompt Emma

## Vue d'ensemble

Le système de gestion dynamique des sections de prompt permet aux utilisateurs de personnaliser l'interface "Ask Emma" en ajoutant, modifiant, supprimant et réordonnant les sections de prompt via Supabase.

## Architecture

### Base de données (Supabase)

**Table: `emma_prompt_sections`**

```sql
CREATE TABLE emma_prompt_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT, -- Optionnel: pour support multi-utilisateurs
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📝',
  placeholder TEXT,
  button_color TEXT DEFAULT 'bg-blue-600',
  button_hover_color TEXT DEFAULT 'hover:bg-blue-700',
  prompt_type TEXT CHECK (prompt_type IN ('existing', 'custom')),
  prompt_key TEXT, -- e.g., 'prompts.expertSystem'
  custom_prompt TEXT,
  inputs JSONB DEFAULT '[]',
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Configuration des Inputs (JSONB)

Les inputs sont stockés sous forme de tableau JSON :

```json
[
  {
    "name": "query",
    "placeholder": "Posez votre question...",
    "type": "text",
    "width": "flex-1"
  },
  {
    "name": "stockTitle",
    "placeholder": "Nom (ex: Apple)",
    "type": "text",
    "width": "flex-1"
  },
  {
    "name": "stockTicker",
    "placeholder": "Ticker (ex: AAPL)",
    "type": "text",
    "width": "w-32"
  }
]
```

## Installation

### 1. Créer la table Supabase

Exécutez la migration SQL :

```bash
# Via Supabase Dashboard ou CLI
psql -h gob-watchlist.supabase.co -U postgres -d postgres -f supabase-migrations/008_create_emma_prompt_sections.sql
```

### 2. Seed des sections par défaut

Exécutez le script de seed :

```bash
psql -h gob-watchlist.supabase.co -U postgres -d postgres -f supabase-migrations/009_seed_emma_prompt_sections.sql
```

### 3. Configuration du client Supabase

Dans le dashboard, le client Supabase est initialisé automatiquement avec la clé par défaut. 

**Configuration automatique :**
- URL Supabase : `https://boyuxgdpbkpknplxbxp.supabase.co`
- Clé ANON_KEY : Configurée par défaut dans le code

**Surcharge personnalisée (optionnel) :**

Si vous souhaitez utiliser une autre clé, vous pouvez la définir dans localStorage :

```javascript
localStorage.setItem('SUPABASE_ANON_KEY', 'votre-clé-anon-key');
```

Puis rechargez la page.

**Note:** Le système utilisera toujours les sections par défaut en fallback si Supabase n'est pas disponible.

## Utilisation

### Mode Normal

1. Les sections sont chargées automatiquement depuis Supabase (ou utilisent les sections par défaut)
2. Chaque section affiche ses inputs configurés
3. L'utilisateur peut saisir des données et envoyer des messages via chaque section

### Mode Édition

1. Cliquez sur le bouton **"⚙️ Gérer"** en haut de la section "Sections de Prompt"
2. Le mode édition s'active, affichant :
   - Boutons de réordonnancement (↑↓) pour chaque section
   - Bouton de modification (✏️) pour chaque section
   - Bouton de suppression (🗑️) pour chaque section
   - Bouton **"➕ Ajouter"** pour créer une nouvelle section

### Ajouter une Section

1. Activez le mode édition
2. Cliquez sur **"➕ Ajouter"**
3. Remplissez le formulaire :
   - **Nom**: Nom de la section (ex: "Analyse Technique")
   - **Icône**: Emoji ou icône (ex: "📊")
   - **Type de prompt**: 
     - `existing`: Utilise un prompt depuis `emma-config.js`
     - `custom`: Prompt personnalisé
   - **Clé du prompt** (si `existing`): Sélectionnez depuis la liste déroulante
   - **Prompt personnalisé** (si `custom`): Saisissez votre prompt
   - **Couleur du bouton**: Classe Tailwind (ex: "bg-blue-600")
4. Cliquez sur **"Ajouter"**

### Modifier une Section

1. Activez le mode édition
2. Cliquez sur **"✏️"** sur la section à modifier
3. Modifiez les champs souhaités
4. Cliquez sur **"Mettre à jour"**

### Supprimer une Section

1. Activez le mode édition
2. Cliquez sur **"🗑️"** sur la section à supprimer
3. Confirmez la suppression

**Note:** La suppression est un "soft delete" (is_active = false), la section peut être restaurée depuis la base de données.

### Réordonner les Sections

1. Activez le mode édition
2. Utilisez les boutons **"↑"** et **"↓"** pour déplacer les sections
3. L'ordre est sauvegardé automatiquement dans Supabase

## Types de Prompts

### Prompt Existing

Utilise un prompt défini dans `emma-config.js` :

- `prompts.expertSystem`: Prompt système expert
- `prompts.generalAssistant`: Assistant général
- `prompts.institutionalAnalysis`: Analyse institutionnelle
- `prompts.newsSearch`: Recherche d'actualités
- `prompts.tickerComparison`: Comparaison de titres

### Prompt Custom

Prompt personnalisé saisi directement dans le formulaire. Peut inclure des variables comme :
- `{userMessage}`: Message de l'utilisateur
- `{dashboardData}`: Données du dashboard
- `{currentTime}`: Heure actuelle

## Sections par Défaut

Le système inclut 5 sections par défaut :

1. **Emma Expert (Prompt Système)** - 👩‍💼
   - Prompt: `prompts.expertSystem`
   - Input: Question générale

2. **Question Générale (LLM Standard)** - 🤖
   - Prompt: `prompts.generalAssistant`
   - Input: Question générale

3. **Analyse Rapide de Titre** - 📈
   - Prompt: `prompts.institutionalAnalysis`
   - Inputs: Nom d'entreprise + Ticker

4. **Recherche d'Actualités** - 📰
   - Prompt: `prompts.newsSearch`
   - Input: Sujet de recherche

5. **Comparaison de Titres** - ⚖️
   - Prompt: `prompts.tickerComparison`
   - Input: Liste de tickers

## Fonctionnalités Techniques

### Résolution des Prompts

Le système résout automatiquement les prompts :

- **Existing**: Résout depuis `window.emmaConfig.prompts[key]`
- **Custom**: Utilise directement `custom_prompt`

### Gestion des Inputs Multiples

Chaque section peut avoir plusieurs inputs :

```json
[
  { "name": "field1", "placeholder": "...", "type": "text", "width": "flex-1" },
  { "name": "field2", "placeholder": "...", "type": "text", "width": "w-32" }
]
```

Les valeurs sont stockées dans `sectionInputs` avec la clé `${section.id}_${input.name}`.

### Fallback

Si Supabase n'est pas disponible ou si aucune section n'est trouvée, le système utilise les sections par défaut définies dans `DEFAULT_SECTIONS`.

## Dépannage

### Les sections ne se chargent pas

1. Vérifiez que la table `emma_prompt_sections` existe dans Supabase (projet: `boyuxgdpbkpknplxbxp`)
2. Vérifiez la console du navigateur pour les erreurs (devrait afficher "✅ Client Supabase initialisé")
3. Vérifiez que les migrations SQL ont été exécutées correctement
4. Le système devrait utiliser les sections par défaut en fallback si Supabase n'est pas disponible

### Les modifications ne sont pas sauvegardées

1. Vérifiez que le client Supabase est initialisé (console: "✅ Client Supabase initialisé")
2. Vérifiez les permissions RLS (Row Level Security) dans Supabase
3. Vérifiez la console pour les erreurs de requête

### Le modal ne s'ouvre pas

1. Vérifiez que le mode édition est activé
2. Vérifiez la console pour les erreurs JavaScript
3. Vérifiez que `window.emmaConfig` est chargé

## Sécurité

- Les sections sont filtrées par `is_active = true`
- Le soft delete préserve les données
- Les permissions RLS peuvent être configurées dans Supabase pour restreindre l'accès

## Évolutions Futures

- Support multi-utilisateurs avec `user_id`
- Templates de sections pré-configurées
- Import/Export de configurations
- Validation avancée des inputs
- Support de types d'inputs supplémentaires (select, checkbox, etc.)

