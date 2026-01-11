# 🔍 Rapport: Variantes et ADR pour Tickers en Échec FMP

**Date:** 2026-01-11  
**Objectif:** Trouver des alternatives fonctionnelles pour les 14 tickers qui ne répondent pas via FMP

---

## 📊 Résumé Exécutif

Sur **14 tickers en échec**, nous avons trouvé:
- ✅ **Variantes fonctionnelles:** 12/14 (85.7%)
- ✅ **ADR disponibles:** 9/14 (64.3%)
- ❌ **Aucune alternative:** 2/14 (14.3%)

---

## ✅ Solutions Trouvées par Ticker

### 1. **ATD.B** → ✅ **ATD.TO** ou **ANCTF** (ADR)
- **Variante fonctionnelle:** ATD.TO (TSX)
- **ADR disponible:** ANCTF (OTC)
- **Recommandation:** Utiliser **ATD.TO** (bourse principale) ou **ANCTF** (ADR)

### 2. **BBD.B** → ✅ **BBD-A.TO**, **BBD-B.TO** ou **BOMBF** (ADR)
- **Variantes fonctionnelles:** BBD-A.TO, BBD-B.TO (TSX)
- **ADR disponibles:** BOMBF, BDRXF, BDRPF, BDRBF, BDRAF (OTC)
- **Recommandation:** Utiliser **BBD-B.TO** (même classe) ou **BOMBF** (ADR)

### 3. **BRK.B** → ✅ **BRK-B** ou **BRK-A**
- **Variantes fonctionnelles:** BRK-B, BRK-A (NYSE)
- **Note:** BRK.B est un ETF, pas Berkshire Hathaway
- **Recommandation:** Vérifier si BRK-B correspond bien à l'ETF

### 4. **BFB** → ✅ **BF-B** ou **BF-A**
- **Variantes fonctionnelles:** BF-B, BF-A (NYSE)
- **Recommandation:** Utiliser **BF-B** (même classe)

### 5. **MOGA** → ✅ **MOG-A**
- **Variante fonctionnelle:** MOG-A (NYSE)
- **Recommandation:** Utiliser **MOG-A** (même classe)

### 6. **CCLB.TO** → ✅ **CCLLF** ou **CCDBF** (ADR)
- **Variantes:** Aucune variante directe fonctionnelle
- **ADR disponibles:** CCLLF, CCDBF (OTC)
- **Recommandation:** Utiliser **CCLLF** (ADR)

### 7. **CTCA.TO** → ✅ **CTC.TO**
- **Variante fonctionnelle:** CTC.TO (TSX)
- **ADR:** Aucun trouvé
- **Recommandation:** Utiliser **CTC.TO** (ticker principal)

### 8. **EMPA.TO** → ❌ Aucune alternative trouvée
- **Variantes:** Toutes échouées
- **ADR:** Aucun trouvé
- **Recommandation:** Vérifier manuellement ou supprimer

### 9. **GIBA.TO** → ✅ **GIB** (ADR NYSE)
- **Variante fonctionnelle:** GIB (NYSE) - ADR
- **Recommandation:** Utiliser **GIB** (ADR sur NYSE - meilleur que TSE)

### 10. **RCIB.TO** → ✅ **RCI** (ADR NYSE)
- **Variante fonctionnelle:** RCI (NYSE) - ADR
- **Recommandation:** Utiliser **RCI** (ADR sur NYSE)

### 11. **CCA** → ✅ **CCA.TO** ou **CGEAF** (ADR)
- **Variante fonctionnelle:** CCA.TO (TSX)
- **ADR disponible:** CGEAF (OTC)
- **Recommandation:** Utiliser **CCA.TO** (bourse principale)

### 12. **GWO** → ✅ **GWO.TO** ou **GWLIF/GRWTF** (ADR)
- **Variante fonctionnelle:** GWO.TO (TSX)
- **ADR disponibles:** GWLIF, GRWTF (OTC)
- **Recommandation:** Utiliser **GWO.TO** (bourse principale)

### 13. **IFC** → ✅ **IFC.TO** ou **INTAF** (ADR)
- **Variante fonctionnelle:** IFC.TO (TSX)
- **ADR disponibles:** INTAF, INFFF, IFZZF, IFTPF, IFCZF (OTC)
- **Recommandation:** Utiliser **IFC.TO** (bourse principale) ou **INTAF** (ADR)

### 14. **MRU** → ✅ **MRU.TO** ou **MTRI/MTRAF** (ADR)
- **Variante fonctionnelle:** MRU.TO (TSX)
- **ADR disponibles:** MTRI, MTRAF (OTC)
- **Recommandation:** Utiliser **MRU.TO** (bourse principale)

---

## 📋 Tableau Récapitulatif

| Ticker Original | Variante Fonctionnelle | ADR Disponible | Action Recommandée |
|----------------|------------------------|----------------|-------------------|
| ATD.B | ATD.TO | ANCTF | ✅ Remplacer par ATD.TO |
| BBD.B | BBD-B.TO | BOMBF | ✅ Remplacer par BBD-B.TO |
| BRK.B | BRK-B | - | ⚠️ Vérifier (ETF spécial) |
| BFB | BF-B | - | ✅ Remplacer par BF-B |
| MOGA | MOG-A | - | ✅ Remplacer par MOG-A |
| CCLB.TO | - | CCLLF | ✅ Remplacer par CCLLF (ADR) |
| CTCA.TO | CTC.TO | - | ✅ Remplacer par CTC.TO |
| EMPA.TO | - | - | ❌ Supprimer (aucune alternative) |
| GIBA.TO | GIB | - | ✅ Remplacer par GIB (ADR NYSE) |
| RCIB.TO | RCI | - | ✅ Remplacer par RCI (ADR NYSE) |
| CCA | CCA.TO | CGEAF | ✅ Remplacer par CCA.TO |
| GWO | GWO.TO | GWLIF | ✅ Remplacer par GWO.TO |
| IFC | IFC.TO | INTAF | ✅ Remplacer par IFC.TO |
| MRU | MRU.TO | MTRI | ✅ Remplacer par MRU.TO |

---

## 🔄 Actions Recommandées

### Option A: Remplacement Automatique (Recommandé)

Remplacer les tickers par leurs variantes fonctionnelles dans Supabase:

1. **ATD.B** → **ATD.TO**
2. **BBD.B** → **BBD-B.TO**
3. **BFB** → **BF-B**
4. **MOGA** → **MOG-A**
5. **CCLB.TO** → **CCLLF** (ADR)
6. **CTCA.TO** → **CTC.TO**
7. **GIBA.TO** → **GIB** (ADR NYSE)
8. **RCIB.TO** → **RCI** (ADR NYSE)
9. **CCA** → **CCA.TO**
10. **GWO** → **GWO.TO**
11. **IFC** → **IFC.TO**
12. **MRU** → **MRU.TO**

### Option B: Suppression

- **EMPA.TO** - Aucune alternative trouvée
- **BRK.B** - Vérifier manuellement (ETF spécial)

---

## ⚠️ Notes Importantes

1. **BRK.B:** C'est un ETF (YieldMax BRK.B Option Income Strategy ETF), pas Berkshire Hathaway. BRK-B est Berkshire Hathaway Class B. Vérifier si c'est bien ce que vous voulez.

2. **ADR vs Bourse Principale:** 
   - Préférer la bourse principale (.TO) pour les entreprises canadiennes
   - Utiliser ADR seulement si la bourse principale n'est pas disponible

3. **Classes d'actions:** Les variantes avec tiret (ATD-B, BBD-B) fonctionnent mieux que les points (ATD.B)

---

## 📄 Fichiers Générés

- ✅ `docs/VARIANTES_ET_ADR_TICKERS_ECHEC.json` - Données complètes
- ✅ `docs/VARIANTES_ET_ADR_TICKERS_ECHEC.csv` - Export CSV
- ✅ `docs/RAPPORT_VARIANTES_ET_ADR.md` - Ce document
