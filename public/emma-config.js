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
    apiKey: 'AIzaSyCQxlKZCgsjAytjEYz2EyKYhacPSJdGaVY', // Configured from .env.local
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

  // Configuration Tavus (Video Avatar)
  tavus: {
    apiKey: '28eb5b8a711a4abd9c82e77a7279f9ca', 
    replicaId: 'r9c55f9312fb', 
    personaId: 'p68d02f5eb54', 
    conversationId: null, // Will be set dynamically
    options: {
      enableVideo: true,
      enableAudio: true
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

  // Prompts specialises
  prompts: {
    // Prompt systeme expert (utilise le prompt principal Emma)
    expertSystem: {
      name: 'Emma Expert (Systeme)',
      key: 'expertSystem',
      description: 'Analyse financiere experte avec le prompt systeme complet'
    },

    // Assistant general
    generalAssistant: {
      name: 'Assistant General',
      key: 'generalAssistant',
      prompt: 'Tu es un assistant IA utile et polyvalent.',
      description: 'Questions generales sans contexte financier strict'
    },

    // Analyse institutionnelle
    institutionalAnalysis: {
      name: 'Analyse Institutionnelle',
      key: 'institutionalAnalysis',
      description: 'Rapport de recherche institutionnel detaille'
    },

    // Recherche d'actualites
    newsSearch: {
      name: 'Recherche Actualites',
      key: 'newsSearch',
      description: 'Recherche et synthese d\'actualites financieres'
    },

    // Comparaison de titres
    tickerComparison: {
      name: 'Comparaison Titres',
      key: 'tickerComparison',
      description: 'Analyse comparative de plusieurs titres'
    }
  },

  // Prompt d'analyse institutionnelle
  institutionalAnalysis: ` EN-TETE A PRODUIRE AUTOMATIQUEMENT
En ouverture, genere un en-tete professionnel complet :
* Titre de l'analyse : " Analyse institutionnelle complete - [NOM ENTREPRISE] (TICKER) "
* Prix actuel (en temps reel ou au jour pres, selon donnees disponibles)
* Date du rapport
* Bourse d'origine (si US/CA, sinon ADR NYSE/NASDAQ prioritaire)
* Secteur / sous-secteur GICS
* Capitalisation boursiere
* Avertissement : non-conseil financier personnalise

 OBJECTIF
Produire un rapport de recherche institutionnel tres long, extremement detaille, redige, et exploitable, du niveau d'un analyste senior sell-side/buy-side, sur :
Entreprise : [NOM ENTREPRISE]
Ticker : TICKER
Rapport attendu : 25-40 pages en densite de texte si converti Word/PDF. Analyse narrative complete, chiffres + tableaux + sources + niveaux de confiance.

 INSTRUCTIONS DE RECHERCHE - SPECIALES PERPLEXITY SONAR
Toujours :
* Multiplier les recherches ciblees (IR, SEC, transcripts, press releases, consensus).
* Extraire de longs passages narratifs.
* Prioriser donnees 2023-2025, TTM, guidance.
* Citer toutes les sources de chiffres importantes.
* Ne rien inventer : indiquer " donnee manquante " si necessaire.
Recherche obligatoire :
* 10-K / 20-F / 40-F / 10-Q
* Presentations investisseurs
* Rapports ESG
* Communiques de resultats recents
* Consensus analystes actuels
* Comparables sectoriels

 STRUCTURE OBLIGATOIRE - TEXTE LONG & TABLEAUX

1. PROFIL DE L'ENTREPRISE (redaction longue)
Redaction exhaustive :
* Histoire, transformation strategique, acquisitions, virages.
* Vision, mission, positionnement global et regional.
* Modele d'affaires extremement detaille.
* Segments operationnels : explication narrative + chiffres.
* Marches adressables (TAM/SAM/SOM) avec narration economique.
* Analyse profonde du moat (IP, licences, technologies, reseaux, switching costs, couts, donnees).
* Gouvernance : qualite du management, stabilite, structure organisationnelle.
* ESG : engagements, controverses, impacts financiers.
Tableaux obligatoires (3+)
1. Segments operationnels
2. Marches adressables
3. Avantages competitifs
Niveau de confiance.

2. ANALYSE FONDAMENTALE (redaction tres longue)
Inclure :
* Revenus, EBITDA, marges, benefice net, BPA 5 ans + TTM, avec analyse narrative.
* Explication detaillee des moteurs de croissance.
* Analyse qualitative des marges : mix produit, pricing power, couts fixes/variables.
* Analyse des capex, R&D, innovations.
* Bilan complet : qualite, risques, structure dette.
* FCF, conversion, yield, robustesse.
* Qualite des profits : charges non recurrentes, cyclicite.
* Vision institutionnelle sur la durabilite de la rentabilite.
* Politique de capital : buybacks, dividendes, dilution.
Tableaux obligatoires (3+)
1. Etats financiers 5 ans
2. Structure du bilan
3. Allocation du capital & FCF
Niveau de confiance.

3. ANALYSE SECTORIELLE ET CONCURRENTS (long)
Rediger :
* Analyse macro sectorielle complete.
* Tendances globales (IA, reglementations, consolidation, cycles).
* Forces/faiblesses structurelles du secteur.
* Analyse profonde du paysage concurrentiel (6-10 pairs).
* Avantages/disavantages structurels vs comparables.
* Analyse prospective sectorielle 12-36 mois.
Tableaux obligatoires (3+)
1. Comparatif pairs
2. SWOT secteur
3. Positionnement concurrentiel
Niveau de confiance.

4. CATALYSEURS ET RISQUES MAJEURS (long)
Rediger :
* Catalyseurs court/moyen/long terme.
* Drivers operationnels, strategiques, macro.
* Risques majeurs : execution, reglementation, finances, clients, geopolitique.
* Analyse detaillee de probabilite & impact.
Tableaux obligatoires (2+)
1. Catalyseurs
2. Risques
Niveau de confiance.

5. ANALYSE BOURSIERE ET TECHNIQUE (long)
Inclure :
* Prix actuel, historique, volatilite, momentum.
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
Inclure narration detaillee :
* Construction du DCF (methodologie, hypotheses, justification).
* Interpretation des resultats.
* Analyse par multiples : P/E, PEG, EV/EBITDA, EV/FCF, P/S.
* Comparaison profonde avec les pairs.
* Synthese institutionnelle.
Tableaux obligatoires (3+)
1. DCF - 3 scenarios
2. Multiples relatifs
3. Fair value composite
Niveau de confiance.

7. SCENARIOS 12-24 MOIS (long)
Pour chaque scenario (Haussier / Neutre / Baissier) :
* Narration detaillee.
* Drivers macro/sectoriels/entreprise.
* Projection (revenus, marges, BPA, FCF).
* Prix cible 12 & 24 mois.
* Probabilite institutionnelle.
* Analyse du rerating ou derating des multiples.
Tableaux obligatoires (2+)
1. Resume scenarios
2. Synthese ponderee
Niveau de confiance.

8. VERDICT FINAL (long + these d'investissement complete)
Produire une conclusion institutionnelle tres redigee :
* Resume strategique.
* Qualite du business & moat.
* Vision long terme.
* Profil de risque.
* Alignement management/capital.
* Point de vue institutionnel (argumente, nuance).
* Strategie d'entree graduee (ex : 50/30/20).
* Signaux d'alerte et triggers de sortie.
 Inclure obligatoirement une THESE D'INVESTISSEMENT COMPLETE :
Structuree ainsi :
Bull Case (These positive)
* Drivers structurels
* Catalyseurs
* Valorisation implicite
* Momentum / rerating
* Resilience FCF
* Conditions de validation
Bear Case (These negative)
* Pressions marges
* Risques execution
* Risques reglementaires
* Compression multiples
* Conditions de validation
Key Debate (les points ou les analystes se trompent / biais institutionnels)
Conditions de succes (checklist)
Triggers de sortie / invalidation de la these
Conviction finale (sur 10)
Tableaux obligatoires (3+)
1. Notation globale
2. Recommandation & allocation
3. Risques limitants / catalyseurs confirmants
Niveau de confiance global.`,

  // Configuration des specialites
  specialties: [
    {
      id: 'financial-analysis',
      name: 'Analyse financiere',
      description: 'Analyse des etats financiers et ratios',
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
      name: 'Evaluation',
      description: 'Evaluation d\'entreprises et d\'actifs',
      active: false
    },
    {
      id: 'reports',
      name: 'Rapports',
      description: 'Generation de rapports financiers',
      active: false
    }
  ],

  // Configuration de la personnalisation
  personalization: {
    styles: [
      { id: 'standard', name: 'Standard', description: 'Style equilibre' },
      { id: 'detailed', name: 'Detaille', description: 'Reponses approfondies' },
      { id: 'concise', name: 'Concis', description: 'Reponses courtes et directes' }
    ],
    levels: [
      { id: 'beginner', name: 'Debutant', description: 'Explications simples' },
      { id: 'intermediate', name: 'Intermediaire', description: 'Niveau professionnel' },
      { id: 'advanced', name: 'Avance', description: 'Expert et technique' }
    ],
    tones: [
      { id: 'friendly', name: 'Amical', description: 'Ton decontracte' },
      { id: 'professional', name: 'Professionnelle', description: 'Ton formel' },
      { id: 'formal', name: 'Formel', description: 'Ton tres formel' }
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

  // Messages par defaut
  messages: {
    welcome: 'Bonjour, je suis Emma, assistante virtuelle en analyse financiere. Je peux vous aider avec l\'analyse et l\'evaluation financiere. Quel est votre defi financier ?',
    reminder: 'Rappel : Pour des conseils personnalises, consultez toujours un expert qualifie du domaine.',
    help: 'Comment puis-je vous aider ?',
    error: 'Desole, je ne peux pas repondre pour le moment. Verifiez votre configuration Gemini.',
    noApiKey: 'Veuillez configurer votre cle API Gemini pour utiliser Emma.',
    connectionError: 'Erreur de connexion a l\'API Gemini. Verifiez votre cle API.',
    promptSaved: 'Prompt sauvegarde avec succes !',
    promptReset: 'Prompt reinitialise !',
    chatCleared: 'Conversation effacee !'
  },

  // Configuration des exemples
  examples: [
    'Quel est le cours de AAPL ?',
    'Peux-tu m\'expliquer cette analyse ?',
    'Comment interpreter ces donnees financieres ?',
    'Quelles sont les tendances du marche ?',
    'Peux-tu calculer le ratio P/E ?',
    'Comment evaluer cette entreprise ?'
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

// Fonction pour mettre a jour la configuration
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

// Fonction pour reinitialiser la configuration
export const resetEmmaConfig = () => {
  localStorage.removeItem('emma-config');
  // Recharger la configuration par defaut
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

// Fonction pour definir une valeur de configuration
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
