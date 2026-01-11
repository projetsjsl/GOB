# ✅ Confirmation de Suppression des Tickers

**Date:** 2026-01-11  
**Action:** Désactivation de 9 tickers internationaux

---

## 📋 Tickers Désactivés

Les 9 tickers suivants ont été désactivés (`is_active = false`) dans Supabase:

1. ✅ **MC.PA** - LVMH (FR, PAR)
2. ✅ **OR.PA** - L'Oréal (FR, PAR)
3. ✅ **TECK.B** - Sunteck Realty (IN, BSE)
4. ✅ **9984.T** - SoftBank (JP, JPX)
5. ✅ **SMSN.IL** - Samsung (KR, IOB)
6. ✅ **HSBA** - Données incomplètes
7. ✅ **LVMH** - Données incomplètes (doublon)
8. ✅ **NESN** - Données incomplètes
9. ✅ **ULVR** - Données incomplètes

---

## 🔄 Prochaines Étapes Recommandées

### 1. Ajouter les ADR Disponibles (Optionnel)

Si vous souhaitez conserver ces entreprises via leurs ADR américains:

- **LVMHF** (OTC) - Remplace MC.PA et LVMH
- **LRLCY** (OTC) - Remplace OR.PA
- **SFTBY** (OTC) - Remplace 9984.T

### 2. Mettre à Jour les Filtres FMP

S'assurer que les filtres dans `App.tsx` et `tickersApi.ts` excluent automatiquement:
- Bourses internationales non-US/non-CA
- Tickers sans pays/bourse définis

### 3. Vérification

Les tickers désactivés ne seront plus:
- ✅ Chargés automatiquement depuis FMP
- ✅ Affichés dans la liste des tickers disponibles
- ✅ Synchronisés lors des mises à jour

Ils restent dans la base de données mais sont inactifs.

---

## 📊 Statistiques Finales

- **Total tickers actifs avant:** 1087
- **Tickers désactivés:** 9
- **Total tickers actifs après:** ~1078

---

## ⚠️ Note

Les tickers désactivés peuvent être réactivés manuellement si nécessaire en exécutant:
```sql
UPDATE tickers SET is_active = true WHERE ticker = 'TICKER_NAME';
```
