# Algorithme Optimal de Projection EPS - 3p1 Finance Pro

## Analyse Empirique (1000 Tickers)

Date: 2026-01-15

### Resultats Cles

| Metrique | Valeur |
|----------|--------|
| Tickers testes | 1000 |
| Avec Consensus | 987 (98.7%) |
| CAGR seulement | 13 (1.3%) |
| EPS positifs | 949 |
| EPS negatifs | 51 |

### Decouverte Principale

**Le nombre d'analystes n'est PAS un bon predicteur de fiabilite!**

Le **CAGR historique** est le meilleur indicateur de coherence entre Consensus et CAGR:

| CAGR Historique | Coherence | Conclusion |
|-----------------|-----------|------------|
| 10-20% | **57.5%** | Plus stable |
| 20%+ | 54.6% | Bon |
| 5-10% | 38.9% | Variable |
| 0-5% | 35.6% | Instable |
| Negatif | 13.9% | Tres instable |

### Algorithme Optimal (Weighted Blend)

```typescript
// Poids bases sur la stabilite du CAGR historique
if (absCAGR >= 10 && absCAGR <= 20) {
  // Plus stable: blend egal
  consensusWeight = 0.50;
  cagrWeight = 0.50;
} else if (absCAGR > 20 && absCAGR <= 30) {
  // Croissance elevee: favoriser CAGR
  consensusWeight = 0.45;
  cagrWeight = 0.55;
} else if (absCAGR >= 5 && absCAGR < 10) {
  // Croissance moderee: blend egal
  consensusWeight = 0.50;
  cagrWeight = 0.50;
} else if (absCAGR < 5) {
  // Faible croissance: favoriser consensus
  consensusWeight = 0.60;
  cagrWeight = 0.40;
} else if (historicalCAGR < 0) {
  // CAGR negatif: fortement instable, favoriser consensus
  consensusWeight = 0.65;
  cagrWeight = 0.35;
} else {
  // Croissance extreme (>30%): reversion to mean
  consensusWeight = 0.60;
  cagrWeight = 0.40;
}

// Target Price Blende
targetPrice = (consensusTarget * consensusWeight) + (cagrTarget * cagrWeight);
```

### Formule Finale

```
Target Price = (Consensus_Target × Consensus_Weight) + (CAGR_Target × CAGR_Weight)

ou:
- Consensus_Target = Projected_EPS_Consensus × Target_PE
- CAGR_Target = Projected_EPS_CAGR × Target_PE
- Weights bases sur la stabilite du CAGR historique
```

### Fichiers Modifies

- `utils/calculations.ts` - Algorithme optimal implemente
- `scripts/algorithm-analysis-1000.json` - Donnees brutes de l'analyse

### Points Importants

1. **EPS Negatifs**: Utiliser extrapolation lineaire (CAGR ne fonctionne pas)
2. **Outliers**: Filtrer P/E > 100 ou prix > $100,000 (ex: BRK-A)
3. **Corridor**: ±15% pour CAGR, utiliser corridor analystes pour consensus
4. **Confiance**: Ne PAS baser sur le nombre d'analystes

### Prochaines Etapes

- [ ] Creer table Supabase `analyst_estimates` pour stocker les donnees FMP
- [ ] Ajouter affichage des poids dans l'UI (ex: "Blend 50/50")
- [ ] Backtester l'algorithme sur donnees historiques
