# Identifier les Tickers Non Récupérables de FMP

## Vue d'ensemble

Ce guide explique comment identifier les tickers qui **ne peuvent PAS être récupérés officiellement de FMP**, même après tous les fallbacks et variantes de symboles.

## Outils Disponibles

### 1. API Endpoint (Recommandé)

**Endpoint**: `GET /api/admin/unrecoverable-tickers`

#### Utilisation

```bash
# Format JSON (défaut)
curl "https://gobapps.com/api/admin/unrecoverable-tickers?limit=1000"

# Format CSV (export Excel)
curl "https://gobapps.com/api/admin/unrecoverable-tickers?format=csv" > unrecoverable-tickers.csv

# Limiter le nombre de tickers testés
curl "https://gobapps.com/api/admin/unrecoverable-tickers?limit=100"
```

#### Paramètres

- `limit` (optionnel, default: 1000): Nombre maximum de tickers à tester
- `format` (optionnel, default: 'json'): Format de réponse ('json' ou 'csv')

#### Réponse JSON

```json
{
  "success": true,
  "message": "Analyse terminée",
  "summary": {
    "total": 800,
    "unrecoverable": 15,
    "recoverable": 780,
    "unknown": 5,
    "unrecoverablePercent": "1.9",
    "recoverablePercent": "97.5"
  },
  "unrecoverable": [
    {
      "ticker": "SYMBOL",
      "companyName": "Company Name",
      "sector": "Technology",
      "source": "manual",
      "reason": "404 - Symbole introuvable dans FMP (tous fallbacks échoués)",
      "triedSymbols": ["SYMBOL", "SYMBOL.TO", "SYMBOL-B"],
      "error": "Aucune donnée trouvée pour SYMBOL après avoir essayé 3 variante(s)"
    }
  ],
  "unrecoverableByReason": {
    "404 - Symbole introuvable dans FMP (tous fallbacks échoués)": [...],
    "Données incomplètes ou invalides": [...]
  },
  "recoverable": 780,
  "unknown": 5,
  "timestamp": "2025-01-XX..."
}
```

### 2. Script Node.js (Local)

**Fichier**: `scripts/identify-unrecoverable-tickers.js`

#### Prérequis

```bash
# Variables d'environnement requises dans .env.local
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
FMP_API_KEY=...
```

#### Utilisation

```bash
# Depuis la racine du projet
node scripts/identify-unrecoverable-tickers.js
```

#### Sortie

Le script affiche :
- ✅ Statistiques globales (total, récupérable, non récupérable, inconnu)
- ❌ Liste détaillée des tickers non récupérables groupés par raison
- ⚠️ Liste des tickers avec statut inconnu (erreurs temporaires)
- 📄 Export CSV pour copier-coller dans Excel

## Types de Tickers Non Récupérables

### 1. Symbole Introuvable (404)

**Raison**: `404 - Symbole introuvable dans FMP (tous fallbacks échoués)`

**Description**: Le symbole n'existe pas dans FMP, même après avoir essayé :
- Le symbole original
- Variantes avec tirets (ex: `BRK-B` pour `BRK.B`)
- Variantes avec `.TO` pour les titres canadiens
- Recherche via FMP Search API
- Toutes les variantes définies dans `symbolVariants`

**Exemples**:
- Tickers avec symboles obsolètes
- Tickers de bourses non supportées par FMP
- Tickers avec formats spéciaux non reconnus

### 2. Données Incomplètes ou Invalides

**Raison**: `Données incomplètes ou invalides`

**Description**: FMP retourne une réponse, mais les données sont :
- Tableau de données annuelles vide (`data.length === 0`)
- Prix actuel invalide (`currentPrice <= 0`)
- Informations de compagnie manquantes (`info.name` absent)

**Exemples**:
- Tickers récemment listés sans historique
- Tickers suspendus ou retirés
- Tickers avec données financières insuffisantes

### 3. Erreur API

**Raison**: `Erreur API`

**Description**: FMP retourne une erreur explicite dans la réponse JSON.

**Exemples**:
- Erreurs de format de symbole
- Restrictions d'accès pour certains types de titres

## Tickers avec Statut Inconnu

Les tickers avec statut "inconnu" sont ceux qui ont rencontré des erreurs qui pourraient être **temporaires** :

- **Rate limiting** (HTTP 429)
- **Erreurs réseau** (timeout, connexion refusée)
- **Erreurs serveur** (HTTP 500, 502, 503)

Ces tickers devraient être **retestés** plus tard, car ils pourraient être récupérables.

## Actions Recommandées

### Pour les Tickers Non Récupérables

1. **Vérifier le symbole** : Le symbole est-il correct dans Supabase ?
2. **Rechercher alternative** : Existe-t-il un symbole alternatif (ADR, autre bourse) ?
3. **Vérifier la bourse** : FMP supporte-t-il cette bourse ?
4. **Marquer comme inactif** : Si aucune solution, marquer `is_active = false` dans Supabase
5. **Documenter** : Ajouter une note dans Supabase expliquant pourquoi le ticker n'est pas récupérable

### Pour les Tickers avec Statut Inconnu

1. **Retester** : Relancer l'analyse après quelques minutes
2. **Vérifier les logs** : Consulter les logs Vercel pour plus de détails
3. **Vérifier la clé API** : S'assurer que `FMP_API_KEY` est valide et active

## Exemple d'Utilisation

### Via l'API (Recommandé)

```javascript
// Dans le navigateur ou un script
const response = await fetch('https://gobapps.com/api/admin/unrecoverable-tickers?limit=1000');
const data = await response.json();

console.log(`Total: ${data.summary.total}`);
console.log(`Non récupérables: ${data.summary.unrecoverable}`);
console.log(`Récupérables: ${data.summary.recoverable}`);

// Afficher les tickers non récupérables
data.unrecoverable.forEach(ticker => {
  console.log(`${ticker.ticker}: ${ticker.reason}`);
  if (ticker.triedSymbols) {
    console.log(`  Symboles essayés: ${ticker.triedSymbols.join(', ')}`);
  }
});
```

### Via le Script Node.js

```bash
# Tester tous les tickers
node scripts/identify-unrecoverable-tickers.js

# Le script affichera automatiquement :
# - Statistiques
# - Liste détaillée des non récupérables
# - Export CSV
```

## Notes Importantes

1. **Temps d'exécution** : L'analyse peut prendre plusieurs minutes pour 800+ tickers (délai de 200-300ms entre chaque requête pour éviter le rate limiting)

2. **Rate Limiting FMP** : Si vous obtenez beaucoup d'erreurs "unknown", c'est probablement dû au rate limiting. Augmentez le délai entre les requêtes.

3. **Données à jour** : Les résultats peuvent changer si FMP ajoute de nouveaux symboles ou corrige des données existantes.

4. **Fallbacks automatiques** : L'API `/api/fmp-company-data` essaie automatiquement plusieurs variantes de symboles. Si un ticker est marqué comme "non récupérable", cela signifie que **toutes** les variantes ont échoué.

## Support

Si vous identifiez des tickers qui devraient être récupérables mais qui sont marqués comme "non récupérables", vérifiez :

1. Le symbole dans Supabase est-il correct ?
2. Le ticker existe-t-il sur une bourse supportée par FMP ?
3. Y a-t-il un symbole alternatif (ADR, autre classe d'actions) ?

Pour plus d'informations, consultez :
- `docs/FIX_PROBLEMATIC_TICKERS.md` - Guide de correction des tickers problématiques
- `api/fmp-company-data.js` - Logique de fallback automatique

