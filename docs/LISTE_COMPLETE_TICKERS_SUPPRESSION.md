# 📋 Liste Complète des Tickers à Supprimer

## Résumé Exécutif

**Total à supprimer:** 5 tickers  
**Raison:** Bourses internationales non-US/non-CA, pas d'ADR américain disponible

---

## Liste Détaillée

### 1. MC.PA
- **Entreprise:** LVMH Moët Hennessy - Louis Vuitton, Société Européenne
- **Pays:** FR (France)
- **Bourse:** PAR (Paris)
- **Secteur:** Consumer Cyclical
- **Source:** manual
- **ADR disponible:** ✅ LVMHF (OTC) - À ajouter manuellement si souhaité

### 2. OR.PA
- **Entreprise:** L'Oréal S.A.
- **Pays:** FR (France)
- **Bourse:** PAR (Paris)
- **Secteur:** Consumer Defensive
- **Source:** manual
- **ADR disponible:** ✅ LRLCY (OTC) - À ajouter manuellement si souhaité

### 3. TECK.B
- **Entreprise:** Sunteck Realty Limited
- **Pays:** IN (Inde)
- **Bourse:** BSE (Bombay Stock Exchange)
- **Secteur:** Real Estate
- **Source:** watchlist
- **ADR disponible:** ❌ Non disponible

### 4. 9984.T
- **Entreprise:** SoftBank Group Corp.
- **Pays:** JP (Japon)
- **Bourse:** JPX (Japan Exchange)
- **Secteur:** Communication Services
- **Source:** manual
- **ADR disponible:** ✅ SFTBY (OTC) - À ajouter manuellement si souhaité

### 5. SMSN.IL
- **Entreprise:** Samsung Electronics Co., Ltd.
- **Pays:** KR (Corée du Sud)
- **Bourse:** IOB (Korea Exchange)
- **Secteur:** Technology
- **Source:** (non spécifié)
- **ADR disponible:** ❌ Non disponible (mais Samsung a des actions sur d'autres bourses)

---

## 🔄 Actions Recommandées

### Option 1: Suppression Pure
Exécuter le script SQL pour désactiver ces 5 tickers.

### Option 2: Remplacement par ADR
Pour LVMH, L'Oréal et SoftBank, remplacer par leurs ADR:
- MC.PA → LVMHF (OTC)
- OR.PA → LRLCY (OTC)
- 9984.T → SFTBY (OTC)

### Option 3: Garder Temporairement
Garder ces tickers mais ne plus les charger automatiquement depuis FMP.

---

## 📝 Script SQL de Suppression

```sql
-- Désactiver les tickers internationaux non-ADR
UPDATE tickers SET is_active = false WHERE ticker IN (
  'MC.PA',    -- LVMH (FR, PAR) - ADR disponible: LVMHF
  'OR.PA',    -- L'Oréal (FR, PAR) - ADR disponible: LRLCY
  'TECK.B',   -- Sunteck Realty (IN, BSE) - Pas d'ADR
  '9984.T',   -- SoftBank (JP, JPX) - ADR disponible: SFTBY
  'SMSN.IL'   -- Samsung (KR, IOB) - Pas d'ADR direct
);
```

---

## ✅ Tickers à Ajouter (ADR)

Si vous souhaitez conserver ces entreprises via leurs ADR:

1. **LVMHF** (LVMH ADR sur OTC)
2. **LRLCY** (L'Oréal ADR sur OTC)
3. **SFTBY** (SoftBank ADR sur OTC)

Ces ADR seront automatiquement conservés car ils sont sur OTC (bourse américaine).
