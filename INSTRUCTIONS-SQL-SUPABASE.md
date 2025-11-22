# 🚀 Instructions SQL Supabase - Emma Config

## ⚠️ CRITIQUE: 2 Fichiers SQL à Exécuter

Vous devez exécuter **2 fichiers SQL** dans cet ordre:

---

## 📝 ÉTAPE 1: Configuration Base de Données

### Fichier: `supabase-prompt-delivery-config-FIXED.sql`

**Ce qu'il fait**:
- ✅ Ajoute colonnes: `prompt_id`, `prompt_number`, `email_recipients`, `delivery_enabled`, `delivery_schedule`
- ✅ Crée index pour performance
- ✅ Crée vue `prompt_delivery_configs`
- ✅ Crée fonction RPC `get_prompt_delivery_config()`

**Instructions**:
1. Ouvrir https://supabase.com
2. Sélectionner votre projet GOB
3. Cliquer "SQL Editor" (menu gauche)
4. Copier TOUT le contenu de: `supabase-prompt-delivery-config-FIXED.sql`
5. Coller dans l'éditeur SQL
6. Cliquer **"Run"** (ou Ctrl+Enter)
7. Vérifier: ✅ "Success. No rows returned"

---

## 📝 ÉTAPE 2: Migration des Prompts Manquants

### Fichier: `migrate-missing-prompts-to-supabase.sql`

**Ce qu'il fait**:
- ✅ Ajoute **8 prompts critiques** manquants:
  - `briefing_morning` (Briefing 7h20 AM)
  - `briefing_midday` (Briefing 11h50 AM)
  - `briefing_evening` (Briefing 16h20 PM)
  - `cfa_standards` (Standards CFA®)
  - `cfa_perplexity_priority` (Priorité Perplexity)
  - `intent_fundamentals` (Analyse fondamentale)
  - `intent_comparative_analysis` (Analyse comparative)
  - `intent_comprehensive_analysis` (Analyse complète)

**Instructions**:
1. **APRÈS avoir exécuté ÉTAPE 1**
2. Dans le même SQL Editor
3. Copier TOUT le contenu de: `migrate-missing-prompts-to-supabase.sql`
4. Coller dans l'éditeur SQL
5. Cliquer **"Run"** (ou Ctrl+Enter)
6. Vérifier: ✅ Devrait afficher un tableau avec 8 prompts

**Résultat attendu**:
```
+---------------------------+--------------------------------+
| key                       | description                    |
+---------------------------+--------------------------------+
| briefing_morning          | Configuration briefing matinal |
| briefing_midday           | Configuration briefing midi    |
| briefing_evening          | Configuration briefing soirée  |
| cfa_standards             | Standards d'excellence CFA®    |
| cfa_perplexity_priority   | Priorité Perplexity           |
| intent_fundamentals       | Prompt pour fondamentaux       |
| intent_comparative_...    | Prompt pour comparatifs        |
| intent_comprehensive_...  | Prompt pour analyses complètes |
+---------------------------+--------------------------------+
```

---

## ✅ ÉTAPE 3: Vérification

### Test 1: Compter les prompts
Dans Supabase SQL Editor:
```sql
SELECT COUNT(*) as total_prompts FROM emma_config;
```
**Attendu**: Au moins 15 prompts (7 existants + 8 nouveaux)

### Test 2: Vérifier les briefings
```sql
SELECT key, prompt_id, prompt_number, description
FROM emma_config
WHERE key LIKE 'briefing_%'
ORDER BY prompt_number;
```
**Attendu**: 3 lignes (morning, midday, evening)

### Test 3: Tester l'API
Dans votre terminal local:
```bash
node check-missing-prompts.js
```
**Attendu**: ✅ 9/9 prompts présents (au lieu de 1/9)

### Test 4: Interface Emma Config
1. Ouvrir: https://gobapps.com/emma-config.html
2. Rafraîchir la page (Ctrl+R)
3. Vérifier la liste: Vous devriez voir **15+ prompts**
4. Chercher "briefing" → 3 résultats (morning, midday, evening)

---

## 🎯 RÉSULTAT FINAL

Après avoir exécuté les 2 fichiers SQL:

### APIs (4/4 fonctionnels)
- ✅ `/api/admin/emma-config` - Liste complète (15+ prompts)
- ✅ `/api/email-design` - Design emails
- ✅ `/api/prompt-delivery-config` - Prompts actifs
- ✅ `/api/prompt-delivery-config?prompt_id=briefing_morning` - Config spécifique

### Interface Emma Config
- ✅ **15+ prompts** dans la liste (au lieu de 7)
- ✅ 3 briefings configurables (morning, midday, evening)
- ✅ Section "📧 Destinataires Email" fonctionnelle
- ✅ Planification automatique des briefings

---

## 🆘 TROUBLESHOOTING

### Erreur: "duplicate key value violates unique constraint"
**Normal!** Signifie que certains prompts existent déjà.
**Solution**: Continuer, le SQL utilise `ON CONFLICT DO UPDATE`

### Erreur: "column 'prompt_id' does not exist"
**Cause**: ÉTAPE 1 pas exécutée
**Solution**: Exécuter `supabase-prompt-delivery-config-FIXED.sql` AVANT

### Aucun prompt affiché dans emma-config.html après SQL
**Causes possibles**:
1. Cache navigateur → Ctrl+Shift+R (hard refresh)
2. API non déployée → Attendre 30 secondes
3. Console errors → F12 → Vérifier erreurs JavaScript

### "Success. No rows returned" est-ce normal?
**Oui!** Pour ÉTAPE 1 (création colonnes/vues/fonctions)
**Non!** Pour ÉTAPE 2 (devrait afficher tableau de 8 prompts)

---

## ⏱️ TEMPS REQUIS

- **ÉTAPE 1**: 2 minutes
- **ÉTAPE 2**: 2 minutes
- **Vérification**: 1 minute
- **TOTAL**: ~5 minutes

---

## 📚 FICHIERS CONCERNÉS

- ✅ `supabase-prompt-delivery-config-FIXED.sql` - Structure DB
- ✅ `migrate-missing-prompts-to-supabase.sql` - Migration prompts
- ✅ `check-missing-prompts.js` - Script de vérification
- ✅ `INSTRUCTIONS-SQL-SUPABASE.md` - Ce guide

---

**🎉 Une fois terminé, emma-config.html sera 100% fonctionnel avec tous les prompts!**
