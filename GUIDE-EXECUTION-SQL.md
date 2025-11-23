# 🚀 GUIDE EXÉCUTION SQL - 2 MINUTES

## ✅ FICHIER À EXÉCUTER

**UN SEUL FICHIER**: `supabase-setup-complete.sql`

Ce fichier fait TOUT:
- ✅ Ajoute colonnes manquantes
- ✅ Insère les 8 prompts critiques (briefings + intents + CFA)
- ✅ Crée vue et fonction RPC
- ✅ Affiche la vérification

---

## 📋 INSTRUCTIONS (2 MINUTES)

### Étape 1: Ouvrir Supabase SQL Editor
1. Aller sur https://supabase.com
2. Sélectionner projet **GOB**
3. Cliquer **"SQL Editor"** (menu gauche)

### Étape 2: Copier-Coller le SQL
1. Ouvrir le fichier: `supabase-setup-complete.sql`
2. **Sélectionner TOUT** (Cmd+A ou Ctrl+A)
3. **Copier** (Cmd+C ou Ctrl+C)
4. **Coller** dans Supabase SQL Editor (Cmd+V ou Ctrl+V)

### Étape 3: Exécuter
1. Cliquer bouton **"Run"** (en haut à droite)
   - OU appuyer **Ctrl+Enter**
2. Attendre 2-3 secondes

### Étape 4: Vérifier le Résultat ✅

Vous devriez voir un tableau avec **~15 lignes**:

```
key                          | description                   | type   | category
-----------------------------|-------------------------------|--------|----------
briefing_morning             | Configuration briefing...     | json   | briefing
briefing_midday              | Configuration briefing...     | json   | briefing
briefing_evening             | Configuration briefing...     | json   | briefing
cfa_identity                 | Identité et qualifications... | string | prompt
cfa_standards                | Standards d'excellence CFA®   | string | prompt
cfa_perplexity_priority      | Priorité d'utilisation...     | string | prompt
intent_fundamentals          | Prompt pour fondamentaux      | string | prompt
intent_comparative_analysis  | Prompt pour comparatifs       | string | prompt
intent_comprehensive_analysis| Prompt pour analyses complètes| string | prompt
...
```

**Si vous voyez ce tableau = SUCCÈS!** 🎉

---

## 🧪 TESTS POST-SETUP

### Test 1: Compter les prompts
Dans Supabase SQL Editor:
```sql
SELECT COUNT(*) as total FROM emma_config;
```
**Attendu**: Au moins **15 prompts**

### Test 2: Vérifier les briefings
```sql
SELECT key, prompt_number, description
FROM emma_config
WHERE category = 'briefing'
ORDER BY prompt_number;
```
**Attendu**: 3 lignes (morning=1, midday=2, evening=3)

### Test 3: Tester l'API depuis votre terminal
```bash
node check-missing-prompts.js
```
**Attendu**: ✅ **9/9 prompts présents**

### Test 4: Interface Emma Config
1. Ouvrir https://gobapps.com/emma-config.html
2. **Rafraîchir** (Ctrl+Shift+R pour hard refresh)
3. Vérifier la liste → **15+ prompts** visibles
4. Chercher "briefing" → **3 résultats**

---

## 🆘 ERREURS POSSIBLES

### "duplicate key value violates unique constraint"
**C'est NORMAL!** Signifie que certains prompts existent déjà.
- Le SQL utilise `ON CONFLICT DO UPDATE`, donc ça continue automatiquement.
- ✅ Pas d'action requise

### "column does not exist"
**Vous n'avez pas copié TOUT le fichier.**
- Assurez-vous de sélectionner **du début à la fin** du fichier
- Re-copiez et re-exécutez

### Aucun tableau affiché après l'exécution
**Le SQL s'exécute parfois en silence.**
- Exécutez manuellement la vérification:
```sql
SELECT key, description, category FROM emma_config ORDER BY category, key;
```

### Interface emma-config.html ne montre pas les nouveaux prompts
**Cache navigateur**
- Appuyez **Ctrl+Shift+R** (Windows/Linux) ou **Cmd+Shift+R** (Mac)
- Ou ouvrez en navigation privée

---

## 🎯 RÉSULTAT FINAL ATTENDU

Après exécution:
- ✅ **15+ prompts** dans emma_config
- ✅ **3 briefings** (morning, midday, evening)
- ✅ **5 prompts intents/CFA**
- ✅ API `/api/admin/emma-config` retourne tous les prompts
- ✅ API `/api/prompt-delivery-config` fonctionne
- ✅ Interface **emma-config.html** 100% opérationnelle

---

## ⏱️ TEMPS TOTAL: 2 MINUTES

1. Ouvrir Supabase SQL Editor: **30 secondes**
2. Copier-coller le fichier: **30 secondes**
3. Exécuter: **5 secondes**
4. Vérifier résultat: **1 minute**

---

## 📞 SUPPORT

Si problème persiste après avoir suivi ce guide:
1. Vérifier console navigateur (F12 → Console) pour erreurs JavaScript
2. Vérifier Vercel logs pour erreurs API
3. Exécuter: `node check-missing-prompts.js` pour diagnostic détaillé

**C'est tout!** 🚀
