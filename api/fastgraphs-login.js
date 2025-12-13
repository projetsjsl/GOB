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
 * Fallback vers API REST Browserbase directe si Stagehand n'est pas disponible
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

// Fonction de fallback: Créer une session Browserbase via API REST directe
async function createBrowserbaseSessionDirect(req, res, options) {
  const { email, password, hasCredentials, debugMode, browserbaseApiKey, browserbaseProjectId, stagehandError } = options;
  
  try {
    const browserbaseApiUrl = process.env.BROWSERBASE_API_URL || 'https://www.browserbase.com/v1';
    
    console.log('Création d\'une session Browserbase via API REST...');
    
    // Créer une session Browserbase
    const sessionResponse = await fetch(`${browserbaseApiUrl}/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${browserbaseApiKey}`,
        'Content-Type': 'application/json',
        'x-browserbase-project-id': browserbaseProjectId
      },
      body: JSON.stringify({
        url: 'https://www.fastgraphs.com/',
        options: {
          headless: false,
          keepAlive: true
        }
      }),
      signal: AbortSignal.timeout(30000)
    });
    
    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('Erreur création session Browserbase:', sessionResponse.status, errorText);
      
      return res.status(sessionResponse.status >= 500 ? 502 : sessionResponse.status).json({
        success: false,
        error: 'Erreur lors de la création de la session Browserbase',
        details: errorText || 'Erreur inconnue',
        hint: 'Vérifiez vos clés API Browserbase. Ajoutez ?debug=true pour plus de détails.',
        type: 'BrowserbaseAPIError',
        timestamp: new Date().toISOString(),
        debugInfo: debugMode ? {
          status: sessionResponse.status,
          errorText,
          apiUrl: `${browserbaseApiUrl}/sessions`
        } : undefined
      });
    }
    
    const sessionData = await sessionResponse.json();
    const sessionId = sessionData.id || sessionData.sessionId;
    const sessionUrl = sessionData.url || 
                      sessionData.viewerUrl || 
                      sessionData.viewer_url ||
                      `https://www.browserbase.com/sessions/${sessionId}`;
    
    console.log('Session Browserbase créée:', sessionId);
    
    // Script d'automatisation JavaScript pour injection côté client
    const emailSafe = hasCredentials ? JSON.stringify(email) : 'null';
    const passwordSafe = hasCredentials ? JSON.stringify(password) : 'null';
    
    const automationScript = `
      (async () => {
        try {
          const email = ${emailSafe};
          const password = ${passwordSafe};
          const hasCredentials = ${hasCredentials ? 'true' : 'false'};
          
          await new Promise(resolve => {
            if (document.readyState === 'complete') {
              resolve();
            } else {
              window.addEventListener('load', resolve);
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const results = { steps: [] };
          
          // Chercher et cliquer sur le bouton "Log In"
          let loginButton = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"]'))
            .find(btn => {
              const text = (btn.textContent || '').toLowerCase();
              return text.includes('log in') || text.includes('login') || text.includes('se connecter');
            });
          
          if (!loginButton) {
            loginButton = document.querySelector('[id*="login"], [class*="login"], [id*="signin"], [class*="signin"]');
          }
          
          if (!loginButton) {
            loginButton = document.querySelector('a[href*="login"], a[href*="signin"]');
          }
          
          if (loginButton) {
            loginButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 500));
            loginButton.click();
            results.steps.push({ step: 'click_login', success: true });
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            results.steps.push({ step: 'click_login', success: false, message: 'Bouton non trouvé' });
            return { success: false, results };
          }
          
          // Si identifiants fournis, remplir le formulaire
          if (hasCredentials && email && password) {
            let emailField = document.querySelector('input[type="email"], input[name*="email"], input[name*="username"], input[id*="email"], input[id*="username"]');
            if (!emailField) {
              emailField = Array.from(document.querySelectorAll('input')).find(input => 
                (input.placeholder || '').toLowerCase().includes('email') ||
                (input.placeholder || '').toLowerCase().includes('username')
              );
            }
            
            let passwordField = document.querySelector('input[type="password"]');
            
            if (emailField && passwordField) {
              emailField.focus();
              emailField.value = email;
              emailField.dispatchEvent(new Event('input', { bubbles: true }));
              emailField.dispatchEvent(new Event('change', { bubbles: true }));
              
              await new Promise(resolve => setTimeout(resolve, 500));
              
              passwordField.focus();
              passwordField.value = password;
              passwordField.dispatchEvent(new Event('input', { bubbles: true }));
              passwordField.dispatchEvent(new Event('change', { bubbles: true }));
              
              results.steps.push({ step: 'fill_credentials', success: true });
              await new Promise(resolve => setTimeout(resolve, 500));
              
              let submitButton = document.querySelector('button[type="submit"], input[type="submit"], button:not([type])');
              if (!submitButton) {
                submitButton = Array.from(document.querySelectorAll('button')).find(btn => {
                  const text = (btn.textContent || '').toLowerCase();
                  return text.includes('log in') || text.includes('sign in') || text.includes('connexion') || text.includes('submit');
                });
              }
              
              if (submitButton) {
                submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await new Promise(resolve => setTimeout(resolve, 500));
                submitButton.click();
                results.steps.push({ step: 'submit_form', success: true });
                await new Promise(resolve => setTimeout(resolve, 2000));
              } else {
                results.steps.push({ step: 'submit_form', success: false, message: 'Bouton submit non trouvé' });
              }
            } else {
              results.steps.push({ step: 'fill_credentials', success: false, message: 'Champs email/password non trouvés' });
            }
          }
          
          return { success: true, results };
        } catch (error) {
          console.error('Erreur automatisation:', error);
          return { success: false, error: error.message };
        }
      })();
    `;
    
    const automationSteps = [
      { step: 'session_created', success: true, message: 'Session Browserbase créée via API REST' },
      { step: 'automation_script', success: true, message: 'Script d\'automatisation disponible' }
    ];
    
    return res.status(200).json({
      success: true,
      message: hasCredentials 
        ? 'Session créée - Automatisation disponible (API REST)' 
        : 'Session Browserbase créée - Bouton "Log In" à cliquer manuellement',
      session: {
        id: sessionId,
        url: sessionUrl,
        status: sessionData.status || 'active',
        createdAt: sessionData.createdAt || new Date().toISOString()
      },
      automation: {
        steps: automationSteps,
        script: automationScript,
        fullyAutomated: false,
        method: 'api_rest',
        message: hasCredentials 
          ? 'Script d\'automatisation disponible - Exécutez-le dans la console de la session' 
          : 'Ouvrez la session et cliquez manuellement sur "Log In"'
      },
      workflow: {
        url: 'https://www.fastgraphs.com/',
        action: 'click the Log In button' + (hasCredentials ? ' and login with credentials' : ''),
        status: 'session_created',
        automationLevel: hasCredentials ? 'script_available' : 'manual',
        method: 'api_rest_fallback'
      },
      fallback: {
        reason: 'Stagehand non autorisé - Utilisation API REST Browserbase',
        stagehandError: stagehandError?.message || 'Unauthorized',
        note: 'Pour une automatisation complète serveur, whitelistez votre clé API Browserbase pour Stagehand'
      },
      debugInfo: debugMode ? {
        method: 'api_rest_fallback',
        sessionId,
        apiUrl: `${browserbaseApiUrl}/sessions`,
        hasCredentials,
        stagehandError: stagehandError?.message
      } : undefined
    });
    
  } catch (error) {
    console.error('Erreur création session Browserbase directe:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la session Browserbase',
      details: error.message || 'Erreur inconnue',
      hint: 'Vérifiez vos clés API Browserbase. Ajoutez ?debug=true pour plus de détails.',
      type: 'BrowserbaseError',
      timestamp: new Date().toISOString(),
      debugInfo: debugMode ? {
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name
      } : undefined
    });
  }
}

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

    // Fallback to server-side environment variables if not provided in request
    if (!email && process.env.FASTGRAPHS_EMAIL) {
        console.log('Utilisation de l\'email FastGraphs défini dans les variables d\'environnement');
        email = process.env.FASTGRAPHS_EMAIL;
    }
    
    if (!password && process.env.FASTGRAPHS_PASSWORD) {
        console.log('Utilisation du mot de passe FastGraphs défini dans les variables d\'environnement');
        password = process.env.FASTGRAPHS_PASSWORD;
    }
    
    const hasCredentials = !!(email && password);
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
    
    // Validation des clés API avant initialisation
    if (!stagehandConfig.apiKey || !stagehandConfig.projectId) {
      return res.status(503).json({
        success: false,
        error: 'Configuration Browserbase incomplète',
        details: 'BROWSERBASE_API_KEY ou BROWSERBASE_PROJECT_ID manquant',
        hint: 'Vérifiez que les variables d\'environnement sont définies dans Vercel',
        type: 'ConfigurationError',
        timestamp: new Date().toISOString(),
        debugInfo: debugMode ? {
          hasApiKey: !!stagehandConfig.apiKey,
          hasProjectId: !!stagehandConfig.projectId,
          apiKeyLength: stagehandConfig.apiKey?.length || 0,
          projectIdLength: stagehandConfig.projectId?.length || 0,
          apiKeyPrefix: stagehandConfig.apiKey ? stagehandConfig.apiKey.substring(0, 8) + '...' : 'N/A',
          projectIdPrefix: stagehandConfig.projectId ? stagehandConfig.projectId.substring(0, 8) + '...' : 'N/A'
        } : undefined
      });
    }
    
    if (!stagehandConfig.modelClientOptions?.apiKey) {
      console.warn('GEMINI_API_KEY non définie - Stagehand pourrait échouer');
      return res.status(503).json({
        success: false,
        error: 'Clé API Gemini manquante',
        details: 'GEMINI_API_KEY ou GOOGLE_API_KEY est requis pour Stagehand',
        hint: 'Configurez GEMINI_API_KEY dans Vercel Environment Variables',
        type: 'ConfigurationError',
        timestamp: new Date().toISOString(),
        debugInfo: debugMode ? {
          hasGeminiKey: false,
          hasGoogleKey: !!process.env.GOOGLE_API_KEY,
          envKeys: Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('GOOGLE'))
        } : undefined
      });
    }
    
    if (debugMode) {
      console.log('Configuration Stagehand:', {
        env: stagehandConfig.env,
        hasApiKey: !!stagehandConfig.apiKey,
        hasProjectId: !!stagehandConfig.projectId,
        modelName: stagehandConfig.modelName,
        hasGeminiKey: !!stagehandConfig.modelClientOptions?.apiKey,
        apiKeyPrefix: stagehandConfig.apiKey ? stagehandConfig.apiKey.substring(0, 8) + '...' : 'N/A',
        projectIdPrefix: stagehandConfig.projectId ? stagehandConfig.projectId.substring(0, 8) + '...' : 'N/A',
        geminiKeyPrefix: stagehandConfig.modelClientOptions?.apiKey ? stagehandConfig.modelClientOptions.apiKey.substring(0, 8) + '...' : 'N/A'
      });
    }
    
    let useStagehand = true;
    let stagehandError = null;
    
    try {
      stagehand = new Stagehand(stagehandConfig);
      console.log('Stagehand instance créée, initialisation en cours...');
      await stagehand.init();
      console.log('Stagehand initialisé avec succès.');
    } catch (initError) {
      console.error('Erreur lors de l\'initialisation de Stagehand:', initError);
      console.error('Type d\'erreur:', initError.name);
      console.error('Message:', initError.message);
      
      stagehandError = initError;
      
      // Si erreur Unauthorized, basculer vers API REST Browserbase
      const isUnauthorizedError = initError.message?.includes('Unauthorized') || 
                                  initError.name === 'StagehandAPIUnauthorizedError' ||
                                  initError.name?.includes('Unauthorized');
      
      console.log('🔍 Vérification erreur Stagehand:', {
        message: initError.message,
        name: initError.name,
        isUnauthorizedError,
        willFallback: isUnauthorizedError
      });
      
      if (isUnauthorizedError) {
        console.log('✅ Stagehand non autorisé - Basculement vers API REST Browserbase directe...');
        useStagehand = false;
        // Ne pas retourner ici, continuer pour appeler le fallback
      } else {
        // Pour les autres erreurs, retourner l'erreur
        let hint = 'Vérifiez vos clés API Browserbase et Gemini. Ajoutez ?debug=true pour plus de détails.';
        if (initError.message?.includes('API key')) {
          hint = 'Problème avec la clé API. Vérifiez que GEMINI_API_KEY est valide et a les permissions nécessaires.';
        }
        
        return res.status(503).json({
          success: false,
          error: 'Erreur lors de l\'initialisation de Stagehand',
          details: initError.message || 'Impossible d\'initialiser Stagehand',
          hint: hint,
          type: initError.name || 'InitializationError',
          timestamp: new Date().toISOString(),
          debugInfo: debugMode ? {
            errorMessage: initError.message,
            errorStack: initError.stack,
            errorName: initError.name,
            stagehandConfig: {
              env: stagehandConfig.env,
              hasApiKey: !!stagehandConfig.apiKey,
              hasProjectId: !!stagehandConfig.projectId,
              modelName: stagehandConfig.modelName,
              hasGeminiKey: !!stagehandConfig.modelClientOptions?.apiKey,
              apiKeyPrefix: stagehandConfig.apiKey ? stagehandConfig.apiKey.substring(0, 8) + '...' : 'N/A',
              projectIdPrefix: stagehandConfig.projectId ? stagehandConfig.projectId.substring(0, 8) + '...' : 'N/A',
              geminiKeyPrefix: stagehandConfig.modelClientOptions?.apiKey ? stagehandConfig.modelClientOptions.apiKey.substring(0, 8) + '...' : 'N/A'
            }
          } : undefined
        });
      }
    }
    
    // Si Stagehand n'est pas disponible, utiliser API REST Browserbase
    if (!useStagehand) {
      console.log('🔄 Utilisation de l\'API REST Browserbase directe (fallback)...');
      try {
        return await createBrowserbaseSessionDirect(req, res, {
          email,
          password,
          hasCredentials,
          debugMode,
          browserbaseApiKey,
          browserbaseProjectId,
          stagehandError
        });
      } catch (fallbackError) {
        console.error('❌ Erreur lors du fallback API REST:', fallbackError);
        // Si le fallback échoue aussi, retourner une erreur combinée
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la création de la session (Stagehand et API REST ont échoué)',
          details: `Stagehand: ${stagehandError?.message || 'Unauthorized'}, API REST: ${fallbackError.message}`,
          hint: 'Vérifiez vos clés API Browserbase. Ajoutez ?debug=true pour plus de détails.',
          type: 'DualFailureError',
          timestamp: new Date().toISOString(),
          debugInfo: debugMode ? {
            stagehandError: stagehandError?.message,
            fallbackError: fallbackError.message,
            stagehandStack: stagehandError?.stack,
            fallbackStack: fallbackError.stack
          } : undefined
        });
      }
    }
    
    // Si Stagehand n'est pas disponible, utiliser API REST Browserbase
    if (!useStagehand) {
      console.log('Utilisation de l\'API REST Browserbase directe (fallback)...');
      return await createBrowserbaseSessionDirect(req, res, {
        email,
        password,
        hasCredentials,
        debugMode,
        browserbaseApiKey,
        browserbaseProjectId,
        stagehandError
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
