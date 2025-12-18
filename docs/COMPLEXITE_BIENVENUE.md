# Pourquoi c'est compliqué ? 🤔

## Problèmes de complexité identifiés

### 1. **Multiple sources de vérité** (3 états différents)
```javascript
// 1. Templates de la DB (structure)
taskTemplates = [{ id: 1, title: "...", phase_id: 1 }]

// 2. Statuts par employé (séparé)
employeeTasks = { 
  [employeeId]: { 
    [templateId]: "completed" 
  } 
}

// 3. Tâches générées pour l'affichage (fusion des 2)
tasks = [{ id: "1-1", title: "...", status: "completed" }]
```

**Problème** : Synchronisation manuelle entre 3 états → bugs de sync

### 2. **Babel inline (compilation JSX en temps réel)**
- 2600+ lignes de JSX compilées dans le navigateur
- Lent au chargement
- Difficile à debugger
- Pas de type checking

### 3. **Mapping snake_case ↔ camelCase partout**
```javascript
// DB utilise snake_case
phase_id, day_offset, assigned_to

// React utilise camelCase  
phaseId, dayOffset, assignedTo

// Mapping manuel partout = erreurs faciles
```

### 4. **Gestion manuelle de la synchronisation**
- Optimistic updates (UI change avant DB)
- Rollback logic (si DB échoue)
- useEffect avec dépendances complexes
- Race conditions possibles

### 5. **Pas de state management centralisé**
- useState partout
- Pas de Redux/Zustand
- Logique dispersée

## Solutions possibles

### Option 1: Simplifier la structure de données
```javascript
// UNE SEULE source de vérité
tasks = [
  { 
    id: 1, 
    templateId: 1,
    employeeId: 1,
    status: "completed",  // Directement dans la tâche
    title: "...",
    ...
  }
]
```

### Option 2: Utiliser un build process
- Vite/Webpack pour précompiler JSX
- Plus rapide, meilleur debugging
- TypeScript possible

### Option 3: State management centralisé
- Zustand (simple) ou Redux
- Une seule source de vérité
- Actions claires

### Option 4: Simplifier le mapping DB
- Utiliser un ORM ou mapper automatique
- Ou accepter snake_case partout

## Recommandation

**Court terme** : Documenter la complexité actuelle (ce fichier)

**Moyen terme** : Refactoriser pour une seule source de vérité

**Long terme** : Build process + state management




