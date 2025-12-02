/**
 * API Endpoint pour se connecter à FastGraphs.com via Stagehand + Browserbase
 * 
 * Ce endpoint exécute un workflow automatisé qui:
 * 1. Navigue vers fastgraphs.com
 * 2. Clique sur le bouton "Log In"
 * 3. Remplit les identifiants si fournis
 * 4. Soumet le formulaire
 * 
 * Utilise Stagehand avec Browserbase pour l'automatisation du navigateur
 * Basé sur le workflow initial fourni par Browserbase
 */

// Configuration Stagehand pour utilisation avec Browserbase
const getStagehandConfig = () => {
  return {
    env: 'BROWSERBASE',
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    verbose: 1,
    modelName: 'google/gemini-2.5-flash',
    disablePino: true,
    modelClientOptions: {
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    },
  };
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  let stagehand = null;

  try {
    // Récupérer les identifiants depuis le body ou query params
    let email, password;
    try {
      if (req.method === 'POST') {
        email = req.body?.email;
        password = req.body?.password;
      } else {
        email = req.query?.email;
        password = req.query?.password;
      }
    } catch (parseError) {
      console.warn('Erreur parsing body/query:', parseError.message);
    }
    
    const hasCredentials = email && password;
    const debugMode = req.query?.debug === 'true' || req.body?.debug === true;
    
    // Vérifier les variables d'environnement requises
    const browserbaseApiKey = process.env.BROWSERBASE_API_KEY;
    const browserbaseProjectId = process.env.BROWSERBASE_PROJECT_ID;
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!browserbaseApiKey || !browserbaseProjectId) {
      console.error('Configuration Browserbase manquante:', {
        hasApiKey: !!browserbaseApiKey,
        hasProjectId: !!browserbaseProjectId,
        envKeys: Object.keys(process.env).filter(k => k.includes('BROWSERBASE'))
      });
      
      if (debugMode) {
        return res.status(503).json({
          success: false,
          error: 'Configuration Browserbase manquante',
          details: 'BROWSERBASE_API_KEY et BROWSERBASE_PROJECT_ID sont requis',
          hint: 'Configurez ces variables dans Vercel Environment Variables',
          config: {
            hasApiKey: !!browserbaseApiKey,
            hasProjectId: !!browserbaseProjectId,
            apiKeyPrefix: browserbaseApiKey ? browserbaseApiKey.substring(0, 4) + '...' : 'non défini',
            projectIdPrefix: browserbaseProjectId ? browserbaseProjectId.substring(0, 4) + '...' : 'non défini',
            envKeysFound: Object.keys(process.env).filter(k => k.includes('BROWSERBASE'))
          },
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(503).json({
        success: false,
        error: 'Configuration Browserbase manquante',
        details: 'BROWSERBASE_API_KEY et BROWSERBASE_PROJECT_ID sont requis',
        hint: 'Configurez ces variables dans Vercel Environment Variables. Ajoutez ?debug=true pour plus de détails.',
        timestamp: new Date().toISOString()
      });
    }

    if (!geminiApiKey) {
      console.warn('GEMINI_API_KEY ou GOOGLE_API_KEY non définie - Stagehand utilisera la clé par défaut si disponible');
    }

    // Import dynamique de Stagehand pour éviter les erreurs de chargement
    console.log('Import de Stagehand...');
    let Stagehand;
    try {
      const stagehandModule = await import('@browserbasehq/stagehand');
      Stagehand = stagehandModule.Stagehand;
      if (!Stagehand) {
        throw new Error('Stagehand class not found in module');
      }
      console.log('Stagehand importé avec succès');
    } catch (importError) {
      console.error('Erreur lors de l\'import de Stagehand:', importError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors du chargement de Stagehand',
        details: importError.message || 'Impossible de charger le module @browserbasehq/stagehand',
        hint: 'Vérifiez que @browserbasehq/stagehand est installé et compatible avec Vercel Serverless',
        type: 'ImportError',
        timestamp: new Date().toISOString(),
        debugInfo: debugMode ? {
          errorMessage: importError.message,
          errorStack: importError.stack,
          errorName: importError.name
        } : undefined
      });
    }

    // Initialiser Stagehand
    console.log('Initialisation de Stagehand...');
    const stagehandConfig = getStagehandConfig();
    
    if (debugMode) {
      console.log('Configuration Stagehand:', {
        env: stagehandConfig.env,
        hasApiKey: !!stagehandConfig.apiKey,
        hasProjectId: !!stagehandConfig.projectId,
        modelName: stagehandConfig.modelName,
        hasGeminiKey: !!stagehandConfig.modelClientOptions?.apiKey
      });
    }
    
    try {
      stagehand = new Stagehand(stagehandConfig);
      await stagehand.init();
      console.log('Stagehand initialisé avec succès.');
    } catch (initError) {
      console.error('Erreur lors de l\'initialisation de Stagehand:', initError);
      return res.status(503).json({
        success: false,
        error: 'Erreur lors de l\'initialisation de Stagehand',
        details: initError.message || 'Impossible d\'initialiser Stagehand',
        hint: 'Vérifiez vos clés API Browserbase et Gemini. Ajoutez ?debug=true pour plus de détails.',
        type: 'InitializationError',
        timestamp: new Date().toISOString(),
        debugInfo: debugMode ? {
          errorMessage: initError.message,
          errorStack: initError.stack,
          errorName: initError.name,
          stagehandConfig: {
            env: stagehandConfig.env,
            hasApiKey: !!stagehandConfig.apiKey,
            hasProjectId: !!stagehandConfig.projectId
          }
        } : undefined
      });
    }

    // Obtenir l'instance de page
    const page = stagehand.page;
    if (!page) {
      throw new Error('Échec de l\'obtention de l\'instance de page depuis Stagehand');
    }

    // Étape 1: Naviguer vers FastGraphs
    console.log('Navigation vers: https://www.fastgraphs.com/');
    await page.goto('https://www.fastgraphs.com/', { waitUntil: 'networkidle0' });
    
    // Étape 2: Cliquer sur le bouton "Log In"
    console.log('Action: cliquer sur le bouton "Log In"');
    await page.act('click the Log In button');
    
    // Attendre que le formulaire de connexion apparaisse
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const automationSteps = [
      { step: 'navigate', success: true, message: 'Navigation vers FastGraphs.com réussie' },
      { step: 'click_login', success: true, message: 'Bouton "Log In" cliqué avec succès' }
    ];
    
    // Étape 3: Si des identifiants sont fournis, remplir le formulaire et se connecter
    if (hasCredentials && email && password) {
      console.log('Remplissage automatique des identifiants...');
      
      try {
        // Remplir le champ email/username
        await page.act(`fill the email or username field with "${email}"`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Remplir le champ password
        await page.act(`fill the password field with "${password}"`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        automationSteps.push({ 
          step: 'fill_credentials', 
          success: true, 
          message: 'Identifiants remplis avec succès' 
        });
        
        // Soumettre le formulaire
        console.log('Soumission du formulaire de connexion...');
        await page.act('click the submit or sign in button');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        automationSteps.push({ 
          step: 'submit_form', 
          success: true, 
          message: 'Formulaire soumis avec succès' 
        });
        
      } catch (fillError) {
        console.error('Erreur lors du remplissage des identifiants:', fillError);
        automationSteps.push({ 
          step: 'fill_credentials', 
          success: false, 
          message: `Erreur: ${fillError.message}` 
        });
      }
    }
    
    // Obtenir l'URL de la session Browserbase pour l'utilisateur
    // Stagehand avec Browserbase crée automatiquement une session
    // On peut obtenir l'URL via l'API Browserbase ou la retourner depuis Stagehand
    const sessionUrl = page.url(); // URL actuelle de la page
    
    console.log('Workflow terminé avec succès');
    
    return res.status(200).json({
      success: true,
      message: hasCredentials 
        ? 'Connexion automatisée à FastGraphs réussie' 
        : 'Session Browserbase créée - Bouton "Log In" cliqué',
      session: {
        url: sessionUrl,
        status: 'active',
        createdAt: new Date().toISOString()
      },
      automation: {
        steps: automationSteps,
        fullyAutomated: hasCredentials,
        message: hasCredentials 
          ? 'Connexion complète automatisée avec succès' 
          : 'Bouton "Log In" cliqué - Entrez vos identifiants manuellement'
      },
      workflow: {
        url: 'https://www.fastgraphs.com/',
        action: 'click the Log In button' + (hasCredentials ? ' and login with credentials' : ''),
        status: 'completed',
        automationLevel: hasCredentials ? 'full' : 'partial'
      },
      debugInfo: debugMode ? {
        stagehandConfig: {
          env: stagehandConfig.env,
          modelName: stagehandConfig.modelName,
          hasApiKey: !!stagehandConfig.apiKey,
          hasProjectId: !!stagehandConfig.projectId
        },
        emailProvided: !!email,
        passwordProvided: !!password
      } : undefined
    });

  } catch (error) {
    console.error('Erreur FastGraphs Login:', error);
    console.error('Stack:', error.stack);
    
    // Gérer les différents types d'erreurs
    let statusCode = 500;
    let errorMessage = 'Erreur lors de la connexion à FastGraphs';
    let hint = 'Vérifiez les variables d\'environnement (BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID, GEMINI_API_KEY)';
    
    if (error.message?.includes('init')) {
      statusCode = 503;
      errorMessage = 'Erreur lors de l\'initialisation de Stagehand';
      hint = 'Vérifiez vos clés API Browserbase et Gemini';
    } else if (error.message?.includes('page')) {
      statusCode = 502;
      errorMessage = 'Erreur lors de l\'obtention de la page';
      hint = 'Problème avec la session Browserbase';
    } else if (error.message?.includes('timeout')) {
      statusCode = 504;
      errorMessage = 'Timeout lors de l\'exécution du workflow';
      hint = 'Le workflow a pris trop de temps. Réessayez.';
    }
    
    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.message || 'Erreur inconnue',
      hint: hint,
      type: error.name || 'UnknownError',
      timestamp: new Date().toISOString(),
      debugInfo: (req.query?.debug === 'true' || req.body?.debug === true) ? {
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name
      } : undefined
    });
  } finally {
    // Nettoyer la connexion Stagehand
    if (stagehand) {
      console.log('Fermeture de la connexion Stagehand...');
      try {
        await stagehand.close();
      } catch (closeError) {
        console.error('Erreur lors de la fermeture de Stagehand:', closeError);
      }
    }
  }
}
