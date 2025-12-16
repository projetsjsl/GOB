# 🧪 TEST COMPLET DES SKILLS EMMA

## 📋 Liste Complète des Intents/Skills

### 1. **Conversationnels** (Pas d'outils)
- `greeting` - Salutations
- `help` - Aide/SKILLS
- `general_conversation` - Conversation générale
- `politeness` - Merci, au revoir

### 2. **Analyse Actions** (Outils requis)
- `stock_price` - Prix actuel
- `fundamentals` - Fondamentaux
- `technical_analysis` - Analyse technique
- `comprehensive_analysis` - Analyse complète (7+ outils)
- `comparative_analysis` - Comparaison tickers
- `valuation` - Valorisation

### 3. **Actualités & Calendrier**
- `news` - Actualités ticker
- `earnings` - Calendrier résultats
- `economic_calendar` - Calendrier économique

### 4. **Marché & Stratégie**
- `market_overview` - Vue d'ensemble marché
- `sector_industry` - Analyse sectorielle
- `investment_strategy` - Stratégie d'investissement
- `recommendation` - Recommandations
- `risk_volatility` - Risque/volatilité

### 5. **Macro & Politique**
- `economic_analysis` - Analyse économique
- `political_analysis` - Analyse politique

### 6. **Portfolio & Screening**
- `portfolio` - Gestion portfolio
- `stock_screening` - Recherche actions

---

## 🧪 Tests à Effectuer (SMS)

### ✅ Tier 1: CRITIQUES (Doivent fonctionner parfaitement)

| Test | Commande SMS | Intent Attendu | Outils | Résultat Attendu |
|------|--------------|----------------|--------|------------------|
| 1 | `Analyse AAPL` | comprehensive_analysis | 7+ outils | 3-4 SMS, toutes sections |
| 2 | `Prix MSFT` | stock_price | 2 outils | 1 SMS, prix + variation |
| 3 | `News GOOGL` | news | 2 outils | 1-2 SMS, dernières news |
| 4 | `SKILLS` | help | 0 outils | 1 SMS, liste compétences |

### ⚠️ Tier 2: IMPORTANTS (Doivent fonctionner)

| Test | Commande SMS | Intent Attendu | Outils | Résultat Attendu |
|------|--------------|----------------|--------|------------------|
| 5 | `Indices` | market_overview | 3+ outils | 2-3 SMS, S&P500, NASDAQ, TSX |
| 6 | `Taux` | economic_analysis | 2+ outils | 1-2 SMS, Fed, inflation |
| 7 | `Compare AAPL MSFT` | comparative_analysis | 4+ outils | 3-4 SMS, comparaison |
| 8 | `Earnings TSLA` | earnings | 3 outils | 1-2 SMS, prochains résultats |

### 📊 Tier 3: AVANCÉS (Nice to have)

| Test | Commande SMS | Intent Attendu | Outils | Résultat Attendu |
|------|--------------|----------------|--------|------------------|
| 9 | `Screening tech` | stock_screening | 1 outil | 2-3 SMS, liste tickers |
| 10 | `Risque NVDA` | risk_volatility | 3 outils | 2 SMS, volatilité, beta |
| 11 | `Secteur tech` | sector_industry | 3 outils | 2-3 SMS, analyse secteur |
| 12 | `Stratégie value` | investment_strategy | 4 outils | 3 SMS, recommandations |

---

## 🎯 Critères de Réussite

### ✅ Fonctionnement Parfait
- [ ] SMS reçu dans les 30 secondes
- [ ] Contenu complet (pas de `[...Analyse complete]`)
- [ ] Format correct (emojis sections gardés)
- [ ] Pas de "Salut Salut"
- [ ] Pas de `>>>`
- [ ] Découpage intelligent (titres non coupés)
- [ ] Ordre correct (Partie 1/2, 2/2)

### ⚠️ Erreurs Acceptables
- Gemini 429 (quota épuisé) → Fallback local
- FMP 404 (ticker invalide) → Message clair
- Perplexity timeout → Retry automatique

### ❌ Erreurs INACCEPTABLES
- TwiML échoue silencieusement (pas de SMS reçu)
- Réponse tronquée sans indication
- SMS arrive dans le désordre
- Emojis forcent UCS-2 inutilement
- Double "Salut Salut"

---

## 📝 Problèmes Identifiés (à fixer)

### 🔴 CRITIQUE
1. **TwiML échoue silencieusement** (> 800 chars)
   - Seuil actuel: 1000 chars
   - Fix: Baisser à 800 chars OU ajouter fallback

2. **Emojis drapeaux/globe non supprimés**
   - `🌎 🇺🇸 🇨🇦` forcent UCS-2
   - Fix: Ajouter à la liste de suppression

3. **Pas de SMS d'erreur si échec**
   - Utilisateur ne sait pas pourquoi ça échoue
   - Fix: Ajouter fallback SMS après timeout TwiML

### 🟡 IMPORTANT
4. **Email notification retourne "undefined"**
   - Logs: `✅ [Email Notifier] Email envoyé: undefined`
   - Fix: Vérifier retour de sendConversationEmail()

5. **Gemini quota 429 fréquent**
   - Analyse d'intention échoue
   - Fix: Améliorer fallback local

### 🟢 MINEUR
6. **Cache retourne anciennes versions**
   - Fix: GitHub Action vide cache (déjà implémenté)

---

## 🚀 Plan d'Action

### Phase 1: Fixes Critiques (MAINTENANT)
1. ✅ Baisser seuil TwiML: 1000 → 800 chars
2. ✅ Supprimer emojis drapeaux/globe
3. ✅ Ajouter fallback SMS si TwiML échoue
4. ✅ Tester avec "Indices" pour valider

### Phase 2: Tests Systématiques (APRÈS)
1. Tester les 12 commandes ci-dessus
2. Documenter résultats
3. Fixer problèmes découverts

### Phase 3: Optimisations (PLUS TARD)
1. Améliorer fallback Gemini 429
2. Fixer email notification
3. Optimiser cache

---

## 📊 Résultats Tests (À remplir)

| # | Test | Status | Segments | Coût | Notes |
|---|------|--------|----------|------|-------|
| 1 | Analyse AAPL | ⏳ | - | - | - |
| 2 | Prix MSFT | ⏳ | - | - | - |
| 3 | News GOOGL | ⏳ | - | - | - |
| 4 | SKILLS | ⏳ | - | - | - |
| 5 | Indices | ⏳ | - | - | - |
| 6 | Taux | ⏳ | - | - | - |
| 7 | Compare AAPL MSFT | ⏳ | - | - | - |
| 8 | Earnings TSLA | ⏳ | - | - | - |
| 9 | Screening tech | ⏳ | - | - | - |
| 10 | Risque NVDA | ⏳ | - | - | - |
| 11 | Secteur tech | ⏳ | - | - | - |
| 12 | Stratégie value | ⏳ | - | - | - |

**Légende**: ✅ Parfait | ⚠️ Fonctionne avec problèmes | ❌ Échoue | ⏳ Pas testé

