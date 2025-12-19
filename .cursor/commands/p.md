# Commande `/p` - Push

Quand l'utilisateur écrit `/p`, exécuter un push intelligent en tenant compte du contexte et des bonnes pratiques apprises.

**Processus optimisé**:

## 1. ANALYSE DU CONTEXTE

Analyser la conversation récente pour identifier :
- **Fichiers modifiés** : 
  - Utiliser `grep` ou `codebase_search` pour trouver les fichiers mentionnés
  - Vérifier `git status` pour fichiers non commités
  - Examiner les appels d'outils récents (`read_file`, `write`, `search_replace`)
- **Type de modification** :
  - `Fix:` → Correction de bug/erreur
  - `Feature:` → Nouvelle fonctionnalité
  - `Docs:` → Documentation uniquement
  - `Refactor:` → Refactorisation sans changement fonctionnel
  - `Perf:` → Optimisation performance
- **Concepts clés** : Extraire les mots-clés de la conversation (ex: "batch endpoint", "sync options", "yield curve", etc.)

## 2. VÉRIFICATION PRÉ-PUSH

**Tests CODE** :
1. `read_lints` sur tous les fichiers modifiés identifiés
2. Si erreurs de lint → Corriger AVANT de push
3. Consulter `docs/REPERTOIRE_COMPLET_ERREURS.md` pour patterns communs :
   - Variables avant `useState` initializers
   - Z-index hierarchy
   - Component exposure pour Babel inline
   - Références protégées avec `typeof`

**Critère** : 0 erreurs de lint avant push

## 3. SÉLECTION DES FICHIERS

**Fichiers à inclure** :
- Fichiers modifiés dans la conversation récente
- Fichiers liés au contexte (ex: si `App.tsx` modifié, inclure `dist/index.js` si rebuild nécessaire)
- Exclure : fichiers temporaires, logs, fichiers générés automatiquement (sauf `dist/` si explicitement nécessaire)

**Commande** : `git add [fichiers_pertinents]`

## 4. CRÉATION DU MESSAGE DE COMMIT

**Format** : `[Type]: [Description concise]`

**Exemples basés sur contexte** :
- Batch endpoint modifié → `Fix: Batch endpoint key metrics avec includeKeyMetrics param`
- Nouveau composant → `Feature: SyncReportDialog avec export CSV/JSON et graphiques`
- Documentation → `Docs: Ajout tests multi-dimensionnels aux commandes /st et //`
- Refactor → `Refactor: Extraction NouvellesTab depuis MarketsEconomyTab`
- Performance → `Perf: Optimisation RLS policies et ajout materialized view`

**Règles** :
- Description concise mais informative (max 80 caractères idéalement)
- Inclure détails techniques importants (noms de fichiers, paramètres, etc.)
- Éviter messages génériques ("Auto-commit", "Update", "Fix")

## 5. EXÉCUTION DU PUSH

**Séquence** :
```bash
git add [fichiers]
git commit -m "[Type]: [Description]"
git push
```

**Vérification post-push** :
- Confirmer que le push a réussi (code de sortie 0)
- Informer l'utilisateur du succès

**Bonnes pratiques consolidées**:
- Toujours vérifier les lints avant push
- Messages de commit descriptifs mais concis
- Ne commit que les fichiers pertinents au contexte
- Analyser le contexte AVANT de créer le message de commit
- Éviter les commits génériques "Auto-commit"
- **Profils de synchronisation** : Inclure descriptions complètes et détails ventilés pour chaque preset
- **Visibilité UI** : Améliorer visibilité avec bordures épaisses (border-2), ombres (shadow-sm), fonds colorés
- **Build 3p1** : Toujours inclure fichiers `dist/` si composants React modifiés
- **Stockage persistant** : Utiliser `storage` utility (IndexedDB/localStorage) au lieu de localStorage direct
- **Tests de filtres** : Créer scripts de test pour valider que filtres fonctionnent et retournent des résultats

