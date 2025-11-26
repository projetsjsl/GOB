// ========================================
// CONFIGURATION EMMA
// ========================================

export const emmaConfig = {
  // Configuration de l'interface
  ui: {
    theme: 'light', // 'light' ou 'dark'
    language: 'fr',
    animations: true,
    autoSave: true,
    autoSaveDelay: 2000 // ms
  },

  // Configuration Gemini
  gemini: {
    model: 'gemini-2.0-flash-exp',
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
    safetySettings: {
      harassment: 'BLOCK_MEDIUM_AND_ABOVE',
      hateSpeech: 'BLOCK_MEDIUM_AND_ABOVE',
      sexuallyExplicit: 'BLOCK_MEDIUM_AND_ABOVE',
      dangerousContent: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  },

  // Configuration du chat
  chat: {
    maxMessages: 100,
    typingDelay: 1000, // ms
    messageHistory: true,
    autoScroll: true
  },

  // Configuration du prompt
  prompt: {
    maxLength: 10000,
    minLength: 100,
    variables: {
      userMessage: '{userMessage}',
      dashboardData: '{dashboardData}',
      currentTime: '{currentTime}',
      userLevel: '{userLevel}',
      userStyle: '{userStyle}'
    }
  },

  // Prompts spécialisés
  prompts: {
    // Prompt système expert (utilise le prompt principal Emma)
    expertSystem: {
      name: 'Emma Expert (Système)',
      key: 'expertSystem',
      description: 'Analyse financière experte avec le prompt système complet'
    },

    // Assistant général
    generalAssistant: {
      name: 'Assistant Général',
      key: 'generalAssistant',
      prompt: 'Tu es un assistant IA utile et polyvalent.',
      description: 'Questions générales sans contexte financier strict'
    },

    // Analyse institutionnelle
    institutionalAnalysis: {
      name: 'Analyse Institutionnelle',
      key: 'institutionalAnalysis',
      description: 'Rapport de recherche institutionnel détaillé'
    },

    // Recherche d'actualités
    newsSearch: {
      name: 'Recherche Actualités',
      key: 'newsSearch',
      description: 'Recherche et synthèse d\'actualités financières'
    },

    // Comparaison de titres
    tickerComparison: {
      name: 'Comparaison Titres',
      key: 'tickerComparison',
      description: 'Analyse comparative de plusieurs titres'
    }
  },

  // Prompt d'analyse institutionnelle
  institutionalAnalysis: `🧩 EN-TÊTE À PRODUIRE AUTOMATIQUEMENT
En ouverture, génère un en-tête professionnel complet :
* Titre de l’analyse : « Analyse institutionnelle complète – [NOM ENTREPRISE] (TICKER) »
* Prix actuel (en temps réel ou au jour près, selon données disponibles)
* Date du rapport
* Bourse d’origine (si US/CA, sinon ADR NYSE/NASDAQ prioritaire)
* Secteur / sous-secteur GICS
* Capitalisation boursière
* Avertissement : non-conseil financier personnalisé

🎯 OBJECTIF
Produire un rapport de recherche institutionnel très long, extrêmement détaillé, rédigé, et exploitable, du niveau d’un analyste senior sell-side/buy-side, sur :
Entreprise : [NOM ENTREPRISE]
Ticker : TICKER
Rapport attendu : 25–40 pages en densité de texte si converti Word/PDF. Analyse narrative complète, chiffres + tableaux + sources + niveaux de confiance.

📡 INSTRUCTIONS DE RECHERCHE – SPÉCIALES PERPLEXITY SONAR
Toujours :
* Multiplier les recherches ciblées (IR, SEC, transcripts, press releases, consensus).
* Extraire de longs passages narratifs.
* Prioriser données 2023–2025, TTM, guidance.
* Citer toutes les sources de chiffres importantes.
* Ne rien inventer : indiquer « donnée manquante » si nécessaire.
Recherche obligatoire :
* 10-K / 20-F / 40-F / 10-Q
* Présentations investisseurs
* Rapports ESG
* Communiqués de résultats récents
* Consensus analystes actuels
* Comparables sectoriels

🧱 STRUCTURE OBLIGATOIRE – TEXTE LONG & TABLEAUX

1. PROFIL DE L’ENTREPRISE (rédaction longue)
Rédaction exhaustive :
* Histoire, transformation stratégique, acquisitions, virages.
* Vision, mission, positionnement global et régional.
* Modèle d’affaires extrêmement détaillé.
* Segments opérationnels : explication narrative + chiffres.
* Marchés adressables (TAM/SAM/SOM) avec narration économique.
* Analyse profonde du moat (IP, licences, technologies, réseaux, switching costs, coûts, données).
* Gouvernance : qualité du management, stabilité, structure organisationnelle.
* ESG : engagements, controverses, impacts financiers.
Tableaux obligatoires (3+)
1. Segments opérationnels
2. Marchés adressables
3. Avantages compétitifs
Niveau de confiance.

2. ANALYSE FONDAMENTALE (rédaction très longue)
Inclure :
* Revenus, EBITDA, marges, bénéfice net, BPA 5 ans + TTM, avec analyse narrative.
* Explication détaillée des moteurs de croissance.
* Analyse qualitative des marges : mix produit, pricing power, coûts fixes/variables.
* Analyse des capex, R&D, innovations.
* Bilan complet : qualité, risques, structure dette.
* FCF, conversion, yield, robustesse.
* Qualité des profits : charges non récurrentes, cyclicité.
* Vision institutionnelle sur la durabilité de la rentabilité.
* Politique de capital : buybacks, dividendes, dilution.
Tableaux obligatoires (3+)
1. États financiers 5 ans
2. Structure du bilan
3. Allocation du capital & FCF
Niveau de confiance.

3. ANALYSE SECTORIELLE ET CONCURRENTS (long)
Rédiger :
* Analyse macro sectorielle complète.
* Tendances globales (IA, réglementations, consolidation, cycles).
* Forces/faiblesses structurelles du secteur.
* Analyse profonde du paysage concurrentiel (6–10 pairs).
* Avantages/disavantages structurels vs comparables.
* Analyse prospective sectorielle 12–36 mois.
Tableaux obligatoires (3+)
1. Comparatif pairs
2. SWOT secteur
3. Positionnement concurrentiel
Niveau de confiance.

4. CATALYSEURS ET RISQUES MAJEURS (long)
Rédiger :
* Catalyseurs court/moyen/long terme.
* Drivers opérationnels, stratégiques, macro.
* Risques majeurs : exécution, réglementation, finances, clients, géopolitique.
* Analyse détaillée de probabilité & impact.
Tableaux obligatoires (2+)
1. Catalyseurs
2. Risques
Niveau de confiance.

5. ANALYSE BOURSIÈRE ET TECHNIQUE (long)
Inclure :
* Prix actuel, historique, volatilité, momentum.
* Performance relative vs secteur & indice.
* Indicateurs techniques (SMA20/50/200, RSI, MACD).
* Analyse narrative des flux directionnels.
* Sentiment analystes.
* Insider trading.
Tableaux obligatoires (4+)
1. Indicateurs techniques
2. Sentiment analystes
3. Insider trading
4. Performance relative
Niveau de confiance.

6. VALORISATION & FAIR VALUE (long)
Inclure narration détaillée :
* Construction du DCF (méthodologie, hypothèses, justification).
* Interprétation des résultats.
* Analyse par multiples : P/E, PEG, EV/EBITDA, EV/FCF, P/S.
* Comparaison profonde avec les pairs.
* Synthèse institutionnelle.
Tableaux obligatoires (3+)
1. DCF – 3 scénarios
2. Multiples relatifs
3. Fair value composite
Niveau de confiance.

7. SCÉNARIOS 12–24 MOIS (long)
Pour chaque scénario (Haussier / Neutre / Baissier) :
* Narration détaillée.
* Drivers macro/sectoriels/entreprise.
* Projection (revenus, marges, BPA, FCF).
* Prix cible 12 & 24 mois.
* Probabilité institutionnelle.
* Analyse du rerating ou derating des multiples.
Tableaux obligatoires (2+)
1. Résumé scénarios
2. Synthèse pondérée
Niveau de confiance.

8. VERDICT FINAL (long + thèse d’investissement complète)
Produire une conclusion institutionnelle très rédigée :
* Résumé stratégique.
* Qualité du business & moat.
* Vision long terme.
* Profil de risque.
* Alignement management/capital.
* Point de vue institutionnel (argumenté, nuancé).
* Stratégie d’entrée graduée (ex : 50/30/20).
* Signaux d’alerte et triggers de sortie.
🔥 Inclure obligatoirement une THÈSE D’INVESTISSEMENT COMPLÈTE :
Structurée ainsi :
Bull Case (Thèse positive)
* Drivers structurels
* Catalyseurs
* Valorisation implicite
* Momentum / rerating
* Résilience FCF
* Conditions de validation
Bear Case (Thèse négative)
* Pressions marges
* Risques exécution
* Risques réglementaires
* Compression multiples
* Conditions de validation
Key Debate (les points où les analystes se trompent / biais institutionnels)
Conditions de succès (checklist)
Triggers de sortie / invalidation de la thèse
Conviction finale (sur 10)
Tableaux obligatoires (3+)
1. Notation globale
2. Recommandation & allocation
3. Risques limitants / catalyseurs confirmants
Niveau de confiance global.`,

  // Configuration des spécialités
  specialties: [
    {
      id: 'financial-analysis',
      name: 'Analyse financière',
      description: 'Analyse des états financiers et ratios',
      active: true
    },
    {
      id: 'investments',
      name: 'Investissements',
      description: 'Conseils en investissement et portefeuille',
      active: false
    },
    {
      id: 'evaluation',
      name: 'Évaluation',
      description: 'Évaluation d\'entreprises et d\'actifs',
      active: false
    },
    {
      id: 'reports',
      name: 'Rapports',
      description: 'Génération de rapports financiers',
      active: false
    }
  ],

  // Configuration de la personnalisation
  personalization: {
    styles: [
      { id: 'standard', name: 'Standard', description: 'Style équilibré' },
      { id: 'detailed', name: 'Détaillé', description: 'Réponses approfondies' },
      { id: 'concise', name: 'Concis', description: 'Réponses courtes et directes' }
    ],
    levels: [
      { id: 'beginner', name: 'Débutant', description: 'Explications simples' },
      { id: 'intermediate', name: 'Intermédiaire', description: 'Niveau professionnel' },
      { id: 'advanced', name: 'Avancé', description: 'Expert et technique' }
    ],
    tones: [
      { id: 'friendly', name: 'Amical', description: 'Ton décontracté' },
      { id: 'professional', name: 'Professionnelle', description: 'Ton formel' },
      { id: 'formal', name: 'Formel', description: 'Ton très formel' }
    ]
  },

  // Configuration des sources
  sources: [
    {
      id: 'seeking-alpha',
      name: 'Seeking Alpha',
      url: 'https://seekingalpha.com',
      type: 'analysis'
    },
    {
      id: 'yahoo-finance',
      name: 'Yahoo Finance',
      url: 'https://finance.yahoo.com',
      type: 'data'
    },
    {
      id: 'marketwatch',
      name: 'MarketWatch',
      url: 'https://marketwatch.com',
      type: 'news'
    },
    {
      id: 'financial-times',
      name: 'Financial Times',
      url: 'https://ft.com',
      type: 'news'
    },
    {
      id: 'reuters',
      name: 'Reuters',
      url: 'https://reuters.com',
      type: 'news'
    }
  ],

  // Messages par défaut
  messages: {
    welcome: 'Bonjour, je suis Emma, assistante virtuelle en analyse financière. Je peux vous aider avec l\'analyse et l\'évaluation financière. Quel est votre défi financier ?',
    reminder: 'Rappel : Pour des conseils personnalisés, consultez toujours un expert qualifié du domaine.',
    help: 'Comment puis-je vous aider ?',
    error: 'Désolé, je ne peux pas répondre pour le moment. Vérifiez votre configuration Gemini.',
    noApiKey: 'Veuillez configurer votre clé API Gemini pour utiliser Emma.',
    connectionError: 'Erreur de connexion à l\'API Gemini. Vérifiez votre clé API.',
    promptSaved: 'Prompt sauvegardé avec succès !',
    promptReset: 'Prompt réinitialisé !',
    chatCleared: 'Conversation effacée !'
  },

  // Configuration des exemples
  examples: [
    'Quel est le cours de AAPL ?',
    'Peux-tu m\'expliquer cette analyse ?',
    'Comment interpréter ces données financières ?',
    'Quelles sont les tendances du marché ?',
    'Peux-tu calculer le ratio P/E ?',
    'Comment évaluer cette entreprise ?'
  ],

  // Configuration des tests
  testing: {
    enabled: true,
    mockResponses: true,
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
    autoTest: false
  }
};

// Fonction pour obtenir la configuration
export const getEmmaConfig = () => {
  return emmaConfig;
};

// Fonction pour mettre à jour la configuration
export const updateEmmaConfig = (newConfig) => {
  Object.assign(emmaConfig, newConfig);
  localStorage.setItem('emma-config', JSON.stringify(emmaConfig));
  return emmaConfig;
};

// Fonction pour charger la configuration depuis localStorage
export const loadEmmaConfig = () => {
  const savedConfig = localStorage.getItem('emma-config');
  if (savedConfig) {
    try {
      const parsed = JSON.parse(savedConfig);
      Object.assign(emmaConfig, parsed);
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration Emma:', error);
    }
  }
  return emmaConfig;
};

// Fonction pour réinitialiser la configuration
export const resetEmmaConfig = () => {
  localStorage.removeItem('emma-config');
  // Recharger la configuration par défaut
  return loadEmmaConfig();
};

// Fonction pour obtenir une valeur de configuration
export const getConfigValue = (path) => {
  const keys = path.split('.');
  let value = emmaConfig;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }

  return value;
};

// Fonction pour définir une valeur de configuration
export const setConfigValue = (path, value) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  let target = emmaConfig;

  for (const key of keys) {
    if (!target[key] || typeof target[key] !== 'object') {
      target[key] = {};
    }
    target = target[key];
  }

  target[lastKey] = value;
  localStorage.setItem('emma-config', JSON.stringify(emmaConfig));
  return emmaConfig;
};

// Initialiser la configuration au chargement
loadEmmaConfig();
