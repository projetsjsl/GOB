Utilise le skill **Stock Screener** d'Emma pour rechercher des actions selon des critères spécifiques.

**OBJECTIF**: Trouver des actions qui correspondent à des critères d'investissement précis (valeur, croissance, dividendes, etc.)

**CRITÈRES DE RECHERCHE POPULAIRES**:
- Large cap sous-évaluées
- Actions à dividendes élevés
- Actions de croissance (growth)
- Large cap technologie
- Small cap prometteuses
- Mid cap sous-évaluées
- Value stocks (actions valeur)

**PARAMÈTRES**:
- **criteria** (requis): Description des critères de recherche
- **limit**: Nombre de résultats (défaut: 10, max: 50)
- **market_cap**: "large" (>$10B), "mid" ($2B-$10B), "small" (<$2B)
- **sector**: Secteur spécifique (Technology, Healthcare, Finance, etc.)

**INSTRUCTIONS**:
1. Demande à Emma d'utiliser le tool `stock-screener` via `/api/tools/stock-screener`
2. Utilise Perplexity pour générer une liste de tickers selon les critères
3. Valide avec données FMP en temps réel
4. Filtre et classe selon métriques pertinentes
5. Présente les résultats avec:
   - Ticker et nom
   - Prix actuel et variation
   - Market cap
   - Secteur/industrie
   - Métriques clés (P/E, dividende si applicable)
   - Justification du choix

**EXEMPLE DE FORMAT DE RÉPONSE**:

```
🔍 STOCK SCREENER - Large Cap Sous-Évaluées

Critères: Large cap (>$10B) avec P/E inférieur à la moyenne sectorielle

📊 10 RÉSULTATS TROUVÉS

1. JPM - JPMorgan Chase & Co.
   Prix: $152.30 (+1.2%)
   Market Cap: $442B
   Secteur: Financials
   P/E: 11.2 (vs industrie: 15.8)
   💡 Leader bancaire avec P/E attractif

2. PFE - Pfizer Inc.
   Prix: $28.50 (-0.8%)
   Market Cap: $160B
   Secteur: Healthcare
   P/E: 9.5 (vs industrie: 18.3)
   💡 Pharma établi, valorisation comprimée

3. [...]

📈 OBSERVATION:
Le secteur financier offre plusieurs opportunités value actuellement. Attention aux risques de taux d'intérêt.

⚠️ RAPPEL:
Ces suggestions sont basées sur des critères quantitatifs. Toujours effectuer une analyse fondamentale complète avant d'investir.
```

**TON**: Professionnel, analytique, neutre (pas de recommandation directe d'achat).

**EXEMPLES D'UTILISATION**:
- "Trouve-moi des large cap sous-évaluées dans la tech"
- "Quelles sont les meilleures actions à dividendes au Canada?"
- "Liste les small cap de croissance prometteuses"
- "Actions financières avec P/E bas"
