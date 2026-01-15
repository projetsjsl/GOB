/**
 * API Endpoint pour se connecter a FastGraphs.com via Playwright Core + Browserbase
 * 
 * Ce endpoint execute un workflow automatise robuste qui:
 * 1. Cree une session Browserbase
 * 2. Se connecte via Playwright (CDP)
 * 3. Execute les actions de login de maniere fiable
 */


// Note: On utilise l'import dynamique pour eviter les crashs au demarrage si playwright-core a des soucis de dependances
// import { chromium } from 'playwright-core'; 

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode non autorisee' });
  }

  let browser = null;
  const automationSteps = [];

  try {
    // Import dynamique pour la robustesse serverless
    // Cela permet d'attraper les erreurs de chargement de module ici au lieu de crasher le process
    let chromium;
    try {
        const playwright = await import('playwright-core');
        chromium = playwright.chromium;
    } catch (importError) {
        console.error("CRITICAL: Failed to load playwright-core", importError);
        throw new Error(`Module Playwright manquant ou incompatible: ${importError.message}`);
    }

    // 1. Recuperation des parametres
    let email, password;
    try {
      if (req.method === 'POST') {
        email = req.body?.email;
        password = req.body?.password;
      } else {
        email = req.query?.email;
        password = req.query?.password;
      }
    } catch (e) {
      console.warn('Erreur parsing:', e);
    }

    // Fallback variables d'environnement (Support des deux formats)
    if (!email) email = process.env.FASTGRAPHS_EMAIL || process.env.FASTGRAPHS_ID;
    if (!password) password = process.env.FASTGRAPHS_PASSWORD || process.env.FASTGRAPHS_PASS;
    
    const hasCredentials = !!(email && password);
    const debugMode = req.query?.debug === 'true' || req.body?.debug === true;
    const browserbaseApiKey = process.env.BROWSERBASE_API_KEY;
    const browserbaseProjectId = process.env.BROWSERBASE_PROJECT_ID;

    if (!browserbaseApiKey || !browserbaseProjectId) {
      throw new Error('Configuration Browserbase manquante (API_KEY ou PROJECT_ID)');
    }

    // 2. Creation de la session Browserbase
    console.log('Creation de la session Browserbase...');
    const sessionResponse = await fetch('https://www.browserbase.com/v1/sessions', {
      method: 'POST',
      headers: {
        'x-browserbase-project-id': browserbaseProjectId,
        'Authorization': `Bearer ${browserbaseApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: browserbaseProjectId,
        // Important: keepAlive true permet de laisser le navigateur ouvert pour l'utilisateur
        keepAlive: true 
      }),
    });

    if (!sessionResponse.ok) {
        const errText = await sessionResponse.text();
        throw new Error(`Erreur creation session Browserbase: ${errText}`);
    }

        // Secure JSON parsing
    let sessionData;
    try {
        const raw = await sessionResponse.text();
        sessionData = JSON.parse(raw);
    } catch(e) {
        throw new Error(`Browserbase Session Error (Invalid JSON): ${e.message}`);
    }
    const sessionId = sessionData.id;
    // URL de debug/view pour l'utilisateur
    const sessionUrl = `https://www.browserbase.com/sessions/${sessionId}`; 
    const connectUrl = sessionData.connectUrl; 

    console.log(`Session creee: ${sessionId}`);
    automationSteps.push({ step: 'session_created', success: true, message: `Session ID: ${sessionId}` });

    // 3. Connexion Playwright via CDP
    console.log('Connexion Playwright...');
    browser = await chromium.connectOverCDP(connectUrl);
    const defaultContext = browser.contexts()[0];
    const page = defaultContext.pages()[0];

    // 4. Execution du Login Workflow
    console.log('Navigation vers FastGraphs...');
    await page.goto('https://www.fastgraphs.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    automationSteps.push({ step: 'navigate', success: true });

    // Clic sur Log In
    console.log('Recherche du bouton Log In...');
    // Selecteurs robustes pour le bouton login
    const loginSelectors = [
        'a[href*="login"]',
        'button:has-text("Log In")',
        'a:has-text("Log In")',
        'a:has-text("Se connecter")'
    ];
    
    let loginClicked = false;
    for (const selector of loginSelectors) {
        try {
            if (await page.isVisible(selector)) {
                await page.click(selector);
                loginClicked = true;
                break;
            }
        } catch (e) { continue; }
    }

    if (!loginClicked) {
        // Fallback ultime : essayer de trouver par texte exact
        try {
             await page.getByText('Log In', { exact: false }).first().click();
             loginClicked = true;
        } catch (e) {
             automationSteps.push({ step: 'click_login', success: false, message: 'Bouton non trouve' });
             // Ne pas throw ici, on laisse l'utilisateur voir la page
             // throw new Error('Impossible de trouver le bouton Log In');
        }
    }
    
    if (loginClicked) {
        automationSteps.push({ step: 'click_login', success: true });
    }

    // Remplissage du formulaire (si credentials presents)
    if (hasCredentials && loginClicked) {
        console.log('Tentative de remplissage des identifiants...');
        try {
            // Attendre que les champs soient visibles
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });
            
            // Remplir Email
            await page.fill('input[type="email"]', email);
            
            // Remplir Password
            await page.fill('input[type="password"]', password);
            
            automationSteps.push({ step: 'fill_credentials', success: true });

            // Soumettre
            const submitButtons = ['button[type="submit"]', 'button:has-text("Login")', 'input[type="submit"]'];
            let submitted = false;
            for(const btn of submitButtons) {
                if(await page.isVisible(btn)) {
                    await page.click(btn);
                    submitted = true;
                    break; 
                }
            }
            if(!submitted) await page.keyboard.press('Enter');
            
            automationSteps.push({ step: 'submit_form', success: true });

            // Attendre un peu pour confirmer le login (optionnel car on veut rendre la main vite)
            await page.waitForTimeout(1000);

        } catch (loginError) {
             console.error('Erreur remplissage:', loginError);
             automationSteps.push({ step: 'fill_credentials', success: false, message: loginError.message });
        }
    }

    console.log('Workflow termine.');

    // Recuperer le HTML de la page finale pour debug
    let finalHtml = '';
    try {
        finalHtml = await page.content();
    } catch (e) {
        console.warn('Impossible de recuperer le HTML final:', e.message);
    }

    // Note: On ne ferme PAS le browser pour laisser la session active pour l'utilisateur
    // await browser.close(); 
    // Au lieu de ca, on se deconnecte juste du CDP cote serveur
    try {
        await browser.close(); // close() sur connectOverCDP ferme la *connexion*, pas forcement le browser distant si keepAlive=true
    } catch(e) {
        console.warn('Erreur fermeture connexion CDP:', e);
    }

    return res.status(200).json({
      success: true,
      session: {
        id: sessionId,
        url: sessionUrl,
        status: 'active'
      },
      automation: {
        steps: automationSteps,
        fullyAutomated: hasCredentials
      },
      debugInfo: debugMode ? { method: 'playwright-core', sessionId } : undefined
    });

  } catch (error) {
    console.error('Erreur API FastGraphs:', error);
    
    // Nettoyage si crash (si browser defini)
    if (browser) {
        try { await browser.close(); } catch(e) {}
    }

    // Important: Toujours retourner JSON, jamais HTML
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur interne inconnue',
      details: 'Une erreur est survenue lors de l\'automatisation.',
      automation: { steps: automationSteps },
      debugInfo: { stack: error.stack }
    });
  }
}
