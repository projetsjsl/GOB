# Commande `//` - Script Test puis Push

Quand l'utilisateur écrit `//`, exécuter tests multi-dimensionnels (Code/Console/UI) puis push de manière optimisée.

**Séquence complète optimisée**:

## 1. ANALYSE DU CONTEXTE

Analyser la conversation récente pour identifier :
- **Fichiers modifiés** : Utiliser `grep`, `codebase_search`, et `git status`
- **Type de modification** : API/Backend, Frontend React, Scripts, SQL, Documentation
- **Concepts clés** : Mots-clés pour mapping vers tests pertinents

**Mapping contexte → tests** (voir `/st` pour détails complets) :
```
api/fmp-company-data-batch-sync.js → CODE (lints) + CONSOLE (test-batch-optimization.js)
public/3p1/App.tsx → CODE (lints) + UI (build 3p1)
public/js/dashboard/app-inline.js → CODE (lints) + UI (vérifier rendu)
scripts/test-*.js → CONSOLE (exécuter le script)
```

## 2. TESTS CODE

**Processus** :
1. `read_lints` sur tous les fichiers modifiés
2. Vérifier syntaxe TypeScript/JavaScript
3. Vérifier imports/exports
4. Consulter `docs/REPERTOIRE_COMPLET_ERREURS.md` pour patterns communs

**Critère** : 0 erreurs de lint avant de continuer

**Si échec** : Corriger et réessayer (max 3 tentatives)

## 3. TESTS CONSOLE

**Sélection du script** :
- Analyser le contexte pour identifier le script le plus pertinent
- Voir `/st` pour mapping détaillé contexte → scripts

**Processus** :
1. Identifier script pertinent (ex: `test-batch-optimization.js` pour batch endpoint)
2. Exécuter : `node scripts/test-[pertinent].js`
3. Analyser sortie :
   - ✅ Code 0 + logs positifs → Succès
   - ❌ Code non-0 ou erreurs → Corriger et réessayer (max 3 tentatives)
4. Si erreur 500/timeout → Attendre 2-5 min (déploiement Vercel) puis réessayer

**Critère** : Code de sortie 0 + logs confirmant le succès

**Si échec** : Corriger et réessayer (max 3 tentatives)

## 4. TESTS UI

**Déclencheurs** :
- Modifications dans `public/3p1/**/*.tsx` → Build 3p1
- Modifications dans `public/js/dashboard/**` → Vérifier rendu dashboard

**Processus** :
1. **Build 3p1** (si `public/3p1/` modifié) :
   ```bash
   cd public/3p1 && npm run build
   ```
   - Vérifier : 0 erreurs de compilation
   - Vérifier : Fichiers `dist/` générés

2. **Vérifier rendu dashboard** (si `public/js/dashboard/` modifié) :
   - Vérifier via `read_lints` que le code compile
   - Patterns : z-index, positioning, component exposure

**Critère** : Build réussi (0 erreurs) + composants accessibles

**Si échec** : Corriger et réessayer (max 3 tentatives)

## 5. TEST SCEPTIQUE RIGOUREUX 🔍

**Philosophie**: Ne jamais faire confiance à un succès apparent. Toujours vérifier en profondeur avant push.

### 5.1 Validation Multi-Niveaux (OBLIGATOIRE avant push)

| Niveau | Vérification | Commande/Action |
|--------|-------------|-----------------|
| **Syntaxe** | Code compile sans erreur | `read_lints` sur fichiers modifiés |
| **Runtime** | Pas d'erreurs console | Exécuter script de test |
| **Données** | Valeurs réelles, non-nulles | Vérifier data !== null/undefined |
| **Comportement** | Fonctionnalité opérationnelle | Test manuel ou automatisé |
| **Régression** | Pas de cassure ailleurs | Tests croisés sur composants liés |

### 5.2 Questions Sceptiques AVANT Push

**Ne jamais push sans répondre OUI à toutes ces questions** :

1. ❓ **Les données sont-elles réelles ?** (Pas juste un objet vide `{}` ou `[]`)
2. ❓ **Le test couvre-t-il le cas réel ?** (Pas juste un mock/stub)
3. ❓ **Ai-je testé les edge cases ?** (Valeurs nulles, chaînes vides, erreurs réseau)
4. ❓ **La fonctionnalité marche de bout en bout ?** (Pas juste une partie)
5. ❓ **Ai-je vérifié les composants liés ?** (Régression potentielle)
6. ❓ **Les logs/console sont-ils propres ?** (Pas d'avertissements cachés)

### 5.3 Vérifications Anti-Patterns

**Patterns d'erreurs fréquents** (référence: `docs/REPERTOIRE_COMPLET_ERREURS.md`) :

| Pattern Dangereux | Vérification |
|------------------|--------------|
| Variable avant `useState` | Ordre de déclaration correct ? |
| `z-index` insuffisant | Hiérarchie modals > dropdowns > content ? |
| Composant non exposé | `window.ComponentName = ComponentName` présent ? |
| Référence non définie | Protection `typeof var !== 'undefined'` ? |
| Données nulles | Fallback ou gestion d'erreur ? |

### 5.4 Checklist Finale Sceptique

**Valider TOUS ces points avant push** :

- [ ] ✅ Code compile (0 erreurs lint)
- [ ] ✅ Script termine avec code 0
- [ ] ✅ Données réelles retournées (pas vides)
- [ ] ✅ Fonctionnalité testée de bout en bout
- [ ] ✅ Pas de régression sur composants liés
- [ ] ✅ Console propre (pas d'erreurs/warnings cachés)
- [ ] ✅ Edge cases couverts (null, vide, erreur)

### 5.5 Si un doute persiste

**NE PAS PUSH** et :
1. Exécuter des tests supplémentaires
2. Vérifier les composants liés
3. Consulter `docs/REPERTOIRE_COMPLET_ERREURS.md` pour patterns connus
4. Tester manuellement la fonctionnalité

## 6. APPRENTISSAGE DES RÉSULTATS

Documenter les solutions dans la conversation pour éviter répétition :
- Erreurs de syntaxe → Patterns à éviter
- Erreurs runtime → Corrections appliquées
- Erreurs de build → Configurations nécessaires

## 7. CRÉATION DU MESSAGE DE COMMIT

**Format** : `[Type]: [Description concise]`

**Processus** :
1. Analyser le contexte pour déterminer le type (Fix/Feature/Docs/Refactor/Perf)
2. Extraire les concepts clés de la conversation
3. Créer description concise mais informative

**Exemples** :
- Batch endpoint modifié → `Fix: Batch endpoint key metrics avec includeKeyMetrics param`
- Nouveau composant → `Feature: SyncReportDialog avec export CSV/JSON et graphiques`
- Tests réussis → `Fix: [Description de la correction]` ou `Feature: [Description de la fonctionnalité]`

## 8. PUSH

**Séquence** :
```bash
git add [fichiers_pertinents]
git commit -m "[Type]: [Description]"
git push
```

**Critère** : Push réussi (code de sortie 0)

**Bonnes pratiques consolidées**:
- Ordre strict : Code → Console → UI → Push
- Ne push que si TOUS les tests passent (0 erreurs)
- Messages de commit descriptifs mais concis
- Analyser le contexte AVANT de choisir les tests
- Apprendre des patterns d'erreurs pour éviter répétition
- Maximum 3 tentatives par type de test avant d'informer l'utilisateur
- **Profils de synchronisation** : Inclure descriptions et détails ventilés pour chaque preset
- **Visibilité UI** : Sections importantes doivent avoir bordures épaisses, ombres, fonds colorés
- **Build 3p1** : Toujours inclure `dist/assets/index.js` et `dist/assets/index.css` dans le commit si composants modifiés
- **Tests de filtres** : Vérifier que les filtres retournent des résultats (créer scripts de test si nécessaire)
- **Stockage persistant** : Utiliser `storage` utility pour IndexedDB/localStorage, pas localStorage direct

**Exemple complet optimisé** :
1. Contexte : Batch endpoint modifié (`api/fmp-company-data-batch-sync.js`)
2. CODE : `read_lints` → 0 erreurs ✅
3. CONSOLE : `node scripts/test-batch-optimization.js` → Code 0 ✅
4. UI : Pas nécessaire (pas de modifications UI)
5. Commit : `Fix: Batch endpoint key metrics avec includeKeyMetrics param`
6. Push : `git add api/fmp-company-data-batch-sync.js && git commit -m "..." && git push` ✅

