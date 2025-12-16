# ✅ Correction : Team et Watchlist Mutuellement Exclusifs

## 🎯 Règle Importante

**Un ticker ne peut être soit team (portefeuille), soit watchlist, mais PAS les deux.**

---

## ✅ État Final Corrigé

### Watchlist (3 tickers uniquement)
- ✅ **NVDA** - NVIDIA Corporation
- ✅ **SNY** - Sanofi
- ✅ **J** - Jacobs Solutions Inc.

**Aucun de ces tickers n'est en team (portefeuille).**

### Team / Portefeuille (25 tickers uniquement)
Les 25 team tickers sont **pure team** (category='team', pas de watchlist) :
- BCE, BNS, CNR, CSCO, CVS, DEO, GOOGL, JNJ, JPM, LVMHF, MDT, MFC, MG, MU, NKE, NSRGY, NTR, PFE, T, TD, TRP, UL, UNH, VZ, WFC

**Aucun de ces tickers n'est en watchlist.**

### Tickers sans particularité
- Tous les autres tickers : category='manual'
- Pas d'étoile (team)
- Pas d'œil (watchlist)

---

## ✅ Validation

- ✅ **3 tickers en watchlist** : NVDA, SNY, J (sans team)
- ✅ **25 tickers en team** : Tous pure team (sans watchlist)
- ✅ **Aucun ticker avec les deux** : Team et watchlist sont mutuellement exclusifs
- ✅ **789 tickers sans particularité** : category='manual'

---

## 🔍 Requêtes de Vérification

### Vérifier qu'aucun ticker n'est à la fois team ET watchlist
```sql
SELECT ticker, category, categories
FROM tickers
WHERE is_active = true
AND 'team' = ANY(categories)
AND 'watchlist' = ANY(categories);
-- Doit retourner 0 résultats
```

### Récupérer la watchlist (sans team)
```sql
SELECT ticker, category, categories, company_name
FROM tickers
WHERE is_active = true
AND 'watchlist' = ANY(categories)
AND NOT ('team' = ANY(categories))
ORDER BY ticker;
```

### Récupérer les team tickers (sans watchlist)
```sql
SELECT ticker, category, categories, company_name
FROM tickers
WHERE is_active = true
AND 'team' = ANY(categories)
AND NOT ('watchlist' = ANY(categories))
ORDER BY ticker;
```


