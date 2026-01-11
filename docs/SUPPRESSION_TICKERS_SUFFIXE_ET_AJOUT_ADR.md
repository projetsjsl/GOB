# ✅ Suppression des Tickers avec Suffixe et Ajout des ADR

**Date:** 2026-01-11  
**Action:** Suppression de tous les tickers avec suffixe (sauf .TO) SAUF les 3 .B, puis ajout des ADR américains

---

## 📋 Résumé des Actions

### ✅ Tickers Conservés (3 .B)

1. **ATD.B** - Alimentation Couche-Tard Inc. (CA, TSX)
2. **BBD.B** - Bombardier Inc. (CA, TSX)
3. **BRK.B** - YieldMax BRK.B Option Income Strategy ETF (US, AMEX)

**Raison:** Classes d'actions sur bourses US/CA principales

---

## ❌ Tickers Supprimés

**Total supprimé:** 38 tickers avec suffixe (sauf .B et .TO)

### Par Suffixe:
- **.L (26)** - London Stock Exchange
- **.MX (3)** - Mexican Stock Exchange
- **.ST (3)** - Stockholm Stock Exchange
- **.HK (2)** - Hong Kong Stock Exchange
- **.DE (2)** - XETRA (Deutsche Börse)
- **.F (1)** - Frankfurt Stock Exchange
- **.KQ (1)** - Korea Exchange

---

## ✅ ADR Ajoutés/Réactivés

Les ADR américains suivants ont été ajoutés ou réactivés pour remplacer les tickers supprimés:

### Bourses NYSE/NASDAQ (ADR Principaux)

1. **SHOP** - Shopify Inc. (NYSE) - Remplace 0VHA.L, 307.F
2. **ENB** - Enbridge Inc. (NYSE) - Remplace 0KTI.L
3. **RY** - Royal Bank of Canada (NYSE) - Remplace 0QKU.L
4. **TD** - The Toronto-Dominion Bank (NYSE) - Remplace 0VL8.L
5. **BMO** - Bank of Montreal (NYSE) - Remplace 0UKH.L
6. **BNS** - The Bank of Nova Scotia (NYSE) - Remplace 0UKI.L
7. **MFC** - Manulife Financial Corporation (NYSE) - Remplace 0V5H.L, 0945.HK
8. **SLF** - Sun Life Financial Inc. (NYSE) - Remplace 0VJA.L
9. **NTR** - Nutrien Ltd. (NYSE) - Remplace 0NHS.L
10. **FNV** - Franco-Nevada Corporation (NYSE) - Remplace 0QYZ.L
11. **AEM** - Agnico Eagle Mines Limited (NYSE) - Remplace 0R2J.L
12. **CCJ** - Cameco Corporation (NYSE) - Remplace 0R35.L
13. **LULU** - Lululemon Athletica Inc. (NASDAQ) - Remplace 0JVT.L
14. **QSR** - Restaurant Brands International Inc. (NYSE) - Remplace 0VFA.L
15. **WPM** - Wheaton Precious Metals Corp. (NYSE) - Remplace WPM.L, SII.DE
16. **K** - Kinross Gold Corporation (NYSE) - Remplace KIN2.DE
17. **GIB** - CGI Inc. (NYSE) - Remplace 0A18.L, CGI.L

---

## 📊 Statistiques Finales

- **Tickers supprimés:** 38
- **Tickers conservés (.B):** 3
- **ADR ajoutés/réactivés:** 17
- **Net:** -21 tickers internationaux, +17 ADR américains

---

## 🔄 Mapping Complet

| Ticker Supprimé | ADR Ajouté | Bourse | Statut |
|----------------|------------|--------|--------|
| 0VHA.L, 307.F | SHOP | NYSE | ✅ |
| 0KTI.L | ENB | NYSE | ✅ |
| 0QKU.L | RY | NYSE | ✅ |
| 0VL8.L | TD | NYSE | ✅ |
| 0UKH.L | BMO | NYSE | ✅ |
| 0UKI.L | BNS | NYSE | ✅ |
| 0V5H.L, 0945.HK | MFC | NYSE | ✅ |
| 0VJA.L | SLF | NYSE | ✅ |
| 0NHS.L | NTR | NYSE | ✅ |
| 0QYZ.L | FNV | NYSE | ✅ |
| 0R2J.L | AEM | NYSE | ✅ |
| 0R35.L | CCJ | NYSE | ✅ |
| 0JVT.L | LULU | NASDAQ | ✅ |
| 0VFA.L | QSR | NYSE | ✅ |
| WPM.L, SII.DE | WPM | NYSE | ✅ |
| KIN2.DE | K | NYSE | ✅ |
| 0A18.L, CGI.L | GIB | NYSE | ✅ |

---

## ⚠️ Tickers Supprimés SANS ADR Disponible

Certains tickers ont été supprimés car ils n'ont pas d'ADR américain direct:

- **AAPL.MX, XOM.MX** - Versions mexicaines d'actions US (AAPL, XOM existent déjà)
- **BBDBN.MX** - Bombardier (BBD.B conservé)
- **AT1D.L** - ETF (pas d'ADR)
- **BRK.B** - Déjà conservé (classe B)
- **Tickers miniers/exploration** - Pas d'ADR pour petites entreprises
- **950160.KQ** - Entreprise US sur bourse coréenne

---

## ✅ Résultat Final

La base de données contient maintenant:
- ✅ **Uniquement des tickers US/Canada** sur bourses principales
- ✅ **ADR américains** pour les principales entreprises canadiennes
- ✅ **3 classes B** conservées (ATD.B, BBD.B, BRK.B)
- ❌ **Aucun ticker** sur bourses internationales (LSE, MEX, STO, HKSE, XETRA, FSX, KOE)

---

## 📄 Fichiers Générés

- ✅ `docs/SUPPRESSION_TICKERS_SUFFIXE_ET_AJOUT_ADR.md` - Ce document
- ✅ `scripts/add-adr-for-removed-tickers.js` - Script d'ajout ADR
