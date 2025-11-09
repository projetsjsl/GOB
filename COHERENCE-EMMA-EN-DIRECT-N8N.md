# ✅ Cohérence Emma En Direct - n8n Workflow

## 🎯 Vérification de Cohérence Complète

### **1. Types de Briefing Identiques**

| Source | Types Supportés | Normalisation |
|--------|----------------|---------------|
| **Site Emma En Direct** | `morning`, `midday`, `evening` | `noon` → `midday` |
| **n8n Workflow** | `morning`, `midday`, `evening` | `noon` → `midday` |
| **API `/api/briefing`** | `morning`, `midday`, `evening`, `custom` | `noon` → `midday` |
| **API `/api/briefing-prompts`** | `morning`, `midday`, `evening` | - |

✅ **Résultat** : Types identiques partout

---

### **2. Source des Prompts Unifiée**

#### **Source Unique : GitHub**
- **Fichier** : `config/briefing-prompts.json`
- **Structure** :
  ```json
  {
    "morning": { "prompt": "...", "name": "...", ... },
    "midday": { "prompt": "...", "name": "...", ... },
    "evening": { "prompt": "...", "name": "...", ... }
  }
  ```

#### **Accès via API**
- **Endpoint** : `/api/briefing-prompts`
- **GET** : Récupère tous les prompts ou un type spécifique
- **PUT/POST** : Modifie un prompt (sauvegarde dans GitHub)

#### **Utilisation**
| Système | Comment il récupère les prompts |
|---------|--------------------------------|
| **Site Emma En Direct** | `fetch('/api/briefing-prompts')` → Affiche et permet modification |
| **n8n Workflow** | Nœud "Fetch Prompts from API" → `/api/briefing-prompts` |
| **API `/api/briefing`** | `loadBriefingConfig()` → Lit `config/briefing-prompts.json` |

✅ **Résultat** : Source unique, synchronisation automatique

---

### **3. Génération de Briefings**

#### **Site Emma En Direct**
```javascript
// Dans EmailPreviewManager
const response = await fetch(`/api/briefing?type=${previewType}`);
// Types: 'morning', 'midday', 'evening', 'custom'
```

#### **n8n Workflow**
```javascript
// Dans "Determine Time-Based Prompt"
if (data.briefing_type || data.prompt_type) {
  const selectedType = (data.briefing_type || data.prompt_type).toLowerCase();
  // Types: 'morning', 'midday', 'evening'
}
```

#### **API `/api/briefing`**
```javascript
let briefingType = req.query.type || req.body?.type;
// Normalise: 'noon' → 'midday'
// Types valides: 'morning', 'midday', 'evening', 'custom'
```

✅ **Résultat** : Même logique de génération, mêmes types

---

### **4. Flux de Données Complet**

```
┌─────────────────────────────────────────────────────────┐
│  SOURCE UNIQUE : config/briefing-prompts.json (GitHub)  │
└─────────────────────────────────────────────────────────┘
                        │
                        ├─→ /api/briefing-prompts
                        │   ├─→ Site Emma En Direct (GET/PUT)
                        │   └─→ n8n Workflow (GET)
                        │
                        └─→ /api/briefing
                            ├─→ Site Emma En Direct (GET ?type=...)
                            └─→ n8n Workflow (via /api/chat)
```

---

### **5. Modifications dans n8n**

#### **Nœud "🎯 Manual Briefing Selector (MODIFIEZ ICI)"**
- **Champ `briefing_type`** : `"morning"`, `"midday"`, ou `"evening"`
- **Champ `prompt_type`** : Même valeur que `briefing_type`
- **Champ `custom_prompt`** : Vide pour utiliser GitHub, rempli pour prompt personnalisé

#### **Nœud "Determine Time-Based Prompt"**
- **Priorité 1** : `custom_prompt` (si fourni)
- **Priorité 2** : `briefing_type` ou `prompt_type` (sélection manuelle)
- **Priorité 3** : Détermination automatique selon l'heure (Schedule Trigger)

#### **Nœud "Fetch Prompts from API"**
- **URL** : `https://gob-projetsjsls-projects.vercel.app/api/briefing-prompts`
- **Méthode** : GET
- **Réponse** : `{ success: true, prompts: { morning: {...}, midday: {...}, evening: {...} } }`

---

### **6. Interface Site Emma En Direct**

#### **Onglet "Emma En Direct"**
- **Section "Gestion des Prompts"** :
  - Affiche les prompts depuis `/api/briefing-prompts`
  - Permet modification et sauvegarde (PUT vers `/api/briefing-prompts`)
  - Tabs : Matin / Midi / Soir

- **Section "Génération de Briefings"** :
  - Sélecteur de type : Matin / Midi / Soir
  - Appel à `/api/briefing?type=morning|midday|evening`
  - Prévisualisation HTML

- **Section "Destinataires"** :
  - Gestion des emails actifs par type (`morning`, `midday`, `evening`)
  - Sauvegarde dans Supabase
  - Utilisé par n8n pour déterminer les destinataires

---

### **7. Avantages de cette Architecture**

✅ **Synchronisation Automatique**
- Les prompts modifiés dans le site sont immédiatement disponibles dans n8n
- Aucune duplication de code ou de configuration

✅ **Source Unique de Vérité**
- Tous les prompts dans `config/briefing-prompts.json`
- Modifications via l'API sauvegardées dans GitHub

✅ **Cohérence Garantie**
- Mêmes types partout (`morning`, `midday`, `evening`)
- Même normalisation (`noon` → `midday`)
- Même structure de données

✅ **Test Facile**
- Test manuel dans n8n avec sélection du type
- Test dans le site avec prévisualisation
- Même résultat garanti

---

### **8. Checklist de Vérification**

- [x] Types identiques : `morning`, `midday`, `evening`
- [x] Normalisation identique : `noon` → `midday`
- [x] Source unique : `config/briefing-prompts.json`
- [x] API unifiée : `/api/briefing-prompts`
- [x] Génération cohérente : `/api/briefing`
- [x] n8n récupère depuis GitHub via API
- [x] Site récupère depuis GitHub via API
- [x] Modifications synchronisées automatiquement

---

## 🎉 Conclusion

**Tout est parfaitement cohérent !** 

- ✅ Les modifications dans n8n utilisent les mêmes prompts que le site
- ✅ Les types de briefing sont identiques partout
- ✅ La source est unique (GitHub) et synchronisée automatiquement
- ✅ Vous pouvez tester chaque briefing individuellement dans n8n
- ✅ Les modifications dans le site sont immédiatement disponibles dans n8n

**Vous pouvez utiliser n8n et le site Emma En Direct en toute confiance - ils sont parfaitement synchronisés !** 🚀

