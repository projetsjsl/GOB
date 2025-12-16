# Analyse de la Structure Supabase - Table `tickers`

**Date** : 3 décembre 2025  
**Objectif** : Vérifier si la table `tickers` contient tous les champs nécessaires pour le plan en 3 phases

---

## 📊 Structure Actuelle de la Table `tickers`

### Champs Existants (Base)

| Champ | Type | Description | Source |
|-------|------|-------------|--------|
| `id` | UUID | Identifiant unique | ✅ Existant |
| `ticker` | VARCHAR(10) | Symbole boursier | ✅ Existant |
| `company_name` | VARCHAR(255) | Nom de l'entreprise | ✅ Existant |
| `sector` | VARCHAR(100) | Secteur | ✅ Existant |
| `industry` | VARCHAR(100) | Industrie | ✅ Existant |
| `country` | VARCHAR(100) | Pays | ✅ Existant |
| `exchange` | VARCHAR(50) | Bourse | ✅ Existant |
| `currency` | VARCHAR(10) | Devise | ✅ Existant |
| `market_cap` | VARCHAR(50) | Market cap | ✅ Existant |
| `is_active` | BOOLEAN | Actif/Inactif | ✅ Existant |
| `source` | VARCHAR(50) | Source (team/watchlist/manual/both) | ✅ Existant |
| `priority` | INTEGER | Priorité | ✅ Existant |
| `user_id` | TEXT | ID utilisateur | ✅ Existant |
| `target_price` | DECIMAL(10,2) | Prix cible | ✅ Existant |
| `stop_loss` | DECIMAL(10,2) | Stop loss | ✅ Existant |
| `notes` | TEXT | Notes | ✅ Existant |
| `added_date` | TIMESTAMP | Date d'ajout | ✅ Existant |
| `last_scraped` | TIMESTAMP | Dernier scraping | ✅ Existant |
| `scraping_enabled` | BOOLEAN | Scraping activé | ✅ Existant |
| `created_at` | TIMESTAMP | Date de création | ✅ Existant |
| `updated_at` | TIMESTAMP | Date de mise à jour | ✅ Existant |

### Champs ValueLine Existants (Ajoutés via `supabase-add-valueline-metrics.sql`)

| Champ | Type | Description | Source |
|-------|------|-------------|--------|
| `security_rank` | VARCHAR(10) | Financial Strength (Cote de sécurité) | ✅ Existant |
| `earnings_predictability` | VARCHAR(10) | Earnings Predictability | ✅ Existant |
| `price_growth` | VARCHAR(10) | Price Growth | ✅ Existant |
| `persistence` | VARCHAR(10) | Persistence | ✅ Existant |
| `price_stability` | VARCHAR(10) | Price Stability | ✅ Existant |
| `beta` | DECIMAL(5,2) | Beta (volatilité) | ✅ Existant |
| `valueline_updated_at` | TIMESTAMP | Date mise à jour ValueLine | ✅ Existant |

---

## ❌ Champs Manquants pour le Plan en 3 Phases

### Phase 1 : Initialisation ValueLine

**Champs nécessaires pour stocker les données ValueLine d'initialisation** :

| Champ | Type | Description | Priorité |
|-------|------|-------------|----------|
| `valueline_eps_growth` | DECIMAL(5,2) | Projected EPS Growth 3 To 5 Yr | ⚠️ **Recommandé** |
| `valueline_cf_growth` | DECIMAL(5,2) | Cash Flow Proj 3 To 5 Year Growth Rate | ⚠️ **Recommandé** |
| `valueline_bv_growth` | DECIMAL(5,2) | Book Value Proj 3 To 5 Year Growth Rate | ⚠️ **Recommandé** |
| `valueline_div_growth` | DECIMAL(5,2) | Dividend Proj 3 To 5 Year Growth Rate | ⚠️ **Recommandé** |
| `valueline_pe_ratio` | DECIMAL(10,2) | Current P/E Ratio_1 | ⚠️ **Recommandé** |
| `valueline_pcf_ratio` | DECIMAL(10,2) | P/CF Ratio (si disponible) | ⚠️ **Optionnel** |
| `valueline_pbv_ratio` | DECIMAL(10,2) | P/BV Ratio (si disponible) | ⚠️ **Optionnel** |
| `valueline_yield` | DECIMAL(5,2) | 3 To 5 Year Proj Dividend Yield | ⚠️ **Recommandé** |

**Note** : Ces champs peuvent être stockés dans le profil 3p1 (`AnalysisProfile`) plutôt que dans Supabase, car ils sont spécifiques à chaque analyse utilisateur.

---

### Phase 3 : Validation Corridor ValueLine

**Champs nécessaires pour stocker le corridor ValueLine (low/high)** :

| Champ | Type | Description | Priorité |
|-------|------|-------------|----------|
| `valueline_proj_low_return` | DECIMAL(5,2) | Proj Low TTL Return | ✅ **Critique** |
| `valueline_proj_high_return` | DECIMAL(5,2) | Proj High TTL Return | ✅ **Critique** |
| `valueline_proj_low_price_gain` | DECIMAL(5,2) | Proj Price Low Gain | ⚠️ **Optionnel** |
| `valueline_proj_high_price_gain` | DECIMAL(5,2) | Proj Price High Gain | ⚠️ **Optionnel** |

**Note** : Ces champs sont **critiques** pour Phase 3 (affichage du corridor comme référence).

---

## 📋 Recommandations

### Option 1 : Stocker dans Supabase (Recommandé pour Corridor)

**Avantages** :
- ✅ Accessible depuis n'importe où
- ✅ Partageable entre utilisateurs
- ✅ Persistant même si profil 3p1 supprimé

**Champs à ajouter** :
- `valueline_proj_low_return` (DECIMAL(5,2))
- `valueline_proj_high_return` (DECIMAL(5,2))

**Script SQL** : `supabase-add-valueline-corridor.sql`

---

### Option 2 : Stocker dans Profil 3p1 (Recommandé pour Métriques)

**Avantages** :
- ✅ Spécifique à chaque analyse utilisateur
- ✅ Peut varier selon les hypothèses utilisateur
- ✅ Pas de pollution de la table Supabase

**Champs à ajouter dans `AnalysisProfile`** :
```typescript
interface AnalysisProfile {
    // ... champs existants ...
    
    // Corridor ValueLine (pour Phase 3)
    valuelineCorridor?: {
        lowReturn?: number;
        highReturn?: number;
        lowPriceGain?: number;
        highPriceGain?: number;
    };
    
    // Métriques ValueLine initiales (pour Phase 1)
    valuelineInitial?: {
        epsGrowth?: number;
        cfGrowth?: number;
        bvGrowth?: number;
        divGrowth?: number;
        peRatio?: number;
        pcfRatio?: number;
        pbvRatio?: number;
        yield?: number;
    };
}
```

---

## ✅ Conclusion

### Champs Critiques Manquants

1. **`valueline_proj_low_return`** (DECIMAL(5,2)) - ✅ **À ajouter**
2. **`valueline_proj_high_return`** (DECIMAL(5,2)) - ✅ **À ajouter**

### Champs Recommandés (Optionnels)

3. `valueline_proj_low_price_gain` (DECIMAL(5,2)) - ⚠️ Optionnel
4. `valueline_proj_high_price_gain` (DECIMAL(5,2)) - ⚠️ Optionnel

### Champs à Stocker dans Profil 3p1 (Pas dans Supabase)

- Métriques ValueLine initiales (growth rates, ratios) - Stockées dans `AnalysisProfile.valuelineInitial`
- Corridor par métrique (si nécessaire) - Stocké dans `AnalysisProfile.valuelineCorridor`

---

## 📝 Prochaines Étapes

1. ✅ Créer script SQL pour ajouter `valueline_proj_low_return` et `valueline_proj_high_return`
2. ✅ Mettre à jour `types.ts` pour ajouter `valuelineCorridor` dans `AnalysisProfile`
3. ✅ Mettre à jour `tickersApi.ts` pour inclure les nouveaux champs

---

**Document créé le** : 3 décembre 2025  
**Dernière mise à jour** : 3 décembre 2025  
**Version** : 1.0

