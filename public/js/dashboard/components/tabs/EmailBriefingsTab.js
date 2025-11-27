// Auto-converted from monolithic dashboard file
// Component: EmailBriefingsTab

const { useState, useEffect, useCallback, useMemo } = React;

const EmailBriefingsTab = ({ isDarkMode = true }) => {
                const [loading, setLoading] = useState(false);
                const [currentBriefing, setCurrentBriefing] = useState(null);
                const [previewHtml, setPreviewHtml] = useState('');
                const [briefingHistory, setBriefingHistory] = useState([]);
                const [customTopic, setCustomTopic] = useState('');
                const [showCustomModal, setShowCustomModal] = useState(false);
                const [recipients, setRecipients] = useState('');
                const [selectedType, setSelectedType] = useState('morning');
                const [isEditMode, setIsEditMode] = useState(false);
                const [editedHtml, setEditedHtml] = useState('');
                const [currentStep, setCurrentStep] = useState('');
                const [stepDetails, setStepDetails] = useState('');
                const [dataSource, setDataSource] = useState('apis'); // 'apis' ou 'yahoo'
                const [apiSources, setApiSources] = useState({
                    marketData: 'perplexity', // 'perplexity' - Perplexity 100% par défaut
                    news: 'perplexity', // 'perplexity' - Perplexity par défaut
                    analysis: 'perplexity' // 'perplexity' - Perplexity par défaut
                });
                const [perplexityEnabled, setPerplexityEnabled] = useState({
                    marketData: true,
                    news: true,
                    analysis: true
                });
                const [debugData, setDebugData] = useState({
                    marketData: { request: null, response: null, error: null },
                    news: { request: null, response: null, error: null },
                    analysis: { request: null, response: null, error: null }
                });
        // NOTE: healthStatus, healthCheckLoading, processLog, showDebug, showFullLog
        // moved to dashboard-main.js for proper scope

                // Tickers de la watchlist (récupérés depuis Supabase)
                // Utilise l'état global watchlistTickers chargé depuis Supabase

                // ============================================================================
                // EMMA EN DIRECT 100% PERPLEXITY - PROMPTS ULTRA-DÉTAILLÉS
                // ============================================================================
                // 🎯 Architecture ultra-simplifiée : 1 requête Perplexity → Contenu complet
                // ✅ Plus de Yahoo Finance, plus de variables multiples, plus de complexité
                // ✅ Prompts de 2000+ mots = analyses professionnelles complètes
                // ✅ 4 modèles de backup + cache intelligent + monitoring en temps réel
                // ============================================================================
                
                // Prompts Emma En Direct - Style professionnel et technique approfondi
                const prompts = {
                    morning: {
                        perplexity: `🌅 Prompt Morning Market Briefing — Briefing Matinal Expert
Tu es Emma, assistante virtuelle experte en analyse financière institutionnelle.
Rédige un briefing matinal ultra-complet d'environ 1800-2000 mots sur les 12 dernières heures à la fermeture de la veille et à la préouverture, avec :

Contenu attendu
🧾 Résumé du ton et contexte macro, sentiment global de marché (2-3 phrases)

📉 Analyse détaillée des courbes de taux US & CA (2Y, 5Y, 10Y, 30Y), écarts clés, tendances intraday, sources officielles (Slickcharts, Banque du Canada)

💱 Devises clés vs USD/CAD, impact sur matières premières, corrélations, données chiffrées (Investing, Banque du Canada)

📊 Volatilité & sentiment marché : VIX, MOVE, put/call ratios, indicateurs options, analyse sentiment institutionnel et retail

🏭 Performance sectorielle US + CA avec rotations, % moves, drivers macro/micro, sans nommer de titres dans la consigne mais analyses dans la réponse possibles

📈 Analyse des mouvements significatifs sur titres (résultats pré-marché, fusions, volumes anormaux), volumes et gaps, réactions cours

🗓️ Calendrier macro & corporate 24-48h : publications clés, résultats attendus, rencontres BC, discours Fed/BCE, anticipation impacts

🧭 Synthèse stratégique macro et tactique à court terme, recommandations positionnement, alertes risques

🎨 Graphiques clairs inclus (courbes taux, heatmaps sectorielles, volumes consolidés) avec légende et sources

🔗 Sources validées (Bloomberg, Reuters, CNBC, sites banques centrales, Investing.com) avec URLs`,
                        openai: `🌅 Prompt Morning Market Briefing — Briefing Matinal Expert
Tu es Emma, assistante virtuelle experte en analyse financière institutionnelle.
Rédige un briefing matinal ultra-complet d'environ 1800-2000 mots sur les 12 dernières heures à la fermeture de la veille et à la préouverture, avec :

Contenu attendu
🧾 Résumé du ton et contexte macro, sentiment global de marché (2-3 phrases)

📉 Analyse détaillée des courbes de taux US & CA (2Y, 5Y, 10Y, 30Y), écarts clés, tendances intraday, sources officielles (Slickcharts, Banque du Canada)

💱 Devises clés vs USD/CAD, impact sur matières premières, corrélations, données chiffrées (Investing, Banque du Canada)

📊 Volatilité & sentiment marché : VIX, MOVE, put/call ratios, indicateurs options, analyse sentiment institutionnel et retail

🏭 Performance sectorielle US + CA avec rotations, % moves, drivers macro/micro, sans nommer de titres dans la consigne mais analyses dans la réponse possibles

📈 Analyse des mouvements significatifs sur titres (résultats pré-marché, fusions, volumes anormaux), volumes et gaps, réactions cours

🗓️ Calendrier macro & corporate 24-48h : publications clés, résultats attendus, rencontres BC, discours Fed/BCE, anticipation impacts

🧭 Synthèse stratégique macro et tactique à court terme, recommandations positionnement, alertes risques

🎨 Graphiques clairs inclus (courbes taux, heatmaps sectorielles, volumes consolidés) avec légende et sources

🔗 Sources validées (Bloomberg, Reuters, CNBC, sites banques centrales, Investing.com) avec URLs

🚀 PROMPT MATINAL - PRÉOUVERTURE :

🌏 RÉSUMÉ EXÉCUTIF APPROFONDI (6-8 phrases)
→ Bonjour ! Voici votre briefing matinal avec les mouvements overnight détaillés
→ Thème dominant des marchés et rotation sectorielle observée avec contexte
→ Sentiment général (risk-on/risk-off) et flux institutionnels avec analyse
→ Implications pour vos stratégies tactiques et positionnement
→ Niveaux techniques clés à surveiller aujourd'hui
→ Événements majeurs du jour et leur impact potentiel

📊 PERFORMANCE DES MARCHÉS APPROFONDIE ET DÉTAILLÉE
→ Asie : analyse détaillée par région avec contexte économique et tendances
→ Futures : implications pour l'ouverture US/EU avec niveaux clés et volumes
→ Secteurs moteurs et sous-performants avec drivers explicatifs détaillés
→ Corrélations inter-marchés et devises avec analyse des flux
→ Volumes et liquidité par secteur avec comparaisons historiques
→ Indicateurs de sentiment et positionnement institutionnel

💡 CATALYSEURS & ACTUALITÉS CLÉS DÉTAILLÉES
→ Top 8 événements impactants avec analyse quantitative approfondie
→ Signification pour vos secteurs et titres de la watchlist avec implications
→ Réactions des marchés et ajustements de positionnement observés
→ Déclarations de dirigeants et banquiers centraux avec contexte
→ Événements géopolitiques et réglementaires avec évaluation des risques
→ Activisme actionnarial et mouvements corporate avec détails

📈 DONNÉES TECHNIQUES & SENTIMENT APPROFONDIES
→ Niveaux S&P 500, support/résistance, volumes avec analyse technique
→ Indicateurs de sentiment (VIX, put/call ratio, flows) avec tendances
→ Positionnement institutionnel et retail avec flux détaillés
→ Corrélations et divergences techniques entre asset classes
→ Momentum et oscillateurs sur les indices majeurs
→ Analyse des gaps et niveaux de retournement

🎯 FOCUS DU JOUR APPROFONDI - VOTRE WATCHLIST
→ Publications économiques à surveiller (impact détaillé sur vos secteurs)
→ Résultats d'entreprises attendus (earnings calendar) avec consensus
→ Dividendes à venir et ex-dates avec impact sur les cours
→ Événements corporate (analyst days, conférences) avec participants
→ Activisme actionnarial et proxy fights en cours
→ Changements réglementaires sectoriels avec implications

⚠️ RISQUES & OPPORTUNITÉS TACTIQUES DÉTAILLÉES
→ 5 risques majeurs avec probabilité, impact et mitigation
→ 5 opportunités tactiques avec entry/exit levels et stop-loss
→ Recommandations de positionnement par secteur avec allocation
→ Stratégies de hedging et protection de portefeuille
→ Niveaux de volatilité attendus et gestion des risques
→ Corrélations à surveiller et diversification

📅 AGENDA ÉCONOMIQUE & CORPORATE DÉTAILLÉ
→ Calendrier économique du jour avec consensus et impact attendu
→ Résultats d'entreprises avec estimations et guidance
→ Interventions de banquiers centraux avec contexte
→ Événements sectoriels et conférences industrielles
→ Réunions d'actionnaires et votes importants
→ Publications de données macro avec tendances

🔮 PERSPECTIVES COURT TERME & POSITIONNEMENT
→ Analyse des tendances émergentes et leur durabilité
→ Niveaux techniques critiques pour la suite de la semaine
→ Corrélations à surveiller entre asset classes
→ Stratégies de positionnement pour les prochains jours
→ Gestion des risques et opportunités tactiques
→ Recommandations sectorielles avec conviction

**Important :** Rappelez toujours que pour des conseils personnalisés, il faut consulter un expert qualifié.

STYLE : Voix Emma - Niveau expert institutionnel, 2000-2500 mots, français, avec chiffres précis, références sectorielles détaillées, et recommandations tactiques approfondies`
                    },
                    noon: {
                        perplexity: `⏱️ Prompt Noon Market Briefing — Mise à jour Intraday Approfondie
Tu es Emma, assistante virtuelle experte en analyse financière.
Rédige une mise à jour complète de 1800-2200 mots sur la séance en cours, couvrant les dernières 4 heures, avec :

Contenu attendu
📰 Breaking news corporate : résultats trimestriels, changements de guidance, upgrades/downgrades, rachats, nominations, volumes anormaux, réactions intraday, détails chiffrés précis

📈 Données macro EU/US publiées en matinée (retail sales, PPI, consumer sentiment), comparaison consensus vs réalité, impacts marchés

🔥 Mouvements anormaux sur watchlist (gaps >5%, volumes multipliés), activités options, put/call ratios, sentiment détaillé retail et institutionnel, flux analysés

🏭 Analyse sectorielle approfondie (tech, santé, finance, consommation, énergie, télécoms) avec drivers fondamentaux, implications stratégiques, analyses libres sur titres

📉 Analyse technique intraday (supports, résistances, oscillateurs RSI/MACD, volumes, VIX, corrélations inter-marchés), implications tactiques

💹 Flux institutionnels et retail : rotation sectorielle, flux devises/obligations/actions, analyse sentiment et volumes

🗒️ Calendrier après-midi : discours Fed (Powell), publications économiques clés, résultats after-market, votes/actionnariat

🎯 Recommandations tactiques : niveaux d'entry, stops, hedging, diversification, gestion de risques avec chiffres et scénarios détaillés

📊 Graphiques riches : heatmaps secteurs, volumes titres, courbes techniques, sentiment options

🔗 Sources fiables : Bloomberg, CNBC, Reuters, sites banques centrales, Investing, CBOE

⏱️ PROMPT MI-JOURNÉE - UPDATE INTRADAY :

🗞️ Breaking news corporate récentes (4h) : M&A, annonces de guidances, upgrades/downgrades, rachats/dividendes, changements de direction, avec chiffres, consensus, réactions (cours, volumes)

📈 Données macro US/EU publiées en matinée : récents chiffres retail sales, PPI, consumer sentiment, spreads, taux, avec analyse des différences consensus vs réalité et impact quantifié sur marchés

🚨 Mouvements anormaux sur watchlist : volumes >200%, gaps >5%, détails des titres, analyse du sentiment options (put/call ratio), flux institutionnels/retail

🔬 Deep dive sectoriel (tech, finance, santé, consommation, énergie, télécoms) avec drivers fondamentaux, chiffres clés, réactions boursières, comparaisons peers

📉 Analyse technique avancée intraday : supports/résistances tests, oscillateurs, volumes, corrélations inter-marchés, VIX, avec implications tactiques

💹 Flux institutionnels et retail détaillés : rotation sectorielle, corrélations devises/obligations/actions, analyse de sentiment et volume avec impact immédiat

🗓️ Agenda après-midi aperçu : prochains événements macro, discours Fed/BCE, publications earnings, voting corporate

🔔 Recommandations tactiques intraday : niveaux d'entrée, stops, hedging, diversification, gestion risques face à la volatilité

Style : Format riche en données et analyses chiffrées (ex : BAC +4.5% intraday, MS EPS $2.80 vs 2.10 consensus). Sources citées systématiquement avec URL (Reuters, CNBC, Bloomberg). Structure claire avec titres, sous-titres, emojis, listes pour faciliter la lecture rapide. Ton expert, synthétique et concret, focalisé sur insights opérationnels à haute valeur ajoutée.`,
                        openai: `⏱️ Prompt Noon Market Briefing — Mise à jour Intraday Approfondie
Tu es Emma, assistante virtuelle experte en analyse financière.
Rédige une mise à jour complète de 1800-2200 mots sur la séance en cours, couvrant les dernières 4 heures, avec :

Contenu attendu
📰 Breaking news corporate : résultats trimestriels, changements de guidance, upgrades/downgrades, rachats, nominations, volumes anormaux, réactions intraday, détails chiffrés précis

📈 Données macro EU/US publiées en matinée (retail sales, PPI, consumer sentiment), comparaison consensus vs réalité, impacts marchés

🔥 Mouvements anormaux sur watchlist (gaps >5%, volumes multipliés), activités options, put/call ratios, sentiment détaillé retail et institutionnel, flux analysés

🏭 Analyse sectorielle approfondie (tech, santé, finance, consommation, énergie, télécoms) avec drivers fondamentaux, implications stratégiques, analyses libres sur titres

📉 Analyse technique intraday (supports, résistances, oscillateurs RSI/MACD, volumes, VIX, corrélations inter-marchés), implications tactiques

💹 Flux institutionnels et retail : rotation sectorielle, flux devises/obligations/actions, analyse sentiment et volumes

🗒️ Calendrier après-midi : discours Fed (Powell), publications économiques clés, résultats after-market, votes/actionnariat

🎯 Recommandations tactiques : niveaux d'entry, stops, hedging, diversification, gestion de risques avec chiffres et scénarios détaillés

📊 Graphiques riches : heatmaps secteurs, volumes titres, courbes techniques, sentiment options

🔗 Sources fiables : Bloomberg, CNBC, Reuters, sites banques centrales, Investing, CBOE

⏱️ PROMPT MI-JOURNÉE - UPDATE INTRADAY :

🗞️ Breaking news corporate récentes (4h) : M&A, annonces de guidances, upgrades/downgrades, rachats/dividendes, changements de direction, avec chiffres, consensus, réactions (cours, volumes)

📈 Données macro US/EU publiées en matinée : récents chiffres retail sales, PPI, consumer sentiment, spreads, taux, avec analyse des différences consensus vs réalité et impact quantifié sur marchés

🚨 Mouvements anormaux sur watchlist : volumes >200%, gaps >5%, détails des titres, analyse du sentiment options (put/call ratio), flux institutionnels/retail

🔬 Deep dive sectoriel (tech, finance, santé, consommation, énergie, télécoms) avec drivers fondamentaux, chiffres clés, réactions boursières, comparaisons peers

📉 Analyse technique avancée intraday : supports/résistances tests, oscillateurs, volumes, corrélations inter-marchés, VIX, avec implications tactiques

💹 Flux institutionnels et retail détaillés : rotation sectorielle, corrélations devises/obligations/actions, analyse de sentiment et volume avec impact immédiat

🗓️ Agenda après-midi aperçu : prochains événements macro, discours Fed/BCE, publications earnings, voting corporate

🔔 Recommandations tactiques intraday : niveaux d'entrée, stops, hedging, diversification, gestion risques face à la volatilité

Style : Format riche en données et analyses chiffrées (ex : BAC +4.5% intraday, MS EPS $2.80 vs 2.10 consensus). Sources citées systématiquement avec URL (Reuters, CNBC, Bloomberg). Structure claire avec titres, sous-titres, emojis, listes pour faciliter la lecture rapide. Ton expert, synthétique et concret, focalisé sur insights opérationnels à haute valeur ajoutée.`
                    },
                    evening: {
                        perplexity: `🌇 Prompt Market Close Briefing — Synthèse & Perspectives Expert
Tu es Emma, assistante virtuelle experte.
Livre un briefing de clôture complet (1800-2200 mots) sur la séance clôturée avec :

Contenu attendu
📉 Synthèse marchés détaillée (indices majeurs US/CA/EU), % variations, volumes, volatilité, gaps, faits marquants

🏢 Review résultats after-market et intraday : analyse des écarts vs consensus, guidances, réactions marchés, avec liberté d'individuer les titres à mentionner

🗞️ Événements macro-financiers : discours Fed/BCE, publications du jour, impacts sur taux, devises, actions

📊 Analyse des flux fin de séance : volumes, VIX, rapports put/call, rotation trading final, corrélations inter-actifs

📉 Analyse technique fin de séance : supports, résistances, oscillateurs, impulsion, perspectives pour séance prochaine

💼 Positionnements institutionnels & retail : mouvements notables, réallocations sectorielles, flux intraday

🗓️ Points à surveiller demain : publications macro, earnings, événements corporate, discours banques centrales

🎯 Recommandations tactiques overnight & open next day : stops, hedge, opportunités, anticipation risques

📈 Graphiques et images : courbes taux, heatmaps, volumes, sentiment, légendes soignées

🔗 Citations sources accessibles : Bloomberg, CNBC, Reuters, sites officiels banques centrales, Investing.com

📊 PROMPT CLÔTURE - SYNTHÈSE ET PERSPECTIVES :

📉 Synthèse performance des marchés (indices, secteurs, grandes valeurs) avec % moves, volumes, volatilité, gaps et facteurs clés du jour

🏢 Review résultats d'après-midi : publications intraséance et after-market, analyse des écarts versus consensus, guidance, réactions boursières

🗞️ Événements macro-financiers clés de la journée (Federal Reserve, BCE, discours, annonces) avec résumé des impacts sur taux, devises, actions

📊 Analyse de flux fin de journée : liquidité, pression acheteuse/vendeuse, sentiment options et évolution du VIX, corrélations inter-assets (actions/obligations/devise)

🛠️ Analyse technique de clôture : supports résistances touchés, indicateurs momentum, implications pour la séance suivante

💼 Positionnement institutionnel fin de séance : ajustements, rotations sectorielles, comportements retail avec chiffres

🗓️ À suivre demain : événements macro, earnings, points de vigilance sectoriels

🎯 Recommendations tactiques overnight et open next day : stops, hedging, opportunités, risques à anticiper

Style : Information dense, riche en données et chiffres, 100% sourcé (endpoints Bloomberg, Reuters, sites officiels). Utilisation de graphiques et tableaux intégrés possible (selon format), toujours légendés et référencés. Format clair avec sous-titres, emojis, listes, paragraphes courts pour interface rapide avec prise de décision.

🏆 GAGNANTS & PERDANTS APPROFONDIS - VOTRE WATCHLIST
- Top 15 mouvements sur les titres suivis avec analyse détaillée
- Catalyseurs précis pour chaque mouvement significatif avec contexte
- Révisions d'estimations et changements de consensus avec impact
- Activisme actionnarial et événements corporate avec détails
- Activité des options et sentiment avec put/call ratios
- Flux institutionnels et retail avec patterns d'activité

📢 ÉVÉNEMENTS MARQUANTS DU JOUR DÉTAILLÉS
- Résultats d'entreprises publiés (beat/miss, guidances) avec analyse comparative
- Annonces macro importantes (Fed, BCE, données économiques) avec implications
- M&A et restructurations annoncées avec évaluation stratégique
- Nouvelles réglementaires et politiques avec impact sectoriel
- Déclarations de dirigeants et banquiers centraux avec contexte
- Activisme actionnarial et proxy fights avec détails des demandes

🔮 APRÈS CLÔTURE & PRÉ-MARCHÉ APPROFONDIS
- Résultats après clôture (earnings calendar) avec consensus et réactions
- Guidances et communications corporate avec analyse des implications
- Futures et pré-ouverture asiatique avec tendances et niveaux
- Événements corporate de demain avec participants et timing
- Activité des options et sentiment avec patterns
- Flux institutionnels et retail avec analyse des positions

📅 AGENDA DEMAIN APPROFONDI - ÉCONOMIQUE & CORPORATE
- Publications économiques clés (NFP, CPI, PMI, etc.) avec consensus et impact attendu
- Résultats d'entreprises attendus (earnings calendar) avec estimations
- Dividendes à venir et ex-dates avec impact sur les cours
- Événements corporate (analyst days, conférences) avec participants
- Interventions de banquiers centraux avec contexte et implications
- Réunions d'actionnaires et votes importants avec détails

🎯 FOCUS SECTEUR APPROFONDI - SETUP DEMAIN
- Technologie (GOOGL, CSCO, MU) - actualités tech, earnings, régulation, tendances
- Santé (JNJ, MDT, PFE, UNH) - réglementation, résultats, innovation, pipeline
- Finance (JPM, BNS, TD, WFC) - taux, stress tests, provisions, régulation
- Consommation (NKE, DEO, UL) - retail, consumer sentiment, ESG, tendances
- Énergie/Matériaux (NTR, TRP) - commodities, transition énergétique, ESG
- Télécoms (T, BCE, VZ) - 5G, infrastructure, consolidation, régulation

📈 ANALYSE TECHNIQUE & SENTIMENT APPROFONDIE
- Niveaux clés : support/résistance, volumes, momentum avec analyse
- Indicateurs de sentiment : VIX, put/call, flows avec tendances
- Positionnement institutionnel et retail avec flux détaillés
- Corrélations et divergences techniques avec asset classes
- Momentum et oscillateurs sur les indices majeurs
- Analyse des gaps et niveaux de retournement

FOCUS : Bilan factuel complet et détaillé + setup tactique pour demain avec niveaux clés, recommandations sectorielles, et gestion des risques`,
                        openai: `🌇 Prompt Market Close Briefing — Synthèse & Perspectives Expert
Tu es Emma, assistante virtuelle experte.
Livre un briefing de clôture complet (1800-2200 mots) sur la séance clôturée avec :

Contenu attendu
📉 Synthèse marchés détaillée (indices majeurs US/CA/EU), % variations, volumes, volatilité, gaps, faits marquants

🏢 Review résultats after-market et intraday : analyse des écarts vs consensus, guidances, réactions marchés, avec liberté d'individuer les titres à mentionner

🗞️ Événements macro-financiers : discours Fed/BCE, publications du jour, impacts sur taux, devises, actions

📊 Analyse des flux fin de séance : volumes, VIX, rapports put/call, rotation trading final, corrélations inter-actifs

📉 Analyse technique fin de séance : supports, résistances, oscillateurs, impulsion, perspectives pour séance prochaine

💼 Positionnements institutionnels & retail : mouvements notables, réallocations sectorielles, flux intraday

🗓️ Points à surveiller demain : publications macro, earnings, événements corporate, discours banques centrales

🎯 Recommandations tactiques overnight & open next day : stops, hedge, opportunités, anticipation risques

📈 Graphiques et images : courbes taux, heatmaps, volumes, sentiment, légendes soignées

🔗 Citations sources accessibles : Bloomberg, CNBC, Reuters, sites officiels banques centrales, Investing.com

📊 PROMPT CLÔTURE - SYNTHÈSE ET PERSPECTIVES :

🎯 SYNTHÈSE EXÉCUTIVE APPROFONDIE (6-8 phrases)
→ Bonsoir ! Voici votre rapport de clôture avec la performance globale détaillée
→ Thème dominant et rotation sectorielle observée avec contexte et analyse
→ Sentiment et positionnement institutionnel avec flux détaillés
→ Implications pour vos stratégies tactiques et positionnement
→ Setup pour la séance de demain avec niveaux techniques clés
→ Événements majeurs de demain et leur impact potentiel

📊 ANALYSE DE MARCHÉ APPROFONDIE ET DÉTAILLÉE
→ Indices majeurs : variations, volumes, corrélations avec analyse comparative
→ Secteurs : performance relative et drivers explicatifs avec tendances
→ Devises et obligations : impact sur les actions avec flux détaillés
→ Flux institutionnels et retail par secteur avec patterns d'activité
→ Volatilité et liquidité par asset class avec comparaisons historiques
→ Indicateurs de sentiment et positionnement avec analyse

💡 DEEP DIVE ÉVÉNEMENTS CORPORATE APPROFONDIS
→ Résultats d'entreprises : beat/miss, guidances, révisions avec analyse comparative
→ M&A et restructurations : impact sectoriel avec évaluation stratégique
→ Activisme actionnarial et proxy fights avec détails des demandes
→ Événements corporate (analyst days, roadshows) avec participants
→ Révisions d'estimations et changements de consensus avec impact
→ Déclarations de dirigeants et banquiers centraux avec contexte

🔬 ANALYSE SECTORIELLE APPROFONDIE - VOTRE WATCHLIST
→ Technologie (GOOGL, CSCO, MU) : actualités tech, earnings, régulation, tendances
→ Santé (JNJ, MDT, PFE, UNH) : FDA, résultats, innovation, pipeline
→ Finance (JPM, BNS, TD, WFC) : taux, stress tests, provisions, régulation
→ Consommation (NKE, DEO, UL) : retail, consumer sentiment, ESG, tendances
→ Énergie/Matériaux (NTR, TRP) : commodities, transition énergétique, ESG
→ Télécoms (T, BCE, VZ) : 5G, infrastructure, consolidation, régulation

📈 ANALYSE TECHNIQUE & SENTIMENT APPROFONDIES
→ Niveaux clés : support/résistance, volumes, momentum avec analyse détaillée
→ Indicateurs de sentiment : VIX, put/call, flows avec tendances et patterns
→ Positionnement institutionnel et retail avec flux détaillés
→ Corrélations et divergences techniques avec asset classes
→ Momentum et oscillateurs sur les indices majeurs
→ Analyse des gaps et niveaux de retournement

🔮 PERSPECTIVES & POSITIONNEMENT APPROFONDIS
→ Calendrier économique de demain (impact sectoriel) avec consensus
→ Résultats d'entreprises attendus (earnings calendar) avec estimations
→ Dividendes à venir et ex-dates avec impact sur les cours
→ Événements corporate et analyst days avec participants
→ Recommandations tactiques par secteur avec allocation
→ Stratégies de hedging et protection de portefeuille

⚠️ RISQUES & OPPORTUNITÉS TACTIQUES DÉTAILLÉES
→ 5 risques majeurs avec probabilité, impact et mitigation
→ 5 opportunités tactiques avec entry/exit levels et stop-loss
→ Recommandations de positionnement par secteur avec allocation
→ Stratégies de hedging et protection de portefeuille
→ Niveaux de volatilité attendus et gestion des risques
→ Corrélations à surveiller et diversification

📅 AGENDA ÉCONOMIQUE & CORPORATE DÉTAILLÉ
→ Calendrier économique de demain avec consensus et impact attendu
→ Résultats d'entreprises avec estimations et guidance
→ Interventions de banquiers centraux avec contexte
→ Événements sectoriels et conférences industrielles
→ Réunions d'actionnaires et votes importants
→ Publications de données macro avec tendances

**Important :** Rappelez toujours que pour des conseils personnalisés, il faut consulter un expert qualifié.

STYLE : Voix Emma - Analyse institutionnelle niveau expert, 2500-3000 mots, français, avec chiffres précis, références sectorielles détaillées, et recommandations tactiques approfondies`
                    }
                };

                // NOTE: addLogEntry() moved to line ~2183 (before AdminJSLaiTab for proper scope)

                // Optimisation: useCallback pour clearProcessLog
                const clearProcessLog = useCallback(() => {
                    setProcessLog([]);
                    addLogEntry('SYSTEM', 'Log Initialisé', 'Nouveau processus de génération de briefing démarré', 'info');
                }, []);

                // Fonction pour enrichir les données avec les informations de la watchlist
                const enrichWatchlistData = async (marketData, type) => {
                    try {
                        addLogEntry('ENRICHMENT_EXPERT', 'Début enrichissement Expert Emma', { 
                            type, 
                            tickersCount: watchlistTickers.length 
                        }, 'info');
                        
                        // ============================================================================
                        // APPELS PARALLÈLES MODULES EXPERT EMMA
                        // ============================================================================
                        
                        const [
                            yieldCurvesData,
                            forexDetailedData,
                            volatilityAdvancedData,
                            commoditiesData,
                            tickersNewsData,
                            earnings,
                            dividends
                        ] = await Promise.all([
                            // Module 1: Courbes de taux US + CA
                            fetch('/api/ai-services', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ service: 'yield-curves' })
                            }).then(r => r.json()).catch(e => {
                                addLogEntry('YIELD_CURVES', 'Erreur', e.message, 'error');
                                return { success: false, data: null };
                            }),
                            
                            // Module 2: Forex détaillé vs USD + CAD
                            fetch('/api/ai-services', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ service: 'forex-detailed' })
                            }).then(r => r.json()).catch(e => {
                                addLogEntry('FOREX_DETAILED', 'Erreur', e.message, 'error');
                                return { success: false, data: null };
                            }),
                            
                            // Module 3: Volatilité VIX + MOVE
                            fetch('/api/ai-services', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ service: 'volatility-advanced' })
                            }).then(r => r.json()).catch(e => {
                                addLogEntry('VOLATILITY_ADVANCED', 'Erreur', e.message, 'error');
                                return { success: false, data: null };
                            }),
                            
                            // Module 4: Commodities (WTI, Or, Cuivre, Argent)
                            fetch('/api/ai-services', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ service: 'commodities' })
                            }).then(r => r.json()).catch(e => {
                                addLogEntry('COMMODITIES', 'Erreur', e.message, 'error');
                                return { success: false, data: null };
                            }),
                            
                            // Module 5: Nouvelles 26 tickers + Watchlist Dan
                            fetch('/api/ai-services', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                    service: 'tickers-news',
                                    tickers: tickers, // 26 tickers principaux
                                    watchlistTickers: watchlistTickers
                                })
                            }).then(r => r.json()).catch(e => {
                                addLogEntry('TICKERS_NEWS', 'Erreur', e.message, 'error');
                                return { success: false, data: { main_tickers: [], watchlist_dan: [] } };
                            }),
                            
                            // Module 6: Earnings calendar (existant)
                            getEarningsCalendar(),
                            
                            // Module 7: Dividends calendar (existant)
                            getDividendsCalendar()
                        ]);
                        
                        addLogEntry('ENRICHMENT_EXPERT', 'Modules Expert collectés', {
                            yieldCurves: yieldCurvesData.success,
                            forex: forexDetailedData.success,
                            volatility: volatilityAdvancedData.success,
                            commodities: commoditiesData.success,
                            tickersNews: tickersNewsData.success,
                            earnings: earnings.length,
                            dividends: dividends.length
                        }, 'success');
                        
                        // Ajouter les données existantes
                        const sectors = getSectorAnalysis();
                        const events = getEconomicEvents(type);
                        
                        // Structure enrichie complète
                        const enrichedData = {
                            ...marketData,
                            // ============================================================================
                            // MODULES EXPERT EMMA EN DIRECT
                            // ============================================================================
                            expert_modules: {
                                yield_curves: yieldCurvesData.data,
                                forex_detailed: forexDetailedData.data,
                                volatility_advanced: volatilityAdvancedData.data,
                                commodities: commoditiesData.data,
                                tickers_news: tickersNewsData.data || { main_tickers: [], watchlist_dan: [] },
                                sources_status: {
                                    yieldCurves: yieldCurvesData.source || 'unavailable',
                                    forex: forexDetailedData.source || 'unavailable',
                                    volatility: volatilityAdvancedData.source || 'unavailable',
                                    commodities: commoditiesData.source || 'unavailable'
                                }
                            },
                            // Données watchlist existantes
                            watchlist: {
                                tickers: watchlistTickers,
                                earnings_calendar: earnings,
                                dividends_calendar: dividends,
                                sector_analysis: sectors,
                                economic_events: events
                            }
                        };
                        
                        addLogEntry('ENRICHMENT_EXPERT', 'Enrichissement Expert terminé', {
                            originalSize: JSON.stringify(marketData).length,
                            enrichedSize: JSON.stringify(enrichedData).length,
                            expertModulesCount: 5,
                            watchlistData: enrichedData.watchlist
                        }, 'success');
                        
                        // Stocker les données enrichies dans debugData
                        setDebugData(prev => ({
                            ...prev,
                            expertModules: enrichedData.expert_modules
                        }));
                        
                        return enrichedData;
                    } catch (error) {
                        addLogEntry('ENRICHMENT_EXPERT', 'Erreur critique enrichissement', error.message, 'error');
                        console.error('Erreur enrichissement Expert Emma:', error);
                        return marketData;
                    }
                };

                // Optimisation: useCallback pour getEarningsCalendar
                const getEarningsCalendar = useCallback(async () => {
                    // Simulation des prochains résultats pour la watchlist
                    const earnings = [
                        { ticker: 'GOOGL', date: '2024-12-15', time: 'after-hours', estimate: 1.45 },
                        { ticker: 'JPM', date: '2024-12-16', time: 'before-open', estimate: 3.89 },
                        { ticker: 'JNJ', date: '2024-12-17', time: 'before-open', estimate: 2.78 },
                        { ticker: 'PFE', date: '2024-12-18', time: 'before-open', estimate: 0.45 },
                        { ticker: 'NKE', date: '2024-12-19', time: 'after-hours', estimate: 0.85 }
                    ];
                    return earnings.filter(e => watchlistTickers.includes(e.ticker));
                }, [watchlistTickers]);

                // Optimisation: useCallback pour getDividendsCalendar
                const getDividendsCalendar = useCallback(async () => {
                    // Simulation des prochains dividendes pour la watchlist
                    const dividends = [
                        { ticker: 'T', date: '2024-12-20', amount: 0.2775, ex_date: '2024-12-19' },
                        { ticker: 'JNJ', date: '2024-12-20', amount: 1.19, ex_date: '2024-12-19' },
                        { ticker: 'PFE', date: '2024-12-20', amount: 0.42, ex_date: '2024-12-19' },
                        { ticker: 'JPM', date: '2024-12-20', amount: 1.00, ex_date: '2024-12-19' },
                        { ticker: 'WFC', date: '2024-12-20', amount: 0.35, ex_date: '2024-12-19' }
                    ];
                    return dividends.filter(d => watchlistTickers.includes(d.ticker));
                }, [watchlistTickers]);

                // Optimisation: useMemo pour getSectorAnalysis (structure constante)
                const getSectorAnalysis = useMemo(() => {
                    return {
                        technology: { tickers: ['GOOGL', 'CSCO', 'MU'], weight: 0.25, trend: 'bullish' },
                        healthcare: { tickers: ['JNJ', 'MDT', 'PFE', 'UNH'], weight: 0.30, trend: 'neutral' },
                        financial: { tickers: ['JPM', 'BNS', 'TD', 'WFC'], weight: 0.20, trend: 'bullish' },
                        consumer: { tickers: ['NKE', 'DEO', 'UL'], weight: 0.15, trend: 'neutral' },
                        energy: { tickers: ['NTR', 'TRP'], weight: 0.05, trend: 'bearish' },
                        telecom: { tickers: ['T', 'BCE', 'VZ'], weight: 0.05, trend: 'neutral' }
                    };
                }, []);

                // Optimisation: useCallback pour getEconomicEvents
                const getEconomicEvents = useCallback((type) => {
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    const events = {
                        today: [
                            { time: '08:30', event: 'CPI MoM', impact: 'high', forecast: '0.3%' },
                            { time: '10:00', event: 'Consumer Sentiment', impact: 'medium', forecast: '102.5' },
                            { time: '14:00', event: 'Fed Speech - Powell', impact: 'high', forecast: 'hawkish tone' }
                        ],
                        tomorrow: [
                            { time: '08:30', event: 'Retail Sales', impact: 'high', forecast: '0.4%' },
                            { time: '10:00', event: 'Industrial Production', impact: 'medium', forecast: '0.2%' },
                            { time: '14:00', event: 'FOMC Minutes', impact: 'high', forecast: 'policy insights' }
                        ]
                    };

                    return type === 'morning' ? events.today : events.tomorrow;
                }, []);

                // Fonction utilitaire pour extraire la valeur numérique d'un change (inline dans les templates)

                // ============================================================================
                // GÉNÉRATION BRIEFING EMMA EN DIRECT - ARCHITECTURE ULTRA-SIMPLE
                // ============================================================================
                // 🎯 FLUX SIMPLIFIÉ : 1 requête Perplexity → Analyse complète → HTML
                // ✅ Plus de collecte de données multiples, plus de variables complexes
                // ✅ Prompt ultra-détaillé (2000+ mots) = contenu professionnel complet
                // ✅ Système de backup multi-modèles + cache intelligent + monitoring
                // ============================================================================
                
                // Fonction pour générer un briefing
                const generateBriefing = async (type) => {
                    console.log('🚀 DÉBUT generateBriefing:', { type, loading });
                    console.log('🔍 API Sources configurées:', apiSources);
                    console.log('🔍 Perplexity enabled:', perplexityEnabled);
                    
                    // Protection contre les générations multiples
                    if (loading) {
                        console.log('⚠️ Génération déjà en cours, ignoré');
                        return;
                    }
                    
                    console.log('✅ Démarrage de la génération...');
                    setLoading(true);
                    setCurrentBriefing(null);
                    setPreviewHtml('');

                    try {
                        // Initialiser le logging
                        clearProcessLog();
                        addLogEntry('GENERATION', 'Début génération briefing', { 
                            type, 
                            apiSources,
                            timestamp: new Date().toISOString()
                        }, 'info');

                        // Reset debug data
                        setDebugData({
                            marketData: { request: null, response: null, error: null },
                            news: { request: null, response: null, error: null },
                            analysis: { request: null, response: null, error: null }
                        });

                        // ============================================================================
                        // 1. COLLECTE DONNÉES MARCHÉ VIA PERPLEXITY (ULTRA-SIMPLIFIÉ)
                        // ============================================================================
                        // 🎯 AVANT : Yahoo Finance + variables multiples + complexité
                        // ✅ MAINTENANT : 1 requête Perplexity → Données complètes
                        // ============================================================================
                        
                        addLogEntry('MARKET_DATA', 'Début collecte données marché', { 
                            source: 'perplexity',
                            type 
                        }, 'info');
                        
                        const marketDataRequest = {
                            service: 'perplexity',
                            query: `Données de marché actuelles pour briefing ${type}: indices US (S&P 500, NASDAQ, DOW), devises (USD/CAD, EUR/USD), matières premières (or, pétrole), taux d'intérêt, volatilité VIX`,
                            section: 'market-data',
                            recency: 'day'
                        };
                        
                        addLogEntry('MARKET_DATA', 'Requête envoyée', marketDataRequest, 'info');
                        
                        setDebugData(prev => ({
                            ...prev,
                            marketData: { ...prev.marketData, request: marketDataRequest }
                        }));

                        const dataResponse = await fetch('/api/ai-services', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(marketDataRequest),
                            signal: AbortSignal.timeout(120000) // 120 secondes timeout pour Perplexity
                        });
                        
                        addLogEntry('MARKET_DATA', 'Réponse reçue', { 
                            status: dataResponse.status,
                            statusText: dataResponse.statusText,
                            headers: Object.fromEntries(dataResponse.headers.entries())
                        }, 'info');
                        
                        const dataResult = await dataResponse.json();
                        
                        addLogEntry('MARKET_DATA', 'Données parsées', {
                            success: dataResult.success,
                            contentLength: dataResult.content?.length || 0,
                            model: dataResult.model,
                            fallback: dataResult.fallback,
                            timestamp: dataResult.timestamp
                        }, dataResult.success ? 'success' : 'error');
                        
                        setDebugData(prev => ({
                            ...prev,
                            marketData: { 
                                ...prev.marketData, 
                                response: dataResult,
                                error: dataResult.success ? null : dataResult.error
                            }
                        }));
                        
                        if (!dataResult.success) {
                            addLogEntry('MARKET_DATA', 'Erreur données marché', dataResult.error, 'error');
                            throw new Error('Erreur lors de la collecte des données');
                        }

                        // 1.5. Créer un objet de données marché basé sur la réponse Perplexity
                        const marketData = {
                            source: 'perplexity',
                            content: dataResult.content,
                            model: dataResult.model,
                            timestamp: new Date().toISOString(),
                            fallback: dataResult.fallback || false
                        };
                        
                        // Enrichir avec les informations de la watchlist (simplifié pour Perplexity)
                        const enrichedMarketData = {
                            ...marketData,
                            watchlist: watchlistTickers.slice(0, 5), // Limiter pour éviter les erreurs
                            type: type
                        };

                        // 2. Rechercher les actualités
                        // ============================================================================
                        // 2. RECHERCHE ACTUALITÉS VIA PERPLEXITY (ULTRA-SIMPLIFIÉ)
                        // ============================================================================
                        // 🎯 AVANT : Marketaux + variables + complexité
                        // ✅ MAINTENANT : 1 requête Perplexity → Actualités complètes
                        // ============================================================================
                        
                        addLogEntry('NEWS', 'Début recherche actualités', { 
                            source: 'perplexity',
                            promptLength: prompts[type].perplexity.length
                        }, 'info');
                        
                        const newsRequest = {
                            service: 'perplexity',
                            prompt: prompts[type].perplexity,
                            recency: 'day',
                            section: 'news'
                        };
                        
                        addLogEntry('NEWS', 'Requête actualités envoyée', {
                            service: newsRequest.service,
                            section: newsRequest.section,
                            recency: newsRequest.recency,
                            promptPreview: newsRequest.prompt.substring(0, 200) + '...',
                            fullPrompt: newsRequest.prompt
                        }, 'info');
                        
                        setDebugData(prev => ({
                            ...prev,
                            news: { ...prev.news, request: newsRequest }
                        }));

                        const newsResponse = await fetch('/api/ai-services', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newsRequest),
                            signal: AbortSignal.timeout(120000) // 120 secondes timeout pour Perplexity
                        });
                        
                        addLogEntry('NEWS', 'Réponse actualités reçue', { 
                            status: newsResponse.status,
                            statusText: newsResponse.statusText
                        }, 'info');
                        
                        const newsResult = await newsResponse.json();
                        
                        addLogEntry('NEWS', 'Actualités parsées', {
                            success: newsResult.success,
                            model: newsResult.model,
                            contentLength: newsResult.content?.length || 0,
                            tokens: newsResult.tokens,
                            fallback: newsResult.fallback
                        }, newsResult.success ? 'success' : 'error');
                        
                        setDebugData(prev => ({
                            ...prev,
                            news: { 
                                ...prev.news, 
                                response: newsResult,
                                error: newsResult.success ? null : newsResult.error
                            }
                        }));

                        // ============================================================================
                        // 3. GÉNÉRATION ANALYSE VIA PERPLEXITY (ULTRA-SIMPLIFIÉ)
                        // ============================================================================
                        // 🎯 AVANT : OpenAI + variables + complexité
                        // ✅ MAINTENANT : 1 requête Perplexity → Analyse complète (2000+ mots)
                        // ============================================================================
                        
                        addLogEntry('ANALYSIS', 'Début génération analyse IA', { 
                            source: 'perplexity',
                            promptLength: prompts[type].perplexity.length,
                            marketDataSize: JSON.stringify(enrichedMarketData).length,
                            newsSize: (newsResult.content || '').length
                        }, 'info');
                        
                        const analysisRequest = {
                            service: 'perplexity',
                            prompt: prompts[type].perplexity,
                            marketData: enrichedMarketData,
                            news: newsResult.content || 'Aucune actualité disponible',
                            section: 'analysis'
                        };
                        
                        addLogEntry('ANALYSIS', 'Requête analyse envoyée', {
                            service: analysisRequest.service,
                            section: analysisRequest.section,
                            promptPreview: analysisRequest.prompt.substring(0, 200) + '...',
                            fullPrompt: analysisRequest.prompt,
                            marketDataKeys: Object.keys(analysisRequest.marketData || {}),
                            newsPreview: analysisRequest.news.substring(0, 100) + '...'
                        }, 'info');
                        
                        setDebugData(prev => ({
                            ...prev,
                            analysis: { ...prev.analysis, request: analysisRequest }
                        }));

                        const analysisResponse = await fetch('/api/ai-services', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(analysisRequest),
                            signal: AbortSignal.timeout(120000) // 120 secondes timeout pour l'analyse Perplexity
                        });
                        
                        addLogEntry('ANALYSIS', 'Réponse analyse reçue', { 
                            status: analysisResponse.status,
                            statusText: analysisResponse.statusText
                        }, 'info');
                        
                        let analysisResult;
                        let responseText = '';
                        try {
                            responseText = await analysisResponse.text();
                            analysisResult = JSON.parse(responseText);
                        } catch (parseError) {
                            console.error('Erreur parsing JSON analyse:', parseError);
                            console.error('Response text reçu:', responseText ? responseText.substring(0, 500) : 'No response text');
                            addLogEntry('ERROR', 'Erreur parsing JSON analyse', {
                                error: parseError.message,
                                responseText: responseText ? responseText.substring(0, 200) : 'No response text',
                                responseStatus: analysisResponse.status,
                                responseStatusText: analysisResponse.statusText
                            }, 'error');
                            
                            // ERREUR : Pas de fallback demo
                            throw new Error(`Erreur API Perplexity: ${error.message}. Vérifiez votre clé API PERPLEXITY_API_KEY.`);
                        }
                        
                        addLogEntry('ANALYSIS', 'Analyse parsée', {
                            success: analysisResult.success,
                            model: analysisResult.model,
                            contentLength: analysisResult.content?.length || 0,
                            tokens: analysisResult.tokens,
                            fallback: analysisResult.fallback,
                            responseStatus: analysisResponse.status,
                            responseStatusText: analysisResponse.statusText
                        }, analysisResult.success ? 'success' : 'error');
                        
                        setDebugData(prev => ({
                            ...prev,
                            analysis: { 
                                ...prev.analysis, 
                                response: analysisResult,
                                error: analysisResult.success ? null : analysisResult.error
                            }
                        }));

                        // 4. Créer le HTML
                        addLogEntry('HTML_GENERATION', 'Début création HTML', { 
                            type,
                            analysisLength: (analysisResult.content || '').length,
                            dataSize: JSON.stringify(enrichedMarketData).length
                        }, 'info');
                        
                        let html = '';
                        const analysis = analysisResult.content || 'Analyse non disponible';
                        const data = enrichedMarketData;

                        switch (type) {
                            case 'morning':
                                html = createMorningBriefingHTML(analysis, data);
                                break;
                            case 'noon':
                                html = createNoonBriefingHTML(analysis, data);
                                break;
                            case 'evening':
                                html = createEveningBriefingHTML(analysis, data);
                                break;
                        }
                        
                        addLogEntry('HTML_GENERATION', 'HTML généré', { 
                            htmlLength: html.length,
                            template: type
                        }, 'success');

                        // 5. Créer l'objet briefing
                        const briefing = {
                            type,
                            subject: getSubjectForType(type),
                            html,
                            data,
                            analysis,
                            timestamp: new Date().toISOString(),
                            fallback: analysisResult.fallback === true ? true : false,
                            model: analysisResult.model || 'unknown'
                        };
                        
                        addLogEntry('BRIEFING_CREATION', 'Briefing créé', {
                            type: briefing.type,
                            subject: briefing.subject,
                            htmlSize: briefing.html.length,
                            analysisSize: briefing.analysis.length,
                            timestamp: briefing.timestamp
                        }, 'success');

                        console.log('🎯 Mise à jour des états React:', {
                            briefingType: briefing.type,
                            hasHtml: !!briefing.html,
                            htmlLength: briefing.html.length,
                            fallback: briefing.fallback,
                            model: briefing.model
                        });
                        
                        setCurrentBriefing(briefing);
                        // Forcer React à détecter le changement en créant une nouvelle référence
                        setPreviewHtml(html + '');
                        setSelectedType(type);
                        
                        console.log('✅ États React mis à jour avec succès');
                        console.log('🔍 Briefing object:', briefing);
                        console.log('🔍 HTML length:', html.length);
                        console.log('🔍 currentBriefing state will be:', briefing);
                        console.log('🔍 previewHtml state will be:', html.substring(0, 100) + '...');
                        
                        addLogEntry('COMPLETION', 'Briefing généré avec succès', {
                            totalTime: Date.now() - new Date(processLog[0]?.timestamp).getTime(),
                            finalSize: JSON.stringify(briefing).length,
                            steps: processLog.length
                        }, 'success');

                    } catch (error) {
                        addLogEntry('ERROR', 'Erreur génération briefing', {
                            message: error.message,
                            stack: error.stack,
                            step: processLog[processLog.length - 1]?.step || 'unknown'
                        }, 'error');
                        console.error('Erreur génération briefing:', error);
                        setMessage({ type: 'error', text: `Erreur: ${error.message}` });
                        
                        // ERREUR : Pas de fallback demo - Timeout API
                        if (error.message.includes('timeout') || error.message.includes('timed out')) {
                            throw new Error(`Timeout API Perplexity (90s dépassé). Vérifiez votre connexion et votre clé API PERPLEXITY_API_KEY.`);
                        }
                    } finally {
                        setLoading(false);
                        addLogEntry('SYSTEM', 'Processus terminé', {
                            loading: false,
                            totalLogs: processLog.length
                        }, 'info');
                    }
                };

                // ============================================================================
                // GÉNÉRATION COGNITIVE BRIEFING - ARCHITECTURE 5 ÉTAPES
                // ============================================================================
                // 🧠 Cognitive Scaffolding + Adaptive Email Generation + Intelligent Preview
                // ============================================================================

                // ÉTAPE 0: Intent Analysis avec Emma Agent
                const analyzeIntent = async (type) => {
                    console.log('🧠 ÉTAPE 0: Intent Analysis START');

                    const intentAnalysisPrompt = `Tu es Emma, assistante financière experte.
Analyse l'actualité et l'environnement de marché pour ${type}.

DATE: ${new Date().toLocaleDateString('fr-FR')}
HEURE: ${new Date().toLocaleTimeString('fr-FR')}
BRIEFING: ${type} (morning/noon/evening)

ANALYSE L'ACTUALITÉ DU JOUR ET DÉTECTE:

1. TRENDING TOPICS: Quels sont les sujets dominants aujourd'hui?
   - Earnings releases (Apple, Tesla, etc.)
   - Fed/ECB meetings
   - Economic data (CPI, jobs report, etc.)
   - Geopolitical events
   - Market crashes/rallies

2. IMPORTANCE LEVEL:
   - BREAKING (10/10): Événement majeur (market crash, Fed decision)
   - HIGH (7-9/10): Earnings important, economic data critique
   - MEDIUM (4-6/10): Normal market day
   - LOW (1-3/10): Quiet market

3. RECOMMENDED TOOLS:
   Suggère quels outils Emma Agent doit utiliser:
   - polygon-stock-price: Si focus sur indices/actions
   - economic-calendar: Si événement macro important
   - earnings-calendar: Si earnings releases
   - finnhub-news: Si breaking news
   - analyst-recommendations: Si changements ratings importants

4. EMAIL STYLE:
   - urgent: Si BREAKING news (style alarmiste)
   - professional: Si HIGH importance (style sérieux)
   - casual: Si MEDIUM/LOW (style informatif)

RÉPONDS EN JSON UNIQUEMENT:
{
  "intent": "earnings_day",
  "confidence": 0.95,
  "importance_level": 8,
  "trending_topics": [
    "Apple Q4 earnings beat expectations",
    "Fed hints at rate pause",
    "Tech sector rally"
  ],
  "recommended_tools": [
    "earnings-calendar",
    "polygon-stock-price",
    "finnhub-news"
  ],
  "email_style": "professional",
  "key_tickers": ["AAPL", "TSLA"],
  "summary": "Apple vient de publier des résultats record. Le marché réagit positivement."
}`;

                    try {
                        const response = await fetch('/api/emma-agent', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                message: intentAnalysisPrompt,
                                context: {
                                    briefing_type: type,
                                    analysis_type: 'briefing_intent_analysis',
                                    date: new Date().toISOString()
                                }
                            }),
                            signal: AbortSignal.timeout(60000)
                        });

                        const result = await response.json();

                        if (result.success && result.response) {
                            // Extraire JSON de la réponse
                            const jsonMatch = result.response.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                const intentData = JSON.parse(jsonMatch[0]);
                                console.log('✅ Intent Analysis:', intentData);
                                addLogEntry('INTENT_ANALYSIS', 'Intent détecté', intentData, 'success');
                                return intentData;
                            }
                        }

                        throw new Error('Intent analysis failed');
                    } catch (error) {
                        console.error('❌ Intent Analysis error:', error);
                        addLogEntry('INTENT_ANALYSIS', 'Erreur intent analysis', { error: error.message }, 'error');

                        // Fallback: Intent par défaut
                        return {
                            intent: 'market_overview',
                            confidence: 0.5,
                            importance_level: 5,
                            trending_topics: ['Analyse de marché standard'],
                            recommended_tools: ['polygon-stock-price', 'finnhub-news'],
                            email_style: 'casual',
                            key_tickers: [],
                            summary: 'Briefing de marché standard'
                        };
                    }
                };

                // ÉTAPE 1: Smart Data Gathering avec Emma Agent
                const gatherSmartData = async (type, intentData) => {
                    console.log('📊 ÉTAPE 1: Smart Data Gathering START');

                    try {
                        const response = await fetch('/api/emma-agent', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                message: `Récupérer les données pour briefing ${type}. Focus: ${intentData.summary}`,
                                context: {
                                    output_mode: 'data',  // ← MODE DATA pour récupération de données
                                    briefing_type: type,
                                    intent: intentData.intent,
                                    suggested_tools: intentData.recommended_tools,
                                    key_tickers: intentData.key_tickers,
                                    tickers: teamTickers,
                                    news_requested: true,
                                    news_limit: 10
                                }
                            }),
                            signal: AbortSignal.timeout(90000)
                        });

                        const result = await response.json();

                        if (result.success) {
                            console.log('✅ Smart Data gathered:', result.tools_used);
                            addLogEntry('SMART_DATA', 'Données récupérées', {
                                tools_used: result.tools_used,
                                data_size: JSON.stringify(result).length
                            }, 'success');

                            return {
                                response: result.response,
                                tools_used: result.tools_used,
                                raw_data: result,
                                timestamp: new Date().toISOString()
                            };
                        }

                        throw new Error('Smart data gathering failed');
                    } catch (error) {
                        console.error('❌ Smart Data error:', error);
                        addLogEntry('SMART_DATA', 'Erreur collecte données', { error: error.message }, 'error');

                        // Fallback: Données minimales
                        return {
                            response: 'Données de marché actuelles non disponibles',
                            tools_used: [],
                            raw_data: {},
                            timestamp: new Date().toISOString()
                        };
                    }
                };

                // ÉTAPE 2: Content Selection
                const selectEmailContent = (intentData, smartData) => {
                    console.log('🎯 ÉTAPE 2: Content Selection START');

                    const sections = [];

                    // SECTION 1: TOUJOURS - Market Overview
                    sections.push({
                        title: "📊 Vue d'ensemble du marché",
                        priority: 10,
                        content: smartData.response,
                        style: 'standard'
                    });

                    // SECTION 2: CONDITIONNELLE - Breaking News
                    if (intentData.importance_level >= 8) {
                        sections.push({
                            title: "🚨 BREAKING - Événement majeur",
                            priority: 9,
                            content: intentData.trending_topics[0],
                            style: 'alert'
                        });
                    }

                    // SECTION 3: CONDITIONNELLE - Trending Topics
                    if (intentData.trending_topics && intentData.trending_topics.length > 0) {
                        sections.push({
                            title: "🔥 Sujets du moment",
                            priority: 8,
                            content: intentData.trending_topics,
                            style: 'highlight'
                        });
                    }

                    // SECTION 4: TOUJOURS - Emma Agent Insights
                    sections.push({
                        title: "🤖 Analyse Emma Agent",
                        priority: 7,
                        content: smartData.response,
                        tools_used: smartData.tools_used,
                        style: 'standard'
                    });

                    // Trier par priorité décroissante
                    sections.sort((a, b) => b.priority - a.priority);

                    console.log('✅ Sections sélectionnées:', sections.length);
                    addLogEntry('CONTENT_SELECTION', 'Sections sélectionnées', {
                        count: sections.length,
                        titles: sections.map(s => s.title)
                    }, 'success');

                    return sections;
                };

                // ÉTAPE 3: Build Adaptive Prompt
                const buildAdaptivePrompt = (type, intentData, selectedSections) => {
                    console.log('✍️ ÉTAPE 3: Build Adaptive Prompt START');

                    const basePrompt = prompts[type]?.perplexity || prompts[type]?.openai || '';
                    let adaptedPrompt = basePrompt;

                    // Si BREAKING news
                    if (intentData.importance_level >= 8) {
                        adaptedPrompt = `🚨 BREAKING - Événement majeur détecté

${intentData.trending_topics[0]}

${basePrompt}

⚠️ INSTRUCTIONS SPÉCIALES:
- COMMENCER par l'événement majeur
- Style: Urgent mais professionnel
- Inclure implications pour le marché
- Recommandations tactiques immédiates
`;
                    }

                    // Si Earnings Day
                    else if (intentData.intent === 'earnings_day') {
                        adaptedPrompt = `📈 EARNINGS DAY - ${intentData.key_tickers?.join(', ') || 'N/A'}

${basePrompt}

📊 FOCUS PRIORITAIRE:
- Résultats vs attentes
- Guidance management
- Réaction marché
- Implications secteur
`;
                    }

                    // Si Fed Decision
                    else if (intentData.intent === 'fed_decision') {
                        adaptedPrompt = `🏛️ FED DECISION DAY

${basePrompt}

🎯 FOCUS PRIORITAIRE:
- Décision taux
- Commentaires Powell
- Réaction obligataire
- Impact devises/actions
`;
                    }

                    // Ajouter sections sélectionnées
                    adaptedPrompt += `\n\nSECTIONS À INCLURE (PAR ORDRE DE PRIORITÉ):\n`;
                    selectedSections.forEach((section, index) => {
                        adaptedPrompt += `${index + 1}. ${section.title}\n`;
                    });

                    // Ajouter données réelles
                    adaptedPrompt += `\n\nDONNÉES EMMA AGENT:\n`;
                    selectedSections.forEach(section => {
                        if (section.content) {
                            const contentPreview = typeof section.content === 'string'
                                ? section.content.substring(0, 500)
                                : JSON.stringify(section.content).substring(0, 500);
                            adaptedPrompt += `\n${section.title}:\n${contentPreview}...\n`;
                        }
                    });

                    console.log('✅ Adaptive Prompt built:', adaptedPrompt.length, 'chars');
                    addLogEntry('ADAPTIVE_PROMPT', 'Prompt adaptatif créé', {
                        length: adaptedPrompt.length,
                        intent: intentData.intent,
                        importance: intentData.importance_level
                    }, 'success');

                    return adaptedPrompt;
                };

                // FONCTION PRINCIPALE: Generate Cognitive Briefing
                const generateCognitiveBriefing = async (type) => {
                    console.log('🧠 COGNITIVE BRIEFING START:', { type, loading });

                    // Protection contre les générations multiples
                    if (loading) {
                        console.log('⚠️ Génération déjà en cours, ignoré');
                        return;
                    }

                    setLoading(true);
                    setCurrentBriefing(null);
                    setPreviewHtml('');
                    setCurrentStep('Initialisation...');
                    setStepDetails('Préparation de l\'analyse cognitive');

                    try {
                        // Initialiser le logging
                        clearProcessLog();
                        addLogEntry('COGNITIVE_START', 'Début génération cognitive briefing', {
                            type,
                            timestamp: new Date().toISOString()
                        }, 'info');

                        // ÉTAPE 0: Intent Analysis (OPTIMISÉ: Skip pour briefings prédéfinis)
                        setCurrentStep('ÉTAPE 0/4: Analyse de l\'Intent');
                        let intentData;

                        // OPTIMISATION: Pour briefings prédéfinis, utiliser intent prédéfini (économise 5-15s)
                        if (['morning', 'noon', 'evening'].includes(type)) {
                            console.log(`⚡ OPTIMISATION: Intent prédéfini pour ${type} (skip API call)`);
                            const currentHour = new Date().getHours();

                            // Intent adapté selon l'heure
                            intentData = {
                                intent: 'market_overview',
                                confidence: 1.0,
                                importance_level: currentHour < 10 ? 6 : currentHour < 16 ? 7 : 6,
                                trending_topics: [
                                    type === 'morning' ? 'Ouverture des marchés' :
                                    type === 'noon' ? 'Mi-journée de trading' :
                                    'Clôture des marchés'
                                ],
                                recommended_tools: ['polygon-stock-price', 'finnhub-news', 'earnings-calendar', 'economic-calendar', 'twelve-data-technical'],
                                email_style: 'professional',
                                key_tickers: teamTickers.slice(0, 10), // Top 10 tickers équipe
                                summary: `Briefing ${type} standard avec données de marché`
                            };

                            addLogEntry('INTENT_OPTIMIZED', 'Intent prédéfini utilisé (skip analysis)', {
                                type,
                                timeSaved: '5-15s',
                                intentData
                            }, 'info');

                            setStepDetails(`⚡ Intent prédéfini: ${intentData.intent} (${intentData.importance_level}/10) - Analyse skippée pour rapidité`);
                        } else {
                            // Custom briefing: analyse complète nécessaire
                            setStepDetails('Emma analyse l\'actualité du jour et détecte les sujets importants...');
                            addLogEntry('STEP_0', 'ÉTAPE 0: Intent Analysis', {}, 'info');
                            intentData = await analyzeIntent(type);
                            setStepDetails(`Intent détecté: ${intentData.intent} (Confiance: ${(intentData.confidence * 100).toFixed(0)}%, Importance: ${intentData.importance_level}/10)`);
                        }

                        // ÉTAPE 1: Smart Data Gathering
                        setCurrentStep('ÉTAPE 1/4: Collecte de Données');
                        setStepDetails(`Emma récupère les données avec les outils recommandés: ${intentData.recommended_tools?.join(', ') || 'outils standard'}...`);
                        addLogEntry('STEP_1', 'ÉTAPE 1: Smart Data Gathering', {}, 'info');
                        const smartData = await gatherSmartData(type, intentData);
                        setStepDetails(`Données collectées avec ${smartData.tools_used?.length || 0} outils: ${smartData.tools_used?.join(', ') || 'aucun'}`);

                        // ÉTAPE 2: Content Selection
                        setCurrentStep('ÉTAPE 2/4: Sélection du Contenu');
                        setStepDetails('Emma décide quelles sections inclure dans le briefing...');
                        addLogEntry('STEP_2', 'ÉTAPE 2: Content Selection', {}, 'info');
                        const selectedSections = selectEmailContent(intentData, smartData);
                        setStepDetails(`${selectedSections.length} sections sélectionnées pour l'email`);

                        // ÉTAPE 3: Adaptive Email Generation avec Emma Agent
                        setCurrentStep('ÉTAPE 3/4: Génération Adaptative');
                        setStepDetails('Emma Agent génère le briefing en mode BRIEFING...');
                        addLogEntry('STEP_3', 'ÉTAPE 3: Adaptive Email Generation', {}, 'info');

                        // Construire le message ADAPTATIF pour Emma Agent
                        let briefingMessage = '';

                        // BASE PROMPT selon le type de briefing
                        const basePrompt = prompts[type]?.perplexity || prompts[type]?.openai || '';

                        // ADAPTATION CONTEXTUELLE selon l'intent et l'importance
                        if (intentData.importance_level >= 8) {
                            // 🚨 BREAKING NEWS - Importance critique
                            briefingMessage = `🚨 BREAKING - Événement majeur détecté

${intentData.trending_topics[0] || 'Événement de marché significatif'}

${basePrompt}

⚠️ INSTRUCTIONS SPÉCIALES POUR CET ÉVÉNEMENT MAJEUR:
- COMMENCER par l'événement majeur et son impact immédiat
- Style: Urgent mais professionnel et factuel
- Inclure implications immédiates pour le marché
- Recommandations tactiques urgentes
- Niveaux techniques critiques à surveiller
- Scénarios possibles et probabilités

CONTEXTE CRITIQUE:
- Intent: ${intentData.intent}
- Niveau d'importance: ${intentData.importance_level}/10 (⚠️ CRITIQUE)
- Catalyseur principal: ${intentData.trending_topics[0]}
- Tickers impactés: ${intentData.key_tickers?.join(', ') || teamTickers.join(', ')}`;

                        } else if (intentData.intent === 'earnings_day') {
                            // 📈 EARNINGS DAY
                            briefingMessage = `📈 EARNINGS DAY - ${intentData.key_tickers?.join(', ') || 'N/A'}

${basePrompt}

📊 FOCUS PRIORITAIRE EARNINGS:
- Résultats vs attentes (EPS, revenus)
- Guidance management et perspectives
- Réaction marché et volumes
- Implications sectorielles
- Comparaison peers et multiples de valorisation
- Conférence calls et highlights

CONTEXTE EARNINGS:
- Intent: ${intentData.intent}
- Importance: ${intentData.importance_level}/10
- Entreprises clés: ${intentData.key_tickers?.join(', ') || 'N/A'}
- Tendances détectées: ${intentData.trending_topics?.join(', ') || 'N/A'}`;

                        } else if (intentData.intent === 'fed_decision' || intentData.intent === 'central_bank') {
                            // 🏛️ FED/CENTRAL BANK DECISION
                            briefingMessage = `🏛️ DÉCISION BANQUE CENTRALE

${basePrompt}

🎯 FOCUS PRIORITAIRE POLITIQUE MONÉTAIRE:
- Décision taux et communiqué officiel
- Dot plot et forward guidance
- Commentaires président/gouverneur
- Réaction courbe de taux et obligataire
- Impact devises et actions
- Implications court et moyen terme

CONTEXTE BANQUE CENTRALE:
- Intent: ${intentData.intent}
- Importance: ${intentData.importance_level}/10
- Événement: ${intentData.trending_topics[0] || 'Décision politique monétaire'}`;

                        } else if (intentData.intent === 'market_crash' || intentData.intent === 'high_volatility') {
                            // 📉 VOLATILITÉ EXTRÊME / CRASH
                            briefingMessage = `📉 ALERTE VOLATILITÉ - ${intentData.trending_topics[0] || 'Mouvements de marché inhabituels'}

${basePrompt}

⚡ FOCUS PRIORITAIRE VOLATILITÉ:
- Ampleur des mouvements et vitesse
- Secteurs et valeurs les plus touchés
- VIX et indicateurs de stress
- Flux et volumes anormaux
- Corrélations rompues
- Historique et comparaisons
- Niveaux de support critiques

CONTEXTE VOLATILITÉ:
- Intent: ${intentData.intent}
- Importance: ${intentData.importance_level}/10
- Catalyseur: ${intentData.trending_topics[0] || 'Mouvement de marché significatif'}`;

                        } else {
                            // 📊 BRIEFING STANDARD
                            briefingMessage = `${basePrompt}

CONTEXTE DU BRIEFING:
- Intent: ${intentData.intent}
- Importance: ${intentData.importance_level}/10
- Sujets clés: ${intentData.trending_topics?.join(', ') || 'Analyse de marché générale'}
- Tickers focus: ${intentData.key_tickers?.join(', ') || teamTickers.join(', ')}`;
                        }

                        // SECTIONS SÉLECTIONNÉES PAR ORDRE DE PRIORITÉ
                        briefingMessage += `\n\nSECTIONS À INCLURE (PAR ORDRE DE PRIORITÉ):
${selectedSections.map((s, i) => `${i + 1}. ${s.title}`).join('\n')}`;

                        // DONNÉES EMMA AGENT COLLECTÉES
                        briefingMessage += `\n\nDONNÉES EMMA AGENT DISPONIBLES:`;
                        selectedSections.forEach(section => {
                            if (section.content) {
                                const contentPreview = typeof section.content === 'string'
                                    ? section.content.substring(0, 500)
                                    : JSON.stringify(section.content).substring(0, 500);
                                briefingMessage += `\n\n📦 ${section.title}:\n${contentPreview}${section.content.length > 500 ? '...' : ''}`;
                            }
                        });

                        briefingMessage += `\n\n✅ INSTRUCTIONS FINALES:
- Rédige une analyse APPROFONDIE et PROFESSIONNELLE (1800-2200 mots minimum)
- Utilise les DONNÉES RÉELLES ci-dessus (pas de données fictives)
- Structure MARKDOWN avec sections claires (##, ###)
- Inclure DONNÉES CHIFFRÉES précises (prix, %, volumes, etc.)
- Ton: Professionnel institutionnel adapté à l'importance ${intentData.importance_level}/10
- Focus sur l'ACTIONNABLE et les INSIGHTS
- Citer les SOURCES en fin d'analyse`;

                        console.log('✅ Adaptive prompt built:', briefingMessage.length, 'chars');
                        addLogEntry('ADAPTIVE_PROMPT', 'Prompt adaptatif créé', {
                            length: briefingMessage.length,
                            intent: intentData.intent,
                            importance: intentData.importance_level,
                            type: type
                        }, 'info');

                        // Appel Emma Agent en MODE BRIEFING
                        console.log('🔄 Appel Emma Agent API en MODE BRIEFING...');
                        setStepDetails('⏳ Génération du briefing via Emma Agent... (cela peut prendre 2-3 minutes)');
                        addLogEntry('API_CALL_START', 'Début appel Emma Agent API', {
                            endpoint: '/api/emma-agent',
                            mode: 'briefing',
                            promptLength: briefingMessage.length,
                            timestamp: new Date().toISOString()
                        }, 'info');

                        // Timers pour tenir l'utilisateur informé
                        const startTime = Date.now();

                        // Warning 1: après 60s
                        const warningTimer1 = setTimeout(() => {
                            const elapsed = Math.floor((Date.now() - startTime) / 1000);
                            console.log(`⏰ Génération en cours: ${elapsed}s...`);
                            setStepDetails(`⏳ Analyse en profondeur... ${elapsed}s (Emma collecte et analyse les données)`);
                        }, 60000);

                        // Warning 2: après 120s
                        const warningTimer2 = setTimeout(() => {
                            const elapsed = Math.floor((Date.now() - startTime) / 1000);
                            console.log(`⏰ Génération toujours en cours: ${elapsed}s...`);
                            setStepDetails(`⏳ Génération complexe... ${elapsed}s (Emma génère le briefing détaillé)`);
                        }, 120000);

                        // Warning 3: après 180s
                        const warningTimer3 = setTimeout(() => {
                            const elapsed = Math.floor((Date.now() - startTime) / 1000);
                            console.log(`⏰ Finalisation: ${elapsed}s...`);
                            setStepDetails(`⏳ Finalisation imminente... ${elapsed}s (max 300s)`);
                        }, 180000);

                        let analysisResponse;
                        try {
                            analysisResponse = await fetch('/api/emma-agent', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    message: briefingMessage,
                                    context: {
                                        output_mode: 'briefing',  // ← MODE BRIEFING
                                        briefing_type: type,
                                    intent_data: intentData,
                                        smart_data: smartData,
                                        tickers: intentData.key_tickers || teamTickers,
                                        importance_level: intentData.importance_level,
                                        trending_topics: intentData.trending_topics
                                    }
                                }),
                                signal: AbortSignal.timeout(300000) // 5 minutes pour briefing complexe
                            });

                            clearTimeout(warningTimer1);
                            clearTimeout(warningTimer2);
                            clearTimeout(warningTimer3);
                            const elapsed = Math.floor((Date.now() - startTime) / 1000);
                            console.log(`✅ API responded after ${elapsed}s`);

                        } catch (fetchError) {
                            clearTimeout(warningTimer1);
                            clearTimeout(warningTimer2);
                            clearTimeout(warningTimer3);
                            const elapsed = Math.floor((Date.now() - startTime) / 1000);

                            console.error('❌ Fetch Error after', elapsed, 's:', fetchError);
                            addLogEntry('FETCH_ERROR', 'Erreur fetch Emma Agent', {
                                error: fetchError.message,
                                name: fetchError.name,
                                type: fetchError.constructor.name,
                                elapsed_seconds: elapsed,
                                isTimeout: fetchError.name === 'TimeoutError' || fetchError.name === 'AbortError'
                            }, 'error');

                            if (fetchError.name === 'TimeoutError' || fetchError.name === 'AbortError') {
                                throw new Error(`⏱️ Timeout: L'API n'a pas répondu en 2 minutes. L'analyse est trop complexe. Réessayez plus tard.`);
                            }
                            throw new Error(`🌐 Erreur réseau: ${fetchError.message}`);
                        }

                        console.log('📡 Emma Agent Response Status:', analysisResponse.status, analysisResponse.statusText);
                        addLogEntry('API_RESPONSE', 'Réponse Emma Agent reçue', {
                            status: analysisResponse.status,
                            statusText: analysisResponse.statusText,
                            ok: analysisResponse.ok
                        }, analysisResponse.ok ? 'success' : 'error');

                        if (!analysisResponse.ok) {
                            const errorText = await analysisResponse.text();
                            console.error('❌ Emma Agent API Error:', errorText);
                            throw new Error(`Emma Agent API error (${analysisResponse.status}): ${errorText.substring(0, 200)}`);
                        }

                        const analysisResult = await analysisResponse.json();
                        console.log('📊 Emma Agent Result:', {
                            success: analysisResult.success,
                            hasResponse: !!analysisResult.response,
                            responseLength: analysisResult.response?.length || 0,
                            intent: analysisResult.intent,
                            toolsUsed: analysisResult.tools_used?.length || 0
                        });

                        if (!analysisResult.success) {
                            throw new Error('Emma Agent briefing generation failed: ' + (analysisResult.error || 'Unknown error'));
                        }

                        addLogEntry('EMMA_BRIEFING', 'Briefing Emma Agent généré', {
                            mode: 'briefing',
                            intent: analysisResult.intent,
                            confidence: analysisResult.confidence,
                            tools_used: analysisResult.tools_used?.length || 0,
                            contentLength: analysisResult.response?.length || 0
                        }, 'success');

                        setStepDetails(`Briefing généré par Emma Agent (${analysisResult.response?.length || 0} caractères, ${analysisResult.tools_used?.length || 0} outils utilisés)`);

                        // ÉTAPE 4: Création HTML et Preview
                        setCurrentStep('ÉTAPE 4/4: Création du Preview');
                        setStepDetails('Génération du HTML et préparation de l\'aperçu...');

                        // Enrichir le contenu avec éléments multimédias
                        const rawAnalysis = analysisResult.response || 'Analyse non disponible';
                        const enrichedAnalysis = enrichBriefingWithVisuals(rawAnalysis, {
                            intentData,
                            smartData,
                            selectedSections
                        });

                        addLogEntry('VISUAL_ENRICHMENT', 'Contenu enrichi avec visuels', {
                            rawLength: rawAnalysis.length,
                            enrichedLength: enrichedAnalysis.length,
                            visualsAdded: enrichedAnalysis.length - rawAnalysis.length
                        }, 'success');

                        // Créer le HTML avec analyse enrichie
                        let html = '';
                        const analysis = enrichedAnalysis;
                        const data = {
                            source: 'emma-agent-briefing-mode-multimedia',
                            intentData,
                            smartData,
                            selectedSections,
                            tools_used: analysisResult.tools_used || [],
                            failed_tools: analysisResult.failed_tools || [],
                            timestamp: new Date().toISOString()
                        };

                        switch (type) {
                            case 'morning':
                                html = createMorningBriefingHTML(analysis, data);
                                break;
                            case 'noon':
                                html = createNoonBriefingHTML(analysis, data);
                                break;
                            case 'evening':
                                html = createEveningBriefingHTML(analysis, data);
                                break;
                            case 'custom':
                                html = createCustomBriefingHTML(analysis, data, customTopic);
                                break;
                            default:
                                html = createMorningBriefingHTML(analysis, data);
                        }

                        // ÉTAPE 4: Create Briefing Object avec Metadata
                        const briefing = {
                            type,
                            subject: getSubjectForType(type, intentData),
                            html,
                            data,
                            analysis,
                            intentData,
                            smartData,
                            selectedSections,
                            timestamp: new Date().toISOString(),
                            model: 'emma-agent-briefing-mode',
                            tools_used: analysisResult.tools_used || [],
                            failed_tools: analysisResult.failed_tools || [],
                            unavailable_sources: analysisResult.unavailable_sources || [],
                            cognitive: true  // Flag pour distinguer des anciens briefings
                        };

                        addLogEntry('BRIEFING_CREATED', 'Briefing cognitif créé', {
                            type: briefing.type,
                            subject: briefing.subject,
                            intent: intentData.intent,
                            importance: intentData.importance_level,
                            tools_used: smartData.tools_used?.length || 0
                        }, 'success');

                        // ÉTAPE 5: Show Preview
                        setCurrentBriefing(briefing);
                        setPreviewHtml(html + '');
                        setSelectedType(type);

                        addLogEntry('COMPLETION', 'Briefing cognitif généré avec succès', {
                            totalTime: Date.now() - new Date(processLog[0]?.timestamp).getTime(),
                            steps: processLog.length
                        }, 'success');

                        setCurrentStep('✅ Briefing généré avec succès!');
                        setStepDetails(`Analyse cognitive complétée en ${Math.round((Date.now() - new Date(processLog[0]?.timestamp).getTime()) / 1000)}s`);

                        console.log('✅ COGNITIVE BRIEFING COMPLETE');

                    } catch (error) {
                        addLogEntry('ERROR', 'Erreur génération cognitive briefing', {
                            message: error.message,
                            stack: error.stack,
                            currentStep: currentStep
                        }, 'error');
                        console.error('❌ Cognitive Briefing error:', error);

                        setCurrentStep('❌ Erreur lors de la génération');
                        setStepDetails(`Erreur: ${error.message}`);
                        setMessage({ type: 'error', text: `❌ Erreur cognitive briefing: ${error.message}` });

                        // Afficher l'erreur pendant 5 secondes avant de réinitialiser
                        setTimeout(() => {
                            setCurrentStep('');
                            setStepDetails('');
                        }, 5000);
                    } finally {
                        setLoading(false);
                    }
                };

                // Fonction pour obtenir le sujet selon le type (avec intent optionnel)
                const getSubjectForType = (type, intentData = null) => {
                    const date = new Date().toLocaleDateString('fr-FR');

                    // Si importance élevée, ajouter un flag
                    const urgentFlag = intentData?.importance_level >= 8 ? '🚨 ' : '';

                    switch (type) {
                        case 'morning': return `${urgentFlag}📊 Briefing Matinal - ${date}`;
                        case 'noon': return `${urgentFlag}⚡ Update Mi-Journée - ${date}`;
                        case 'evening': return `${urgentFlag}🌙 Rapport de Clôture - ${date}`;
                        default: return `Briefing - ${date}`;
                    }
                };

                // Fonction fallback HTML SUPPRIMÉE - Plus de contenu demo

                // Fonction pour sauvegarder le briefing
                const saveBriefing = async () => {
                    if (!currentBriefing) return;

                    try {
                        const response = await fetch('/api/ai-services', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                service: 'supabase-briefings',
                                type: currentBriefing.type,
                                subject: currentBriefing.subject,
                                html_content: currentBriefing.html,
                                market_data: currentBriefing.data,
                                analysis: currentBriefing.analysis
                            })
                        });

                        const result = await response.json();
                        
                        if (result.success) {
                            setMessage({ type: 'success', text: 'Briefing sauvegardé avec succès' });
                            loadBriefingHistory();
                        } else {
                            throw new Error(result.error || 'Erreur lors de la sauvegarde');
                        }
                    } catch (error) {
                        console.error('Erreur sauvegarde:', error);
                        setMessage({ type: 'error', text: `Erreur sauvegarde: ${error.message}` });
                    }
                };

                // Fonction pour envoyer l'email
                const sendEmail = async () => {
                    if (!currentBriefing || !recipients.trim()) {
                        setMessage({ type: 'error', text: 'Veuillez saisir au moins un destinataire' });
                        return;
                    }

                    try {
                        const emailList = recipients.split(',').map(email => email.trim()).filter(email => email);

                        const response = await fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                subject: currentBriefing.subject,
                                html: currentBriefing.html,
                                to: emailList.join(','),
                                briefingType: currentBriefing.type || 'manual'
                            })
                        });

                        const result = await response.json();

                        if (result.success) {
                            setMessage({ type: 'success', text: `✅ Email envoyé à ${emailList.length} destinataire(s) via Resend` });
                            setRecipients(''); // Clear input after success
                        } else {
                            throw new Error(result.error || 'Erreur lors de l\'envoi');
                        }
                    } catch (error) {
                        console.error('Erreur envoi email:', error);
                        setMessage({ type: 'error', text: `Erreur envoi: ${error.message}` });
                    }
                };

                // Fonction pour envoyer rapidement au destinataire par défaut
                const sendBriefingEmailQuick = async () => {
                    if (!currentBriefing) {
                        setMessage({ type: 'error', text: 'Aucun briefing à envoyer' });
                        return;
                    }

                    try {
                        const response = await fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                subject: currentBriefing.subject,
                                html: currentBriefing.html,
                                briefingType: currentBriefing.type || 'manual'
                            })
                        });

                        const result = await response.json();

                        if (result.success) {
                            setMessage({ type: 'success', text: '✅ Briefing envoyé par email via Resend' });
                        } else {
                            throw new Error(result.error || 'Erreur lors de l\'envoi');
                        }
                    } catch (error) {
                        console.error('Erreur envoi email:', error);
                        setMessage({ type: 'error', text: `Erreur envoi: ${error.message}` });
                    }
                };

                // Fonction pour basculer en mode édition
                const toggleEditMode = () => {
                    if (!isEditMode) {
                        // Passage en mode édition: copier le HTML actuel
                        setEditedHtml(previewHtml);
                    }
                    setIsEditMode(!isEditMode);
                };

                // Fonction pour sauvegarder les modifications
                const saveEditedContent = () => {
                    if (!editedHtml.trim()) {
                        setMessage({ type: 'error', text: 'Le contenu ne peut pas être vide' });
                        return;
                    }

                    // Mettre à jour le previewHtml avec les modifications
                    setPreviewHtml(editedHtml);

                    // Mettre à jour currentBriefing avec le HTML modifié
                    setCurrentBriefing(prev => ({
                        ...prev,
                        html: editedHtml
                    }));

                    // Quitter le mode édition
                    setIsEditMode(false);
                    setMessage({ type: 'success', text: '✅ Modifications enregistrées' });
                };

                // Fonction pour annuler les modifications
                const cancelEdit = () => {
                    setEditedHtml('');
                    setIsEditMode(false);
                };

                // Fonction pour charger l'historique
                const loadBriefingHistory = async () => {
                    try {
                        const response = await fetch('/api/ai-services?service=supabase-briefings&limit=20');
                        const result = await response.json();
                        
                        if (result.success) {
                            setBriefingHistory(result.data);
                        }
                    } catch (error) {
                        console.error('Erreur chargement historique:', error);
                    }
                };

                // NOTE: runHealthCheck() moved to line ~2200 (before AdminJSLaiTab for proper scope)

                // Charger l'historique au montage
                React.useEffect(() => {
                    const abortController = new AbortController();
                    let isMounted = true;
                    
                    const loadHistory = async () => {
                        try {
                            const response = await fetch('/api/ai-services?service=supabase-briefings&limit=20', {
                                signal: abortController.signal
                            });
                            const result = await response.json();
                            
                            if (!isMounted) return;
                            
                            if (result.success) {
                                setBriefingHistory(result.data);
                            }
                        } catch (error) {
                            if (error.name === 'AbortError' || !isMounted) return;
                            console.error('Erreur chargement historique:', error);
                        }
                    };
                    
                    loadHistory();
                    
                    return () => {
                        isMounted = false;
                        abortController.abort();
                    };
                }, []);

                return (
                    <div className="space-y-6">
                        {/* En-tête amélioré */}
                        <div className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                            isDarkMode
                                ? 'bg-gradient-to-r from-gray-900/30 to-gray-800/30 border-gray-500/30'
                                : 'bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600'
                        }`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className={`text-3xl font-bold transition-colors duration-300 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            📡 Emma En Direct
                                        </h2>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold transition-colors duration-300 ${
                                            isDarkMode
                                                ? 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/50'
                                                : 'bg-yellow-100 text-yellow-800 border border-yellow-400'
                                        }`}>
                                            BÊTA v2.0
                                        </span>
                                    </div>
                                    <p className={`text-sm transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                        Briefings intelligents alimentés par Emma Agent • Architecture cognitive multi-sources
                                    </p>
                                </div>
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300 ${
                                    isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                                }`}>
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className={`text-xs font-medium transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                        Système actif
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: AUTOMATION - Configuration des Crons Automatiques */}
                        <div className={`p-6 rounded-lg border transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>⚙️ Briefings Automatiques (Cron Jobs)</h3>

                            <p className={`text-sm mb-6 transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                📅 Envois automatiques quotidiens (Lundi-Vendredi)
                            </p>

                            <div className="space-y-4">
                                {/* Cron Matin 7h20 */}
                                <div className={`p-4 rounded-lg border-2 transition-colors duration-300 ${
                                    isDarkMode ? 'bg-gray-900/20 border-gray-500/30' : 'bg-gray-800 border-gray-700'
                                }`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className={`font-bold mb-1 transition-colors duration-300 ${
                                                isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>
                                                🌅 Briefing Matin - 7h20 ET
                                            </h4>
                                            <p className={`text-sm transition-colors duration-300 ${
                                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                                Asie • Futures • Préouverture
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                            🟢 ACTIF
                                        </span>
                                    </div>
                                    <div className={`text-sm space-y-1 transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        <p><strong>Destinataire:</strong> projetsjsl@gmail.com</p>
                                        <p><strong>Horaire UTC:</strong> 11:20 (Lun-Ven)</p>
                                        <p><strong>Statut Vercel:</strong> ✅ Configuré</p>
                                    </div>
                                </div>

                                {/* Cron Midi 11h50 */}
                                <div className={`p-4 rounded-lg border-2 transition-colors duration-300 ${
                                    isDarkMode ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200'
                                }`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className={`font-bold mb-1 transition-colors duration-300 ${
                                                isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>
                                                ☀️ Briefing Midi - 11h50 ET
                                            </h4>
                                            <p className={`text-sm transition-colors duration-300 ${
                                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                                Wall Street • Clôture Europe
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                            🟢 ACTIF
                                        </span>
                                    </div>
                                    <div className={`text-sm space-y-1 transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        <p><strong>Destinataire:</strong> projetsjsl@gmail.com</p>
                                        <p><strong>Horaire UTC:</strong> 15:50 (Lun-Ven)</p>
                                        <p><strong>Statut Vercel:</strong> ✅ Configuré</p>
                                    </div>
                                </div>

                                {/* Cron Soir 16h20 */}
                                <div className={`p-4 rounded-lg border-2 transition-colors duration-300 ${
                                    isDarkMode ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'
                                }`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className={`font-bold mb-1 transition-colors duration-300 ${
                                                isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>
                                                🌆 Briefing Soir - 16h20 ET
                                            </h4>
                                            <p className={`text-sm transition-colors duration-300 ${
                                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                                Clôture US • Asie Next
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                            🟢 ACTIF
                                        </span>
                                    </div>
                                    <div className={`text-sm space-y-1 transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        <p><strong>Destinataire:</strong> projetsjsl@gmail.com</p>
                                        <p><strong>Horaire UTC:</strong> 20:20 (Lun-Ven)</p>
                                        <p><strong>Statut Vercel:</strong> ✅ Configuré</p>
                                    </div>
                                </div>

                                {/* Configuration globale */}
                                <div className={`p-4 rounded-lg transition-colors duration-300 ${
                                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                }`}>
                                    <h4 className={`font-semibold mb-3 transition-colors duration-300 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>⚙️ Configuration Globale</h4>
                                    <div className={`text-sm space-y-1 transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        <p><strong>Timezone:</strong> Eastern Time (ET)</p>
                                        <p><strong>Jours actifs:</strong> Lundi-Vendredi</p>
                                        <p><strong>Statut Vercel Crons:</strong> ✅ Configuré dans vercel.json</p>
                                        <p><strong>Dernière modification:</strong> 2025-01-16</p>
                                    </div>
                                </div>

                                {/* Note informative */}
                                <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                                    isDarkMode ? 'bg-gray-900/10 border-gray-500/20' : 'bg-gray-800 border-gray-700'
                                }`}>
                                    <p className={`text-sm transition-colors duration-300 ${
                                        isDarkMode ? 'text-blue-300' : 'text-blue-800'
                                    }`}>
                                        💡 <strong>Note:</strong> Les crons sont configurés dans <code className="px-1 py-0.5 rounded bg-gray-800 text-yellow-300">vercel.json</code>.
                                        Pour modifier les horaires, utilisez les scripts <code className="px-1 py-0.5 rounded bg-gray-800 text-yellow-300">npm run cron:edt</code> ou
                                        <code className="px-1 py-0.5 rounded bg-gray-800 text-yellow-300">npm run cron:est</code>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2.5: GESTION DES PROMPTS - Édition centralisée */}
                        <div className={`p-6 rounded-lg border transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>📝 Gestion des Prompts de Briefing</h3>

                            <p className={`text-sm mb-6 transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                Modifiez les prompts utilisés pour les briefings automatisés. Les changements sont synchronisés avec n8n et GitHub.
                            </p>

                            <PromptManager />
                        </div>

                        {/* SECTION 2.5.5: GESTION DES HORAIRES ET AUTOMATISATIONS */}
                        <div className={`p-6 rounded-lg border transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>⏰ Gestion des Horaires et Automatisations</h3>

                            <p className={`text-sm mb-6 transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                Configurez les horaires et activez/désactivez les briefings automatisés. Les modifications sont synchronisées avec n8n.
                            </p>

                            <ScheduleManager />
                        </div>

                        {/* SECTION 2.5.6: PRÉVISUALISATION DES EMAILS */}
                        <div className={`p-6 rounded-lg border transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>👁️ Prévisualisation des Emails de Briefing</h3>

                            <p className={`text-sm mb-6 transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                Générez et prévisualisez les emails de briefing avant l'envoi. Testez différents types de briefings.
                            </p>

                            <EmailPreviewManager />
                        </div>

                        {/* SECTION 2.6: GESTION DES DESTINATAIRES EMAIL */}
                        <div className={`p-6 rounded-lg border transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>📧 Gestion des Destinataires Email</h3>

                            <p className={`text-sm mb-6 transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                Configurez les adresses email qui recevront les briefings selon le type (matin, midi, soir) et l'adresse pour les previews.
                            </p>

                            <EmailRecipientsManager />
                        </div>

                        {/* SECTION 3: PERSONNALISÉ - Email Ponctuel avec Prompt Custom */}
                        <div className={`p-6 rounded-lg border transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>✉️ Email Personnalisé Ponctuel</h3>

                            <p className={`text-sm mb-6 transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                Créez un briefing sur-mesure avec un prompt personnalisé
                            </p>

                            <div className="space-y-4">
                                {/* Prompt personnalisé */}
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        📝 Prompt Personnalisé
                                    </label>
                                    <textarea
                                        placeholder="Exemple: Analyse détaillée de Tesla suite à la publication des Q4 earnings. Focus sur les marges et le guidance 2025."
                                        rows={6}
                                        className={`w-full px-4 py-3 rounded-lg border transition-colors duration-300 ${
                                            isDarkMode
                                                ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500'
                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                        } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                    ></textarea>
                                </div>

                                {/* Tickers à analyser */}
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        🎯 Tickers à Analyser (optionnel)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="TSLA, AAPL, GOOGL..."
                                        className={`w-full px-4 py-2 rounded-lg border transition-colors duration-300 ${
                                            isDarkMode
                                                ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500'
                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                        } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                    />
                                </div>

                                {/* Sources de données */}
                                <div>
                                    <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        📊 Sources Prioritaires
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors duration-300 ${
                                            isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                        }`}>
                                            <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 rounded" />
                                            <span className={`text-sm transition-colors duration-300 ${
                                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}>📈 Prix & Volumes</span>
                                        </label>
                                        <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors duration-300 ${
                                            isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                        }`}>
                                            <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 rounded" />
                                            <span className={`text-sm transition-colors duration-300 ${
                                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}>📰 News</span>
                                        </label>
                                        <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors duration-300 ${
                                            isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                        }`}>
                                            <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 rounded" />
                                            <span className={`text-sm transition-colors duration-300 ${
                                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}>📊 Earnings</span>
                                        </label>
                                        <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors duration-300 ${
                                            isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                        }`}>
                                            <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 rounded" />
                                            <span className={`text-sm transition-colors duration-300 ${
                                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}>📉 Techniques</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Destinataires */}
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        📧 Destinataire(s)
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="projetsjsl@gmail.com"
                                        defaultValue="projetsjsl@gmail.com"
                                        className={`w-full px-4 py-2 rounded-lg border transition-colors duration-300 ${
                                            isDarkMode
                                                ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500'
                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                        } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                                    >
                                        🔄 Générer Aperçu
                                    </button>
                                    <button
                                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                                    >
                                        📧 Générer & Envoyer Direct
                                    </button>
                                </div>

                                {/* Note */}
                                <div className={`p-3 rounded-lg text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'bg-purple-900/20 text-purple-300' : 'bg-purple-50 text-purple-800'
                                }`}>
                                    💡 <strong>Astuce:</strong> Le prompt personnalisé utilise Emma Agent pour générer un briefing sur-mesure. Plus votre demande est précise, meilleur sera le résultat.
                                </div>
                            </div>
                        </div>

                        {/* SECTION 1: GÉNÉRER - Preview Manuel */}
                        <div className={`p-6 rounded-lg border transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>Générer un Briefing</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    onClick={() => generateCognitiveBriefing('morning')}
                                    disabled={loading}
                                    className={`group relative p-6 rounded-xl border-2 transition-all duration-300 ${
                                        loading
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                                    } ${
                                        isDarkMode
                                            ? 'bg-gray-900/30 border-gray-500/50 hover:border-gray-400'
                                            : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                    }`}
                                >
                                    <div className="text-4xl mb-3">🌅</div>
                                    <div className={`font-bold text-lg mb-1 transition-colors duration-300 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        Briefing Matin
                                    </div>
                                    <div className={`text-sm transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        Asie • Futures • Préouverture
                                    </div>
                                    <div className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                    }`}>
                                        →
                                    </div>
                                </button>

                                <button
                                    onClick={() => generateCognitiveBriefing('noon')}
                                    disabled={loading}
                                    className={`group relative p-6 rounded-xl border-2 transition-all duration-300 ${
                                        loading
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                                    } ${
                                        isDarkMode
                                            ? 'bg-green-900/30 border-green-500/50 hover:border-green-400'
                                            : 'bg-green-50 border-green-200 hover:border-green-400'
                                    }`}
                                >
                                    <div className="text-4xl mb-3">☀️</div>
                                    <div className={`font-bold text-lg mb-1 transition-colors duration-300 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        Update Midi
                                    </div>
                                    <div className={`text-sm transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        US • Top Movers • Momentum
                                    </div>
                                    <div className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                                        isDarkMode ? 'text-green-400' : 'text-green-600'
                                    }`}>
                                        →
                                    </div>
                                </button>

                                <button
                                    onClick={() => generateCognitiveBriefing('evening')}
                                    disabled={loading}
                                    className={`group relative p-6 rounded-xl border-2 transition-all duration-300 ${
                                        loading
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                                    } ${
                                        isDarkMode
                                            ? 'bg-indigo-900/30 border-indigo-500/50 hover:border-indigo-400'
                                            : 'bg-indigo-50 border-indigo-200 hover:border-indigo-400'
                                    }`}
                                >
                                    <div className="text-4xl mb-3">🌙</div>
                                    <div className={`font-bold text-lg mb-1 transition-colors duration-300 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        Rapport Soir
                                    </div>
                                    <div className={`text-sm transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        Clôture • Analyse • Perspectives
                                    </div>
                                    <div className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                                        isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                                    }`}>
                                        →
                                    </div>
                                </button>
                            </div>

                            {loading && (
                                <div className={`mt-4 p-4 rounded-lg border-2 transition-colors duration-300 ${
                                    isDarkMode ? 'bg-gray-900/20 border-gray-500/30' : 'bg-gray-800 border-gray-700'
                                }`}>
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                        </div>
                                        <div className="flex-1">
                                            <div className={`font-semibold mb-1 transition-colors duration-300 ${
                                                isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                            }`}>
                                                {currentStep || 'Génération en cours...'}
                                            </div>
                                            {stepDetails && (
                                                <div className={`text-sm transition-colors duration-300 ${
                                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                }`}>
                                                    {stepDetails}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Prévisualisation et actions */}
                        {true && (
                            <div className={`p-6 rounded-lg border transition-colors duration-300 ${
                                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                            }`}>
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex-1">
                                        <h3 className={`text-xl font-bold mb-1 transition-colors duration-300 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            {currentBriefing?.subject || '📄 Aperçu du briefing'}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            {currentBriefing?.fallback === true && (
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                                    isDarkMode
                                                        ? 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/50'
                                                        : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                                }`}>
                                                    ⚠️ Mode Fallback
                                                </span>
                                            )}
                                            {currentBriefing?.cognitive && (
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                                    isDarkMode
                                                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/50'
                                                        : 'bg-purple-100 text-purple-700 border border-purple-300'
                                                }`}>
                                                    🧠 Analyse Cognitive
                                                </span>
                                            )}
                                            {currentBriefing && !currentBriefing?.fallback && (
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                                    isDarkMode
                                                        ? 'bg-green-600/20 text-green-300 border border-green-500/50'
                                                        : 'bg-green-100 text-green-700 border border-green-300'
                                                }`}>
                                                    ✓ Prêt
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        {currentBriefing?.fallback === true && (
                                            <button
                                                onClick={() => generateCognitiveBriefing(currentBriefing.type)}
                                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                                    isDarkMode
                                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                                        : 'bg-green-500 hover:bg-green-600 text-white'
                                                }`}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                Réessayer
                                            </button>
                                        )}
                                        {currentBriefing && (
                                            <>
                                                <button
                                                    onClick={sendBriefingEmailQuick}
                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                                        isDarkMode
                                                            ? 'bg-gray-800 hover:bg-gray-700 text-white'
                                                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                                                    }`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    Envoyer Email
                                                </button>
                                                <button
                                                    onClick={saveBriefing}
                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                                        isDarkMode
                                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                                            : 'bg-green-500 hover:bg-green-600 text-white'
                                                    }`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                                    </svg>
                                                    Sauvegarder
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Metadata Cognitive (si briefing cognitif) */}
                                {currentBriefing?.cognitive && currentBriefing?.intentData && (
                                    <div className={`mb-4 p-4 rounded-lg border-2 transition-colors duration-300 ${
                                        isDarkMode ? 'bg-gray-700/50 border-purple-500/30' : 'bg-purple-50 border-purple-200'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xl"><Icon emoji="🧠" size={24} /></span>
                                            <h4 className={`font-semibold transition-colors duration-300 ${
                                                isDarkMode ? 'text-purple-300' : 'text-purple-700'
                                            }`}>
                                                Analyse Cognitive Emma
                                            </h4>
                                        </div>

                                        {/* Badges Metadata */}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                isDarkMode ? 'bg-gray-600/20 text-gray-300 border border-gray-500/30' : 'bg-gray-700 text-gray-200 border border-gray-600'
                                            }`}>
                                                Intent: {currentBriefing.intentData.intent}
                                            </span>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                isDarkMode ? 'bg-green-600/20 text-green-300 border border-green-500/30' : 'bg-green-100 text-green-700 border border-green-300'
                                            }`}>
                                                Confiance: {(currentBriefing.intentData.confidence * 100).toFixed(0)}%
                                            </span>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                currentBriefing.intentData.importance_level >= 8
                                                    ? isDarkMode ? 'bg-red-600/20 text-red-300 border border-red-500/30' : 'bg-red-100 text-red-700 border border-red-300'
                                                    : currentBriefing.intentData.importance_level >= 6
                                                    ? isDarkMode ? 'bg-green-600/20 text-green-300 border border-green-500/30' : 'bg-green-100 text-green-700 border border-green-300'
                                                    : isDarkMode ? 'bg-gray-600/20 text-gray-300 border border-gray-500/30' : 'bg-gray-100 text-gray-700 border border-gray-300'
                                            }`}>
                                                Importance: {currentBriefing.intentData.importance_level}/10
                                            </span>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                isDarkMode ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-700 border border-purple-300'
                                            }`}>
                                                Style: {currentBriefing.intentData.email_style}
                                            </span>
                                        </div>

                                        {/* Trending Topics */}
                                        {currentBriefing.intentData.trending_topics && currentBriefing.intentData.trending_topics.length > 0 && (
                                            <div className="mb-3">
                                                <div className={`text-xs font-semibold mb-1 transition-colors duration-300 ${
                                                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                                }`}>
                                                    🔥 Sujets du moment:
                                                </div>
                                                <ul className={`text-sm space-y-1 transition-colors duration-300 ${
                                                    isDarkMode ? 'text-gray-400' : 'text-gray-700'
                                                }`}>
                                                    {currentBriefing.intentData.trending_topics.slice(0, 3).map((topic, i) => (
                                                        <li key={i} className="flex items-start">
                                                            <span className="mr-2">•</span>
                                                            <span>{topic}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Tools Used */}
                                        {currentBriefing.smartData?.tools_used && currentBriefing.smartData.tools_used.length > 0 && (
                                            <div>
                                                <div className={`text-xs font-semibold mb-1 transition-colors duration-300 ${
                                                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                                }`}>
                                                    🔧 Outils Emma Agent utilisés:
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {currentBriefing.smartData.tools_used.map((tool, i) => (
                                                        <span key={i} className={`px-2 py-0.5 rounded text-xs font-mono transition-colors duration-300 ${
                                                            isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                                                        }`}>
                                                            {tool}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Summary */}
                                        {currentBriefing.intentData.summary && (
                                            <div className={`mt-3 pt-3 border-t text-sm italic transition-colors duration-300 ${
                                                isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-600'
                                            }`}>
                                                💡 {currentBriefing.intentData.summary}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Formulaire d'envoi email */}
                                {currentBriefing && (
                                <div className="mb-4">
                                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        Destinataires (séparés par des virgules)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={recipients}
                                            onChange={(e) => setRecipients(e.target.value)}
                                            placeholder="email1@example.com, email2@example.com"
                                            className={`flex-1 px-3 py-2 rounded-lg border transition-colors duration-300 ${
                                                isDarkMode 
                                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                            }`}
                                        />
                                        <button
                                            onClick={sendEmail}
                                            disabled={!recipients.trim()}
                                            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            📧 Envoyer
                                        </button>
                                    </div>
                                </div>
                                )}

                                {/* Prévisualisation */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className={`p-3 border-b flex justify-between items-center transition-colors duration-300 ${
                                        isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                                    }`}>
                                        <span className={`text-sm font-medium transition-colors duration-300 ${
                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                            {isEditMode ? '✏️ Édition HTML' : '👁️ Prévisualisation Email'}
                                        </span>
                                        <div className="flex gap-2">
                                            {isEditMode ? (
                                                <>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-all ${
                                                            isDarkMode
                                                                ? 'bg-gray-600 hover:bg-gray-500 text-white'
                                                                : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                                                        }`}
                                                    >
                                                        ✖ Annuler
                                                    </button>
                                                    <button
                                                        onClick={saveEditedContent}
                                                        className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-all"
                                                    >
                                                        ✓ Enregistrer
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={toggleEditMode}
                                                    disabled={!previewHtml}
                                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-all ${
                                                        isDarkMode
                                                            ? 'bg-gray-800 hover:bg-gray-700 text-white disabled:bg-gray-700 disabled:text-gray-500'
                                                            : 'bg-gray-700 hover:bg-gray-600 text-white disabled:bg-gray-200 disabled:text-gray-400'
                                                    } disabled:cursor-not-allowed`}
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Éditer
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {console.log('🔍 État previewHtml:', previewHtml ? previewHtml.substring(0, 200) + '...' : 'null')}
                                    {previewHtml ? (
                                        isEditMode ? (
                                            <div className="p-4">
                                                <textarea
                                                    value={editedHtml}
                                                    onChange={(e) => setEditedHtml(e.target.value)}
                                                    className={`w-full h-96 font-mono text-xs p-3 border rounded transition-colors duration-300 ${
                                                        isDarkMode
                                                            ? 'bg-gray-800 border-gray-600 text-gray-200'
                                                            : 'bg-white border-gray-300 text-gray-900'
                                                    }`}
                                                    placeholder="Éditez le HTML ici..."
                                                    spellCheck="false"
                                                />
                                                <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    💡 Astuce: Vous pouvez modifier le HTML directement. Les changements seront appliqués au briefing.
                                                </div>
                                            </div>
                                        ) : (
                                            <iframe
                                                key={previewHtml} // Force React à recréer l'iframe
                                                srcDoc={previewHtml}
                                                className="w-full h-96 border-0"
                                                title="Email Preview"
                                                onLoad={() => console.log('✅ Iframe chargé avec succès')}
                                                onError={() => console.log('❌ Erreur chargement iframe')}
                                            />
                                        )
                                    ) : (
                                        <div className="w-full h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                            <p className="text-gray-500">Aperçu non disponible</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Historique des briefings */}
                        <div className={`p-6 rounded-lg border transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>📚 Historique des Briefings</h3>
                            
                            {briefingHistory.length > 0 ? (
                                <div className="space-y-3">
                                    {briefingHistory.map((briefing) => (
                                        <div
                                            key={briefing.id}
                                            className={`p-4 rounded-lg border transition-colors duration-300 ${
                                                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className={`font-medium transition-colors duration-300 ${
                                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>
                                                        {briefing.subject}
                                                    </h4>
                                                    <p className={`text-sm transition-colors duration-300 ${
                                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>
                                                        {new Date(briefing.created_at).toLocaleString('fr-FR')}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setPreviewHtml(briefing.html_content);
                                                            setCurrentBriefing({
                                                                type: briefing.type,
                                                                subject: briefing.subject,
                                                                html: briefing.html_content,
                                                                data: briefing.market_data,
                                                                analysis: briefing.analysis
                                                            });
                                                        }}
                                                        className="px-3 py-1 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                                                    >
                                                        👁️ Voir
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={`text-center transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    Aucun briefing sauvegardé
                                </p>
                            )}
                        </div>

                        {/* Panneau de Debugging - Process Log */}
                        {processLog.length > 0 && (
                            <div className={`p-6 rounded-lg border transition-colors duration-300 ${
                                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                            }`}>
                                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                    🔍 Logs de Génération
                                </h3>

                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {processLog.map((log, index) => (
                                        <div
                                            key={index}
                                            className={`p-3 rounded border text-sm font-mono ${
                                                log.level === 'error'
                                                    ? isDarkMode ? 'bg-red-900/20 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
                                                    : log.level === 'success'
                                                    ? isDarkMode ? 'bg-green-900/20 border-green-500/30 text-green-300' : 'bg-green-50 border-green-200 text-green-700'
                                                    : isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-1">
                                                <span className="font-semibold">
                                                    {log.level === 'error' ? '❌' : log.level === 'success' ? '✅' : 'ℹ️'} {log.step}
                                                </span>
                                                <span className="text-xs opacity-70">
                                                    {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                                                </span>
                                            </div>
                                            <div className="opacity-90">{log.message}</div>
                                            {log.data && Object.keys(log.data).length > 0 && (
                                                <details className="mt-2">
                                                    <summary className="cursor-pointer opacity-70 hover:opacity-100">
                                                        Détails technique
                                                    </summary>
                                                    <pre className="mt-2 p-2 rounded bg-black/20 overflow-x-auto text-xs">
                                                        {JSON.stringify(log.data, null, 2)}
                                                    </pre>
                                                </details>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => {
                                        clearProcessLog();
                                        setCurrentStep('');
                                        setStepDetails('');
                                    }}
                                    className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                                >
                                    🗑️ Effacer les logs
                                </button>
                            </div>
                        )}
                    </div>
                );
            };

window.EmailBriefingsTab = EmailBriefingsTab;