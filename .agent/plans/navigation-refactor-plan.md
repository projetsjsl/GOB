# Plan de Refactoring Navigation - 6 Onglets Principaux

## Objectif
Simplifier la navigation avec 6 onglets principaux et des sous-onglets accessibles via les barres de navigation secondaires.

## Structure Proposée

### 1. 🛡️ ADMIN
**Icône:** Shield | **ID:** `admin`
**Description:** Outils d'administration et configuration

**Sous-onglets:**
| ID | Label | Composant Actuel |
|----|-------|------------------|
| `admin-config` | Configuration Emma | EmmaConfigTab |
| `admin-briefings` | Briefings Email | EmailBriefingsTab |
| `admin-scraping` | Scraping SA | ScrappingSATab |
| `admin-fastgraphs` | FastGraphs | FastGraphsTab |
| `admin-settings` | Paramètres | PlusTab |

---

### 2. 📈 MARCHÉS
**Icône:** TrendingUp | **ID:** `marches`
**Description:** Données de marché et économie

**Sous-onglets:**
| ID | Label | Composant Actuel |
|----|-------|------------------|
| `marches-global` | Vue Globale | MarketsEconomyTab (overview) |
| `marches-calendar` | Calendrier Éco | EconomicCalendarTab |
| `marches-yield` | Courbe Taux | YieldCurveTab |
| `marches-forex` | Forex | MarketsEconomyTab (forex view) |
| `marches-heatmaps` | Heatmaps | MarketsEconomyTab (stocks view) |

---

### 3. 📊 TITRES
**Icône:** Briefcase | **ID:** `titres`
**Description:** Gestion de portefeuille et analyse de titres

**Sous-onglets:**
| ID | Label | Composant Actuel |
|----|-------|------------------|
| `titres-portfolio` | Mon Portfolio | StocksNewsTab (portfolio) |
| `titres-watchlist` | Watchlist | StocksNewsTab (watchlist) |
| `titres-3p1` | Finance Pro | Redirect /3p1 |
| `titres-seeking` | Seeking Alpha | SeekingAlphaTab |
| `titres-nouvelles` | Nouvelles | NouvellesTab |

---

### 4. 🧪 JLAB
**Icône:** Flask | **ID:** `jlab`
**Description:** Laboratoire d'analyse et terminal avancé

**Sous-onglets:**
| ID | Label | Composant Actuel |
|----|-------|------------------|
| `jlab-terminal` | Terminal | JLabTab |
| `jlab-advanced` | Analyse Pro | AdvancedAnalysisTab |
| `jlab-compare` | Comparaison | FinanceProPanel (compare) |
| `jlab-screener` | Screener | FinanceProPanel (screener) |

---

### 5. 🤖 EMMA IA
**Icône:** Brain | **ID:** `emma`
**Description:** Intelligence artificielle et assistants

**Sous-onglets:**
| ID | Label | Composant Actuel |
|----|-------|------------------|
| `emma-chat` | Chat Emma | AskEmmaTab |
| `emma-vocal` | Assistant Vocal | VoiceAssistantTab |
| `emma-group` | Group Chat | GroupChatTab |
| `emma-terminal` | Terminal EmmAIA | TerminalEmmaIATab |
| `emma-live` | EmmAIA Live | EmmAIATab |
| `emma-finvox` | FinVox | FinVoxTab |

---

### 6. 🧬 TESTS
**Icône:** TestTube | **ID:** `tests`
**Description:** Fonctionnalités en développement

**Sous-onglets:**
| ID | Label | Composant Actuel |
|----|-------|------------------|
| `tests-calendar` | Calendrier Invest | InvestingCalendarTab |
| `tests-sandbox` | Sandbox | (Nouveau - pour tests) |
| `tests-features` | Nouvelles Features | (Coming soon) |

---

## Étapes d'Implémentation

### Phase 1: Définir les nouvelles constantes
- [ ] Créer `MAIN_TABS` avec les 6 onglets principaux
- [ ] Créer `SUB_TABS` mapping pour chaque onglet principal

### Phase 2: Refactorer la navigation principale
- [ ] Modifier le rendu des onglets pour n'afficher que les 6 principaux
- [ ] Ajouter une barre secondaire pour les sous-onglets

### Phase 3: Adapter le routage
- [ ] Modifier `activeTab` pour gérer main + sub
- [ ] Adapter `handleTabChange` pour la nouvelle structure

### Phase 4: Nettoyer
- [ ] Supprimer les anciens onglets non utilisés
- [ ] Tester toutes les navigations

---

## Mapping Onglets Actuels → Nouveaux

| Ancien ID | Nouveau Parent | Nouveau ID |
|-----------|----------------|------------|
| `admin-jsla` | admin | `admin-config` |
| `email-briefings` | admin | `admin-briefings` |
| `scrapping-sa` | admin | `admin-scraping` |
| `fastgraphs` | admin | `admin-fastgraphs` |
| `plus` | admin | `admin-settings` |
| `markets-economy` | marches | `marches-global` |
| `economic-calendar` | marches | `marches-calendar` |
| `yield-curve` | marches | `marches-yield` |
| `stocks-news` | titres | `titres-portfolio` |
| `dans-watchlist` | titres | `titres-watchlist` |
| `finance-pro` | titres | `titres-3p1` |
| `seeking-alpha` | titres | `titres-seeking` |
| `nouvelles` | titres | `titres-nouvelles` |
| `jlab` | jlab | `jlab-terminal` |
| `advanced-analysis` | jlab | `jlab-advanced` |
| `ask-emma` | emma | `emma-chat` |
| `assistant-vocal` | emma | `emma-vocal` |
| `groupchat` | emma | `emma-group` |
| `terminal-emmaia` | emma | `emma-terminal` |
| `emmaia` | emma | `emma-live` |
| `finvox` | emma | `emma-finvox` |
| `investing-calendar` | tests | `tests-calendar` |
| `tests-tab` | tests | `tests-sandbox` |
