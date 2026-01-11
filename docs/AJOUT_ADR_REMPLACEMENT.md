# ✅ Ajout des ADR Américains

**Date:** 2026-01-11  
**Action:** Ajout de 3 ADR pour remplacer les tickers internationaux supprimés

---

## 📋 ADR Ajoutés

### 1. **LVMHF** - LVMH ADR
- **Entreprise:** LVMH Moët Hennessy - Louis Vuitton SE (ADR)
- **Pays:** FR (France)
- **Bourse:** OTC (Over-The-Counter)
- **Secteur:** Consumer Cyclical
- **Remplace:** MC.PA et LVMH

### 2. **LRLCY** - L'Oréal ADR
- **Entreprise:** L'Oréal S.A. (ADR)
- **Pays:** FR (France)
- **Bourse:** OTC (Over-The-Counter)
- **Secteur:** Consumer Defensive
- **Remplace:** OR.PA

### 3. **SFTBY** - SoftBank ADR
- **Entreprise:** SoftBank Group Corp. (ADR)
- **Pays:** JP (Japon)
- **Bourse:** OTC (Over-The-Counter)
- **Secteur:** Communication Services
- **Remplace:** 9984.T

---

## ✅ Statut

Tous les ADR ont été ajoutés avec succès dans Supabase avec:
- ✅ `is_active = true`
- ✅ `source = 'manual'`
- ✅ Informations complètes (pays, bourse, secteur)

---

## 🔄 Mapping Complet

| Ticker Supprimé | ADR Ajouté | Statut |
|----------------|------------|--------|
| MC.PA | LVMHF | ✅ Ajouté |
| LVMH | LVMHF | ✅ Ajouté (même ADR) |
| OR.PA | LRLCY | ✅ Ajouté |
| 9984.T | SFTBY | ✅ Ajouté |

---

## 📊 Résumé Final

- **Tickers supprimés:** 9
- **ADR ajoutés:** 3
- **Net:** -6 tickers internationaux, +3 ADR américains

Les ADR seront automatiquement:
- ✅ Chargés depuis FMP (bourse OTC américaine)
- ✅ Affichés dans l'application
- ✅ Disponibles pour analyse

---

## ⚠️ Notes

1. **OTC vs NYSE/NASDAQ:** Les ADR sur OTC sont moins liquides mais toujours accessibles via FMP
2. **Données FMP:** Les données financières seront chargées automatiquement lors de la première utilisation
3. **Synchronisation:** Ces ADR suivront le même processus de synchronisation que les autres tickers
