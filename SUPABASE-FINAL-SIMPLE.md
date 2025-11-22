# 🚀 SUPABASE - Setup Final Ultra-Simple

## ⚡ 1 SEUL FICHIER À EXÉCUTER

### Fichier: `supabase-setup-complete.sql`

**Ce qu'il fait (TOUT EN UN)**:
- ✅ Ajoute les colonnes manquantes (`type`, `category`, `prompt_id`, etc.)
- ✅ Insère les 8 prompts critiques (briefings, CFA, intents)
- ✅ Crée la vue `prompt_delivery_configs`
- ✅ Crée la fonction RPC `get_prompt_delivery_config()`
- ✅ Affiche la liste finale des prompts

---

## 📋 INSTRUCTIONS (2 minutes)

### Étape 1: Ouvrir Supabase
```
1. Aller sur https://supabase.com
2. Sélectionner votre projet GOB
3. Cliquer "SQL Editor" (menu gauche)
```

### Étape 2: Copier-Coller
```
1. Ouvrir le fichier: supabase-setup-complete.sql
2. Sélectionner TOUT (Cmd+A)
3. Copier (Cmd+C)
4. Coller dans Supabase SQL Editor
```

### Étape 3: Exécuter
```
1. Cliquer "Run" (ou Ctrl+Enter)
2. Attendre 2-3 secondes
```

### Étape 4: Vérifier le Résultat
```
Vous devriez voir un tableau avec ~15 lignes:

key                          | description                   | category
-----------------------------|-------------------------------|----------
briefing_morning             | Configuration briefing...     | briefing
briefing_midday              | Configuration briefing...     | briefing
briefing_evening             | Configuration briefing...     | briefing
cfa_identity                 | Identité et qualifications... | prompt
cfa_standards                | Standards d'excellence CFA®   | prompt
cfa_perplexity_priority      | Priorité d'utilisation...     | prompt
...

✅ Si vous voyez ce tableau = SUCCÈS!
```

---

## ✅ VÉRIFICATION POST-SETUP

### Test 1: Vérifier la base de données
Dans Supabase SQL Editor:
```sql
SELECT COUNT(*) as total FROM emma_config;
```
**Attendu**: Au moins 15 prompts

### Test 2: Tester l'API
Dans votre terminal:
```bash
node check-missing-prompts.js
```
**Attendu**: ✅ 9/9 prompts présents

### Test 3: Interface Emma Config
```
1. Ouvrir https://gobapps.com/emma-config.html
2. Rafraîchir (Ctrl+R)
3. Vérifier la liste → Devrait afficher 15+ prompts
4. Chercher "briefing" → 3 résultats
```

---

## 🆘 SI ERREUR

### "duplicate key value violates unique constraint"
**C'est NORMAL!** Signifie que certains prompts existent déjà.
→ Le SQL utilise `ON CONFLICT DO UPDATE`, donc ça continue automatiquement.

### "column does not exist"
**Vous avez oublié d'exécuter TOUT le fichier.**
→ Assurez-vous de copier TOUT le contenu (du début à la fin).

### Aucun résultat affiché
**Le SQL s'exécute en silence parfois.**
→ Exécutez manuellement la vérification:
```sql
SELECT key, description FROM emma_config ORDER BY key;
```

---

## 🎯 RÉSULTAT FINAL

Après ce SQL unique:
- ✅ 15+ prompts dans emma_config
- ✅ 3 briefings configurables (morning, midday, evening)
- ✅ API `/api/admin/emma-config` retourne tous les prompts
- ✅ API `/api/prompt-delivery-config` fonctionne
- ✅ Interface emma-config.html 100% opérationnelle

---

## ⏱️ TEMPS TOTAL: 2 minutes

1. Copier le fichier: 30 secondes
2. Coller dans Supabase: 10 secondes
3. Exécuter: 3 secondes
4. Vérifier: 1 minute

**C'est tout!** 🎉
