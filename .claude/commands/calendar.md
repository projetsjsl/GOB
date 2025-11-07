Utilise le skill **Economic Calendar** d'Emma pour afficher les événements économiques importants du jour ou de la semaine.

**OBJECTIF**: Présenter calendrier économique avec publications macroéconomiques, données économiques et événements clés qui peuvent impacter les marchés.

**PARAMÈTRES**:
- **date** (optionnel): Date spécifique au format YYYY-MM-DD (défaut: aujourd'hui)
- **period** (optionnel): "today", "week", "month"

**ÉVÉNEMENTS COUVERTS**:
- **Emploi**: Payrolls, taux de chômage, créations d'emplois
- **Inflation**: CPI, PPI, PCE
- **Croissance**: GDP, ventes au détail, production industrielle
- **Banques centrales**: Décisions taux, discours Fed/BCE/BoC
- **Consommation**: Confiance consommateur, dépenses
- **Immobilier**: Ventes maisons, mises en chantier
- **Manufacture**: PMI, ISM Manufacturing

**INSTRUCTIONS**:
1. Demande à Emma d'utiliser le tool `economic-calendar` via `/api/fmp?endpoint=economic-calendar`
2. Filtre événements par:
   - Importance (High, Medium, Low)
   - Pays (US, CA, EU prioritaires)
   - Timing (ordre chronologique)
3. Indique:
   - Heure exacte (ET)
   - Indicateur publié
   - Consensus attendu
   - Valeur précédente
   - Impact potentiel sur marchés
4. Ajoute contexte si événement majeur (Fed, Payrolls, CPI)

**EXEMPLE DE FORMAT DE RÉPONSE**:

```
📅 CALENDRIER ÉCONOMIQUE - Vendredi 8 novembre 2025

🔴 HAUTE IMPORTANCE

8h30 ET | US Nonfarm Payrolls (Emplois non-agricoles)
📊 Attendu: 180K | Précédent: 150K
💬 Impact: TRÈS ÉLEVÉ sur marchés
📈 Si > 200K: USD strong, actions tech pression
📉 Si < 150K: USD weak, actions tech rallye possible

8h30 ET | US Unemployment Rate (Taux de chômage)
📊 Attendu: 3.9% | Précédent: 3.8%
💬 Impact: ÉLEVÉ sur Fed policy

10h00 ET | US Consumer Sentiment (Confiance consommateur)
📊 Attendu: 70.5 | Précédent: 68.9
💬 Impact: MOYEN sur secteur consommation

🟡 IMPORTANCE MOYENNE

8h30 ET | CA Employment Change (Canada)
📊 Attendu: +25K | Précédent: +15K
💬 Impact: MOYEN sur TSX et CAD

14h00 ET | US Baker Hughes Rig Count
📊 Précédent: 620
💬 Impact: FAIBLE (secteur énergie uniquement)

🎯 ÉVÉNEMENTS BANQUES CENTRALES

13h00 ET | Fed Chair Powell Speech (Discours)
📍 Événement: Economic Club of Washington
💬 Impact: TRÈS ÉLEVÉ
📌 Points à surveiller:
   • Vision inflation
   • Outlook taux 2025
   • Santé économie

📊 SYNTHÈSE DU JOUR

Journée CRITIQUE avec Payrolls + discours Powell.
Forte volatilité attendue, particulièrement:
• 8h30: Payrolls (spike initial)
• 13h00: Powell (direction pour fin année)

💡 STRATÉGIE:
• Éviter positions nouvelles avant 8h30
• Surveiller USD et Treasury yields
• Tech sensible aux commentaires Fed

⏰ PROCHAINS ÉVÉNEMENTS MAJEURS:

Mardi 12 nov | CPI Inflation (8h30 ET)
Mercredi 13 nov | PPI Producer Prices (8h30 ET)
Jeudi 14 nov | Retail Sales (8h30 ET)
```

**FORMAT COURT (SMS)**:
```
📅 Aujourd'hui: Payrolls 8h30 (att 180K) | Powell 13h00 (speech) | HIGH VOLATILITY ⚠️
```

**CALENDRIER SEMAINE**:
```
📅 CALENDRIER SEMAINE (6-10 novembre)

LUNDI 6 nov: ISM Services (10h00)
MARDI 7 nov: Trade Balance (8h30)
MERCREDI 8 nov: 🔴 Payrolls + Powell speech
JEUDI 9 nov: Jobless Claims (8h30)
VENDREDI 10 nov: PPI (8h30)

🔴 Jour critique: Mercredi (2 événements majeurs)
```

**IMPACT SUR SECTEURS**:
```
📊 IMPACT POTENTIEL PAR SECTEUR

Si Payrolls STRONG (>200K):
✅ Financières (taux plus hauts plus longtemps)
✅ Énergie (économie forte)
❌ Tech growth (taux élevés = pression valuation)
❌ Utilities (safe-haven moins attractif)

Si Payrolls WEAK (<150K):
✅ Tech growth (espoir baisse taux)
✅ Immobilier (taux baisse = bon)
❌ Financières (moins de hausses taux)
❌ Industrielles (crainte récession)
```

**GESTION D'ERREURS**:
- Si pas d'événements: "ℹ️ Calendrier calme aujourd'hui"
- Si API down: Suggérer sources alternatives (Investing.com, ForexFactory)
- Si date passée: Afficher résultats actuels vs attendus

**TON**: Informatif, professionnel, avec anticipation de l'impact marché.

**EXEMPLES D'UTILISATION**:
- "Calendrier économique aujourd'hui"
- "Événements économiques cette semaine"
- "Quand est le prochain CPI?"
- "Calendar demain"
- "Quoi de prévu Fed cette semaine?"
