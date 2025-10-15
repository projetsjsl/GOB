// ============================================================================
// API Endpoint: Briefing Cron
// Déclenchement automatisé des briefings Emma En Direct 3x/jour
// ============================================================================

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Vérifier authentification (CRON_SECRET)
    const authHeader = req.headers['authorization'];
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (!process.env.CRON_SECRET) {
      console.error('CRON_SECRET non configuré');
      return res.status(500).json({ 
        success: false,
        error: 'Configuration serveur incomplète' 
      });
    }
    
    if (authHeader !== expectedAuth) {
      console.error('Tentative d\'accès non autorisée au cron:', authHeader);
      return res.status(401).json({ 
        success: false,
        error: 'Non autorisé' 
      });
    }

    // Récupérer le type de briefing
    const { type } = req.method === 'GET' ? req.query : req.body;
    
    if (!type || !['morning', 'noon', 'close'].includes(type)) {
      return res.status(400).json({ 
        success: false,
        error: 'Type de briefing requis (morning, noon, ou close)' 
      });
    }

    console.log(`🤖 Cron déclenchement: ${type} briefing - ${new Date().toISOString()}`);

    // Générer le briefing automatiquement
    const result = await generateAndSendBriefing(type);
    
    return res.status(200).json({
      success: true,
      type,
      timestamp: new Date().toISOString(),
      result
    });
    
  } catch (error) {
    console.error('Erreur cron briefing:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// ============================================================================
// FONCTION DE GÉNÉRATION ET ENVOI AUTOMATIQUE
// ============================================================================

async function generateAndSendBriefing(type) {
  const startTime = Date.now();
  const logs = [];
  
  try {
    logs.push({ step: 'START', message: `Début génération ${type}`, timestamp: new Date().toISOString() });
    
    // 1. Collecter données marché
    logs.push({ step: 'MARKET_DATA', message: 'Collecte données marché', timestamp: new Date().toISOString() });
    const marketDataResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/ai-services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: 'briefing-data',
        type: type,
        source: 'apis' // Priorité APIs professionnelles
      })
    });
    
    if (!marketDataResponse.ok) {
      throw new Error(`Erreur données marché: ${marketDataResponse.statusText}`);
    }
    
    const marketData = await marketDataResponse.json();
    logs.push({ step: 'MARKET_DATA', message: 'Données marché collectées', data: { success: marketData.success }, timestamp: new Date().toISOString() });
    
    // 2. Enrichir avec modules Expert
    logs.push({ step: 'ENRICHMENT', message: 'Enrichissement modules Expert', timestamp: new Date().toISOString() });
    const enrichedData = await enrichWithExpertModules(marketData.data, type);
    logs.push({ step: 'ENRICHMENT', message: 'Enrichissement terminé', timestamp: new Date().toISOString() });
    
    // 3. Générer analyse IA
    logs.push({ step: 'AI_ANALYSIS', message: 'Génération analyse IA', timestamp: new Date().toISOString() });
    const analysisResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/ai-services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: 'openai',
        prompt: getPromptForType(type),
        marketData: enrichedData,
        news: 'Actualités intégrées dans enrichedData',
        source: 'openai' // Priorité OpenAI GPT-4
      })
    });
    
    if (!analysisResponse.ok) {
      throw new Error(`Erreur analyse IA: ${analysisResponse.statusText}`);
    }
    
    const analysis = await analysisResponse.json();
    logs.push({ step: 'AI_ANALYSIS', message: 'Analyse générée', data: { success: analysis.success, model: analysis.model }, timestamp: new Date().toISOString() });
    
    // 4. Créer HTML
    logs.push({ step: 'HTML_GENERATION', message: 'Création HTML', timestamp: new Date().toISOString() });
    const html = createHTMLForType(type, analysis.content || 'Analyse non disponible', enrichedData);
    logs.push({ step: 'HTML_GENERATION', message: 'HTML créé', data: { htmlLength: html.length }, timestamp: new Date().toISOString() });
    
    // 5. Sauvegarder dans Supabase
    logs.push({ step: 'SUPABASE_SAVE', message: 'Sauvegarde Supabase', timestamp: new Date().toISOString() });
    const saveResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/ai-services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: 'supabase-briefings',
        type,
        subject: getSubjectForType(type),
        html_content: html,
        market_data: enrichedData,
        analysis: analysis.content || 'Analyse non disponible'
      })
    });
    
    if (!saveResponse.ok) {
      console.error('Erreur sauvegarde Supabase (non-bloquant)');
    } else {
      logs.push({ step: 'SUPABASE_SAVE', message: 'Sauvegarde réussie', timestamp: new Date().toISOString() });
    }
    
    // 6. Envoyer email
    if (process.env.RESEND_TO_EMAIL) {
      logs.push({ step: 'EMAIL_SEND', message: 'Envoi email', timestamp: new Date().toISOString() });
      const emailResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/ai-services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: 'resend',
          recipients: [process.env.RESEND_TO_EMAIL],
          subject: getSubjectForType(type),
          html
        })
      });
      
      if (!emailResponse.ok) {
        console.error('Erreur envoi email (non-bloquant)');
      } else {
        const emailResult = await emailResponse.json();
        logs.push({ step: 'EMAIL_SEND', message: 'Email envoyé', data: emailResult, timestamp: new Date().toISOString() });
      }
    } else {
      logs.push({ step: 'EMAIL_SEND', message: 'Email non configuré (RESEND_TO_EMAIL manquant)', timestamp: new Date().toISOString() });
    }
    
    const duration = Date.now() - startTime;
    logs.push({ step: 'COMPLETE', message: `Briefing ${type} généré avec succès`, duration: `${duration}ms`, timestamp: new Date().toISOString() });
    
    return {
      success: true,
      type,
      duration,
      logs,
      summary: {
        marketData: marketData.success,
        analysis: analysis.success,
        htmlGenerated: html.length > 0,
        supabaseSaved: saveResponse?.ok || false,
        emailSent: !!process.env.RESEND_TO_EMAIL
      }
    };
    
  } catch (error) {
    console.error(`Erreur génération ${type}:`, error);
    logs.push({ step: 'ERROR', message: error.message, timestamp: new Date().toISOString() });
    
    return {
      success: false,
      type,
      error: error.message,
      logs
    };
  }
}

// ============================================================================
// FONCTIONS HELPER
// ============================================================================

async function enrichWithExpertModules(marketData, type) {
  try {
    const baseUrl = process.env.VERCEL_URL || 'http://localhost:3000';
    
    const [yieldCurves, forex, volatility, commodities, tickersNews] = await Promise.all([
      fetch(`${baseUrl}/api/ai-services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'yield-curves' })
      }).then(r => r.json()).catch(() => ({ success: false, data: null })),
      
      fetch(`${baseUrl}/api/ai-services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'forex-detailed' })
      }).then(r => r.json()).catch(() => ({ success: false, data: null })),
      
      fetch(`${baseUrl}/api/ai-services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'volatility-advanced' })
      }).then(r => r.json()).catch(() => ({ success: false, data: null })),
      
      fetch(`${baseUrl}/api/ai-services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'commodities' })
      }).then(r => r.json()).catch(() => ({ success: false, data: null })),
      
      fetch(`${baseUrl}/api/ai-services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          service: 'tickers-news',
          tickers: ['GOOGL', 'T', 'BNS', 'TD', 'BCE', 'CNR', 'CSCO', 'CVS', 'DEO', 'MDT', 'JNJ', 'JPM'],
          watchlistTickers: ['GOOGL', 'T', 'BNS', 'TD', 'BCE']
        })
      }).then(r => r.json()).catch(() => ({ success: false, data: { main_tickers: [], watchlist_dan: [] } }))
    ]);
    
    return {
      ...marketData,
      expert_modules: {
        yield_curves: yieldCurves.data,
        forex_detailed: forex.data,
        volatility_advanced: volatility.data,
        commodities: commodities.data,
        tickers_news: tickersNews.data || { main_tickers: [], watchlist_dan: [] }
      }
    };
  } catch (error) {
    console.error('Erreur enrichissement Expert:', error);
    return marketData;
  }
}

function getPromptForType(type) {
  const basePrompt = `Tu es Emma, assistante virtuelle spécialisée en analyse financière. Tu es professionnelle, experte et bienveillante.

STRUCTURE OBLIGATOIRE - Voix Emma :

🌏 RÉSUMÉ EXÉCUTIF (4-5 phrases)
→ Bonjour ! Mouvements clés avec contexte
→ Thème dominant et rotation sectorielle
→ Sentiment risk-on/risk-off
→ Implications stratégiques

📊 ANALYSE APPROFONDIE
→ Marchés et secteurs avec drivers
→ Données économiques et impact
→ Catalyseurs et événements

🎯 PERSPECTIVE STRATÉGIQUE
→ Recommandations tactiques
→ Risques et opportunités
→ Niveaux clés à surveiller

IMPORTANT : Rappelle toujours de consulter un expert qualifié.

STYLE : Voix Emma - Niveau expert, 1200-1500 mots, français, avec chiffres précis`;

  switch (type) {
    case 'morning':
      return basePrompt + '\n\nCONTEXTE : Briefing matinal - Analyse marchés asiatiques + futures + préparation journée';
    case 'noon':
      return basePrompt + '\n\nCONTEXTE : Update mi-journée - Mouvements intraday + breaking news + ajustements';
    case 'close':
      return basePrompt + '\n\nCONTEXTE : Rapport clôture - Bilan séance + performance secteurs + outlook next day';
    default:
      return basePrompt;
  }
}

function createHTMLForType(type, analysis, data) {
  // Utiliser template simplifié pour cron
  const title = type === 'morning' ? 'Matin' : type === 'noon' ? 'Midi' : 'Clôture';
  const gradient = type === 'morning' ? '#1e3a8a 0%, #3b82f6 100%' : type === 'noon' ? '#f59e0b 0%, #d97706 100%' : '#7c3aed 0%, #5b21b6 100%';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Emma En Direct · ${title}</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7fa; margin: 0; padding: 20px; line-height: 1.6; color: #1f2937;">
  <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, ${gradient}); color: white; padding: 40px 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 32px;">📡 Emma En Direct · ${title}</h1>
      <p style="margin: 10px 0 0; font-size: 14px;">L'analyse des marchés, sans filtre</p>
      <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.85;">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    
    <div style="padding: 35px;">
      <div style="background: #f8fafc; padding: 25px; border-radius: 10px; border-left: 5px solid #3b82f6; margin: 20px 0; white-space: pre-wrap; font-size: 15px; line-height: 1.8;">
${analysis}
      </div>
    </div>
    
    <div style="background: #f8fafc; padding: 30px 35px; border-top: 2px solid #e2e8f0; text-align: center;">
      <div style="font-weight: 700; color: #1e40af; font-size: 15px; margin-bottom: 8px;">Emma En Direct</div>
      <div style="color: #64748b; font-size: 12px; margin-bottom: 15px; font-style: italic;">L'analyse des marchés, sans filtre · Powered by JSL AI</div>
      <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 15px 0; font-size: 11px; color: #475569; line-height: 1.6;">
        <strong>⚠️ AVERTISSEMENT IMPORTANT</strong><br/>
        Emma En Direct fournit des analyses éducatives basées sur des données publiques. Ce contenu ne constitue pas un conseil en investissement personnalisé.
      </div>
      <div style="color: #94a3b8; font-size: 10px; margin-top: 10px;">© ${new Date().getFullYear()} JSL AI - Emma En Direct</div>
    </div>
  </div>
</body>
</html>
  `;
}

function getSubjectForType(type) {
  const date = new Date().toLocaleDateString('fr-FR');
  switch (type) {
    case 'morning': return `📊 Emma En Direct · Matin - ${date}`;
    case 'noon': return `⚡ Emma En Direct · Midi - ${date}`;
    case 'close': return `🌙 Emma En Direct · Clôture - ${date}`;
    default: return `Emma En Direct - ${date}`;
  }
}

