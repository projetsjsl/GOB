# 📋 Liste Finale des Tickers à Supprimer

**Date:** 2026-01-11  
**Total analysé:** 1087 tickers actifs  
**À supprimer:** 9 tickers

---

## ❌ Liste Complète des 9 Tickers à Supprimer

### 1. **MC.PA** - LVMH (France, Bourse Paris)
- **Entreprise:** LVMH Moët Hennessy - Louis Vuitton, Société Européenne
- **Pays:** FR (France)
- **Bourse:** PAR (Paris)
- **Secteur:** Consumer Cyclical
- **ADR disponible:** ✅ **LVMHF** (OTC)

### 2. **OR.PA** - L'Oréal (France, Bourse Paris)
- **Entreprise:** L'Oréal S.A.
- **Pays:** FR (France)
- **Bourse:** PAR (Paris)
- **Secteur:** Consumer Defensive
- **ADR disponible:** ✅ **LRLCY** (OTC)

### 3. **TECK.B** - Sunteck Realty (Inde, BSE)
- **Entreprise:** Sunteck Realty Limited
- **Pays:** IN (Inde)
- **Bourse:** BSE (Bombay Stock Exchange)
- **Secteur:** Real Estate
- **ADR disponible:** ❌ Non disponible

### 4. **9984.T** - SoftBank (Japon, JPX)
- **Entreprise:** SoftBank Group Corp.
- **Pays:** JP (Japon)
- **Bourse:** JPX (Japan Exchange)
- **Secteur:** Communication Services
- **ADR disponible:** ✅ **SFTBY** (OTC)

### 5. **SMSN.IL** - Samsung (Corée du Sud, IOB)
- **Entreprise:** Samsung Electronics Co., Ltd.
- **Pays:** KR (Corée du Sud)
- **Bourse:** IOB (Korea Exchange)
- **Secteur:** Technology
- **ADR disponible:** ❌ Non disponible direct

### 6. **HSBA** - (Pays/Bourse non spécifiés)
- **Entreprise:** N/A
- **Pays:** N/A
- **Bourse:** N/A
- **Raison:** Données incomplètes (probablement HSBC Holdings - LSE)

### 7. **LVMH** - (Pays/Bourse non spécifiés)
- **Entreprise:** N/A
- **Pays:** N/A
- **Bourse:** N/A
- **Raison:** Données incomplètes (doublon de MC.PA?)

### 8. **NESN** - (Pays/Bourse non spécifiés)
- **Entreprise:** N/A
- **Pays:** N/A
- **Bourse:** N/A
- **Raison:** Données incomplètes (probablement Nestlé - SWX)

### 9. **ULVR** - (Pays/Bourse non spécifiés)
- **Entreprise:** N/A
- **Pays:** N/A
- **Bourse:** N/A
- **Raison:** Données incomplètes (probablement Unilever - LSE)

---

## 🔄 Actions Recommandées

### Option A: Suppression Simple
Exécuter le script SQL pour désactiver ces 9 tickers.

### Option B: Remplacement par ADR (Recommandé pour 3 tickers)
Pour LVMH, L'Oréal et SoftBank, remplacer par leurs ADR:

| Ticker Actuel | ADR Disponible | Action |
|--------------|----------------|--------|
| MC.PA | LVMHF (OTC) | ✅ Ajouter LVMHF, supprimer MC.PA |
| OR.PA | LRLCY (OTC) | ✅ Ajouter LRLCY, supprimer OR.PA |
| 9984.T | SFTBY (OTC) | ✅ Ajouter SFTBY, supprimer 9984.T |
| LVMH | LVMHF (OTC) | ✅ Ajouter LVMHF, supprimer LVMH (doublon) |

---

## 📝 Script SQL de Suppression

Le script complet est dans `docs/TICKERS_TO_DELETE.sql`

```sql
-- Script de suppression de 9 tickers
UPDATE tickers SET is_active = false WHERE ticker IN (
  'MC.PA',    -- LVMH (FR, PAR) - ADR: LVMHF
  'OR.PA',    -- L'Oréal (FR, PAR) - ADR: LRLCY
  'TECK.B',   -- Sunteck Realty (IN, BSE)
  '9984.T',   -- SoftBank (JP, JPX) - ADR: SFTBY
  'SMSN.IL',  -- Samsung (KR, IOB)
  'HSBA',     -- Données incomplètes
  'LVMH',     -- Données incomplètes (doublon?)
  'NESN',     -- Données incomplètes
  'ULVR'      -- Données incomplètes
);
```

---

## ✅ Résumé

- **Total à supprimer:** 9 tickers
- **Avec ADR disponible:** 4 tickers (MC.PA, OR.PA, 9984.T, LVMH)
- **Sans ADR:** 5 tickers (TECK.B, SMSN.IL, HSBA, NESN, ULVR)
- **Données incomplètes:** 4 tickers (HSBA, LVMH, NESN, ULVR)

---

## ⚠️ Prochaines Étapes

1. ✅ Liste complète générée
2. ⏳ Exécuter le script SQL de suppression
3. ⏳ Ajouter les ADR (LVMHF, LRLCY, SFTBY) si souhaité
4. ⏳ Mettre à jour les filtres FMP pour éviter de recharger ces bourses
