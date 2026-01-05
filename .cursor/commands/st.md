# Commande `/st` - Script Test jusqu'à réussite

Quand l'utilisateur écrit `/st`, exécuter les tests pertinents (Code, Console, UI, **VISUEL**) intelligemment jusqu'à réussite.

**⚠️ OBLIGATOIRE : Tests visuels avec navigation browser et screenshots**

**Processus optimisé - Tests multi-dimensionnels**:

## 1. ANALYSE DU CONTEXTE

Analyser la conversation récente pour identifier :
- **Fichiers modifiés** : Utiliser `grep` ou `codebase_search` pour trouver les fichiers mentionnés/modifiés
- **Type de modification** :
  - API/Backend (`api/*.js`) → Tests CONSOLE prioritaires
  - Frontend React (`public/3p1/**/*.tsx`, `public/js/dashboard/**`) → Tests CODE + UI prioritaires
  - Scripts (`scripts/*.js`) → Tests CONSOLE
  - SQL/Migrations (`supabase/migrations/*.sql`) → Tests CODE (syntaxe SQL)
  - Documentation → Pas de tests nécessaires
- **Concepts clés** : Identifier mots-clés (batch, sync, FMP, Supabase, 3p1, dashboard, etc.)

**Mapping contexte → tests** :
```
api/fmp-company-data-batch-sync.js → scripts/test-batch-optimization.js
api/fmp-company-data.js → scripts/test-fmp-*.js
public/3p1/App.tsx → CODE (lints) + UI (build 3p1)
public/3p1/components/*.tsx → CODE (lints) + UI (build 3p1)
public/js/dashboard/app-inline.js → CODE (lints) + UI (vérifier rendu)
scripts/test-*.js → CONSOLE (exécuter le script)
supabase/migrations/*.sql → CODE (syntaxe SQL via read_lints)
```

## 2. TESTS CODE (Structure, syntaxe, qualité)

**Ordre d'exécution** :
1. `read_lints` sur tous les fichiers modifiés identifiés
2. Vérifier syntaxe TypeScript/JavaScript (via lints)
3. Vérifier imports/exports (via lints)
4. Consulter `docs/REPERTOIRE_COMPLET_ERREURS.md` pour patterns communs :
   - Variables avant `useState` initializers
   - Z-index hierarchy (modals 10000+, dropdowns 9999)
   - `window.ComponentName = ComponentName` pour Babel inline
   - `typeof variable !== 'undefined'` pour références

**Critères de réussite** : 0 erreurs de lint

## 3. TESTS CONSOLE (Logs, erreurs, comportement runtime)

**Sélection des scripts selon contexte** :

| Contexte détecté | Scripts à exécuter |
|------------------|-------------------|
| `api/fmp-company-data-batch-sync.js` modifié | `scripts/test-batch-optimization.js` |
| `api/fmp-company-data.js` modifié | `scripts/test-fmp-key-metrics-batch.js` |
| Sync/3p1 (`public/3p1/App.tsx`) | `scripts/test-sync-options-variants.js`, `scripts/test-batch-endpoint-debug.js` |
| Batch endpoint | `scripts/test-batch-optimization.js` |
| Supabase (`supabase/migrations/*.sql`) | `scripts/test-supabase-batch-api.js` |
| Sync report (`SyncReportDialog.tsx`) | `scripts/test-sync-report-features.js` |

**Processus** :
1. Identifier le script le plus pertinent selon le contexte
2. Exécuter : `node scripts/test-[pertinent].js`
3. Analyser la sortie :
   - ✅ Code 0 + logs positifs → Succès
   - ❌ Code non-0 ou erreurs → Corriger et réessayer (max 3 tentatives)
4. Si erreur 500/timeout → Attendre 2-5 min (déploiement Vercel) puis réessayer

**Critères de réussite** : Code de sortie 0 + logs confirmant le succès

## 4. TESTS UI (Rendu visuel, interactions)

**Déclencheurs** :
- Modifications dans `public/3p1/**/*.tsx` → Build 3p1
- Modifications dans `public/js/dashboard/**` → Vérifier rendu dashboard
- Ajout/modification de composants React → Build + vérifier compilation

**Processus** :
1. **Build 3p1** (si `public/3p1/` modifié) :
   ```bash
   cd public/3p1 && npm run build
   ```
   - Vérifier : 0 erreurs de compilation
   - Vérifier : Fichiers `dist/` générés correctement

2. **Vérifier rendu dashboard** (si `public/js/dashboard/` modifié) :
   - Vérifier via `read_lints` que le code compile
   - Patterns à vérifier :
     - Z-index : modals (10000+), dropdowns (9999), content (1-100)
     - Positioning : `fixed` pour dropdowns avec `overflow` parent
     - Component exposure : `window.ComponentName = ComponentName`

**Critères de réussite** : Build réussi (0 erreurs) + composants accessibles

## 5. EXÉCUTION ITÉRATIVE

**Boucle jusqu'à réussite** :
1. Exécuter tests CODE → Si échec, corriger et réessayer
2. Exécuter tests CONSOLE → Si échec, corriger et réessayer (max 3 tentatives)
3. Exécuter tests UI → Si échec, corriger et réessayer

**Limite** : Maximum 3 tentatives par type de test avant d'informer l'utilisateur

## 6. TEST SCEPTIQUE RIGOUREUX 🔍

**Philosophie**: Ne jamais faire confiance à un succès apparent. Toujours vérifier en profondeur.

### 6.1 Validation Multi-Niveaux

Pour chaque modification, appliquer le **principe de scepticisme** :

| Niveau | Vérification | Commande/Action |
|--------|-------------|-----------------|
| **Syntaxe** | Code compile sans erreur | `read_lints` sur fichiers modifiés |
| **Runtime** | Pas d'erreurs console | Exécuter script de test |
| **Données** | Valeurs réelles, non-nulles | Vérifier que data !== null/undefined |
| **Comportement** | Fonctionnalité opérationnelle | Test manuel ou automatisé |
| **Régression** | Pas de cassure ailleurs | Tests croisés sur composants liés |

### 6.2 Questions Sceptiques à Se Poser

**Avant de déclarer "succès"**, répondre OUI à toutes ces questions :

1. ❓ **Les données sont-elles réelles ?** (Pas juste un objet vide `{}` ou `[]`)
2. ❓ **Le test couvre-t-il le cas réel ?** (Pas juste un mock/stub)
3. ❓ **Ai-je testé les edge cases ?** (Valeurs nulles, chaînes vides, erreurs réseau)
4. ❓ **La fonctionnalité marche de bout en bout ?** (Pas juste une partie)
5. ❓ **Ai-je vérifié les composants liés ?** (Régression potentielle)
6. ❓ **Les logs/console sont-ils propres ?** (Pas d'avertissements cachés)

### 6.3 Diagnostic Console Approfondi

**Commandes de vérification à exécuter** :

```javascript
// Vérifier l'état global des composants
Object.keys(window).filter(k => k.includes('Tab') || k.includes('Component'))

// Vérifier les erreurs silencieuses
console.error = (function(original) {
    return function(...args) {
        console.log('🚨 ERREUR CAPTURÉE:', ...args);
        original.apply(console, args);
    };
})(console.error);

// Vérifier les données
typeof data !== 'undefined' && data !== null && Object.keys(data).length > 0
```

### 6.4 Vérifications Anti-Patterns

**Patterns d'erreurs fréquents** (référence: `docs/REPERTOIRE_COMPLET_ERREURS.md`) :

| Pattern Dangereux | Vérification |
|------------------|--------------|
| Variable avant `useState` | Ordre de déclaration correct ? |
| `z-index` insuffisant | Hiérarchie modals > dropdowns > content ? |
| Composant non exposé | `window.ComponentName = ComponentName` présent ? |
| Référence non définie | Protection `typeof var !== 'undefined'` ? |
| Données nulles | Fallback ou gestion d'erreur ? |

### 6.5 Checklist Finale Sceptique

Avant de valider un test :

- [ ] ✅ Code compile (0 erreurs lint)
- [ ] ✅ Script termine avec code 0
- [ ] ✅ Données réelles retournées (pas vides)
- [ ] ✅ Fonctionnalité testée de bout en bout
- [ ] ✅ Pas de régression sur composants liés
- [ ] ✅ Console propre (pas d'erreurs/warnings cachés)
- [ ] ✅ Edge cases couverts (null, vide, erreur)
- [ ] ✅ Comportement identique en mode dark/light
- [ ] ✅ Responsive testé (si UI modifiée)

## 7. APPRENTISSAGE DES ÉCHECS

Documenter les solutions dans la conversation pour éviter répétition :
- Erreurs de syntaxe → Patterns à éviter
- Erreurs runtime → Corrections appliquées
- Erreurs de build → Configurations nécessaires

**Bonnes pratiques consolidées**:
- Toujours linter avant tests runtime
- Tester code → console → UI dans cet ordre
- Attendre déploiement Vercel (2-5 min) avant tests console si erreurs 500
- Vérifier les trois dimensions (code/console/UI) pour modifications importantes
- Analyser le contexte AVANT de choisir les tests à exécuter
- **Profils de synchronisation** : Vérifier que les presets avec détails ventilés s'affichent correctement
- **Visibilité UI** : Pour sections importantes, utiliser bordures épaisses (border-2), ombres (shadow-sm), fonds colorés pour meilleure visibilité
- **Stockage persistant** : Utiliser `storage` utility (IndexedDB/localStorage) pour profils personnalisés, pas localStorage direct
- **Tests de filtres** : Créer scripts de test pour vérifier que filtres retournent des résultats (ex: `test-kpi-filters.js`, `test-sidebar-filters.js`)
- **Build 3p1** : Toujours rebuild après modifications de composants React (`public/3p1/components/*.tsx`)

