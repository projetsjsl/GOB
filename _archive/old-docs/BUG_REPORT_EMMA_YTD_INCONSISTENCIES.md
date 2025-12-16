# 📋 Rapport: Incohérences YTD dans les réponses Emma

**Date**: 6 novembre 2025
**Utilisateur**: JS
**Sévérité**: 🔴 HAUTE (données financières incorrectes)

---

## 🎯 Problèmes Identifiés

### BUG #1 ✅ FIXÉ
**Parenthèse bizarre devant le nom à l'invitation SMS**
- **Observed**: "Invite (819) 342-5966 Max" affichait "👤 (Max" au lieu de "👤 Max"
- **Root Cause**: `parseInvitationCommand()` n'enlevait pas correctement les parenthèses résiduelles du numéro
- **Fix Applied**: Amélioré le parsing pour nettoyer les espaces multiples et caractères résiduels
- **File**: `lib/invitation-handler.js` - lignes 42-99

---

### BUG #2 🔴 ACTIF
**Incohérences YTD - Données conflictuelles**

#### Symptômes:
```
ACN Performance YTD:
  Réponse 1: -15% (vs S&P500: +8%)
  Réponse 2: -34%
  Réponse 3: -40% sur 12 mois (vs -15% YTD = CONFUSION MOIS vs ANS)

GOOGL Performance YTD:
  Réponse 1: +48% YTD
  Réponse 2: +42% YTD
  
BCE Performance YTD:
  P/E: 48,9x vs 49x (légère différence)
  YTD: -6% vs -12% (variation significative)
```

#### Root Cause Analysis:

**Problème 1: Perplexity comme source de vérité**
- Emma utilise **Perplexity** pour toutes les requêtes `comprehensive_analysis` (ligne 339-368 dans `/api/emma-agent.js`)
- Perplexity **scrape le web en temps réel** et n'a PAS une source de vérité unique
- Différents appels à Perplexity peuvent retourner des données légèrement différentes selon:
  - L'heure de l'appel
  - Les sources trouvées sur le web
  - La version du cache de Perplexity
  - Les indices utilisés (YTD vs 12 mois vs depuis janvier)

**Problème 2: FMP ignored pour les données factuelles**
- FMP (`/api/marketdata.js`) a des données YTD cohérentes et standardisées
- Mais Emma privilégie **Perplexity** pour les analyses (plus "humanisé")
- FMP n'est utilisé que comme fallback en cas d'erreur Perplexity

**Problème 3: Pas de validation/normalisation YTD**
- Aucune vérification que le YTD affiché est cohérent avec le mois/année affichée
- Pas de source de vérité pour "quel YTD?" (année civile? année fiscale? depuis le début du trading?)

---

## 🛠️ Solutions Recommandées

### Solution 1: Forcer FMP pour données financières critiques
**Niveau**: URGENT
**Impact**: Élimine les incohérences YTD

Modifier `/api/emma-agent.js` (ligne ~301-368) pour:
```javascript
// SI c'est une requête d'ANALYSE FONDAMENTALE:
// - Fetch d'ABORD via FMP (source de vérité)
// - Utilise ces données DANS le prompt Perplexity
// - Perplexity n'invente pas, synthétise seulement

_selectModel(intentData, outputMode, toolsData) {
    const intent = intentData?.intent || 'unknown';
    
    // FONDAMENTAUX: TOUJOURS FMP d'abord, puis contexte Perplexity
    if (['fundamentals', 'comprehensive_analysis'].includes(intent)) {
        // 1. Fetch FMP (source de vérité)
        // 2. Inclure données FMP dans le contexte envoyé à Perplexity
        // 3. Perplexity synthétise SANS inventer de YTD
        return {
            model: 'perplexity_with_fmp_context',
            data_sources: ['FMP', 'Perplexity'],
            reason: 'FMP for factual data + Perplexity for analysis'
        };
    }
}
```

### Solution 2: Créer un validateur YTD
**Niveau**: IMPORTANT
**Impact**: Détecte les hallucinations

Créer `/lib/ytd-validator.js`:
```javascript
/**
 * Valide que le YTD affiché est cohérent
 * - Vérifie que YTD <= performance 12 mois
 * - Vérifie que les sources correspondent
 * - Flags les données suspectes
 */
export function validateYTDData(stock) {
    const ytd = parseFloat(stock.ytd);
    const oneYear = parseFloat(stock.oneYear);
    
    if (ytd > oneYear) {
        // 🚨 Erreur: YTD > 12 mois = impossible
        console.warn(`⚠️ Invalid YTD for ${stock.symbol}: YTD (${ytd}%) > 1Y (${oneYear}%)`);
        return false;
    }
    
    return {
        valid: true,
        source: 'FMP',
        confidence: 0.95
    };
}
```

### Solution 3: Documenter la source de chaque métrique
**Niveau**: IMPORTANT
**Impact**: Transparence sur les données

Dans les réponses Emma:
```markdown
📊 ACN (Accenture) – Fondamentaux

Prix: 247,82$ (+2,0% aujourd'hui) [FMP]
Perf YTD: -15% [FMP - officiel]
Performance 12M: -40% [FMP]

💬 Note: Les données YTD proviennent de FMP 
(source de vérité). Les analyses synthétiques
de performance viennent de Perplexity.
```

---

## 📊 Données Réelles vs Emma

### ACN Comparaison
| Métrique | FMP | Emma R1 | Emma R2 | Emma R3 | Issue |
|----------|-----|---------|---------|---------|-------|
| YTD | -15% | -15% ✓ | -34% ✗ | -40% ✗ | Sources conflictuelles |
| P/E | 20.1x | 20.1x ✓ | 20.1x ✓ | 20.1x ✓ | Cohérent (FMP) |
| Price | $247.82 | $247.82 ✓ | $247.82 ✓ | ~42.50 ✗ | Mauvais ticker? |

**Conclusion**: Quand Emma utilise Perplexity directement (sans contexte FMP), les données divergent.

---

## 🔧 Implémentation Recommandée

### Phase 1: Urgent (This Week)
1. ✅ Fix BUG #1 (Parenthèse) - DONE
2. ✓ Modifier emma-agent pour inclure contexte FMP
3. ✓ Ajouter validation YTD

### Phase 2: Important (Next Week)
4. ✓ Créer ytd-validator.js
5. ✓ Documenter sources dans réponses
6. ✓ Ajouter tests de cohérence YTD

### Phase 3: Nice-to-Have
7. ✓ Cache cohérent entre appels
8. ✓ Dashboard de vérification des données

---

## 📝 Bugs Connexes

- BUG #4: Graphiques sur titres inexistants (IT, US, CA)
- BUG #5: Focus répétitif après ACN

Voir `EMMA_QUALITY_IMPROVEMENTS.md`

---

## Ressources

- **FMP API**: `/api/marketdata.js` (source primaire)
- **Emma Router**: `/api/emma-agent.js` ligne 301-368
- **Perplexity**: `/lib/perplexity-client.js`

---

**Status**: 🔴 BLOCKED - Attendant fix de la priorité des sources de données

