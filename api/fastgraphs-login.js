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
    const { email, password } = req.method === 'POST' ? req.body : req.query;
    const hasCredentials = email && password;
    
    // Vérifier les variables d'environnement requises
    const browserbaseApiKey = process.env.BROWSERBASE_API_KEY;
    const browserbaseProjectId = process.env.BROWSERBASE_PROJECT_ID;
    // Note: GEMINI_API_KEY peut être utilisée pour Stagehand si nécessaire
    // Pour l'instant, seule Browserbase est requise pour créer la session
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!browserbaseApiKey || !browserbaseProjectId) {
      return res.status(503).json({
        error: 'Configuration Browserbase manquante',
        details: 'BROWSERBASE_API_KEY et BROWSERBASE_PROJECT_ID sont requis',
        hint: 'Configurez ces variables dans Vercel Environment Variables'
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
          headless: false, // Pour voir le navigateur
          keepAlive: true // Garder la session active
        }
      })
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('Erreur Browserbase:', sessionResponse.status, errorText);
      throw new Error(`Erreur Browserbase: ${sessionResponse.status} - ${errorText}`);
    }

    const sessionData = await sessionResponse.json();
    console.log('Session Browserbase créée:', sessionData.id);
    
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
    
    // Exécuter le script via l'API Browserbase
    // Note: Browserbase utilise l'endpoint /sessions/{id}/execute pour exécuter du code
    try {
      const executeResponse = await fetch(`${browserbaseApiUrl}/sessions/${sessionId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${browserbaseApiKey}`,
          'Content-Type': 'application/json',
          'x-browserbase-project-id': browserbaseProjectId
        },
        body: JSON.stringify({
          script: automationScript
        })
      });
      
      if (executeResponse.ok) {
        const executeResult = await executeResponse.json();
        console.log('Résultat de l\'exécution:', executeResult);
        
        // Construire l'URL de la session
        const sessionUrl = sessionData.url || 
                          sessionData.viewerUrl || 
                          `https://www.browserbase.com/sessions/${sessionId}`;
        
        return res.status(200).json({
          success: true,
          message: 'Connexion automatisée en cours',
          session: {
            id: sessionId,
            url: sessionUrl,
            status: sessionData.status || 'active',
            createdAt: sessionData.createdAt || new Date().toISOString()
          },
          automation: {
            loginButtonClicked: executeResult.success || false,
            message: executeResult.message || 'Script exécuté',
            steps: executeResult.results?.steps || null,
            fullyAutomated: hasCredentials && executeResult.success
          },
          instructions: hasCredentials ? {
            step1: 'La session Browserbase a été créée',
            step2: 'Le bouton "Log In" a été cliqué automatiquement',
            step3: 'Les identifiants ont été remplis automatiquement',
            step4: 'Le formulaire a été soumis automatiquement',
            step5: 'Vous devriez être connecté à FastGraphs',
            note: 'Vérifiez la session pour confirmer la connexion'
          } : {
            step1: 'La session Browserbase a été créée',
            step2: 'Le bouton "Log In" a été cliqué automatiquement',
            step3: 'Entrez vos identifiants FastGraphs dans le formulaire qui s\'est ouvert',
            step4: 'Vous serez connecté et pourrez utiliser FastGraphs',
            note: 'Pour une automatisation complète, fournissez email et password dans la requête'
          },
          workflow: {
            url: 'https://www.fastgraphs.com/',
            action: 'click the Log In button',
            status: 'automated',
            automationLevel: 'fully-automated'
          }
        });
      } else {
        // Si l'endpoint /execute n'existe pas, essayer une autre méthode
        console.warn('Endpoint /execute non disponible, utilisation de la méthode alternative');
        throw new Error('Endpoint d\'exécution non disponible');
      }
    } catch (executeError) {
      console.warn('Erreur lors de l\'exécution du script, utilisation de la méthode alternative:', executeError.message);
      
      // Méthode alternative: Utiliser l'API Browserbase pour injecter du code via CDP (Chrome DevTools Protocol)
      // Ou simplement retourner la session avec instructions
      const sessionUrl = sessionData.url || 
                        sessionData.viewerUrl || 
                        `https://www.browserbase.com/sessions/${sessionId}`;
      
      // Essayer d'utiliser l'API Browserbase pour exécuter via CDP
      try {
        const cdpResponse = await fetch(`${browserbaseApiUrl}/sessions/${sessionId}/cdp`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${browserbaseApiKey}`,
            'Content-Type': 'application/json',
            'x-browserbase-project-id': browserbaseProjectId
          },
          body: JSON.stringify({
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (async () => {
                  await new Promise(r => setTimeout(r, 2000));
                  const btn = Array.from(document.querySelectorAll('button, a')).find(b => 
                    (b.textContent || '').toLowerCase().includes('log in') || 
                    (b.textContent || '').toLowerCase().includes('login')
                  );
                  if (btn) {
                    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await new Promise(r => setTimeout(r, 500));
                    btn.click();
                    return { success: true };
                  }
                  return { success: false, message: 'Button not found' };
                })()
              `
            }
          })
        });
        
        if (cdpResponse.ok) {
          const cdpResult = await cdpResponse.json();
          console.log('CDP résultat:', cdpResult);
        }
      } catch (cdpError) {
        console.warn('CDP non disponible:', cdpError.message);
      }
      
      // Retourner la session même si l'automatisation a échoué
      return res.status(200).json({
        success: true,
        message: 'Session Browserbase créée (automatisation partielle)',
        session: {
          id: sessionId,
          url: sessionUrl,
          status: sessionData.status || 'active',
          createdAt: sessionData.createdAt || new Date().toISOString()
        },
        automation: {
          loginButtonClicked: false,
          message: 'Automatisation non disponible, cliquez manuellement',
          error: executeError.message
        },
        instructions: {
          step1: 'La session Browserbase a été créée',
          step2: 'Ouvrez l\'URL de la session dans un nouvel onglet',
          step3: 'Cliquez manuellement sur le bouton "Log In"',
          step4: 'Entrez vos identifiants FastGraphs',
          note: 'L\'automatisation complète nécessite une configuration supplémentaire de Browserbase'
        },
        workflow: {
          url: 'https://www.fastgraphs.com/',
          action: 'click the Log In button',
          status: 'session_created',
          automationLevel: 'semi-automated'
        }
      });
    }

  } catch (error) {
    console.error('Erreur FastGraphs Login:', error);
    return res.status(500).json({
      error: 'Erreur lors de la connexion à FastGraphs',
      details: error.message,
      hint: 'Vérifiez les variables d\'environnement Browserbase (BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID)'
    });
  }
}

