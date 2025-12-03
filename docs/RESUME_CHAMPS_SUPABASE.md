# Résumé : Champs Supabase - Table `tickers`

**Date** : 3 décembre 2025

---

## ✅ Champs Existants (Complets)

### Base
- ✅ `id`, `ticker`, `company_name`, `sector`, `industry`, `country`, `exchange`, `currency`
- ✅ `market_cap`, `is_active`, `source`, `priority`, `user_id`
- ✅ `target_price`, `stop_loss`, `notes`
- ✅ `added_date`, `last_scraped`, `scraping_enabled`, `created_at`, `updated_at`

### ValueLine Metrics
- ✅ `security_rank` (Financial Strength)
- ✅ `earnings_predictability`
- ✅ `price_growth`
- ✅ `persistence`
- ✅ `price_stability`
- ✅ `beta`
- ✅ `valueline_updated_at`

---

## ❌ Champs Manquants (À Ajouter)

### Phase 3 : Validation Corridor ValueLine

| Champ | Type | Description | Priorité |
|-------|------|-------------|----------|
| `valueline_proj_low_return` | DECIMAL(5,2) | Proj Low TTL Return | ✅ **Critique** |
| `valueline_proj_high_return` | DECIMAL(5,2) | Proj High TTL Return | ✅ **Critique** |
| `valueline_proj_low_price_gain` | DECIMAL(5,2) | Proj Price Low Gain | ⚠️ Optionnel |
| `valueline_proj_high_price_gain` | DECIMAL(5,2) | Proj Price High Gain | ⚠️ Optionnel |

---

## 📝 Script SQL à Exécuter

**Fichier** : `supabase-add-valueline-corridor.sql`

**Action** : Exécuter ce script dans Supabase SQL Editor pour ajouter les champs manquants.

---

## 📋 Champs Stockés dans Profil 3p1 (Pas dans Supabase)

Les métriques ValueLine initiales (growth rates, ratios) seront stockées dans `AnalysisProfile.valuelineInitial` (TypeScript), pas dans Supabase.

**Raison** : Ces métriques sont spécifiques à chaque analyse utilisateur et peuvent varier.

---

## ✅ Conclusion

**Statut** : ✅ **Structure presque complète**

**Action requise** :
1. ✅ Exécuter `supabase-add-valueline-corridor.sql` pour ajouter les champs du corridor
2. ✅ Mettre à jour `types.ts` (déjà fait)
3. ✅ Mettre à jour `tickersApi.ts` (déjà fait)

**Après exécution du script SQL** : ✅ **Structure complète pour les 3 phases**

---

**Document créé le** : 3 décembre 2025  
**Version** : 1.0

