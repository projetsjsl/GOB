# 📋 Rapport de Suppression des Tickers Internationaux

**Date:** 2026-01-11  
**Objectif:** Nettoyer Supabase pour ne garder que:
- ✅ **Canada** (toutes bourses)
- ✅ **US** (toutes bourses)  
- ✅ **ADR américains** (NYSE/NASDAQ) même si pays international

---

## 📊 Résultats de l'Analyse

**Total tickers actifs dans Supabase:** 1087  
**Tickers analysés:** 1000 (limite de requête)  
**Tickers à supprimer identifiés:** 5

---

## ❌ Liste des 5 Tickers à Supprimer

### 1. **MC.PA** - LVMH (France, Bourse Paris)
- **Entreprise:** LVMH Moët Hennessy - Louis Vuitton, Société Européenne
- **Pays:** FR (France)
- **Bourse:** PAR (Paris)
- **Secteur:** Consumer Cyclical
- **Source:** manual
- **ADR disponible:** ✅ **LVMHF** (OTC) - **Recommandation:** Ajouter LVMHF à la place

### 2. **OR.PA** - L'Oréal (France, Bourse Paris)
- **Entreprise:** L'Oréal S.A.
- **Pays:** FR (France)
- **Bourse:** PAR (Paris)
- **Secteur:** Consumer Defensive
- **Source:** manual
- **ADR disponible:** ✅ **LRLCY** (OTC) - **Recommandation:** Ajouter LRLCY à la place

### 3. **TECK.B** - Sunteck Realty (Inde, BSE)
- **Entreprise:** Sunteck Realty Limited
- **Pays:** IN (Inde)
- **Bourse:** BSE (Bombay Stock Exchange)
- **Secteur:** Real Estate
- **Source:** watchlist
- **ADR disponible:** ❌ Non disponible

### 4. **9984.T** - SoftBank (Japon, JPX)
- **Entreprise:** SoftBank Group Corp.
- **Pays:** JP (Japon)
- **Bourse:** JPX (Japan Exchange)
- **Secteur:** Communication Services
- **Source:** manual
- **ADR disponible:** ✅ **SFTBY** (OTC) - **Recommandation:** Ajouter SFTBY à la place

### 5. **SMSN.IL** - Samsung (Corée du Sud, IOB)
- **Entreprise:** Samsung Electronics Co., Ltd.
- **Pays:** KR (Corée du Sud)
- **Bourse:** IOB (Korea Exchange)
- **Secteur:** Technology
- **Source:** (non spécifié)
- **ADR disponible:** ❌ Non disponible direct (mais Samsung a des actions sur d'autres bourses)

---

## 🔄 Actions Recommandées

### Option A: Suppression Simple
Exécuter le script SQL pour désactiver ces 5 tickers.

### Option B: Remplacement par ADR (Recommandé)
Pour 3 des 5 tickers, remplacer par leurs ADR américains:

| Ticker Actuel | ADR Disponible | Action |
|--------------|----------------|--------|
| MC.PA | LVMHF (OTC) | ✅ Ajouter LVMHF, supprimer MC.PA |
| OR.PA | LRLCY (OTC) | ✅ Ajouter LRLCY, supprimer OR.PA |
| 9984.T | SFTBY (OTC) | ✅ Ajouter SFTBY, supprimer 9984.T |
| TECK.B | ❌ | ❌ Supprimer (pas d'ADR) |
| SMSN.IL | ❌ | ❌ Supprimer (pas d'ADR) |

---

## 📝 Script SQL de Suppression

```sql
-- Script de suppression de 5 tickers internationaux
-- Généré le 2026-01-11

-- LVMH (FR, PAR) - ADR disponible: LVMHF
UPDATE tickers SET is_active = false WHERE ticker = 'MC.PA';

-- L'Oréal (FR, PAR) - ADR disponible: LRLCY
UPDATE tickers SET is_active = false WHERE ticker = 'OR.PA';

-- Sunteck Realty (IN, BSE) - Pas d'ADR
UPDATE tickers SET is_active = false WHERE ticker = 'TECK.B';

-- SoftBank (JP, JPX) - ADR disponible: SFTBY
UPDATE tickers SET is_active = false WHERE ticker = '9984.T';

-- Samsung (KR, IOB) - Pas d'ADR direct
UPDATE tickers SET is_active = false WHERE ticker = 'SMSN.IL';
```

---

## ✅ Tickers ADR à Ajouter (Option B)

Si vous choisissez l'option B (remplacement par ADR), ajouter ces 3 tickers:

1. **LVMHF** - LVMH ADR (OTC)
2. **LRLCY** - L'Oréal ADR (OTC)
3. **SFTBY** - SoftBank ADR (OTC)

Ces ADR seront automatiquement conservés car ils sont sur OTC (bourse américaine).

---

## ⚠️ Notes Importantes

1. **Limite de requête:** Seulement 1000 tickers analysés sur 1087 total. Il pourrait y avoir d'autres tickers à supprimer.

2. **Vérification manuelle recommandée:** Vérifier tous les tickers avec:
   - Pays != US/CA
   - Bourse != NYSE/NASDAQ/AMEX/OTC

3. **Sauvegarde:** Sauvegarder les données avant suppression définitive.

4. **Filtres FMP:** Mettre à jour les filtres pour ne plus charger automatiquement ces bourses internationales.

---

## 📄 Fichiers Générés

- ✅ `docs/TICKERS_TO_DELETE.json` - Données complètes
- ✅ `docs/TICKERS_TO_DELETE.sql` - Script SQL
- ✅ `docs/LISTE_TICKERS_A_SUPPRIMER.md` - Ce document
- ✅ `scripts/identify-tickers-to-delete.js` - Script d'analyse
