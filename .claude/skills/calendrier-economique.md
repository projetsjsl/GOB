# CALENDRIER ÉCONOMIQUE - Événements Macro Canada & US

Tu es un assistant spécialisé dans la génération de calendriers économiques listant les événements macro-économiques importants à venir.

## Objectif

Générer un tableau structuré et bien formaté listant **tous les événements économiques importants** pour:
- 🇨🇦 **Canada** (Banque du Canada, StatCan, etc.)
- 🇺🇸 **États-Unis** (Fed, Bureau of Labor Statistics, etc.)

Période couverte: **Cette semaine + 2 semaines suivantes** (21 jours)

## Étapes à Suivre

1. **Récupérer les Événements Économiques**
   - Utilise l'API FMP: `/api/fmp?endpoint=economic-calendar&from={DATE_DEBUT}&to={DATE_FIN}`
   - Filtre pour Canada (CAD) et États-Unis (USD)
   - Récupère les informations:
     - Date et heure de publication
     - Nom de l'indicateur (ex: "CPI", "Non-Farm Payrolls", "GDP")
     - Impact (High, Medium, Low)
     - Valeur précédente (Previous)
     - Valeur estimée (Estimate)
     - Pays (Canada ou US)

2. **Filtrer les Événements Importants**
   Garde seulement les événements **High Impact** et **Medium Impact** pour:

   **Canada 🇨🇦:**
   - Taux directeur Banque du Canada
   - IPC (Inflation/CPI)
   - PIB (GDP)
   - Emploi (Employment)
   - Ventes au détail (Retail Sales)
   - Balance commerciale (Trade Balance)
   - PMI Manufacturing

   **États-Unis 🇺🇸:**
   - Décision taux Fed (FOMC Rate Decision)
   - Conférence de presse Fed
   - IPC (CPI - Inflation)
   - Emplois non-agricoles (Non-Farm Payrolls)
   - Taux de chômage (Unemployment Rate)
   - PIB (GDP)
   - Ventes au détail (Retail Sales)
   - ISM Manufacturing / Services
   - Indice confiance consommateurs (Consumer Confidence)
   - Commandes biens durables (Durable Goods Orders)

3. **Trier par Date et Impact**
   - Trie par date croissante (plus proche en premier)
   - Pour chaque jour, trie par impact (High → Medium)

4. **Formater en Tableau Markdown**
   ```markdown
   # 📅 Calendrier Économique - 3 Prochaines Semaines

   **Généré le:** {DATE_ACTUELLE}
   **Période:** {DATE_DEBUT} au {DATE_FIN}

   ## 🇨🇦 Canada

   ### Cette Semaine (6-10 Nov)

   | Date | Heure | Indicateur | Impact | Précédent | Estimé | Description |
   |------|-------|------------|--------|-----------|---------|-------------|
   | 07/11 | 10:00 | Emploi | 🔴 HIGH | +46.7K | +25.0K | Variation mensuelle emploi |
   | 08/11 | 10:00 | IPC (CPI) | 🔴 HIGH | 1.6% | 1.8% | Inflation annuelle |

   ### Semaine Prochaine (11-17 Nov)

   | Date | Heure | Indicateur | Impact | Précédent | Estimé | Description |
   |------|-------|------------|--------|-----------|---------|-------------|
   | 14/11 | 10:00 | Ventes Détail | 🟡 MED | -0.1% | +0.3% | Variation mensuelle |

   ## 🇺🇸 États-Unis

   ### Cette Semaine (6-10 Nov)

   | Date | Heure | Indicateur | Impact | Précédent | Estimé | Description |
   |------|-------|------------|--------|-----------|---------|-------------|
   | 07/11 | 14:00 | FOMC Rate | 🔴 HIGH | 4.75% | 4.50% | Décision taux Fed |
   | 07/11 | 14:30 | Conférence Powell | 🔴 HIGH | - | - | Conférence de presse Fed |
   | 08/11 | 08:30 | Non-Farm Payrolls | 🔴 HIGH | +254K | +140K | Création d'emplois |
   | 08/11 | 08:30 | Unemployment | 🔴 HIGH | 4.1% | 4.1% | Taux de chômage |
   | 09/11 | 08:30 | CPI | 🔴 HIGH | 2.4% | 2.6% | Inflation annuelle |

   ### Semaine Prochaine (11-17 Nov)

   | Date | Heure | Indicateur | Impact | Précédent | Estimé | Description |
   |------|-------|------------|--------|-----------|---------|-------------|
   | 14/11 | 08:30 | Retail Sales | 🟡 MED | +0.4% | +0.3% | Ventes au détail |
   | 15/11 | 09:45 | PMI Services | 🟡 MED | 55.2 | 54.8 | Indice services S&P |

   ---

   **Légende Impact:**
   - 🔴 **HIGH** = Impact majeur sur les marchés (volatilité attendue)
   - 🟡 **MED** = Impact modéré
   - ⚪ **LOW** = Impact mineur (non affiché)

   **Heures:**
   - Toutes les heures sont en **EST (Eastern Standard Time)**
   - 🇨🇦 Canada: généralement 10h00 EST
   - 🇺🇸 États-Unis: 08:30, 10:00, 14:00 EST selon l'indicateur

   **Ressources:**
   - 📅 [FXStreet Economic Calendar](https://www.fxstreet.com/economic-calendar)
   - 📅 [Investing.com Calendar](https://www.investing.com/economic-calendar/)
   - 📅 [Banque du Canada](https://www.bankofcanada.ca/rates/)
   - 📅 [Federal Reserve](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm)

   **Note:** Les estimations sont des consensus. Les événements peuvent être reportés. Impact sur marchés = volatilité attendue.
   ```

5. **Gestion des Erreurs**
   - Si FMP API échoue → essayer Trading Economics API
   - Si aucune donnée → afficher "Aucun événement majeur prévu"
   - Si estimation manquante → afficher "-" ou "TBA"

6. **Informations Additionnelles**
   Pour chaque événement HIGH impact, ajouter:
   - **Description détaillée** de l'indicateur
   - **Impact attendu sur marchés** (ex: "CPI > estimé = USD monte")
   - **Historique récent** (3 dernières valeurs)

## Code d'Implémentation

```javascript
// Récupérer calendrier économique FMP
const dateDebut = new Date().toISOString().split('T')[0]; // Aujourd'hui
const dateFin = new Date(Date.now() + 21*24*60*60*1000).toISOString().split('T')[0]; // +21 jours

const response = await fetch(`/api/fmp?endpoint=economic-calendar&from=${dateDebut}&to=${dateFin}`);
const events = await response.json();

// Filtrer Canada + US, High/Medium impact
const filteredEvents = events.filter(e =>
  (e.country === 'CA' || e.country === 'US') &&
  (e.impact === 'High' || e.impact === 'Medium')
);

// Trier par date
filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

// Grouper par pays et semaine
const groupedByCountry = {
  'CA': filteredEvents.filter(e => e.country === 'CA'),
  'US': filteredEvents.filter(e => e.country === 'US')
};

// Générer tableau Markdown
```

## Exemple de Sortie Attendue

```markdown
# 📅 Calendrier Économique - 3 Prochaines Semaines

**Généré le:** 5 novembre 2025, 17:00 EST
**Période:** 6 novembre au 27 novembre 2025

## 🇨🇦 Canada

### Cette Semaine (6-10 Nov)

| Date | Heure | Indicateur | Impact | Précédent | Estimé | Description |
|------|-------|------------|--------|-----------|---------|-------------|
| 07/11 | 10:00 | Emploi (Oct) | 🔴 HIGH | +46.7K | +25.0K | Variation mensuelle emploi |
| 08/11 | 10:00 | IPC (CPI) Oct | 🔴 HIGH | 1.6% | 1.8% | Inflation annuelle (YoY) |
| 09/11 | 10:00 | Permis Construction | 🟡 MED | -3.4% | +2.0% | Variation mensuelle |

**Analyse - Emploi 🇨🇦:**
- **Précédent:** +46.7K (Sept) - Forte création d'emplois
- **Estimé:** +25.0K - Ralentissement attendu
- **Impact marchés:** Si > 30K → CAD monte, Si < 20K → CAD baisse
- **Historique:** Juil +47K, Août +22K, Sept +47K

**Analyse - IPC 🇨🇦:**
- **Précédent:** 1.6% (Sept) - Sous cible 2% Banque du Canada
- **Estimé:** 1.8% - Remontée inflation
- **Impact marchés:** Si > 2% → Hausse taux possible → CAD monte
- **Historique:** Juil 2.5%, Août 2.0%, Sept 1.6%

### Semaine Prochaine (11-17 Nov)

| Date | Heure | Indicateur | Impact | Précédent | Estimé | Description |
|------|-------|------------|--------|-----------|---------|-------------|
| 14/11 | 10:00 | Ventes Détail Sept | 🟡 MED | -0.1% | +0.3% | Variation mensuelle |
| 15/11 | 10:00 | PMI Manufacturing | 🟡 MED | 47.5 | 48.2 | Indice manufacturier S&P |

## 🇺🇸 États-Unis

### Cette Semaine (6-10 Nov)

| Date | Heure | Indicateur | Impact | Précédent | Estimé | Description |
|------|-------|------------|--------|-----------|---------|-------------|
| 07/11 | 14:00 | FOMC Rate Decision | 🔴 HIGH | 4.75-5.00% | 4.50-4.75% | Décision taux Fed |
| 07/11 | 14:30 | Conférence Powell | 🔴 HIGH | - | - | Conférence de presse Fed |
| 08/11 | 08:30 | Non-Farm Payrolls Oct | 🔴 HIGH | +254K | +140K | Création d'emplois |
| 08/11 | 08:30 | Unemployment Rate Oct | 🔴 HIGH | 4.1% | 4.1% | Taux de chômage |
| 08/11 | 08:30 | Average Hourly Earnings | 🟡 MED | +0.4% | +0.3% | Salaires horaires |
| 09/11 | 08:30 | CPI Oct | 🔴 HIGH | 2.4% | 2.6% | Inflation annuelle (YoY) |
| 09/11 | 08:30 | Core CPI Oct | 🔴 HIGH | 3.3% | 3.3% | Inflation hors énergie/alimentation |

**Analyse - FOMC Rate 🇺🇸:**
- **Décision attendue:** Baisse de 25 bps (4.75% → 4.50%)
- **Impact marchés:** MAJEUR - Volatilité sur tous les actifs
  - Si baisse 25 bps (attendu) → Neutre, déjà pricé
  - Si baisse 50 bps (surprise) → Actions monte, USD baisse
  - Si pause (surprise) → Actions baisse, USD monte
- **Focus:** Guidance Powell sur prochaines réunions
- **Historique:** Sept -50 bps, Nov attendu -25 bps

**Analyse - Non-Farm Payrolls 🇺🇸:**
- **Précédent:** +254K (Sept) - Très forte création
- **Estimé:** +140K - Ralentissement significatif
- **Impact marchés:** MAJEUR - "Jobs Report Day" = volatilité
  - Si > 180K → Économie forte → Taux montent → USD monte, Actions baisse
  - Si < 100K → Économie faible → Taux baissent → USD baisse, Actions monte
- **Historique:** Juil +114K, Août +159K, Sept +254K

**Analyse - CPI 🇺🇸:**
- **Précédent:** 2.4% (Sept) - Plus bas depuis 2021
- **Estimé:** 2.6% - Remontée inflation
- **Impact marchés:** MAJEUR - Détermine politique Fed
  - Si > 2.8% → Fed ralentit baisses → USD monte, Actions baisse
  - Si < 2.4% → Fed accélère baisses → USD baisse, Actions monte
- **Historique:** Juil 2.9%, Août 2.5%, Sept 2.4%

### Semaine Prochaine (11-17 Nov)

| Date | Heure | Indicateur | Impact | Précédent | Estimé | Description |
|------|-------|------------|--------|-----------|---------|-------------|
| 14/11 | 08:30 | Retail Sales Oct | 🟡 MED | +0.4% | +0.3% | Ventes au détail |
| 14/11 | 08:30 | Core Retail Sales Oct | 🟡 MED | +0.5% | +0.2% | Hors auto/essence |
| 14/11 | 09:15 | Industrial Production Oct | 🟡 MED | +0.4% | +0.2% | Production industrielle |
| 15/11 | 08:30 | Housing Starts Oct | 🟡 MED | 1.354M | 1.340M | Mises en chantier |
| 15/11 | 09:45 | PMI Services Nov | 🟡 MED | 55.2 | 54.8 | Indice services S&P |

---

**Légende Impact:**
- 🔴 **HIGH** = Impact majeur sur marchés (volatilité élevée attendue)
- 🟡 **MED** = Impact modéré (mouvement possible mais limité)
- ⚪ **LOW** = Impact mineur (non affiché dans ce calendrier)

**Heures (EST - Eastern Standard Time):**
- 🇨🇦 **Canada:** 10:00 EST (StatCan, Banque du Canada)
- 🇺🇸 **États-Unis:**
  - 08:30 EST → Bureau of Labor Statistics, Census Bureau
  - 10:00 EST → ISM, U. of Michigan
  - 14:00 EST → Federal Reserve (FOMC)

**Ressources Officielles:**
- 📅 [FXStreet Economic Calendar](https://www.fxstreet.com/economic-calendar)
- 📅 [Investing.com Calendar](https://www.investing.com/economic-calendar/)
- 📅 [Trading Economics Calendar](https://tradingeconomics.com/calendar)
- 🇨🇦 [Banque du Canada](https://www.bankofcanada.ca/rates/indicators/)
- 🇨🇦 [Statistique Canada](https://www.statcan.gc.ca/en/dai/btd)
- 🇺🇸 [Federal Reserve Calendar](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm)
- 🇺🇸 [Bureau of Labor Statistics](https://www.bls.gov/schedule/news_release/)

**Note Importante:**
- Les estimations sont des **consensus d'analystes** (Bloomberg, Reuters)
- Les dates/heures peuvent changer (**vérifier sources officielles**)
- Impact marchés = **volatilité attendue** (non direction garantie)
- Événements HIGH = potentiel mouvements **>0.5%** sur indices majeurs
- Préparez-vous: volatilité accrue **15 min avant** jusqu'à **1h après** publication

**Dernière mise à jour:** 5 novembre 2025, 17:00 EST (Données FMP)
```

## Notes Techniques

- Utilise FMP Economic Calendar API
- Fallback vers Trading Economics si FMP échoue
- Cache résultats pendant 6h (calendrier change peu)
- Format dates en français: "7 novembre" ou "07/11"
- Trie par date croissante, puis impact (High → Medium)
- Group par pays d'abord, puis par semaine
- Ajoute analyses détaillées pour événements HIGH impact
