# 📋 Liste des Tickers à Supprimer de Supabase

**Date:** 2026-01-11  
**Objectif:** Nettoyer la base de données pour ne garder que:
- ✅ **Canada** (toutes bourses)
- ✅ **US** (toutes bourses)
- ✅ **International ADR américains** (NYSE/NASDAQ uniquement, même si pays != US/CA)

---

## 🎯 Critères de Suppression

### ❌ À SUPPRIMER:
1. **Pays:** Tous sauf United States, Canada, US, CA
2. **Bourses internationales:** Toutes sauf NYSE, NASDAQ, AMEX, OTC (pour ADR)
3. **Exception:** Garder les ADR américains (NYSE/NASDAQ) même si pays != US/CA

### ✅ À CONSERVER:
1. **Pays US/Canada** (peu importe la bourse)
2. **ADR américains** (NYSE/NASDAQ) même si pays international
3. **Bourses canadiennes** (TSX, TSXV, TSE, etc.)

---

## 📊 Résultats de l'Analyse

**Total tickers actifs:** 1000  
**À conserver:** 995  
**À supprimer:** 5

### Tickers identifiés à supprimer:

1. **MC.PA** - LVMH Moët Hennessy - Louis Vuitton (FR, PAR)
2. **OR.PA** - L'Oréal S.A. (FR, PAR)
3. **TECK.B** - Sunteck Realty Limited (IN, BSE)
4. **9984.T** - SoftBank Group Corp. (JP, JPX)
5. **SMSN.IL** - Samsung Electronics Co., Ltd. (KR, IOB)

---

## 📝 Notes Importantes

### Pourquoi ces tickers sont-ils à supprimer?

1. **MC.PA et OR.PA (France):**
   - Bourse: PAR (Paris)
   - Pays: FR (France)
   - ❌ Pas d'ADR américain disponible
   - ✅ **Note:** LVMH et L'Oréal ont des ADR américains (LVMHF, LRLCY sur OTC), mais ces versions PAR ne sont pas des ADR

2. **TECK.B (Inde):**
   - Bourse: BSE (Bombay Stock Exchange)
   - Pays: IN (Inde)
   - ❌ Bourse indienne, pas d'ADR américain

3. **9984.T (Japon):**
   - Bourse: JPX (Japan Exchange)
   - Pays: JP (Japon)
   - ❌ Bourse japonaise, pas d'ADR américain
   - ✅ **Note:** SoftBank a un ADR (SFTBY sur OTC), mais cette version JPX n'est pas un ADR

4. **SMSN.IL (Corée du Sud):**
   - Bourse: IOB (Korea Exchange)
   - Pays: KR (Corée du Sud)
   - ❌ Bourse coréenne, pas d'ADR américain

---

## 🔍 Vérification ADR Disponibles

Pour les entreprises internationales listées ci-dessus, vérifier si des ADR américains existent:

- **LVMH:** LVMHF (OTC) - ✅ ADR disponible
- **L'Oréal:** LRLCY (OTC) - ✅ ADR disponible  
- **SoftBank:** SFTBY (OTC) - ✅ ADR disponible
- **Samsung:** Pas d'ADR américain direct

**Recommandation:** Si des ADR existent pour ces entreprises, les ajouter manuellement avec le symbole ADR (ex: LVMHF au lieu de MC.PA).

---

## 🚀 Actions à Effectuer

1. **Exécuter le script SQL de suppression** (`docs/TICKERS_TO_DELETE.sql`)
2. **Vérifier les ADR disponibles** pour les entreprises supprimées
3. **Ajouter manuellement les ADR** si souhaité (ex: LVMHF, LRLCY, SFTBY)
4. **Mettre à jour les filtres FMP** pour ne plus charger ces tickers automatiquement

---

## 📄 Fichiers Générés

- `docs/TICKERS_TO_DELETE.json` - Données complètes en JSON
- `docs/TICKERS_TO_DELETE.sql` - Script SQL de suppression
- `scripts/identify-tickers-to-delete.js` - Script d'analyse

---

## ⚠️ Avertissement

**AVANT DE SUPPRIMER:**
- Vérifier que ces tickers ne sont pas dans des portefeuilles actifs
- Sauvegarder les données importantes
- Confirmer avec l'utilisateur avant suppression définitive
