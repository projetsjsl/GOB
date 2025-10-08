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
    model: 'gemini-pro',
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
