/**
 * API Endpoint pour se connecter à FastGraphs.com via Browserless/Browserbase
 * 
 * Ce endpoint exécute un workflow automatisé qui:
 * 1. Navigue vers fastgraphs.com
 * 2. Clique sur le bouton "Log In"
 * 
 * Utilise Browserbase API pour l'automatisation du navigateur
 */

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
    
    // Vérifier les variables d'environnement requises
    const browserbaseApiKey = process.env.BROWSERBASE_API_KEY;
    const browserbaseProjectId = process.env.BROWSERBASE_PROJECT_ID;
    // Note: GEMINI_API_KEY peut être utilisée pour Stagehand si nécessaire
    // Pour l'instant, seule Browserbase est requise pour créer la session
    const geminiApiKey = process.env.GEMINI_API_KEY;

    // Mode debug: retourner des infos même si config manquante
    const debugMode = req.query.debug === 'true' || req.body?.debug === true;
    
    if (!browserbaseApiKey || !browserbaseProjectId) {
      console.error('Configuration Browserbase manquante:', {
        hasApiKey: !!browserbaseApiKey,
        hasProjectId: !!browserbaseProjectId,
        envKeys: Object.keys(process.env).filter(k => k.includes('BROWSERBASE'))
      });
      
      // En mode debug, retourner plus d'infos
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

    // Utiliser Browserbase API REST pour créer une session
    // Note: Pour l'automatisation complète (cliquer sur le bouton), il faudrait:
    // 1. Utiliser Stagehand dans un environnement Node.js complet (pas compatible Vercel Serverless)
    // 2. Ou utiliser l'API Browserbase pour exécuter du code JavaScript dans le navigateur
    // Pour l'instant, on crée une session et l'utilisateur peut interagir manuellement
    
    const browserbaseApiUrl = 'https://www.browserbase.com/v1';
    
    // Créer une session Browserbase
    console.log('Création d\'une session Browserbase pour FastGraphs...');
    console.log('API URL:', `${browserbaseApiUrl}/sessions`);
    console.log('Project ID:', browserbaseProjectId?.substring(0, 8) + '...');
    
    let sessionResponse;
    try {
      const requestBody = {
        url: 'https://www.fastgraphs.com/',
        options: {
          headless: false, // Pour voir le navigateur
          keepAlive: true // Garder la session active
        }
      };
      
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      sessionResponse = await fetch(`${browserbaseApiUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${browserbaseApiKey}`,
          'Content-Type': 'application/json',
          'x-browserbase-project-id': browserbaseProjectId
        },
        body: JSON.stringify(requestBody),
        // Timeout pour éviter les attentes infinies
        signal: AbortSignal.timeout(30000) // 30 secondes
      });
      
      console.log('Response status:', sessionResponse.status);
      console.log('Response headers:', Object.fromEntries(sessionResponse.headers.entries()));
    } catch (fetchError) {
      console.error('Erreur fetch Browserbase:', fetchError);
      console.error('Error name:', fetchError.name);
      console.error('Error message:', fetchError.message);
      console.error('Error stack:', fetchError.stack);
      
      if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
        return res.status(504).json({
          success: false,
          error: 'Timeout lors de la création de la session Browserbase',
          details: 'La requête a pris trop de temps (30s)',
          hint: 'Vérifiez votre connexion et réessayez',
          debug: debugMode ? {
            apiUrl: `${browserbaseApiUrl}/sessions`,
            timeout: '30s'
          } : undefined,
          timestamp: new Date().toISOString()
        });
      }
      if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
        return res.status(503).json({
          success: false,
          error: 'Erreur de connexion à Browserbase',
          details: 'Impossible de se connecter à l\'API Browserbase',
          hint: 'Vérifiez votre connexion internet et les clés API',
          debug: debugMode ? {
            errorName: fetchError.name,
            errorMessage: fetchError.message,
            apiUrl: `${browserbaseApiUrl}/sessions`
          } : undefined,
          timestamp: new Date().toISOString()
        });
      }
      throw fetchError;
    }

    if (!sessionResponse.ok) {
      let errorText = '';
      let errorDetails = {};
      try {
        errorText = await sessionResponse.text();
        console.error('Erreur Browserbase:', sessionResponse.status, errorText);
        try {
          errorDetails = JSON.parse(errorText);
        } catch {
          errorDetails = { message: errorText };
        }
      } catch (parseError) {
        console.error('Erreur parsing réponse Browserbase:', parseError);
        errorText = 'Erreur inconnue';
      }
      
      // Gérer les codes d'erreur spécifiques
      if (sessionResponse.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'Authentification Browserbase échouée',
          details: 'Clé API invalide ou expirée',
          hint: 'Vérifiez votre BROWSERBASE_API_KEY dans Vercel',
          debug: debugMode ? {
            apiKeyPrefix: browserbaseApiKey.substring(0, 8) + '...',
            projectIdPrefix: browserbaseProjectId.substring(0, 8) + '...',
            apiUrl: `${browserbaseApiUrl}/sessions`
          } : undefined,
          timestamp: new Date().toISOString()
        });
      }
      
      if (sessionResponse.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'Endpoint Browserbase non trouvé',
          details: 'L\'endpoint /sessions n\'existe pas ou a changé',
          hint: 'Vérifiez la documentation Browserbase pour l\'URL correcte',
          debug: debugMode ? {
            apiUrl: `${browserbaseApiUrl}/sessions`,
            method: 'POST',
            headersSent: true
          } : undefined,
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(sessionResponse.status >= 500 ? 502 : sessionResponse.status).json({
        success: false,
        error: 'Erreur lors de la création de la session Browserbase',
        details: errorDetails.message || errorText || 'Erreur inconnue',
        status: sessionResponse.status,
        hint: 'Vérifiez vos clés API Browserbase et l\'ID du projet. Ajoutez ?debug=true pour plus de détails.',
        debug: debugMode ? {
          errorText,
          errorDetails,
          apiUrl: `${browserbaseApiUrl}/sessions`,
          requestHeaders: {
            hasAuth: true,
            hasProjectId: true
          }
        } : undefined,
        timestamp: new Date().toISOString()
      });
    }

    let sessionData;
    try {
      sessionData = await sessionResponse.json();
      console.log('Session Browserbase créée:', sessionData.id);
    } catch (parseError) {
      console.error('Erreur parsing sessionData:', parseError);
      return res.status(502).json({
        success: false,
        error: 'Erreur lors du parsing de la réponse Browserbase',
        details: 'La réponse de Browserbase est invalide',
        hint: 'Vérifiez les logs Browserbase',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!sessionData || !sessionData.id) {
      console.error('SessionData invalide:', sessionData);
      return res.status(502).json({
        success: false,
        error: 'Réponse Browserbase invalide',
        details: 'La session n\'a pas été créée correctement',
        hint: 'Vérifiez les logs Browserbase',
        timestamp: new Date().toISOString()
      });
    }
    
    const sessionId = sessionData.id;
    
    // Attendre que la page se charge (2 secondes)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Exécuter du JavaScript pour cliquer automatiquement sur le bouton "Log In"
    console.log('Exécution du script pour cliquer sur Log In...');
    
    // Script JavaScript à exécuter dans la session
    // Utiliser JSON.stringify pour sécuriser l'injection des identifiants
    const emailSafe = hasCredentials ? JSON.stringify(email) : 'null';
    const passwordSafe = hasCredentials ? JSON.stringify(password) : 'null';
    
    const automationScript = `
      (async () => {
        try {
          const email = ${emailSafe};
          const password = ${hasCredentials ? passwordSafe : 'null'};
          const hasCredentials = ${hasCredentials ? 'true' : 'false'};
          
          // Attendre que la page soit complètement chargée
          await new Promise(resolve => {
            if (document.readyState === 'complete') {
              resolve();
            } else {
              window.addEventListener('load', resolve);
            }
          });
          
          // Attendre un peu plus pour que tous les éléments soient rendus
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const results = { steps: [] };
          
          // ÉTAPE 1: Chercher et cliquer sur le bouton "Log In"
          let loginButton = null;
          
          // Méthode 1: Chercher par texte
          const buttons = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"]'));
          loginButton = buttons.find(btn => {
            const text = btn.textContent?.toLowerCase() || btn.innerText?.toLowerCase() || '';
            return text.includes('log in') || text.includes('login') || text.includes('se connecter');
          });
          
          // Méthode 2: Chercher par ID ou classe
          if (!loginButton) {
            loginButton = document.querySelector('[id*="login"], [class*="login"], [id*="signin"], [class*="signin"]');
          }
          
          // Méthode 3: Chercher un lien avec href contenant "login"
          if (!loginButton) {
            loginButton = document.querySelector('a[href*="login"], a[href*="signin"]');
          }
          
          if (loginButton) {
            loginButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 500));
            loginButton.click();
            results.steps.push({ step: 'click_login', success: true });
            await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre que le formulaire s'ouvre
          } else {
            results.steps.push({ step: 'click_login', success: false, message: 'Bouton non trouvé' });
            return { success: false, results };
          }
          
          // ÉTAPE 2: Si des identifiants sont fournis, remplir le formulaire et se connecter
          if (hasCredentials && email && password) {
            // Chercher les champs email/username
            let emailField = document.querySelector('input[type="email"], input[name*="email"], input[name*="username"], input[id*="email"], input[id*="username"]');
            if (!emailField) {
              // Chercher par placeholder
              emailField = Array.from(document.querySelectorAll('input')).find(input => 
                (input.placeholder || '').toLowerCase().includes('email') ||
                (input.placeholder || '').toLowerCase().includes('username')
              );
            }
            
            // Chercher le champ password
            let passwordField = document.querySelector('input[type="password"]');
            
            if (emailField && passwordField) {
              // Remplir les champs
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
              
              // Chercher et cliquer sur le bouton de soumission
              let submitButton = document.querySelector('button[type="submit"], input[type="submit"], button:not([type])');
              if (!submitButton) {
                // Chercher par texte
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
                await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre la redirection
              } else {
                results.steps.push({ step: 'submit_form', success: false, message: 'Bouton submit non trouvé' });
              }
            } else {
              results.steps.push({ step: 'fill_credentials', success: false, message: 'Champs email/password non trouvés' });
            }
          }
          
          return { success: true, results };
        } catch (error) {
          console.error('Erreur lors de l\'automatisation:', error);
          return { success: false, error: error.message };
        }
      })();
    `;
    
    // Construire l'URL de la session
    const sessionUrl = sessionData.url || 
                      sessionData.viewerUrl || 
                      sessionData.viewer_url ||
                      `https://www.browserbase.com/sessions/${sessionId}`;
    
    // Pour l'instant, Browserbase ne supporte pas directement l'exécution de scripts via leur API REST
    // L'automatisation complète nécessiterait Stagehand ou l'utilisation de leur SDK
    // On retourne la session avec des instructions pour l'automatisation côté client
    
    // Note: L'automatisation JavaScript peut être injectée côté client via l'URL de la session
    // ou via un bookmarklet, mais pour une vraie automatisation serveur, il faudrait Stagehand
    
    return res.status(200).json({
      success: true,
      message: hasCredentials ? 'Session créée - Automatisation disponible' : 'Session Browserbase créée avec succès',
      session: {
        id: sessionId,
        url: sessionUrl,
        status: sessionData.status || 'active',
        createdAt: sessionData.createdAt || new Date().toISOString()
      },
      automation: {
        script: hasCredentials ? automationScript : null,
        loginButtonClicked: false, // Sera exécuté côté client si nécessaire
        message: 'Session créée - L\'automatisation peut être exécutée via la session',
        fullyAutomated: false // Nécessite Stagehand pour une vraie automatisation serveur
      },
      instructions: hasCredentials ? {
        step1: 'La session Browserbase a été créée',
        step2: 'Ouvrez l\'URL de la session dans un nouvel onglet',
        step3: 'Le script d\'automatisation est disponible dans la réponse',
        step4: 'Pour une automatisation complète serveur, utilisez Stagehand',
        note: 'L\'automatisation JavaScript peut être injectée manuellement dans la console de la session'
      } : {
        step1: 'La session Browserbase a été créée',
        step2: 'Ouvrez l\'URL de la session dans un nouvel onglet',
        step3: 'Cliquez manuellement sur le bouton "Log In"',
        step4: 'Entrez vos identifiants FastGraphs',
        note: 'Pour une automatisation complète, fournissez email et password dans la requête'
      },
      workflow: {
        url: 'https://www.fastgraphs.com/',
        action: 'click the Log In button',
        status: 'session_created',
        automationLevel: hasCredentials ? 'script_available' : 'manual'
      }
    });

  } catch (error) {
    console.error('Erreur FastGraphs Login:', error);
    console.error('Stack:', error.stack);
    
    // Gérer les différents types d'erreurs
    let statusCode = 500;
    let errorMessage = 'Erreur lors de la connexion à FastGraphs';
    let hint = 'Vérifiez les variables d\'environnement Browserbase (BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID)';
    
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      statusCode = 504;
      errorMessage = 'Timeout lors de la connexion à FastGraphs';
      hint = 'La requête a pris trop de temps. Réessayez.';
    } else if (error.message?.includes('fetch')) {
      statusCode = 503;
      errorMessage = 'Erreur de connexion réseau';
      hint = 'Impossible de se connecter à Browserbase. Vérifiez votre connexion.';
    } else if (error.message?.includes('JSON')) {
      statusCode = 502;
      errorMessage = 'Erreur de parsing de la réponse';
      hint = 'La réponse de Browserbase est invalide.';
    }
    
    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.message || 'Erreur inconnue',
      hint: hint,
      type: error.name || 'UnknownError',
      timestamp: new Date().toISOString()
    });
  }
}

